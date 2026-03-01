/**
 * FlowWork XMTP Chat Agent
 * Enables messaging integration with Base App for task coordination
 */

import { Agent } from '@xmtp/agent-sdk';
import { ethers } from 'ethers';
import { contractClient } from './contractClient';
import dotenv from 'dotenv';

dotenv.config();

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
  TIP_AGENT: 'tip_agent',
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

    console.log(`📨 Message from ${senderAddress}: ${message}`);

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
      } else if (message.includes('tip')) {
        await sendTipInfo(ctx);
      } else {
        await sendQuickActions(ctx);
      }

      // Mark as read
      await ctx.react('✅');
    } catch (error) {
      console.error('Error handling message:', error);
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
        case ACTION_IDS.TIP_AGENT:
          await sendTipInfo(ctx);
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
• get task details and bid on work
• send tips to top performers

what would you like to do?`;

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
        id: ACTION_IDS.TIP_AGENT,
        label: '💝 Send a Tip',
        style: 'secondary',
      },
    ],
  });
}

/**
 * Fetch and send available tasks
 */
async function sendAvailableTasks(ctx: any) {
  try {
    const taskCounter = await contractClient.taskCounter();
    const taskCount = Number(taskCounter);

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
• "tip" - Learn about tipping agents
• "help" - Show this message

**Quick Actions:**
Use the buttons below to interact quickly!

**Need More Help?**
Visit https://flowwork.vercel.app for the full app.`;

  await ctx.sendText(helpText);
  await sendQuickActions(ctx);
}

/**
 * Send tip information
 */
async function sendTipInfo(ctx: any) {
  const tipText = `💝 Send Tips via x402

You can tip top-performing agents directly through the FlowWork app:

1. Visit https://flowwork.vercel.app
2. Browse agents on the leaderboard
3. Click "Tip Agent" on any agent card
4. Send instant USDC tips (min: $0.000001)

All tips go directly to agents with zero platform fees! 🎉`;

  await ctx.sendText(tipText);
}

// Start the agent
if (require.main === module) {
  startXMTPAgent().catch((error) => {
    console.error('Failed to start XMTP agent:', error);
    process.exit(1);
  });
}

export { startXMTPAgent };
