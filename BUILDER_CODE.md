# Builder Code Integration

FlowWork integrates Base Builder Codes to attribute all onchain activity for analytics and potential future rewards.

## What are Builder Codes?

Builder Codes are unique identifiers provided by [base.dev](https://base.dev) that allow apps to:
- Track onchain activity and analytics
- Qualify for potential future rewards
- Get attribution for transactions made through your app

## Our Builder Code

```
bc_zo9roirq
```

## How It Works

Every transaction sent through FlowWork automatically includes our Builder Code in the transaction data suffix. This is done by:

1. **Automatic Suffix Appending**: The `useContract` hook automatically appends the Builder Code to all transactions
2. **No User Action Required**: Users don't need to do anything - attribution happens automatically
3. **Fully Compatible**: Works with all wallets (Coinbase Wallet, MetaMask, etc.)

## Implementation

The Builder Code is integrated using a proxied signer that intercepts all transactions:

```typescript
// src/hooks/useContract.ts
const proxiedSigner = new Proxy(ethSigner, {
  get(target, prop) {
    if (prop === "sendTransaction") {
      return async (tx: any) => {
        // Add Builder Code dataSuffix to transaction
        const txWithSuffix = {
          ...tx,
          data: tx.data
            ? tx.data + DATA_SUFFIX.slice(2)
            : DATA_SUFFIX,
        };
        return await target.sendTransaction(txWithSuffix);
      };
    }
    return target[prop];
  },
});
```

## Verification

To verify Builder Code attribution:

### 1. Check base.dev

1. Visit https://base.dev
2. Login with your account
3. Navigate to **Onchain** section
4. View transaction attribution stats

### 2. Check on Basescan

1. Find your transaction hash
2. Go to https://basescan.org/tx/YOUR_TX_HASH
3. Click on "Input Data"
4. Verify the last bytes contain the repeating `8021` pattern
5. Decode the suffix to confirm `bc_zo9roirq`

### 3. Use Builder Code Checker

Visit https://builder-code-checker.vercel.app/ to validate any transaction.

## Transactions with Builder Code

All these transactions are automatically attributed:

- ✅ Creating tasks (`createTask`)
- ✅ Bidding on tasks (`submitBid`)
- ✅ Approving deliveries (`approveDelivery`)
- ✅ USDC approvals (`approve`)
- ✅ All contract interactions

## Benefits

- **Analytics**: Track total volume and activity through your app
- **Rewards**: Qualify for potential Base ecosystem rewards
- **Attribution**: Get credit for driving onchain activity
- **Insights**: Understand user behavior and transaction patterns

## Learn More

- [Base Builder Codes Documentation](https://docs.base.org/builder-codes)
- [ERC-8021 Standard](https://eips.ethereum.org/EIPS/eip-8021)
- [base.dev Registration](https://base.dev)

---

**Implementation Date**: March 2026
**Builder Code**: `bc_zo9roirq`
**Status**: ✅ Active
