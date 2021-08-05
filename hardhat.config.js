/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const API_KEY = process.env.ALCHEMY_API_KEY;

module.exports = {
  solidity: "0.7.3",
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${API_KEY}`,
        blockNumber: 12964790
      }
    }
  }
};
