# Midnight Private Counter Moonshot

> A privacy-preserving smart contract on Midnight proving authorization via private witnesses without leaking secret keys.

## Contract Address

| Network | Address |
|---------|---------|
| Preview | `6f678977ce5a7fbe124870356149edabcf99e43e4b8d593953227988eb877e94` |

## What This Does
This smart contract maintains an on-chain public counter that can only be incremented if a caller proves knowledge of a private secret key without revealing that key publicly.

## Privacy Model
- **What is PUBLIC:** The `counter` ledger state value on-chain.
- **What is PRIVATE:** The `secretKey` (Bytes<32>) private witness.
- **What the user PROVES:** Possession of a valid `secretKey` whose hash matches `expectedCommitment` without exposing the key.

## Tech Stack
- Midnight L1 Network (Preview Testnet)
- Compact Compiler
- Node.js v22 & Docker (Ubuntu)

## Prerequisites & Setup
```bash
# 1. Install dependencies
npm install

# 2. Run local proof server
docker run -d -p 6300:6300 midnightnetwork/proof-server

# 3. Compile Compact contract
compact compile contracts/counter.compact managed/

# 4. Run tests
npx vitest run
```

## Initial Idea
**Hidden Order Dark Pool DEX:** Inspired by Midnight's focus on institutional finance and data protection, this dApp establishes a private order-book exchange where trader volumes, strategies, and order sizes remain completely hidden prior to settlement. By utilizing Zero-Knowledge proofs for execution fairness, it prevents front-running and MEV exposure while giving institutions the confidence to trade on-chain with compliance-ready audit trails.

## Screenshots
<!-- Attach 2 screenshots here before submitting: 1) compact compile output 2) deployed contract address -->
