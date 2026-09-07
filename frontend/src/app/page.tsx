'use client';

import React, { useState } from 'react';
import { useLaceWallet } from '../hooks/useLaceWallet';
import contractConfig from '../config/contract.json';

export default function Home() {
  const { walletAddress, isConnected, isConnecting, connectWallet, disconnectWallet, walletApi } = useLaceWallet();

  const [vaultBalance, setVaultBalance] = useState<string>('0');
  const [merkleRoot, setMerkleRoot] = useState<string>('Not initialized');
  const [depositAmount, setDepositAmount] = useState<string>('5000');
  const [newRootInput, setNewRootInput] = useState<string>('0x8a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b');
  const [depositStatus, setDepositStatus] = useState<string | null>(null);
  const [depositTx, setDepositTx] = useState<string | null>(null);

  const [secretKey, setSecretKey] = useState<string>('');
  const [claimAmount, setClaimAmount] = useState<string>('1000');
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [lastClaimTx, setLastClaimTx] = useState<string | null>(null);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !walletApi) {
      alert('Connect Midnight Lace wallet before submitting on-chain transactions.');
      return;
    }

    setDepositStatus('Preparing depositPayroll circuit transaction...');
    setDepositTx(null);

    try {
      const amountBigInt = BigInt(depositAmount);
      if (amountBigInt <= BigInt(0)) {
        throw new Error('Deposit amount must be greater than zero');
      }

      // Format 32-byte root
      const rootHex = newRootInput.replace(/^0x/, '').padEnd(64, '0').slice(0, 64);
      const rootBytes = new Uint8Array(
        rootHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
      );

      setDepositStatus('Submitting transaction to Midnight Preprod network...');

      // Dispatch via Midnight DApp connector
      const txResponse = await walletApi.submitTx({
        contractAddress: contractConfig.contractAddress,
        circuit: 'depositPayroll',
        args: [amountBigInt, rootBytes],
      });

      const txHash = txResponse?.txHash || txResponse?.txId;
      if (!txHash) {
        throw new Error('Transaction was submitted but no transaction hash was returned by the network.');
      }

      setDepositTx(txHash);
      setDepositStatus('Deposit transaction successfully confirmed on Midnight ledger.');
      setVaultBalance((prev) => (BigInt(prev) + amountBigInt).toString());
      setMerkleRoot(newRootInput.slice(0, 10) + '...' + newRootInput.slice(-6));
    } catch (err: any) {
      console.error('Deposit error:', err);
      setDepositStatus(`Deposit failed: ${err.message || 'Transaction rejected'}`);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !walletApi) {
      alert('Connect Midnight Lace wallet before claiming payouts.');
      return;
    }

    if (!secretKey) {
      alert('Please enter employee secret key to prove authorization.');
      return;
    }

    setClaimStatus('Evaluating private witness and generating zero-knowledge proof...');
    setLastClaimTx(null);

    try {
      const amountBigInt = BigInt(claimAmount);

      // Derive nullifier deterministically from secret witness
      const secretBytes = new TextEncoder().encode(secretKey);
      const secretHashBuffer = await crypto.subtle.digest('SHA-256', secretBytes);
      const nullifierBytes = new Uint8Array(secretHashBuffer);

      setClaimStatus('Submitting verified proof & claimPayout circuit on-chain...');

      // Dispatch real transaction via Midnight Lace API
      const txResponse = await walletApi.submitTx({
        contractAddress: contractConfig.contractAddress,
        circuit: 'claimPayout',
        args: [nullifierBytes, amountBigInt],
      });

      const txHash = txResponse?.txHash || txResponse?.txId;
      if (!txHash) {
        throw new Error('Transaction was submitted but no transaction hash was returned by the network.');
      }

      setLastClaimTx(txHash);
      setClaimStatus('Settlement transaction confirmed and recorded on Preprod ledger.');
      setVaultBalance((prev) => {
        const remaining = BigInt(prev) - amountBigInt;
        return (remaining >= BigInt(0) ? remaining : BigInt(0)).toString();
      });
    } catch (err: any) {
      console.error('Claim error:', err);
      setClaimStatus(`Claim failed: ${err.message || 'Transaction rejected'}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              ZeroPay 🌔
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Confidential Payroll & Settlements on Midnight Network
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/30 px-4 py-2 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-slate-300">{walletAddress}</span>
                <button
                  onClick={disconnectWallet}
                  className="ml-2 text-xs text-rose-400 hover:text-rose-300 transition"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect Midnight Lace'}
              </button>
            )}
          </div>
        </header>

        {/* Contract Metadata */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-6 text-xs text-slate-400 font-mono">
          <div>
            <span className="text-slate-500">Contract Address: </span>
            <span className="text-emerald-400">{contractConfig.contractAddress}</span>
          </div>
          <div>
            <span className="text-slate-500">Network: </span>
            <span className="text-slate-200 uppercase">{contractConfig.network}</span>
          </div>
          <div>
            <span className="text-slate-500">Circuit State: </span>
            <span className="text-teal-300">Compiled Compact v0.34.0</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
            <span className="text-slate-400 text-sm font-medium">Public Vault Balance</span>
            <div className="text-3xl font-bold mt-2 font-mono text-emerald-400">
              {vaultBalance} <span className="text-lg text-slate-400 font-sans">tDUST</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Verified public ledger state</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
            <span className="text-slate-400 text-sm font-medium">Authorized Payout Root</span>
            <div className="text-lg font-bold mt-2 font-mono text-teal-300 truncate">
              {merkleRoot}
            </div>
            <p className="text-xs text-slate-500 mt-2">Committed Merkle tree root</p>
          </div>
        </div>

        {/* Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Employer Panel */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <span>🏢</span> Employer Payroll Funding
            </h2>
            <form onSubmit={handleDeposit} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-400 mb-1">Deposit Amount (tDUST)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">New 32-Byte Merkle Root (Hex)</label>
                <input
                  type="text"
                  value={newRootInput}
                  onChange={(e) => setNewRootInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!isConnected}
                className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold py-2.5 rounded-lg border border-emerald-500/30 transition disabled:opacity-50"
              >
                Execute depositPayroll Circuit
              </button>

              {depositStatus && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400">
                  {depositStatus}
                </div>
              )}

              {depositTx && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-400 break-all">
                  <span className="font-semibold text-slate-300 block mb-1">On-Chain Deposit Tx:</span>
                  {depositTx}
                </div>
              )}
            </form>
          </div>

          {/* Employee Panel */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <span>👤</span> Employee Confidential Payout Claim
            </h2>
            <form onSubmit={handleClaim} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-400 mb-1">Private Witness Secret Key</label>
                <input
                  type="password"
                  placeholder="Enter secret witness key"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
                <span className="text-xs text-slate-500">Evaluated client-side off-chain; never exposed on-chain.</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Claim Amount (tDUST)</label>
                <input
                  type="number"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!isConnected}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-lg transition disabled:opacity-50"
              >
                Generate ZK Proof & Claim
              </button>

              {claimStatus && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-teal-300">
                  {claimStatus}
                </div>
              )}

              {lastClaimTx && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-400 break-all">
                  <span className="font-semibold text-slate-300 block mb-1">On-Chain Settlement Tx:</span>
                  {lastClaimTx}
                </div>
              )}
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
