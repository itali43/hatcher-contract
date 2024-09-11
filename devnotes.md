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

- recheck withdrawal / splitsies
- confirm comfort with immediate send of RONIN to passive listing user upon conjunction
- will the msg.sender be the 721 always or does it send from breed ever (prob no)
- look for reentrancy
- live test on saigon
- upgrade script? (on deck for flaws)
-

CLAIMABLES NOTES:
i get the impression that claimantsTokenIdtoUserAddress is not working appropriately.
Need to likely try-catch the lines 395/6 this: `address addressParentA = claimantTokenIdToOwnerAddress[parentsIDs[0]];`
Need to make sure when spawned to receiver it gets a claimant named.
need to make sure delivered and arrived work, cuz delivered isn't rn.
also listed planets probably need to be marked as delivered, but do they need to also be marked for arrived when searching? Unclear.

ADDS:
do a owner only token withdrawal split, allow for remainder left behind
same for

- **_Solution to CHARGE APRS FOR TXNS_**
  <!-- - **_Splitsies works_** -->
  <!-- - **_upgrades_** -->
- **_Claims confirmed operational_**
<!-- - **_split for APRS etc, with total input_** -->

Note from sunday:

- worked on upgrade, probably bricked contract proxy.. I'd just hot swap to another and move on.. before that possible make a hello world and see how to upgrade it quick and easy from scratch. I think doing it via tasks is probably the approved solution, b/c that's how the deploy is done..
- focus on proving out claimables FIRST BEFORE ABOVE. try contract with script that's easy to see if works but honestly just jump ship, fuck it.
- splities could be tested in hello world.
- APRS should be a pretty testable practice. There's a GPT note about it.

Find a good work environment, relax and concentrate, workout at some point in the day and get some sun (1-1.75 hours well spent).

can you send an erc20 along with calling the conjunct function?

conjuncts:
5019 -- 11

anything less than 4585 is primeval, may have bug for checkCanBreed func
