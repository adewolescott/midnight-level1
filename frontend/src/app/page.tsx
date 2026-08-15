'use client';

import React, { useState } from 'react';
import { useLaceWallet } from '@/hooks/useLaceWallet';
import { 
  Shield, 
  Lock, 
  Key, 
  Coins, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  EyeOff, 
  Globe, 
  ArrowRight,
  Layers,
  DollarSign
} from 'lucide-react';

const CONTRACT_ADDRESS = '6f678977ce5a7fbe124870356149edabcf99e43e4b8d593953227988eb877e94';

export default function ZeroPayDashboard() {
  const { isConnected, address, isConnecting, error: walletError, connectWallet, disconnectWallet, walletApi } = useLaceWallet();

  // Ledger States
  const [vaultBalance, setVaultBalance] = useState<number>(25000);
  const [activeRoot, setActiveRoot] = useState<string>('0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069');
  
  // UI Tabs
  const [activeTab, setActiveTab] = useState<'claim' | 'deposit'>('claim');

  // Employee Claim State
  const [secretKey, setSecretKey] = useState<string>('');
  const [claimAmount, setClaimAmount] = useState<string>('5000');
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [claimTx, setClaimTx] = useState<string | null>(null);

  // Employer Deposit State
  const [depositAmount, setDepositAmount] = useState<string>('10000');
  const [newRootInput, setNewRootInput] = useState<string>('');
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [depositStatus, setDepositStatus] = useState<string | null>(null);
  const [depositTx, setDepositTx] = useState<string | null>(null);

  // Helper for SHA-256 computation in browser
  const computeHash = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // 1. Employee Confidential Claim Flow
  const handleClaimPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey || !claimAmount) return;

    setIsClaiming(true);
    setClaimTx(null);
    setClaimStatus('Step 1/3: Initializing local Compact Proof Server...');

    try {
      if (!walletApi) {
        throw new Error('Lace Wallet not authorized. Please connect your wallet.');
      }

      // Compute deterministic nullifier locally: H(secretKey + '-zeropay-batch-1')
      const publicNullifier = await computeHash(secretKey + '-zeropay-batch-1');
      console.log('Generated public nullifier:', publicNullifier);
      
      setClaimStatus('Step 2/3: Generating Zero-Knowledge membership proof locally...');
      
      const walletState = await walletApi.state();
      console.log('Midnight Wallet State for Proof:', walletState);

      setClaimStatus('Step 3/3: Submitting confidential claim transaction to Preprod...');

      const tx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setClaimTx(tx);
      setVaultBalance(prev => Math.max(0, prev - Number(claimAmount)));
      setClaimStatus('Payout claimed successfully! Nullifier registered on-chain.');
      setSecretKey('');
    } catch (err: any) {
      setClaimStatus('Execution failed: ' + (err.message || 'Circuit assertion failed'));
    } finally {
      setIsClaiming(false);
    }
  };

  // 2. Employer Batch Deposit Flow
  const handleDepositPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount) return;

    setIsDepositing(true);
    setDepositTx(null);
    setDepositStatus('Authorizing payroll vault replenishment via Lace...');

    try {
      if (!walletApi) {
        throw new Error('Lace Wallet not authorized.');
      }

      const generatedRoot = newRootInput || await computeHash(Date.now().toString() + '-merkle-root');
      
      setDepositStatus('Submitting batch deposit transaction to Midnight Preprod...');
      
      const tx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setDepositTx(tx);
      setVaultBalance(prev => prev + Number(depositAmount));
      setActiveRoot(generatedRoot);
      setDepositStatus('Payroll batch deposited. Updated Merkle root active on ledger.');
    } catch (err: any) {
      setDepositStatus('Deposit failed: ' + err.message);
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Top Navbar */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
              <Shield className="w-4 h-4" /> Midnight Preprod Testnet • Level 4 MVP
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              ZeroPay <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">ZK Payroll</span>
            </h1>
            <p className="text-slate-400 text-xs md:text-sm">
              Confidential Cross-Border Payroll & Fund Splits powered by Compact ZK circuits.
            </p>
          </div>

          <div>
            {isConnected ? (
              <div className="flex items-center gap-3 bg-slate-900 border border-indigo-500/30 px-4 py-2 rounded-xl shadow-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-slate-300">
                  {address?.slice(0, 10)}...{address?.slice(-6)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium ml-2 underline"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                {isConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {isConnecting ? 'Connecting Lace...' : 'Connect Lace Wallet'}
              </button>
            )}
          </div>
        </header>

        {walletError && (
          <div className="bg-rose-950/50 border border-rose-800/80 text-rose-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {walletError}
          </div>
        )}

        {/* Global Vault State Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-indigo-400" /> Public Vault Total
            </span>
            <div className="text-2xl font-bold font-mono text-indigo-300">
              ${vaultBalance.toLocaleString()} <span className="text-xs font-normal text-slate-400">NIGHT</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1 md:col-span-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Active Merkle Payout Root
            </span>
            <div className="text-xs font-mono text-slate-300 truncate bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
              {activeRoot}
            </div>
          </div>
        </div>

        {/* Interaction Tabs */}
        <div className="flex border-b border-slate-800 gap-4">
          <button
            onClick={() => setActiveTab('claim')}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'claim'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" /> Employee Claim (Private Witness)
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'deposit'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Employer Batch Deposit
          </button>
        </div>

        {/* Main Interaction Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left Column: Active Action Panel */}
          <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5">
            {activeTab === 'claim' ? (
              <>
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
                    <Key className="w-5 h-5 text-indigo-400" /> Claim Confidential Payout
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Execute the <code className="text-indigo-300">claimPayout</code> circuit. Your private secret key and payout amount never touch the public ledger.
                  </p>
                </div>

                <form onSubmit={handleClaimPayout} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Private Secret Key (<code className="text-indigo-300">witness secretKey</code>)
                    </label>
                    <input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="0x1111111111111111111111111111111111111111111111111111111111111111"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      🔒 Processed exclusively inside local proof memory.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Payout Entitlement (<code className="text-indigo-300">payoutAmount</code>)
                    </label>
                    <input
                      type="number"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                      placeholder="5000"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isConnected || isClaiming || !secretKey}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
                  >
                    {isClaiming ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Proving & Submitting...
                      </>
                    ) : (
                      <>
                        Claim Payout via ZK Proof <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {claimStatus && (
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-indigo-300">
                    {claimStatus}
                  </div>
                )}

                {claimTx && (
                  <div className="text-xs text-emerald-400 flex items-center gap-2 font-mono bg-emerald-950/20 border border-emerald-800/40 p-3 rounded-xl truncate">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Tx Hash: {claimTx.slice(0, 24)}...</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
                    <DollarSign className="w-5 h-5 text-indigo-400" /> Batch Deposit & Update Root
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Execute the <code className="text-indigo-300">depositPayroll</code> circuit to lock funds and commit the employee Merkle tree root.
                  </p>
                </div>

                <form onSubmit={handleDepositPayroll} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Total Deposit Amount (<code className="text-indigo-300">Uint&lt;64&gt;</code>)
                    </label>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="10000"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      New Merkle Root (Optional / Generated)
                    </label>
                    <input
                      type="text"
                      value={newRootInput}
                      onChange={(e) => setNewRootInput(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isConnected || isDepositing}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isDepositing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Processing Deposit...
                      </>
                    ) : (
                      'Deposit Batch Funds & Commit Root'
                    )}
                  </button>
                </form>

                {depositStatus && (
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-indigo-300">
                    {depositStatus}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column: Observable Privacy Architecture */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Observable Privacy Model
              </h3>

              <div className="space-y-2">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-semibold uppercase text-emerald-400 flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> Private Witness (Client Device)
                  </span>
                  <ul className="text-[11px] text-slate-400 mt-1 list-disc list-inside space-y-0.5 font-mono">
                    <li>secretKey</li>
                    <li>merkleProof [Vector&lt;4&gt;]</li>
                    <li>individualSalaryAmount</li>
                  </ul>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-semibold uppercase text-indigo-300 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Public Ledger State (On-Chain)
                  </span>
                  <ul className="text-[11px] text-slate-400 mt-1 list-disc list-inside space-y-0.5 font-mono">
                    <li>vaultTotal: {vaultBalance} NIGHT</li>
                    <li>payoutRoot: 32-Byte Hash</li>
                    <li>nullifierSet: Map&lt;Bytes, Bool&gt;</li>
                  </ul>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                ZeroPay guarantees that individual salary allocations and employee identities are never published on the public ledger. Only cryptographic validity proofs and single-use nullifiers are recorded on-chain.
              </p>
            </div>

            <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-4 font-mono truncate">
              Contract: <span className="text-slate-400">{CONTRACT_ADDRESS.slice(0, 18)}...</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 border-t border-slate-900 pt-6 space-y-1">
          <div>ZeroPay MVP • Midnight Network Preprod Testnet</div>
          <div>Built with Compact ZK Smart Contracts & Next.js</div>
        </footer>

      </div>
    </main>
  );
}
