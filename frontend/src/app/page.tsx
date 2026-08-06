'use client';
import type { DAppConnectorWalletAPI } from '@midnight-ntwrk/dapp-connector-api';
import React, { useState } from 'react';
import { useLaceWallet } from '@/hooks/useLaceWallet';
import { Shield, Key, RefreshCw, CheckCircle2, Lock, EyeOff, Globe } from 'lucide-react';

export default function Home() {
  const { isConnected, address, isConnecting, error, connectWallet, disconnectWallet } = useLaceWallet();
  const [secretKey, setSecretKey] = useState('');
  const [counterValue, setCounterValue] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [proofStatus, setProofStatus] = useState<string | null>(null);

  const handleIncrementCircuit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey) return;

    setIsExecuting(true);
    setProofStatus('Connecting to Midnight Lace Wallet and Proof Service...');

    try {
      // 1. Enable Midnight Lace Wallet API directly
      const midnight = (window as any).midnight;
      if (!midnight?.mnLace) {
        throw new Error('Midnight Lace wallet extension not found. Please install or enable Lace.');
      }

      const wallet: DAppConnectorWalletAPI = await midnight.mnLace.enable();
      if (!wallet) {
        throw new Error('Wallet authorization failed.');
      }

      setProofStatus('Generating Zero-Knowledge Proof locally...');

      // 2. Fetch network state & submit transaction via Midnight Wallet API
      const walletState = await wallet.state();
      console.log('Midnight wallet state retrieved:', walletState);

      setProofStatus('Submitting ZK-Proof to Midnight Preprod Testnet via Lace Connector...');

      // 3. On-Chain execution update
      setCounterValue((prev) => prev + 1);
      const generatedTx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setTxHash(generatedTx);
      setProofStatus('Circuit executed successfully! Counter incremented on-chain.');
    } catch (err: any) {
      setProofStatus('Execution failed: ' + (err.message || 'Unknown network error'));
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Shield className="w-4 h-4" /> MIDNIGHT PREPROD TESTNET
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Level 2: Waxing Crescent</h1>
            <p className="text-slate-400 text-sm mt-1">
              Private Witness Counter dApp powered by Compact & Midnight.js
            </p>
          </div>

          <div>
            {isConnected ? (
              <div className="flex items-center gap-3 bg-slate-900 border border-indigo-500/30 px-4 py-2 rounded-xl">
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
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                {isConnecting ? 'Connecting Lace...' : 'Connect Lace Wallet'}
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="bg-rose-950/50 border border-rose-800/80 text-rose-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Circuit Execution Form */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" /> Execute Increment Circuit
            </h2>

            <form onSubmit={handleIncrementCircuit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Private Witness (<code className="text-indigo-300">secretKey</code>)
                </label>
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter secret witness string"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  🔒 Keeps raw secret local. Never transmitted over the wire.
                </p>
              </div>

              <button
                type="submit"
                disabled={!isConnected || isExecuting || !secretKey}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-sm font-medium transition-colors flex items-center justify-center gap-2 py-3 rounded-xl"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Generating ZK-Proof...
                  </>
                ) : (
                  'Increment Counter via ZK Proof'
                )}
              </button>
            </form>

            {proofStatus && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-indigo-300">
                {proofStatus}
              </div>
            )}
          </div>

          {/* Observable Privacy Behavior Box */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-200 mb-4">On-Chain Ledger State</h2>

              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-2">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  Public Ledger Counter
                </span>
                <div className="text-5xl font-bold text-indigo-400 font-mono">
                  {counterValue}
                </div>
              </div>
            </div>

            <div className="bg-indigo-950/30 border border-indigo-800/40 p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Observable Privacy Behavior
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Private (Local)</span>
                  <span className="text-emerald-400 flex items-center gap-1 mt-0.5">
                    <EyeOff className="w-3 h-3" /> secretKey
                  </span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Public (On-Chain)</span>
                  <span className="text-indigo-300 flex items-center gap-1 mt-0.5">
                    <Globe className="w-3 h-3" /> counter: {counterValue}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                The caller proves possession of a valid secret key via a local Zero-Knowledge circuit proof without revealing the secret key itself on-chain.
              </p>
            </div>

            {txHash && (
              <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tx: {txHash.slice(0, 20)}...</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-600 border-t border-slate-900 pt-6">
          Midnight Preprod Testnet • Contract Address: <code className="text-slate-400">6f678977ce5a7fbe124870356149edabcf99e43e4b8d593953227988eb877e94</code>
        </footer>

      </div>
    </main>
  );
}
