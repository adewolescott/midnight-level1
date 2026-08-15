# ZeroPay 🌔 — Confidential Web3 Payroll & Fund Splits

[![ZeroPay CI/CD Pipeline](https://github.com/adewolescott/midnight-level1/actions/workflows/ci.yml/badge.svg)](https://github.com/adewolescott/midnight-level1/actions/workflows/ci.yml)
[![Midnight Network](https://img.shields.io/badge/Midnight-Preprod%20Testnet-6366f1.svg)](https://midnight.network)
[![X Profile](https://img.shields.io/badge/X-@ZeroPayZK-black.svg?logo=x)](https://x.com/ZeroPayZK)

ZeroPay is a privacy-preserving payroll and fund distribution dApp built on the **Midnight Network** using **Compact** Zero-Knowledge (ZK) circuits and **Next.js**.

It enables Web3 organizations, DAOs, and global enterprises to execute verifiable, batch-funded payroll distributions without exposing employee salaries, private wallet addresses, or compensation structures on a public ledger.

---

## 🔗 Project Links & Verification

| Resource | Link / Identifier |
| :--- | :--- |
| **Live Preprod dApp** | [https://zeropay-midnight.vercel.app](https://zeropay-midnight.vercel.app) |
| **Preprod Contract Address** | `6f678977ce5a7fbe124870356149edabcf99e43e4b8d593953227988eb877e94` |
| **Product X (Twitter) Profile** | [@ZeroPayZK](https://x.com/ZeroPayZK) |
| **Demo Walkthrough Video** | [Watch Demo on YouTube](https://youtube.com) |

---

## 🏛 Architecture & Dual-State Privacy Model

Traditional blockchains expose all financial payouts publicly. ZeroPay utilizes Midnight's dual-state computational model to decouple private execution from on-chain state verification:+-------------------------------------------------------------------------+
|                       LOCAL CLIENT (Browser + Lace)                     |
|                                                                         |
|  [ Private Witness Inputs ]                                             |
|  - secretKey                                                            |
|  - payoutAmount                                                         |
|  - Merkle Proof Vector                                                  |
|                                                                         |
|          │                                                              |
|          ▼                                                              |
|  [ Compact Proof Engine ] ──► Computes: Nullifier = H(secretKey || ID)  |
|                                Generates: ZK-Proof (valid membership)   |
+------------------------------------+------------------------------------+
│
│ Submits Proof & Nullifier
▼
+-------------------------------------------------------------------------+
|                  MIDNIGHT PREPROD TESTNET (On-Chain)                    |
|                                                                         |
|  [ Public Ledger State ]                                                |
|  - vaultTotal: Global deposit balance                                   |
|  - payoutRoot: 32-Byte Merkle commitment of all authorized salaries     |
|  - nullifierSet: Map<Bytes<32>, Boolean> (Enforces single-claim)        |
|                                                                         |
|  [ Circuit Verification ]                                               |
|  - Verifies ZK-Proof matches payoutRoot                                 |
|  - Asserts !nullifierSet.member(nullifier)                              |
|  - Decrements vaultTotal & inserts nullifier                            |
+-------------------------------------------------------------------------+
### Observable Privacy Matrix

| Property | Visibility | Location | Description |
| :--- | :--- | :--- | :--- |
| **Employee Secret Key** | 🔒 Private | Client Device | Private witness used to derive leaf hashes. Never broadcast. |
| **Individual Salary** | 🔒 Private | Client Device | Kept confidential off-chain; verified via ZK-SNARK. |
| **Merkle Sibling Path** | 🔒 Private | Client Device | Proves membership in payout batch without disclosing peer nodes. |
| **Public Vault Balance** | 🌐 Public | On-Chain Ledger | Total tokens locked in contract to back aggregate disbursements. |
| **Payout Merkle Root** | 🌐 Public | On-Chain Ledger | Cryptographic commitment representing all valid employee splits. |
| **Claim Nullifier** | 🌐 Public | On-Chain Ledger | Unique hash registered upon claim to prevent double-spending. |

---

## 📂 Project Structure├── .github/
│   └── workflows/
│       └── ci.yml             # Automated GitHub Actions test & build pipeline
├── contract/
│   ├── src/
│   │   └── zeropay.compact    # Compact smart contract defining circuits & state
│   └── test/
│       └── zeropay.test.ts    # Vitest unit test suite (proof, claims, nullifiers)
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx       # ZeroPay dashboard (Claim, Deposit, Privacy audit)
│   │   │   └── layout.tsx
│   │   └── hooks/
│   │       └── useLaceWallet.ts # Midnight Lace DApp Connector hook
│   ├── package.json
│   └── tsconfig.json
└── README.md
---

## 🛠 Local Setup & Installation

### Prerequisites
- Node.js `v20.x` or higher
- npm `v10.x` or higher
- [Midnight Lace Wallet Extension](https://midnight.network) configured for **Preprod Testnet**

### 1. Clone the Repository
```bash
git clone [https://github.com/adewolescott/midnight-level1.git](https://github.com/adewolescott/midnight-level1.git) zeropay
cd zeropay
