const ethers = require('ethers');
const abi = require('./lib/deposit.json');
const bls = require("@chainsafe/bls");
const blsKeygen =  require("@chainsafe/bls-keygen");
const { buildMessageRoot } = require('./lib/ssz');
const { verifySignature, computeSigningRoot, getDomain } = require('./lib/helper');

const DEPOSIT_ADDRESS = '0x00000000219ab540356cbb839cbe05303d7705fa';
const TRANSFER_AMOUNT = ethers.utils.parseUnits('32', 'ether');
const DEPOSIT_AMOUNT = Number("32000000000");
const DEPOSIT_AMOUNT_LE_HEX = '0x0040597307000000'; //THIS is how value is hashed inside the contract
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

const getDepositObjectHash = (keys, withdrawalCredentials) =>
    ethers.utils.solidityPack(['bytes', 'bytes', 'uint'], [keys.publicKey, withdrawalCredentials, DEPOSIT_AMOUNT])

const computeDepositDataRoot = (publicKey, signature, withdrawalCredentials) => {
    const publicKeyRoot = sha256(['bytes', 'bytes16'], [publicKey, ethers.constants.HashZero.substring(0, 34)]);

    const firstSignatureHash = sha256(['bytes'], [signature.subarray(0, 64)]);
    const secondSignatureHash = sha256(['bytes', 'bytes32'], [signature.subarray(64), ethers.constants.HashZero]);
    const signatureRoot = sha256(['bytes', 'bytes'], [firstSignatureHash, secondSignatureHash]);

    const withdrawalCredentialsHash = sha256(['bytes32', 'bytes'], [publicKeyRoot, withdrawalCredentials]);
    const secondInnerHash = sha256(
        ['bytes', 'bytes24', 'bytes32'],
        [DEPOSIT_AMOUNT_LE_HEX, ethers.constants.HashZero.substring(0, 50), signatureRoot]
    );

    return sha256(['bytes', 'bytes'], [withdrawalCredentialsHash, secondInnerHash]);
}

const simulate = async () => {
    console.log('Initializing BLS signing library')
    await bls.init()
    const sender = await provider.getSigner();
    const depositContract = new ethers.Contract(DEPOSIT_ADDRESS, abi, provider);

    console.log('Ethereum deposit contract located at:', depositContract.address);

    const signingKey = generateValidatorKeys();
    const withdrawalKey = generateValidatorKeys();
    const withdrawalCredentials = getWithdrawalCredentials(withdrawalKey);

    console.log('Withdrawal credentials:', withdrawalCredentials)

    //Also root
    const depositMessageHash = buildMessageRoot({
        pubkey: Buffer.from(signingKey.publicKey).toString('hex'),
        withdrawal_credentials: withdrawalCredentials.slice(2),
        amount: DEPOSIT_AMOUNT
    });

    console.log('Deposit message hash:', depositMessageHash.toString('hex'));

    const domain = getDomain();
    console.log('Domain:', Buffer.from(domain).toString('hex'));

    const signingRoot = computeSigningRoot(depositMessageHash, domain);

    const signature = bls.sign(Uint8Array.from(signingKey.secretKey), signingRoot);
    console.log('Signature:', Buffer.from(signature).toString('hex'));

    const valid = verifySignature({
        pubkey: Buffer.from(signingKey.publicKey),
        signature: signature,
        deposit_message_root: Buffer.from(depositMessageHash, 'hex'),
    }, bls.verify);

    console.log('Deposit data is valid:', valid);
    const rootToDeposit = computeDepositDataRoot(
        Buffer.from(signingKey.publicKey),
        Buffer.from(signature),
        Buffer.from(withdrawalCredentials.slice(2), 'hex')
    );
    const transaction = await depositContract.connect(sender).deposit(
        signingKey.publicKey,
        withdrawalCredentials,
        signature,
        rootToDeposit,
        { value: TRANSFER_AMOUNT }
    )
    await transaction.wait();

    console.log('Transaction complete');
    console.log('Transaction Data:', transaction.data);
};

simulate();
