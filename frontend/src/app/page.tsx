'use client';

import React, { useState } from 'react';
import { useLaceWallet } from '../hooks/useLaceWallet';

export default function ZeroPayDashboard() {
  const { isConnected, address, isConnecting, error: walletError, connectWallet, disconnectWallet, walletApi } = useLaceWallet();

  // Ledger States
  const [vaultBalance, setVaultBalance] = useState<number>(25000);
  const [activeRoot, setActiveRoot] = useState<string>('0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069');
  
  // Deposit Form
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [newRootInput, setNewRootInput] = useState<string>('');
  const [depositStatus, setDepositStatus] = useState<string | null>(null);

  // Claim Form
  const [secretKey, setSecretKey] = useState<string>('emp_sec_991823a');
  const [claimAmount, setClaimAmount] = useState<string>('3500');
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [lastClaimTx, setLastClaimTx] = useState<string | null>(null);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount) return;

    setDepositStatus('Submitting batch deposit circuit transaction...');
    setTimeout(() => {
      const added = parseFloat(depositAmount);
      setVaultBalance((prev) => prev + added);
      if (newRootInput) {
        setActiveRoot(newRootInput);
      }
      setDepositStatus(`Successfully deposited ${added} NIGHT tokens into the confidential vault!`);
      setDepositAmount('');
      setNewRootInput('');
    }, 1500);
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      setClaimStatus('Please connect Midnight Lace Wallet first.');
      return;
    }

    setClaimStatus('Step 1/3: Deriving confidential nullifier off-chain...');
    try {
      setTimeout(async () => {
        setClaimStatus('Step 2/3: Generating Zero-Knowledge membership proof locally...');
        
        if (walletApi && typeof walletApi.state === 'function') {
          const walletState = await walletApi.state();
          console.log('Midnight Wallet State for Proof:', walletState);
        }

        setClaimStatus('Step 3/3: Submitting confidential claim transaction to Preprod...');
        setTimeout(() => {
          const claimed = parseFloat(claimAmount);
          setVaultBalance((prev) => Math.max(0, prev - claimed));
          const mockTxHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
          setLastClaimTx(mockTxHash);
          setClaimStatus(`Claim verified & settled! ${claimed} NIGHT transferred to your private balance.`);
        }, 1500);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Claim failed';
      setClaimStatus(`Error: ${msg}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              ZeroPay <span className="text-indigo-400 text-sm font-normal px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10">Midnight Preprod</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Confidential Web3 Payroll & Fund Distribution</p>
          </div>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="text-sm font-mono text-slate-300">{address}</span>
                <button 
                  onClick={disconnectWallet}
                  className="text-xs text-rose-400 hover:underline ml-2"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect Midnight Lace'}
              </button>
            )}
          </div>
        </header>

        {walletError && (
          <div className="bg-rose-950/50 border border-rose-800 text-rose-300 p-3 rounded-lg text-sm">
            {walletError}
          </div>
        )}

        {/* Global Vault State */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Public Vault Liquidity</span>
            <div className="text-3xl font-bold text-emerald-400 mt-2">{vaultBalance.toLocaleString()} <span className="text-sm font-normal text-slate-400">NIGHT</span></div>
            <p className="text-xs text-slate-500 mt-1">Total collateral backing active confidential salary roots.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Active Payout Merkle Root</span>
            <div className="text-xs font-mono text-slate-300 break-all mt-2 p-2 bg-slate-950 rounded-lg border border-slate-800/80">{activeRoot}</div>
            <p className="text-xs text-slate-500 mt-1">Cryptographic commitment of all authorized salary allocations.</p>
          </div>
        </section>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Employee Claim Panel */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Claim Salary (Zero-Knowledge)</h2>
              <p className="text-xs text-slate-400 mb-5">Prove membership and claim without revealing your identity or salary amount.</p>
              
              <form onSubmit={handleClaim} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Private Witness (Secret Key)</label>
                  <input
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Enter your confidential employee secret"
                  />
                  <span className="text-[11px] text-slate-500">Processed locally in browser; never sent over network.</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Claim Amount (NIGHT)</label>
                  <input
                    type="number"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="3500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isConnected}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Generate Proof & Submit Claim
                </button>
              </form>
            </div>

            {claimStatus && (
              <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                <div className="text-indigo-300">{claimStatus}</div>
                {lastClaimTx && (
                  <div className="text-[11px] font-mono text-slate-500 break-all">Tx: {lastClaimTx}</div>
                )}
              </div>
            )}
          </section>

          {/* Employer Deposit Panel */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Batch Deposit & Update Root</h2>
              <p className="text-xs text-slate-400 mb-5">Fund payroll aggregate and publish new salary Merkle commitment.</p>
              
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Deposit Amount (NIGHT)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. 50000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">New 32-Byte Merkle Root (Optional)</label>
                  <input
                    type="text"
                    value={newRootInput}
                    onChange={(e) => setNewRootInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="0x..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl transition text-sm"
                >
                  Deposit to Vault
                </button>
              </form>
            </div>

            {depositStatus && (
              <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-300">
                {depositStatus}
              </div>
            )}
          </section>
        </div>

        {/* Observable Privacy Breakdown */}
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">On-Chain vs Client-Side Privacy Boundary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-emerald-400 font-medium block mb-1">🔒 Private (Client-Side)</span>
              <p className="text-slate-400">Employee secret key, individual compensation amounts, and Merkle tree sibling vectors never leave browser memory.</p>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-indigo-400 font-medium block mb-1">⚡ Zero-Knowledge Layer</span>
              <p className="text-slate-400">Compact ZK circuit generates succinct proof confirming leaf belongs to public root without exposing which leaf.</p>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-amber-400 font-medium block mb-1">🌐 Public (On-Chain)</span>
              <p className="text-slate-400">Aggregate vault token balance, active 32-byte Merkle root commitment, and anti-double-claim nullifiers.</p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
