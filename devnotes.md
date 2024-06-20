# Scrap dev notes from development

`@nomiclabs/hardhat-waffle` did not take, ethers dependency conflict, left out for now.

# Questions:

requestbreed or requestbreedwithanimus function is best?

DO I need to authorize movement of my NFTs to the contract or since I'm calling it do I get it for free?

request approvals? PlanetAttributeManager?

consider `Reentrancy`---- Reentrancy Attacks: Protect against reentrancy attacks by using the nonReentrant modifier from OpenZeppelin's ReentrancyGuard if your function involves multiple state changes or external calls.

check size:
`npx hardhat size-contracts`

note a claim when breed is requested
note a claimable when nft is sent
when withdrawal is requested use claimable and cross reference with claimable

withdrawal ability>??
