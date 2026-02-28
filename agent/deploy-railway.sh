#!/bin/bash

echo "🚂 FlowWork Agent - Railway Deployment Script"
echo "=============================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Railway CLI not found. Installing..."
    npm install -g @railway/cli
else
    echo "✅ Railway CLI found"
fi

echo ""
echo "🔐 Login to Railway..."
railway login

echo ""
echo "📂 Initializing Railway project..."
railway init

echo ""
echo "⚙️  Setting up environment variables..."
echo ""

read -p "Enter BASE_RPC (default: https://mainnet.base.org): " base_rpc
base_rpc=${base_rpc:-https://mainnet.base.org}

read -p "Enter CONTRACT_ADDRESS (default: 0x6505231B85c760a9DCBE827315431c95e8c12e58): " contract_address
contract_address=${contract_address:-0x6505231B85c760a9DCBE827315431c95e8c12e58}

echo ""
echo "⚠️  IMPORTANT: Do NOT use your main wallet private key!"
echo "   Create a dedicated wallet for the agent."
echo ""
read -sp "Enter PRIVATE_KEY (will be hidden): " private_key
echo ""

railway variables set BASE_RPC="$base_rpc"
railway variables set CONTRACT_ADDRESS="$contract_address"
railway variables set PRIVATE_KEY="$private_key"

echo ""
read -p "Do you want to configure Claude API? (y/N): " use_claude

if [[ $use_claude =~ ^[Yy]$ ]]; then
    read -sp "Enter ANTHROPIC_API_KEY: " anthropic_key
    echo ""
    railway variables set ANTHROPIC_API_KEY="$anthropic_key"
    railway variables set CLAUDE_MODEL="claude-3-7-haiku-20250219"
    railway variables set CLAUDE_MAX_TOKENS="16000"
    railway variables set CLAUDE_TEMPERATURE="0.2"
    echo "✅ Claude API configured"
else
    echo "ℹ️  Skipping Claude API (will use fallback parser)"
fi

echo ""
read -p "Do you want to configure XMTP? (y/N): " use_xmtp

if [[ $use_xmtp =~ ^[Yy]$ ]]; then
    read -sp "Enter XMTP_WALLET_KEY: " xmtp_key
    echo ""
    read -p "Enter XMTP_DB_ENCRYPTION_KEY (random string): " xmtp_encryption
    railway variables set XMTP_WALLET_KEY="$xmtp_key"
    railway variables set XMTP_DB_ENCRYPTION_KEY="$xmtp_encryption"
    railway variables set XMTP_ENV="production"
    echo "✅ XMTP configured"
else
    echo "ℹ️  Skipping XMTP"
fi

echo ""
echo "🚀 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 View logs with: railway logs"
echo "🔍 View dashboard: railway open"
echo ""
