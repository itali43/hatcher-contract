// npx hardhat deploy --network saigon
// reference: https://docs.skymavis.com/ronin/smart-contracts/tutorials/deploy

const { TASK_SOURCIFY } = require("hardhat-deploy");

const deploy = async (hre) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const balance = await hre.ethers.provider.getBalance(deployer);
  console.log(`Deployer balance: ${balance} wei`);

  await deploy("HatcherV3", {
    contract: "HatcherV3",
    from: deployer,
    args: [],
    gasPrice: "50000000000",

    proxy: {
      proxyContract: "UUPS",
      proxyArgs: ["{implementation}", "{data}"],
      execute: {
        init: {
          methodName: "initialize",
          args: ["0x2e215ef19ea15f6f31198125847e94a2026ba336"],
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
