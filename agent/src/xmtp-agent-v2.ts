/**
 * FlowWork XMTP Chat Agent v2
 * Using @xmtp/node-sdk directly (agent-sdk has bugs)
 */

import { Client, type Signer } from '@xmtp/node-sdk';
import { ethers } from 'ethers';
import { contractClient } from './contractClient';
import { addBuilderCode } from './lib/builderCode';
import dotenv from 'dotenv';

dotenv.config();

const AGENT_NAME = "FlowWork Agent";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ABI = ["function transfer(address to, uint256 amount) returns (bool)"];
const MIN_TIP_AMOUNT = "0.000001";
const AUTO_TIP_AMOUNT = "0.0000001"; // x402 micro-payment to every user

// Create a signer wrapper for ethers.Wallet
function createXMTPSigner(wallet: ethers.Wallet): Signer {
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: wallet.address,
      identifierKind: 0, // IdentifierKind.Ethereum = 0
    }),
    signMessage: async (message: string): Promise<Uint8Array> => {
      const signature = await wallet.signMessage(message);
      // Convert hex signature to Uint8Array
      return ethers.getBytes(signature);
    },
  };
}

async function startXMTPAgent() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║                                              ║');
  console.log('║     💬 FlowWork XMTP Chat Agent v2 💬       ║');
  console.log('║                                              ║');
  console.log('║  Connect with clients and agents via chat   ║');
  console.log('║                                              ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // Initialize wallet
  const wallet = new ethers.Wallet(process.env.XMTP_WALLET_KEY!);

  console.log('📋 Agent Configuration:');
  console.log(`   Agent Address: ${wallet.address}`);
  console.log(`   Contract: ${process.env.CONTRACT_ADDRESS}`);
  console.log(`   Environment: ${process.env.XMTP_ENV}\n`);

  // Create encryption key from environment variable
  // Convert the string to UTF-8 bytes
  const encryptionKeyString = process.env.XMTP_DB_ENCRYPTION_KEY!;
  const encryptionKey = ethers.toUtf8Bytes(encryptionKeyString);

  // Create XMTP signer
  const signer = createXMTPSigner(wallet);

  // Create XMTP client
  console.log('🔄 Initializing XMTP client...');
  const client = await Client.create(signer, {
    encryptionKey,
    env: process.env.XMTP_ENV === 'production' ? 'production' : 'dev',
  });

  console.log('✅ XMTP Client initialized!');
  console.log(`🎯 Agent Address: ${wallet.address}`);
  console.log(`📱 Message me via Base App!\n`);

  // Sync conversations first
  console.log('👂 Listening for messages...\n');
  await client.conversations.sync();

  const conversations = await client.conversations.list();
  console.log(`💬 Found ${conversations.length} existing conversations\n`);

  // Track processed messages to avoid duplicates
  const processedMessages = new Set<string>();

  // Stream all messages from all conversations
  const stream = await client.conversations.streamAllMessages();

  for await (const message of stream) {
    try {
      // Skip messages from self
      if (message.senderInboxId === client.inboxId) {
        console.log('⏭️  Skipping own message');
        continue;
      }

      // Skip if already processed
      const messageId = message.id || `${message.conversationId}-${message.sentAt}`;
      if (processedMessages.has(messageId)) {
        console.log('⏭️  Skipping duplicate message');
        continue;
      }

      // Mark as processed
      processedMessages.add(messageId);

      // Get the conversation this message belongs to
      const conversation = await client.conversations.getConversationById(message.conversationId);

      // Handle the message
      await handleMessage(conversation, message, wallet, client);
    } catch (error: any) {
      console.error(`❌ Error processing message: ${error.message}`);
    }
  }
}

async function handleMessage(conversation: any, message: any, wallet: ethers.Wallet, client: any) {
  // Get message content
  const text = message.content?.text || message.content || '';

  // Skip empty messages or non-text content
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    console.log('\n⏭️  Skipping empty or non-text message');
    return;
  }

  // Get sender's Ethereum address from inbox ID
  const inboxState = await client.preferences.inboxStateFromInboxIds([message.senderInboxId]);
  const sender = inboxState[0]?.identifiers[0]?.identifier;

  if (!sender) {
    console.log('\n⚠️  Could not determine sender address');
    return;
  }

  console.log(`\n📨 Message from ${sender.slice(0, 10)}...`);
  console.log(`   Content: ${text}`);

  try {
    // Generate and send text response
    const response = await generateResponse(text, sender);
    await conversation.send(response);
    console.log(`   ✅ Replied: ${response.substring(0, 50)}...`);

    // Send automatic x402 micro-payment
    await sendAutoTip(sender, wallet);
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    await conversation.send('Sorry, I encountered an error. Please try again.');
  }
}

async function sendAutoTip(recipient: string, wallet: ethers.Wallet) {
  try {
    console.log(`   💸 Sending ${AUTO_TIP_AMOUNT} USDC tip to ${recipient.slice(0, 10)}...`);

    // Connect to provider
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC);
    const signer = wallet.connect(provider);

    // Create USDC contract instance
    const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

    // Convert amount to USDC units (6 decimals)
    const amountInUnits = ethers.parseUnits(AUTO_TIP_AMOUNT, 6);

    // Encode the transfer function call
    const transferData = usdcContract.interface.encodeFunctionData("transfer", [
      recipient,
      amountInUnits,
    ]);

    // Add Builder Code attribution for Base analytics
    const dataWithBuilderCode = addBuilderCode(transferData);

    // Send the tip with Builder Code
    const tx = await signer.sendTransaction({
      to: USDC_ADDRESS,
      data: dataWithBuilderCode,
    });

    console.log(`   ✅ Tip sent! TX: ${tx.hash.slice(0, 16)}...`);

    // Don't wait for confirmation to keep response fast
    tx.wait().then(() => {
      console.log(`   ⛓️  Tip confirmed on-chain!`);
    }).catch((error) => {
      console.error(`   ⚠️  Tip confirmation failed: ${error.message}`);
    });
  } catch (error: any) {
    console.error(`   ⚠️  Failed to send auto-tip: ${error.message}`);
    // Don't throw error, continue with message response
  }
}

async function generateResponse(message: string, sender: string): Promise<string> {
  const msg = message.toLowerCase();

  // Greetings
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('gm')) {
    return `hey! i'm the FlowWork agent 🤖

💝 **You just received ${AUTO_TIP_AMOUNT} USDC!**
I send a micro-tip to everyone who messages me (x402 payments)

i can help you with:
• browse available tasks and bounties
• check tasks assigned to you
• open the FlowWork app

**Try these commands:**
"tasks" - See available work
"my tasks" - Your assignments
"app" - Open FlowWork
"help" - All commands`;
  }

  // Tasks
  if (msg.includes('task') && !msg.includes('my')) {
    return await getAvailableTasks();
  }

  // My tasks
  if (msg.includes('my') && msg.includes('task')) {
    return await getMyTasks(sender);
  }

  // App link
  if (msg.includes('app') || msg.includes('website')) {
    return `🌐 **FlowWork - AI Agent Marketplace**

**Open in Base App:**
cbwallet://dapp?url=https://flowwork.vercel.app

**Or visit directly:**
https://flowwork.vercel.app

Browse tasks, hire agents, and send instant payments!`;
  }

  // Help
  if (msg.includes('help')) {
    return `🤖 **FlowWork Agent Help**

**Commands:**
• "hello" or "gm" - Get started
• "tasks" - See open tasks
• "my tasks" - View your tasks
• "app" - Open FlowWork app
• "help" - This message

**Payments (coming soon):**
• "tip [amount] to [address]"

Visit https://flowwork.vercel.app for more!`;
  }

  // Default response
  return `👋 Hi! I'm the FlowWork agent.

Try these commands:
• "tasks" - See available work
• "my tasks" - Your assignments
• "app" - Open FlowWork
• "help" - All commands`;
}

async function getAvailableTasks(): Promise<string> {
  try {
    const taskCounter = await contractClient.taskCounter();
    const taskCount = Number(taskCounter);

    if (taskCount === 0) {
      return 'No tasks available yet. Check back soon! 🔄';
    }

    const openTasks = [];
    for (let i = 1; i <= Math.min(taskCount, 10); i++) {
      try {
        const task = await contractClient.getTask(i);
        if (task.status === 0) {
          openTasks.push({ id: i, ...task });
        }
      } catch (error) {
        // Skip failed tasks
      }
    }

    if (openTasks.length === 0) {
      return 'No open tasks right now. 🔍';
    }

    let response = `📋 **Available Tasks** (${openTasks.length}):\n\n`;

    for (const task of openTasks.slice(0, 5)) {
      const bountyInUSDC = ethers.formatUnits(task.bounty, 6);
      const deadline = new Date(Number(task.deadline) * 1000).toLocaleDateString();

      response += `**Task #${task.id}**\n`;
      response += `${task.description.substring(0, 60)}...\n`;
      response += `💰 $${bountyInUSDC} USDC | 📅 ${deadline}\n\n`;
    }

    response += '\n💡 Visit https://flowwork.vercel.app to bid!';
    return response;
  } catch (error: any) {
    return 'Sorry, couldn\'t fetch tasks. Try again later.';
  }
}

async function getMyTasks(userAddress: string): Promise<string> {
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
        // Skip failed tasks
      }
    }

    if (myTasks.length === 0) {
      return 'You don\'t have any tasks yet. Browse available tasks to get started! 🚀';
    }

    let response = `✅ **Your Tasks** (${myTasks.length}):\n\n`;

    for (const task of myTasks) {
      const bountyInUSDC = ethers.formatUnits(task.bounty, 6);
      const statusText = ['Open', 'Assigned', 'Submitted', 'Approved', 'Disputed'][task.status] || 'Unknown';

      response += `**Task #${task.id}** - ${statusText}\n`;
      response += `${task.description.substring(0, 50)}...\n`;
      response += `💰 $${bountyInUSDC} USDC\n\n`;
    }

    response += '\n📱 Visit the app to submit your work!';
    return response;
  } catch (error: any) {
    return 'Sorry, couldn\'t fetch your tasks. Try again later.';
  }
}

// Start the agent
if (require.main === module) {
  startXMTPAgent().catch((error) => {
    console.error('Failed to start XMTP agent:', error);
    process.exit(1);
  });
}

export { startXMTPAgent };
