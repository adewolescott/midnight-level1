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


## Level 2.
# Midnight Private Counter — Level 2 (Waxing Crescent)

A privacy-preserving dApp interface built on the Midnight Preprod Testnet, connecting the Lace Wallet to execute Zero-Knowledge circuit proofs locally inside the browser.

---

## 🔗 Submission Links & Details

| Field | Details |
| :--- | :--- |
| **Public GitHub Repository** | https://github.com/adewolescott/midnight-level1 |
| **Live Demo Link** | https://midnight-level1.vercel.app/ |
| **Preprod Contract Address** | 6f678977ce5a7fbe124870356149edabcf99e43e4b8d593953227988eb877e94 |
| **Demo Video Link** | https://youtu.be/8XVoEnDSNJk?si=z6Rq9P8sRlLv-F2D |

---

## 🛡️ Privacy Claim & Observable Behavior

### Privacy Guarantee
The application maintains an on-chain public state counter (`counter`) that increments only upon successful zero-knowledge authorization.

- **WHAT STAYS PRIVATE (Local Witness):** The user's `secretKey` (`Bytes<32>`). It is processed exclusively within the local browser environment via Midnight's proof engine. It is never transmitted across the network or stored on-chain.
- **WHAT IS PUBLIC (On-Chain State):** The updated `counter` state on the public ledger.
- **OBSERVABLE BEHAVIOR:** Third parties can verify that an authorized state update occurred on-chain without ever seeing, inspecting, or reconstructing the caller's private secret key.

---

## 🖥️ Frontend Overview & Setup

The frontend is a **Next.js (App Router)** web application located in the `/frontend` directory.

### Tech Stack
- **Framework:** Next.js, Tailwind CSS, TypeScript
- **Wallet Connector:** Lace Wallet DApp Connector API (`mnLace`)
- **SDK:** `@midnight-ntwrk/midnight-js-contracts`
- **Deployment:** Vercel

### Running the Frontend Locally

1. **Navigate to the frontend folder:**
   ```bash
   cd frontend
