'use client';

import { useState, useCallback, useEffect } from 'react';

function findMidnightProvider(): any | null {
  if (typeof window === 'undefined') return null;
  const win = window as any;

  if (win.midnight) {
    if (win.midnight.mnLace) return win.midnight.mnLace;
    if (win.midnight.lace) return win.midnight.lace;
    const entries = Object.entries(win.midnight);
    for (const [, val] of entries) {
      if (val && typeof val === 'object') {
        const candidate = val as any;
        if (candidate.enable || candidate.connect || candidate.name?.toLowerCase().includes('lace')) {
          return candidate;
        }
      }
    }
    if (entries.length > 0 && typeof entries[0][1] === 'object') {
      return entries[0][1];
    }
  }

  if (win.cardano?.lace) return win.cardano.lace;
  if (win.cardano?.midnight) return win.cardano.midnight;

  return null;
}

export function useLaceWallet() {
  const [walletApi, setWalletApi] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLaceDetected, setIsLaceDetected] = useState<boolean>(false);

  useEffect(() => {
    const check = () => {
      if (findMidnightProvider()) setIsLaceDetected(true);
    };
    check();
    window.addEventListener('load', check);
    const id = setInterval(check, 1000);
    return () => {
      window.removeEventListener('load', check);
      clearInterval(id);
    };
  }, []);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const provider = findMidnightProvider();
      if (!provider) {
        throw new Error('Midnight Lace extension not detected. Ensure it is enabled and set to Midnight Preprod.');
      }

      // Safe connection handshake with timeout to prevent freeze during syncing
      const connectPromise = (async () => {
        if (typeof provider.connect === 'function') {
          try { return await provider.connect('preprod'); } catch { return await provider.connect(); }
        }
        if (typeof provider.enable === 'function') {
          return await provider.enable();
        }
        return provider;
      })();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out. Please check if Lace requires approval or is stuck syncing.')), 8000)
      );

      const api: any = await Promise.race([connectPromise, timeoutPromise]);

      if (!api) throw new Error('Wallet connection rejected.');

      // Safely query address without hanging
      let addr: string | null = null;
      try {
        if (typeof api.getUnshieldedAddress === 'function') {
          addr = await Promise.race([api.getUnshieldedAddress(), new Promise((r) => setTimeout(() => r(null), 2000))]);
        }
        if (!addr && typeof api.state === 'function') {
          const s = await Promise.race([api.state(), new Promise((r) => setTimeout(() => r(null), 2000))]);
          addr = s?.address || s?.unshieldedAddress || null;
        }
      } catch (err) {
        console.warn('Address extraction warning:', err);
      }

      setWalletApi(api);
      setWalletAddress(addr || 'Connected (Midnight Lace Preprod)');
      setIsConnected(true);
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Connection failed');
      alert(err.message || 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletApi(null);
    setWalletAddress(null);
    setIsConnected(false);
  }, []);

  return {
    walletApi,
    walletAddress,
    address: walletAddress,
    isConnected,
    isConnecting,
    isLaceDetected,
    error,
    connectWallet,
    disconnectWallet,
  };
}
