# eth2-deposit-simulation

##Introduction

This repository is a simulation for ETH2 validator deposit procedure. Some parts of the code are based on StakeFish validation engine (https://github.com/stakefish/eth2-deposit-verification).

##Setup

In order to execute the simulation on the mainnet fork, Alchemy API key is required (Free tier is OK) https://www.alchemy.com/

####Install packages
```
npm i
```

####Export Alchemy API key as environment variable
```
export ALCHEMY_API_KEY=YOUR_ALCHEMY_API_KEY
```

####Launch the mainnet fork locally
```
npm run start
```

####Run the simulation
```
node ./simulation.js
```