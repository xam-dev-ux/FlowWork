import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const FLOWWORK_ABI = [
  "function registerAgent(string _xmtpAddress, string _basename, string _apiEndpoint, string[] _specialties, uint256 _stake) external",
  "function getAgent(address agentAddress) external view returns (tuple(string xmtpAddress, string basename, uint8 tier, uint256 reputationScore, uint256 completedTasks, uint256 totalEarnings, uint256 pendingEarnings, uint256 stake, bool isActive))",
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
];

async function registerAgent() {
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC || "https://base-mainnet.public.blastapi.io");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS!,
    FLOWWORK_ABI,
    wallet
  );

  const usdcContract = new ethers.Contract(
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    USDC_ABI,
    wallet
  );

  console.log("🤖 FlowWork Agent Registration");
  console.log("================================\n");
  console.log("Wallet:", wallet.address);
  console.log("Contract:", process.env.CONTRACT_ADDRESS);
  
  // Check if already registered
  try {
    const agent = await contract.getAgent(wallet.address);
    if (agent.isActive) {
      console.log("\n✅ Agent already registered!");
      console.log("   Basename:", agent.basename);
      console.log("   Tier:", agent.tier);
      console.log("   Reputation:", agent.reputationScore.toString());
      console.log("   Completed Tasks:", agent.completedTasks.toString());
      console.log("   Stake:", ethers.formatUnits(agent.stake, 6), "USDC");
      return;
    }
  } catch (error: any) {
    // Agent not registered, continue
  }

  // Registration parameters
  const xmtpAddress = "flowwork-ai@xmtp.local"; // Placeholder
  const basename = "flowwork-ai.base.eth";
  const apiEndpoint = "https://flowwork-agent.railway.app";
  const specialties = [
    "Data Analysis",
    "Content Creation", 
    "Code Generation",
    "Research",
    "Translation"
  ];
  const stake = ethers.parseUnits("0.1", 6); // 0.1 USDC stake (minimum for testing)

  console.log("\n📋 Registration Parameters:");
  console.log("   XMTP:", xmtpAddress);
  console.log("   Basename:", basename);
  console.log("   Endpoint:", apiEndpoint);
  console.log("   Specialties:", specialties.join(", "));
  console.log("   Stake:", ethers.formatUnits(stake, 6), "USDC");

  // Check USDC balance
  const balance = await usdcContract.balanceOf(wallet.address);
  console.log("\n💰 USDC Balance:", ethers.formatUnits(balance, 6), "USDC");

  if (balance < stake) {
    console.error("\n❌ Insufficient USDC for stake!");
    console.error("   Need:", ethers.formatUnits(stake, 6), "USDC");
    console.error("   Have:", ethers.formatUnits(balance, 6), "USDC");
    return;
  }

  // Approve USDC (approve more than stake to be safe)
  console.log("\n1️⃣ Approving USDC...");
  const approveAmount = ethers.parseUnits("1", 6); // Approve 1 USDC to be safe
  const approveTx = await usdcContract.approve(process.env.CONTRACT_ADDRESS!, approveAmount);
  const approveReceipt = await approveTx.wait();
  console.log("   ✅ Approved", ethers.formatUnits(approveAmount, 6), "USDC");
  console.log("   Waiting for confirmation...");
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s for blockchain confirmation

  // Register agent
  console.log("\n2️⃣ Registering agent...");
  const registerTx = await contract.registerAgent(
    xmtpAddress,
    basename,
    apiEndpoint,
    specialties,
    stake
  );
  await registerTx.wait();
  console.log("   ✅ Registered!");

  // Verify registration
  const agent = await contract.getAgent(wallet.address);
  console.log("\n✅ Agent Successfully Registered!");
  console.log("   Address:", wallet.address);
  console.log("   Basename:", agent.basename);
  console.log("   Tier:", agent.tier);
  console.log("   Stake:", ethers.formatUnits(agent.stake, 6), "USDC");
  console.log("   Active:", agent.isActive);
  console.log("\n🎉 You can now accept tasks on FlowWork!");
}

registerAgent().catch(console.error);
