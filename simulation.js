const ethers = require('ethers');
const abi = require('./lib/deposit.json');
const bls = require("@chainsafe/bls");
const blsKeygen =  require("@chainsafe/bls-keygen");
const {Bytes} = require("ethers");

const DEPOSIT_ADDRESS = '0x00000000219ab540356cbb839cbe05303d7705fa';
const TRANSFER_AMOUNT = ethers.utils.parseUnits('32', 'ether');
const DEPOSIT_AMOUNT = ethers.utils.parseUnits('32', 'gwei');
const PROVIDER_URL = 'http://127.0.0.1:8545';

const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);

const generateValidatorKeys = () => {
    const secretKey = blsKeygen.generateRandomSecretKey();

    return {
        secretKey: secretKey,
        publicKey: bls.secretKeyToPublicKey(secretKey)
    }
};

const getWithdrawalCredentials = withdrawalKeys =>
    ethers.utils.soliditySha256(['bytes'], [withdrawalKeys.publicKey])

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

const simulate = async () => {
    await bls.init()
    const sender = await provider.getSigner();
    // const depositContract = new ethers.Contract(DEPOSIT_ADDRESS, abi, provider);

    const signingKey = generateValidatorKeys();
    const withdrawalKey = generateValidatorKeys();

    const withdrawalCredentials = getWithdrawalCredentials(withdrawalKey);
    const signature = signDepositObject(signingKey, withdrawalCredentials);
};

simulate()