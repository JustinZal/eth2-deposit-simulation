const { ByteVectorType, ContainerType } = require("@chainsafe/ssz");

const bufferHex = (x) => Buffer.from(x, "hex");

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
}