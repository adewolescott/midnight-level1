'use client';

import { useState, useCallback } from 'react';

export function useLaceWallet() {
  const [walletApi, setWalletApi] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window === 'undefined') return;

      const midnight = (window as any).midnight;
      if (!midnight || !midnight.mnLace) {
        throw new Error(
          'Midnight Lace wallet extension not detected. Please install and enable Lace for Midnight Preprod.'
        );
      }

      const isEnabled = await midnight.mnLace.isEnabled();
      const api = isEnabled
        ? await midnight.mnLace.enable()
        : await midnight.mnLace.enable();

      if (!api) {
        throw new Error('User declined wallet connection request.');
      }

      const state = await api.state();
      const addr = state.address || state.shieldedAddress || state.unshieldedAddress;

      setWalletApi(api);
      setWalletAddress(addr);
      setIsConnected(true);
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect to Midnight Lace');
      setIsConnected(false);
      setWalletApi(null);
      setWalletAddress(null);
      alert(err.message || 'Failed to connect to Midnight Lace');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletApi(null);
    setWalletAddress(null);
    setIsConnected(false);
    setError(null);
  }, []);

  return {
    walletApi,
    walletAddress,
    address: walletAddress,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
  };
}
