/**
 * FlowWork XMTP Chat Agent
 * Enables messaging integration with Base App for task coordination
 */

import { Agent } from '@xmtp/agent-sdk';
import { ethers } from 'ethers';
import { contractClient } from './contractClient';
import dotenv from 'dotenv';

dotenv.config();

// USDC Contract on Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ABI = ["function transfer(address to, uint256 amount) returns (bool)"];
const MIN_TIP_AMOUNT = "0.000001"; // Minimum x402 payment

const AGENT_NAME = "FlowWork Agent";
const AGENT_ADDRESS = process.env.XMTP_WALLET_KEY
  ? new ethers.Wallet(process.env.XMTP_WALLET_KEY).address
  : "";

// Action IDs for Quick Actions
const ACTION_IDS = {
  VIEW_TASKS: 'view_tasks',
  MY_TASKS: 'my_tasks',
  TASK_DETAILS: 'task_details',
  BID_TASK: 'bid_task',
  SEND_TIP: 'send_tip',
  OPEN_APP: 'open_app',
};

async function startXMTPAgent() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║                                              ║');
  console.log('║     💬 FlowWork XMTP Chat Agent 💬          ║');
  console.log('║                                              ║');
  console.log('║  Connect with clients and agents via chat   ║');
  console.log('║                                              ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // Initialize XMTP agent
  const agent = await Agent.createFromEnv({
    env: (process.env.XMTP_ENV as 'production' | 'dev' | 'local') || 'production',
  });

  console.log('📋 Agent Configuration:');
  console.log(`   Agent Address: ${AGENT_ADDRESS}`);
  console.log(`   XMTP Environment: ${process.env.XMTP_ENV}`);
  console.log(`   Contract: ${process.env.CONTRACT_ADDRESS}\n`);

  // Handle text messages
  agent.on('text', async (ctx) => {
    const message = ctx.message.content.toLowerCase();
    const senderAddress = ctx.conversation.peerAddress;

    console.log(`\n📨 Message from ${senderAddress}: ${message}`);
    console.log(`   Conversation ID: ${ctx.conversation.id}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // React to show message received
    await ctx.react('👀');

    try {
      // Check for different commands
      if (message.includes('hello') || message.includes('hi') || message.includes('gm')) {
        await sendWelcomeMessage(ctx);
      } else if (message.includes('tasks') || message.includes('available')) {
        await sendAvailableTasks(ctx);
      } else if (message.includes('my tasks') || message.includes('assigned')) {
        await sendMyTasks(ctx, senderAddress);
      } else if (message.includes('help')) {
        await sendHelpMessage(ctx);
      } else if (message.includes('tip') || message.includes('pay')) {
        await handleTipRequest(ctx, message, senderAddress);
      } else if (message.includes('app') || message.includes('website')) {
        await sendAppLink(ctx);
      } else {
        await sendQuickActions(ctx);
      }

      // Mark as read
      await ctx.react('✅');
    } catch (error) {
      console.error('\n❌ Error handling message:', error);
      console.error(`   From: ${senderAddress}`);
      console.error(`   Message: ${message}`);
      await ctx.sendText('Sorry, I encountered an error processing your request. Please try again.');
      await ctx.react('❌');
    }
  });

  // Handle intents (user clicked a Quick Action button)
  agent.on('intent', async (ctx) => {
    const { actionId, id } = ctx.message.content;
    console.log(`🎯 Intent received: ${actionId} (${id})`);

    await ctx.react('⌛');

    try {
      switch (actionId) {
        case ACTION_IDS.VIEW_TASKS:
          await sendAvailableTasks(ctx);
          break;
        case ACTION_IDS.MY_TASKS:
          await sendMyTasks(ctx, ctx.conversation.peerAddress);
          break;
        case ACTION_IDS.SEND_TIP:
          await sendTipActions(ctx);
          break;
        case ACTION_IDS.OPEN_APP:
          await sendAppLink(ctx);
          break;
        default:
          await ctx.sendText('Action not recognized. Please try again.');
      }

      await ctx.react('✅');
    } catch (error) {
      console.error('Error handling intent:', error);
      await ctx.sendText('Sorry, I encountered an error. Please try again.');
      await ctx.react('❌');
    }
  });

  // Handle reactions
  agent.on('reaction', async (ctx) => {
    const reaction = ctx.message.content;
    console.log(`👍 Reaction received: ${reaction.content}`);
  });

  // Start the agent
  agent.on('start', () => {
    console.log('✅ XMTP Agent running!');
    console.log(`🎯 Agent Address: ${agent.address}`);
    console.log(`📱 Message me at: ${agent.address} or via basename\n`);
    console.log('💡 Tip: Get a basename at https://base.org/names\n');
  });

  await agent.start();
}

/**
 * Send welcome message with Quick Actions
 */
async function sendWelcomeMessage(ctx: any) {
  const welcomeText = `hey! i'm the FlowWork agent 🤖

i can help you with:
• browse available tasks and bounties
• check tasks assigned to you
• send instant USDC payments (x402)
• open the FlowWork app directly

**Try these commands:**
"tasks" - See available work
"tip 5 to 0x..." - Send 5 USDC payment
"app" - Open FlowWork

what would you like to do?`;

  console.log('💬 Sending welcome message');
  await ctx.sendText(welcomeText);
  await sendQuickActions(ctx);
}

/**
 * Send Quick Actions menu
 */
async function sendQuickActions(ctx: any) {
  await ctx.sendActions({
    id: `flowwork_menu_${Date.now()}`,
    description: 'Choose an action:',
    actions: [
      {
        id: ACTION_IDS.VIEW_TASKS,
        label: '📋 View Available Tasks',
        style: 'primary',
      },
      {
        id: ACTION_IDS.MY_TASKS,
        label: '✅ My Tasks',
        style: 'secondary',
      },
      {
        id: ACTION_IDS.SEND_TIP,
        label: '💰 Send Payment (x402)',
        style: 'secondary',
      },
      {
        id: ACTION_IDS.OPEN_APP,
        label: '🌐 Open FlowWork App',
        style: 'secondary',
      },
    ],
  });
}

/**
 * Fetch and send available tasks
 */
async function sendAvailableTasks(ctx: any) {
  console.log('📋 Fetching available tasks...');
  try {
    const taskCounter = await contractClient.taskCounter();
    const taskCount = Number(taskCounter);
    console.log(`   Found ${taskCount} total tasks`);

    if (taskCount === 0) {
      await ctx.sendText('No tasks available yet. Check back soon! 🔄');
      return;
    }

    const openTasks = [];
    for (let i = 1; i <= Math.min(taskCount, 10); i++) {
      try {
        const task = await contractClient.getTask(i);
        if (task.status === 0) { // Open status
          openTasks.push({ id: i, ...task });
        }
      } catch (error) {
        console.error(`Error fetching task ${i}:`, error);
      }
    }

    if (openTasks.length === 0) {
      await ctx.sendText('No open tasks available right now. 🔍');
      return;
    }

    let message = `📋 Available Tasks (${openTasks.length}):\n\n`;

    for (const task of openTasks.slice(0, 5)) {
      const bountyInUSDC = ethers.formatUnits(task.bounty, 6);
      const deadline = new Date(Number(task.deadline) * 1000).toLocaleDateString();

      message += `**Task #${task.id}**\n`;
      message += `${task.description.substring(0, 80)}${task.description.length > 80 ? '...' : ''}\n`;
      message += `💰 Bounty: $${bountyInUSDC} USDC\n`;
      message += `📅 Deadline: ${deadline}\n\n`;
    }

    message += '\n💡 Visit https://flowwork.vercel.app to bid on tasks!';

    await ctx.sendText(message);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    await ctx.sendText('Sorry, I couldn\'t fetch the available tasks. Please try again later.');
  }
}

/**
 * Fetch and send user's assigned tasks
 */
async function sendMyTasks(ctx: any, userAddress: string) {
  try {
    const taskCounter = await contractClient.taskCounter();
    const taskCount = Number(taskCounter);

    const myTasks = [];
    for (let i = 1; i <= taskCount; i++) {
      try {
        const task = await contractClient.getTask(i);
        if (task.assignedAgent.toLowerCase() === userAddress.toLowerCase()) {
          myTasks.push({ id: i, ...task });
        }
      } catch (error) {
        console.error(`Error fetching task ${i}:`, error);
      }
    }

    if (myTasks.length === 0) {
      await ctx.sendText('You don\'t have any assigned tasks yet. Browse available tasks to get started! 🚀');
      return;
    }

    let message = `✅ Your Tasks (${myTasks.length}):\n\n`;

    for (const task of myTasks) {
      const bountyInUSDC = ethers.formatUnits(task.bounty, 6);
      const statusText = ['Open', 'Assigned', 'Submitted', 'Approved', 'Disputed'][task.status] || 'Unknown';

      message += `**Task #${task.id}** - ${statusText}\n`;
      message += `${task.description.substring(0, 60)}...\n`;
      message += `💰 Bounty: $${bountyInUSDC} USDC\n\n`;
    }

    message += '\n📱 Visit the app to submit your work!';

    await ctx.sendText(message);
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    await ctx.sendText('Sorry, I couldn\'t fetch your tasks. Please try again later.');
  }
}

/**
 * Send help message
 */
async function sendHelpMessage(ctx: any) {
  const helpText = `🤖 FlowWork Agent Help

**Available Commands:**
• "hello" or "gm" - Get started
• "tasks" or "available" - See open tasks
• "my tasks" - View your assigned tasks
• "tip [amount] to [address]" - Send USDC payment (x402)
• "app" or "website" - Open FlowWork app
• "help" - Show this message

**Payment Examples:**
• "tip 5 to 0x742d35..." - Send 5 USDC
• "pay 0.1 to 0x742d35..." - Send 0.1 USDC

**Quick Actions:**
Use the buttons below to interact quickly!

**Need More Help?**
Visit https://flowwork.vercel.app for the full app.`;

  await ctx.sendText(helpText);
  await sendQuickActions(ctx);
}

/**
 * Handle tip/payment requests with x402
 */
async function handleTipRequest(ctx: any, message: string, senderAddress: string) {
  // Check if message contains amount and recipient
  // Format: "tip 5 to 0x..." or "pay 10 usdc to 0x..."
  const amountMatch = message.match(/(\d+\.?\d*)/);
  const addressMatch = message.match(/(0x[a-fA-F0-9]{40})/);

  if (amountMatch && addressMatch) {
    const amount = amountMatch[1];
    const recipient = addressMatch[1];
    await sendPayment(ctx, amount, recipient, senderAddress);
  } else {
    // Show tip options with Quick Actions
    await sendTipActions(ctx);
  }
}

/**
 * Send payment using x402 protocol
 */
async function sendPayment(ctx: any, amount: string, recipient: string, senderAddress: string) {
  try {
    console.log(`💰 Processing payment: ${amount} USDC to ${recipient} from ${senderAddress}`);

    const amountNum = parseFloat(amount);
    const minAmount = parseFloat(MIN_TIP_AMOUNT);

    if (isNaN(amountNum) || amountNum < minAmount) {
      await ctx.sendText(`❌ Invalid amount. Minimum is ${MIN_TIP_AMOUNT} USDC.`);
      return;
    }

    // Create payment request
    const wallet = new ethers.Wallet(process.env.XMTP_WALLET_KEY!);
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC);
    const signer = wallet.connect(provider);

    const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
    const amountInUnits = ethers.parseUnits(amount, 6); // USDC has 6 decimals

    // Send confirmation message
    await ctx.sendText(`⏳ Processing payment of ${amount} USDC to ${recipient.slice(0, 10)}...`);

    // Execute transfer
    const tx = await usdcContract.transfer(recipient, amountInUnits);
    console.log(`   Transaction sent: ${tx.hash}`);

    await ctx.sendText(`✅ Payment sent! Transaction: https://basescan.org/tx/${tx.hash}`);

    // Wait for confirmation
    await tx.wait();
    console.log(`   Transaction confirmed`);

    await ctx.sendText(`🎉 Payment of ${amount} USDC confirmed on-chain!`);
  } catch (error: any) {
    console.error('Error sending payment:', error);
    await ctx.sendText(`❌ Payment failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Send tip actions with preset amounts
 */
async function sendTipActions(ctx: any) {
  await ctx.sendText(`💰 x402 Instant Payments

Send USDC payments directly from this chat!

**How to send:**
Type: "tip [amount] to [address]"
Example: "tip 5 to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

**Minimum:** ${MIN_TIP_AMOUNT} USDC
**Network:** Base L2
**Fees:** Zero platform fees! Only gas.

Or visit the app to send tips with a nice UI:`);

  await sendAppLink(ctx);
}

/**
 * Send app link with Mini App embed
 */
async function sendAppLink(ctx: any) {
  const appUrl = "https://flowwork.vercel.app";
  const deeplink = "cbwallet://dapp?url=https://flowwork.vercel.app";

  const message = `🌐 **FlowWork - AI Agent Marketplace**

Browse tasks, hire agents, and send instant payments!

**Open in Base App:**
${deeplink}

**Or visit directly:**
${appUrl}

Features:
• Browse available tasks with bounties
• Hire AI agents to complete work
• Send instant USDC tips (x402)
• Track agent reputation and earnings
• Zero platform fees`;

  await ctx.sendText(message);

  // Send Quick Actions for easy access
  await ctx.sendActions({
    id: `app_link_${Date.now()}`,
    description: 'Quick actions:',
    actions: [
      {
        id: 'open_browser',
        label: '🌐 Open in Browser',
        style: 'primary',
      },
      {
        id: 'back_menu',
        label: '⬅️ Back to Menu',
        style: 'secondary',
      },
    ],
  });
}

// Start the agent
if (require.main === module) {
  startXMTPAgent().catch((error) => {
    console.error('Failed to start XMTP agent:', error);
    process.exit(1);
  });
}

export { startXMTPAgent };
