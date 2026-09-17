'use client';

import { useState, useCallback, useEffect } from 'react';

export function useLaceWallet() {
  const [walletApi, setWalletApi] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connectedWalletName, setConnectedWalletName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window === 'undefined') {
        throw new Error('Window not found');
      }

      const win = window as any;
      let provider: any = null;
      let walletName = 'Midnight Wallet';

      // 1. Check 1am wallet
      if (win.oneam) {
        provider = win.oneam;
        walletName = '1am Wallet';
      } else if (win.midnight?.['1am']) {
        provider = win.midnight['1am'];
        walletName = '1am Wallet';
      } 
      // 2. Check Midnight Lace
      else if (win.midnight?.mnLace) {
        provider = win.midnight.mnLace;
        walletName = 'Midnight Lace';
      } else if (win.midnight?.lace) {
        provider = win.midnight.lace;
        walletName = 'Midnight Lace';
      } 
      // 3. Fallback: enumerate any key under window.midnight
      else if (win.midnight && Object.keys(win.midnight).length > 0) {
        const values = Object.values(win.midnight) as any[];
        provider = values.find((v) => v && (typeof v.connect === 'function' || typeof v.enable === 'function')) || values[0];
        if (provider) walletName = provider.name || 'Midnight Wallet';
      } 
      // 4. Cardano fallback
      else if (win.cardano?.lace) {
        provider = win.cardano.lace;
        walletName = 'Lace';
      }

      if (!provider) {
        throw new Error('No Midnight-compatible wallet found. Please make sure 1am Wallet or Lace is installed and unlocked.');
      }

      // Handshake with timeout
      let api: any = null;
      try {
        if (typeof provider.connect === 'function') {
          api = await Promise.race([
            provider.connect('preprod').catch(() => provider.connect()),
            new Promise((_, r) => setTimeout(() => r(new Error('Handshake timeout')), 7000))
          ]);
        } else if (typeof provider.enable === 'function') {
          api = await Promise.race([
            provider.enable(),
            new Promise((_, r) => setTimeout(() => r(new Error('Handshake timeout')), 7000))
          ]);
        } else {
          api = provider;
        }
      } catch (handshakeErr: any) {
        throw new Error(handshakeErr?.message || 'Wallet connection was rejected or timed out.');
      }

      if (!api) {
        throw new Error('Connection declined.');
      }

      // Extract address safely
      let addr: string | null = null;
      try {
        if (typeof api.getUnshieldedAddress === 'function') {
          addr = await api.getUnshieldedAddress();
        } else if (typeof api.getDustAddress === 'function') {
          addr = await api.getDustAddress();
        } else if (typeof api.state === 'function') {
          const s = await api.state();
          addr = s?.address || s?.unshieldedAddress || null;
        }
      } catch (addrErr) {
        console.warn('Could not read address from API:', addrErr);
      }

      setWalletApi(api);
      setConnectedWalletName(walletName);
      setWalletAddress(addr || `Connected (${walletName})`);
      setIsConnected(true);
    } catch (err: any) {
      console.error('Wallet connect error:', err);
      const msg = err?.message || 'Failed to connect wallet';
      setError(msg);
      alert(msg);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletApi(null);
    setWalletAddress(null);
    setConnectedWalletName(null);
    setIsConnected(false);
    setError(null);
  }, []);

  return {
    walletApi,
    walletAddress,
    connectedWalletName,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
  };
}
