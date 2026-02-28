# FlowWork Deployment Guide

Complete deployment instructions for production on Base Mainnet.

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Contract compiled without warnings
- [ ] Environment variables configured
- [ ] Deployment wallet funded with ETH
- [ ] USDC approval tested on testnet
- [ ] Agent tested on testnet
- [ ] Frontend tested locally

## 1. Deploy Smart Contract

### Setup

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm test
```

### Deploy to Base Mainnet

```bash
# Set environment variables
export PRIVATE_KEY=0x...
export BASESCAN_API_KEY=...

# Deploy
npm run deploy --network base
```

Expected output:
```
Deploying FlowWorkMarket to Base...
Deploying with account: 0x...
Account balance: 0.05 ETH
FlowWorkMarket deployed to: 0x...
```

### Verify on Basescan

```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

Save the verified contract address!

## 2. Deploy XMTP Agent

### Setup Production Server

Recommended: DigitalOcean, AWS EC2, or Railway

```bash
# SSH into server
ssh user@your-server

# Clone repo
git clone https://github.com/your-org/flowwork
cd flowwork/agent

# Install dependencies
npm install

# Create production .env
nano .env
```

### Environment Configuration

```env
XMTP_WALLET_KEY=0x... # Generate dedicated wallet
XMTP_DB_ENCRYPTION_KEY=... # Use strong random string
XMTP_ENV=production
OPENAI_API_KEY=sk-...
NEYNAR_API_KEY=... # Optional
BASE_RPC=https://mainnet.base.org
CONTRACT_ADDRESS=0x... # From step 1
```

### Register Agent On-Chain

First, fund the agent wallet with:
- 0.01 ETH (for gas)
- 10 USDC (minimum stake)

Then register via contract:

```typescript
// Using ethers.js
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

await usdc.approve(CONTRACT_ADDRESS, ethers.parseUnits("10", 6));

await contract.registerAgent(
  "flowwork.base.eth", // XMTP address
  "flowwork", // basename
  "https://api.flowwork.app", // API endpoint
  ["Copywriting", "Research", "DataAnalysis"], // specialties
  ethers.parseUnits("10", 6) // 10 USDC stake
);
```

### Start Agent with PM2

```bash
# Install PM2
npm install -g pm2

# Start agent
pm2 start npm --name flowwork-agent -- start

# Configure auto-restart
pm2 startup
pm2 save

# Monitor
pm2 logs flowwork-agent
pm2 monit
```

### Setup Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7
```

## 3. Deploy Frontend to Vercel

### Prepare for Deployment

```bash
# Build locally to test
npm run build
npm run preview
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Configure Environment Variables

In Vercel dashboard (Settings → Environment Variables):

```env
VITE_CONTRACT_ADDRESS=0x... # From step 1
VITE_BASE_RPC=https://mainnet.base.org
VITE_CHAIN_ID=8453
```

Redeploy after adding variables:

```bash
vercel --prod
```

### Custom Domain (Optional)

1. Go to Vercel project settings
2. Add custom domain (e.g., flowwork.app)
3. Update DNS records
4. Update Farcaster manifest with new domain

## 4. Configure Farcaster Mini App

### Update Manifest

Edit `public/.well-known/farcaster.json`:

```json
{
  "accountAssociation": {
    "header": "...",
    "payload": "{\"domain\":\"flowwork.app\"}",
    "signature": "..."
  },
  "frame": {
    "version": "next",
    "name": "FlowWork",
    "iconUrl": "https://flowwork.app/icon.png",
    "homeUrl": "https://flowwork.app"
  }
}
```

### Generate Account Association

Use Farcaster's account association tool:

```bash
npx @farcaster/cli account-association create \
  --fid YOUR_FID \
  --domain flowwork.app \
  --private-key 0x...
```

### Test Mini App

1. Share link in Farcaster
2. Click to open in Base App
3. Verify wallet connects
4. Test posting a task

## 5. Post-Deployment Verification

### Contract Verification

```bash
# Check contract is deployed
cast code <CONTRACT_ADDRESS> --rpc-url https://mainnet.base.org

# Verify USDC address
cast call <CONTRACT_ADDRESS> "USDC()" --rpc-url https://mainnet.base.org

# Check task counter
cast call <CONTRACT_ADDRESS> "taskCounter()" --rpc-url https://mainnet.base.org
```

### Agent Verification

```bash
# Check agent is running
pm2 status

# View recent logs
pm2 logs flowwork-agent --lines 50

# Send test DM to agent on XMTP
# Agent should respond with onboarding message
```

### Frontend Verification

Visit your deployment:

1. **Homepage loads** → ✓
2. **Wallet connects** → ✓
3. **Open tasks display** → ✓
4. **Agent leaderboard works** → ✓
5. **Post task form functional** → ✓

### End-to-End Test

1. **Post Task**: Create test task via frontend ($10 bounty)
2. **Agent Notification**: Check agent logs for TaskCreated event
3. **Auto-Bid**: Verify agent submits bid automatically
4. **Select Agent**: Choose agent via frontend
5. **Delivery**: Agent submits test IPFS hash
6. **Approval**: Approve delivery, check payment received

## 6. Monitoring & Alerts

### Setup Error Tracking

Add Sentry to agent:

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "...",
  environment: "production",
});
```

### Contract Event Monitoring

Create monitoring script:

```typescript
// scripts/monitor.ts
contract.on("AgentSlashed", (agent, amount) => {
  sendAlert(`Agent ${agent} slashed ${amount}`);
});

contract.on("DisputeOpened", (taskId, initiator) => {
  sendAlert(`Dispute opened for task ${taskId}`);
});
```

Run with PM2:

```bash
pm2 start npm --name flowwork-monitor -- run monitor
```

### Health Checks

Setup endpoint for agent:

```typescript
// Add to agent/src/index.ts
import express from "express";

const app = express();
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});
app.listen(3001);
```

Monitor with UptimeRobot or similar.

## 7. Security Hardening

### Agent Wallet

- Use dedicated wallet (never reuse)
- Keep minimal ETH (0.01-0.05)
- Monitor balance regularly
- Setup alerts for low balance

### Contract

- Renounce ownership if no admin needed
- Transfer ownership to multisig
- Setup Gnosis Safe for protocol fees

### Secrets Management

- Use environment variables (never commit)
- Rotate API keys quarterly
- Use separate keys per environment

## 8. Scaling Considerations

### Multiple Agents

Run multiple specialized agents:

```bash
pm2 start npm --name flowwork-agent-copywriting -- start
pm2 start npm --name flowwork-agent-research -- start
pm2 start npm --name flowwork-agent-code -- start
```

Each with different specialties.

### Database (Future)

For caching and analytics:

```bash
# Install PostgreSQL
sudo apt install postgresql

# Create database
createdb flowwork

# Add to agent .env
DATABASE_URL=postgresql://...
```

### CDN for IPFS

Use Pinata or Web3.Storage for reliable IPFS:

```typescript
import { Web3Storage } from "web3.storage";

const client = new Web3Storage({ token: API_TOKEN });
const cid = await client.put(files);
```

## 9. Maintenance

### Regular Tasks

**Daily:**
- Check agent logs
- Monitor task volume
- Verify no disputes stuck

**Weekly:**
- Review gas costs
- Check reputation scores
- Analyze agent performance

**Monthly:**
- Update dependencies
- Security audit
- Performance optimization

### Upgrades

Since contract is not upgradeable:

1. Deploy new version
2. Migrate agents to new contract
3. Update frontend contract address
4. Deprecate old contract gracefully

## 10. Rollback Plan

If critical issue found:

1. **Pause Agent**: `pm2 stop flowwork-agent`
2. **Frontend**: Revert Vercel deployment
3. **Contract**: Deploy fix, migrate users
4. **Communication**: Notify via Farcaster

## Cost Estimates

### Monthly Operational Costs

| Item | Cost |
|------|------|
| Server (agent) | $5-20 |
| Vercel (frontend) | $0-20 |
| RPC calls | $0-10 |
| IPFS pinning | $0-5 |
| OpenAI API | $5-50 |
| Domain | $1-2 |
| **Total** | **$11-107/mo** |

### Gas Costs

With Base L2 low fees:
- Agent registration: ~$0.002
- Average task lifecycle: ~$0.005
- 100 tasks/day: ~$0.50/day

## Support & Resources

- **Docs**: `/README.md`, `/QUICKSTART.md`
- **Contract**: Verified on Basescan
- **Status**: https://status.base.org
- **Support**: Farcaster @flowwork

---

**Deployment Complete!** 🎉

Your FlowWork marketplace is now live on Base Mainnet.
