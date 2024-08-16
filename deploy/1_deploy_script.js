// npx hardhat deploy --network saigon
// reference: https://docs.skymavis.com/ronin/smart-contracts/tutorials/deploy

const { TASK_SOURCIFY } = require("hardhat-deploy");

const deploy = async (hre) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  console.log("deployer============================");

  console.log(deployer);
  console.log("-----------");
  const balance = await hre.ethers.provider.getBalance(deployer);
  console.log(`Deployer balance: ${balance} wei`);

  await deploy("HatcherV2", {
    contract: "HatcherV2",
    from: deployer,
    args: [],
    gasPrice: "50000000000",

    proxy: {
      proxyContract: "UUPS",
      proxyArgs: ["{implementation}", "{data}"],
      execute: {
        init: {
          methodName: "initialize",
          args: [],
        },
      },
    },
    log: true,
  });

  console.log("I DEPLOYED");

  await hre.run(TASK_SOURCIFY, {
    endpoint: "https://sourcify.roninchain.com/server",
  });
};

module.exports = deploy;
