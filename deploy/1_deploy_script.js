// npx hardhat deploy --network saigon
// reference: https://docs.skymavis.com/ronin/smart-contracts/tutorials/deploy

const func = async function (hre) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy("HatcherV1", {
    from: deployer,
    args: [],
    log: true,
  });
};
module.exports = func;
func.tags = ["HatcherV1"];
