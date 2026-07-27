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
<!-- (1) compact compile output -->
## Compact Compile Output
<img width="1920" height="1043" alt="compilation-output" src="https://github.com/user-attachments/assets/fd60acc6-f79b-47db-8231-159905503adc" />




<!-- (2) deployed contract address -->
## Deployed Contract Address
<img width="1920" height="1052" alt="deployed-contract-address" src="https://github.com/user-attachments/assets/4aad3893-4456-4c4e-87b9-aa18dc572421" />


