const ethers = require('ethers');
const abi = require('./lib/deposit.json');
const bls = require("@chainsafe/bls");
const blsKeygen =  require("@chainsafe/bls-keygen");

const DEPOSIT_ADDRESS = '0x00000000219ab540356cbb839cbe05303d7705fa';
const DEPOSIT_AMOUNT = '32';
const PROVIDER_URL = 'http://127.0.0.1:8545';

const TRANSFER_AMOUNT = ethers.utils.parseUnits(DEPOSIT_AMOUNT, 'ether');
const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);

const generateValidatorKeys = () => {
    const secretKey = blsKeygen.generateRandomSecretKey();

    return {
        secretKey: secretKey,
        publicKey: bls.secretKeyToPublicKey(secretKey)
    }
}

const simulate = async () => {
    await bls.init()
    const sender = await provider.getSigner();
    // const depositContract = new ethers.Contract(DEPOSIT_ADDRESS, abi, provider);

    const signingKey = generateValidatorKeys();
    const withdrawalKey = generateValidatorKeys();
    const withdrawalCredentials = ethers.utils.soliditySha256(['bytes'], [withdrawalKey.publicKey]);

    console.log(bls)

};

simulate()