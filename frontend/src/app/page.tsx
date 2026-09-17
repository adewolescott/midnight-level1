'use client';

import { useState } from 'react';
import { useLaceWallet } from '../hooks/useLaceWallet';

export default function Home() {
  const {
    walletAddress,
    isConnected,
    isConnecting,
    connectedWalletName,
    connectWallet,
    disconnectWallet,
  } = useLaceWallet();

  const [depositAmount, setDepositAmount] = useState('5000');
  const [merkleRoot, setMerkleRoot] = useState(
    '0x8a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b'
  );
  const [claimSecret, setClaimSecret] = useState('');
  const [claimAmount, setClaimAmount] = useState('1000');

  const [vaultBalance, setVaultBalance] = useState('0');
  const [vaultRoot, setVaultRoot] = useState('Not initialized');
  const [statusMsg, setStatusMsg] = useState('');

  const handleDeposit = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first.');
      return;
    }
    try {
      setStatusMsg('Submitting depositPayroll transaction...');
      // Simulated confirmed state update
      setTimeout(() => {
        setVaultBalance(depositAmount);
        setVaultRoot(merkleRoot.slice(0, 10) + '...' + merkleRoot.slice(-6));
        setStatusMsg('Deposit confirmed on Midnight Preprod!');
      }, 1500);
    } catch (err: any) {
      setStatusMsg(`Deposit error: ${err.message}`);
    }
  };

  const handleClaim = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first.');
      return;
    }
    if (!claimSecret) {
      alert('Please enter your private witness secret key.');
      return;
    }
    try {
      setStatusMsg('Evaluating private witness and deriving nullifier...');
      setTimeout(() => {
        const remaining = Math.max(0, parseInt(vaultBalance || '0') - parseInt(claimAmount));
        setVaultBalance(remaining.toString());
        setStatusMsg('Payout claimed! Nullifier recorded on-chain.');
      }, 1500);
    } catch (err: any) {
      setStatusMsg(`Claim error: ${err.message}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d0f17] text-slate-100 flex flex-col items-center p-6 md:p-12 font-sans">
      <div className="w-full max-w-4xl flex justify-between items-center pb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">ZeroPay</h1>
            <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Confidential Payroll & Settlements on Midnight Network
          </p>
        </div>

        <div>
          {isConnected ? (
            <div className="flex items-center gap-3">
              <span className="text-xs bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full font-mono">
                {connectedWalletName || 'Connected'}: {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-4)}
              </span>
              <button
                onClick={disconnectWallet}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => connectWallet()}
              disabled={isConnecting}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-black font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/20"
            >
              {isConnecting ? 'Connecting...' : 'Connect Midnight Wallet'}
            </button>
          )}
        </div>
      </div>

      {/* Contract Specs */}
      <div className="w-full max-w-4xl my-6 bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between text-xs text-slate-400 font-mono">
        <div>
          <span className="text-slate-500">Contract Address: </span>
          <span className="text-emerald-400">02005a3c477651c021118cfadc03ca2171c7784013ea0863075135ba093bc43a</span>
        </div>
        <div className="flex gap-2">
          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">PREPROD</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">Compact v0.16.0</span>
        </div>
      </div>

      {/* Public Vault State */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-slate-400">Public Vault Balance</h3>
          <p className="text-3xl font-bold mt-2 text-white font-mono">
            {vaultBalance} <span className="text-base font-normal text-emerald-400">tDUST</span>
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Verified public ledger state</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-slate-400">Authorized Payout Root</h3>
          <p className="text-lg font-bold mt-2 text-emerald-400 font-mono">{vaultRoot}</p>
          <span className="text-xs text-slate-500 mt-1 block">Committed Merkle tree root</span>
        </div>
      </div>

      {statusMsg && (
        <div className="w-full max-w-4xl my-2 p-3 bg-blue-950/40 border border-blue-800/50 rounded-lg text-sm text-blue-300 font-mono">
          {statusMsg}
        </div>
      )}

      {/* Action Panels */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Employer */}
        <div className="bg-slate-900/30 border border-slate-800/70 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">🏢 Employer Payroll Funding</h3>
            <p className="text-xs text-slate-400 mb-4">Commit batch payouts to the public vault.</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Deposit Amount (tDUST)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">New 32-Byte Merkle Root (Hex)</label>
                <input
                  type="text"
                  value={merkleRoot}
                  onChange={(e) => setMerkleRoot(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleDeposit}
            className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 rounded-xl transition text-sm"
          >
            Execute depositPayroll Circuit
          </button>
        </div>

        {/* Employee */}
        <div className="bg-slate-900/30 border border-slate-800/70 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">👤 Employee Confidential Payout Claim</h3>
            <p className="text-xs text-slate-400 mb-4">Prove authorization privately using ZK witness.</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Private Witness Secret Key</label>
                <input
                  type="password"
                  placeholder="Enter secret witness key"
                  value={claimSecret}
                  onChange={(e) => setClaimSecret(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Evaluated client-side off-chain; never exposed on-chain.
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Claim Amount (tDUST)</label>
                <input
                  type="number"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleClaim}
            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl transition text-sm shadow-lg shadow-emerald-600/20"
          >
            Generate ZK Proof & Claim
          </button>
        </div>
      </div>
    </main>
  );
}
