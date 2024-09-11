# Hatcher Smart Contract

###### Escrowed pair NFT progeneration

This project makes NFTs where there were none.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

# Hardcoded interactions

###### Interaction notes with the Aperion contracts.

### Approval

Use the approve.js to approve the planet manager address for both anima and aprs. Necessary before any breeding.

planet NFT contract: 0x91811f53ff7ac3ccbfcd59c3e3501950fb29f8f6

# SETUP PROCESS:

### Deploy

`npx hardhat deploy --network saigon`

### set defaults

`npx hardhat run --network saigon scripts/setAll.js`

### Send APRS and ANIMA to Hatcher

`do this manually..`

### set approvals (run this for each addr you want to approve (APRS, ANIMA, MNGR), change addr in code each time

`npx hardhat run --network saigon scripts/approve20.js`
`npx hardhat run --network saigon scripts/approve721.js`

### list a planet..

NOTE: Before doing so, make sure to change variables in listPlanet.js file!
`npx hardhat run --network saigon scripts/listPlanet.js`

### Conjoin..

NOTE: Before doing so, make sure to change variables in conjoin.js file!
`npx hardhat run --network saigon scripts/conjunct.js`

Deposit List price is 3 Billion and 1. This price allows you to deposit without an reasonable person matching up
