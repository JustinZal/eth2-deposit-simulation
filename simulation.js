const ethers = require('ethers');
const abi = require('./lib/deposit.json');
const bls = require("@chainsafe/bls");
const blsKeygen =  require("@chainsafe/bls-keygen");

const DEPOSIT_ADDRESS = '0x00000000219ab540356cbb839cbe05303d7705fa';
const TRANSFER_AMOUNT = ethers.utils.parseUnits('32', 'ether');
const DEPOSIT_AMOUNT = ethers.utils.parseUnits('32', 'gwei');
const DEPOSIT_AMOUNT_LE_HEX = '0x0040597307000000';
const PROVIDER_URL = 'http://127.0.0.1:8545';

const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
const sha256 = ethers.utils.soliditySha256;

const generateValidatorKeys = () => {
    const secretKey = blsKeygen.generateRandomSecretKey();

    return {
        secretKey: secretKey,
        publicKey: bls.secretKeyToPublicKey(secretKey)
    }
};

const getWithdrawalCredentials = withdrawalKeys =>
    sha256(['bytes'], [withdrawalKeys.publicKey])

const signDepositObject = (keys, withdrawalCredentials) => {
    const message = ethers.utils.solidityPack(
        ['bytes', 'bytes', 'uint'],
        [
            keys.publicKey,
            withdrawalCredentials,
            DEPOSIT_AMOUNT
        ]
    )

    return bls.sign(Uint8Array.from(keys.secretKey), message);
}

const computeDepositDataRoot = (publicKey, signature, withdrawalCredentials) => {
    const publicKeyRoot = sha256(['bytes', 'bytes16'], [publicKey, ethers.constants.HashZero.substring(0, 34)]);

    const firstSignatureHash = sha256(['bytes'], [signature.slice(0, 64)]);
    const secondSignatureHash = sha256(['bytes', 'bytes32'], [signature.slice(64), ethers.constants.HashZero]);
    const signatureRoot = sha256(['bytes', 'bytes'], [firstSignatureHash, secondSignatureHash]);

    const withdrawalCredentialsHash = sha256(['bytes32', 'bytes'], [publicKeyRoot, withdrawalCredentials]);
    const secondInnerHash = sha256(
        ['bytes', 'bytes24', 'bytes32'],
        [DEPOSIT_AMOUNT_LE_HEX, ethers.constants.HashZero.substring(0, 50), signatureRoot]
    );

    return sha256(['bytes', 'bytes'], [withdrawalCredentialsHash, secondInnerHash]);
}

const simulate = async () => {
    await bls.init()
    const sender = await provider.getSigner();
    const depositContract = new ethers.Contract(DEPOSIT_ADDRESS, abi, provider);

    const signingKey = generateValidatorKeys();
    const withdrawalKey = generateValidatorKeys();

    const withdrawalCredentials = getWithdrawalCredentials(withdrawalKey);
    const signature = signDepositObject(signingKey, withdrawalCredentials);
    const root = computeDepositDataRoot(signingKey.publicKey, signature, withdrawalCredentials)

    await depositContract.connect(sender).deposit(
        signingKey.publicKey,
        withdrawalCredentials,
        signature,
        root,
        { value: TRANSFER_AMOUNT }
    )
};

simulate();