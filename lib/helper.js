const { bufferHex, ForkData, SigningData } = require("./ssz");

const forkVersion = Buffer.from("00000000", "hex");

const GENESIS_FORK_VERSION = forkVersion;

const DOMAIN_DEPOSIT = Buffer.from("03000000", "hex");
const EMPTY_ROOT = Buffer.from(
  "0000000000000000000000000000000000000000000000000000000000000000",
  "hex"
);

const computeForkDataRoot = (currentVersion, genesisValidatorsRoot) => {
  const forkData = {
    currentVersion,
    genesisValidatorsRoot,
  };
  return ForkData.hashTreeRoot(forkData);
};

const computeDomain = (
  domainType,
  forkVersion = GENESIS_FORK_VERSION,
  genesisValidatorsRoot = EMPTY_ROOT
) => {
  const forkDataRoot = computeForkDataRoot(forkVersion, genesisValidatorsRoot);
  const domain = new Uint8Array(32);
  domain.set(domainType);
  domain.set(forkDataRoot.subarray(0, 28), 4);
  return domain;
};

const computeSigningRoot = (sszObjectRoot, domain) => {
  const signingData = {
    objectRoot: sszObjectRoot,
    domain,
  };

  return SigningData.hashTreeRoot(signingData);
};

const getDomain = () => computeDomain(DOMAIN_DEPOSIT)

// Note: usage of this method requires awaiting the initBLS() method from "@chainsafe/bls";
const verifySignature = (depositDatum, verify) => {
  const pubkeyBuffer = depositDatum.pubkey;
  const signatureBuffer = depositDatum.signature;
  const depositMessageBuffer = depositDatum.deposit_message_root;

  const domain = getDomain();
  const signingRoot = computeSigningRoot(depositMessageBuffer, domain);

  return verify(pubkeyBuffer, signingRoot, signatureBuffer);
};

module.exports = {
  verifySignature,
  computeSigningRoot,
  getDomain,
}