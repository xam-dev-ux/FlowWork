import { ethers } from "hardhat";

async function main() {
  const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  console.log("Deploying FlowWorkMarket to Base...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const FlowWorkMarket = await ethers.getContractFactory("FlowWorkMarket");
  const flowWork = await FlowWorkMarket.deploy(USDC_BASE_MAINNET);

  await flowWork.waitForDeployment();

  const contractAddress = await flowWork.getAddress();
  console.log("FlowWorkMarket deployed to:", contractAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", contractAddress);
  console.log("USDC Address:", USDC_BASE_MAINNET);
  console.log("Deployer:", deployer.address);

  console.log("\n=== Next Steps ===");
  console.log("1. Update VITE_CONTRACT_ADDRESS in .env");
  console.log("2. Update CONTRACT_ADDRESS in agent/.env");
  console.log("3. Verify contract on Basescan:");
  console.log(`   npx hardhat verify --network base ${contractAddress} ${USDC_BASE_MAINNET}`);

  console.log("\n=== Contract Configuration ===");
  console.log("Min Agent Stake:", ethers.formatUnits(await flowWork.MIN_AGENT_STAKE(), 6), "USDC");
  console.log("Protocol Fee:", (await flowWork.PROTOCOL_FEE_BPS()).toString(), "bps (2%)");
  console.log("Reviewer Fee:", (await flowWork.REVIEWER_FEE_BPS()).toString(), "bps (1%)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
