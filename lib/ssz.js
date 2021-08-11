const { ByteVectorType, ContainerType, NumberUintType } = require("@chainsafe/ssz");

const bufferHex = (x) => Buffer.from(x, "hex");

const DepositMessage = new ContainerType({
    fields: {
        pubkey: new ByteVectorType({
            length: 48,
        }),
        withdrawalCredentials: new ByteVectorType({
            length: 32,
        }),
        amount: new NumberUintType({
            byteLength: 8,
        }),
    },
});

const buildMessageRoot = (depositData) => {
    const depositDataObject = {
        pubkey: depositData.pubkey,
        withdrawalCredentials: depositData.withdrawal_credentials,
        amount: Number(depositData.amount),
    };

    console.log('HASH result', DepositMessage.hashTreeRoot(depositDataObject).toString('hex'))

    return DepositMessage.hashTreeRoot(depositDataObject);
};

const SigningData = new ContainerType({
    fields: {
        objectRoot: new ByteVectorType({
            length: 32,
        }),
        domain: new ByteVectorType({
            length: 32,
        }),
    },
});

const ForkData = new ContainerType({
    fields: {
        currentVersion: new ByteVectorType({
            length: 4,
        }),
        genesisValidatorsRoot: new ByteVectorType({
            length: 32,
        }),
    },
});

module.exports  = {
    ForkData,
    SigningData,
    bufferHex,
    buildMessageRoot,
}