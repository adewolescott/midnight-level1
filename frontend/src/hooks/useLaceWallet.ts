'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Probes all known injection locations for Midnight Lace:
 * 1. window.midnight (both UUID entries and named properties)
 * 2. window.cardano (lace, mnLace, or midnight entries)
 * 3. window.midnightLace / window.mnLace global aliases
 */
function findMidnightProvider(): any | null {
  if (typeof window === 'undefined') return null;

  const win = window as any;

  // 1. Check window.midnight
  if (win.midnight) {
    if (win.midnight.mnLace) return win.midnight.mnLace;
    if (win.midnight.lace) return win.midnight.lace;
    
    // CAIP-372 enumeration of UUID keys
    const entries = Object.entries(win.midnight);
    for (const [, val] of entries) {
      if (val && typeof val === 'object') {
        const candidate = val as any;
        if (
          candidate.enable ||
          candidate.connect ||
          candidate.name?.toLowerCase().includes('lace') ||
          candidate.rdns?.toLowerCase().includes('lace')
        ) {
          return candidate;
        }
      }
    }
    if (entries.length > 0 && typeof entries[0][1] === 'object') {
      return entries[0][1];
    }
  }

  // 2. Check window.cardano namespace (Standard CIP-30 injection)
  if (win.cardano) {
    if (win.cardano.lace?.enable || win.cardano.lace?.connect) return win.cardano.lace;
    if (win.cardano.mnLace) return win.cardano.mnLace;
    if (win.cardano.midnight) return win.cardano.midnight;
    if (win.cardano['midnight-lace']) return win.cardano['midnight-lace'];

    for (const [key, val] of Object.entries(win.cardano)) {
      if (key.toLowerCase().includes('lace') || key.toLowerCase().includes('midnight')) {
        return val;
      }
    }
  }

  // 3. Direct global aliases
  if (win.mnLace) return win.mnLace;
  if (win.midnightLace) return win.midnightLace;

  return null;
}

async function waitForProvider(maxWaitMs = 5000): Promise<any> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const provider = findMidnightProvider();
    if (provider) return provider;
    await new Promise((r) => setTimeout(r, 200));
  }

  return findMidnightProvider();
}

export function useLaceWallet() {
  const [walletApi, setWalletApi] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLaceDetected, setIsLaceDetected] = useState<boolean>(false);

  // Monitor DOM injection and event notifications
  useEffect(() => {
    let active = true;

    const checkProvider = () => {
      const p = findMidnightProvider();
      if (p && active) {
        setIsLaceDetected(true);
      }
    };

    checkProvider();

    // Listen for custom wallet announcement events
    window.addEventListener('midnight#initialized', checkProvider);
    window.addEventListener('cardano#initialized', checkProvider);
    window.addEventListener('load', checkProvider);

    const interval = setInterval(checkProvider, 500);

    return () => {
      active = false;
      window.removeEventListener('midnight#initialized', checkProvider);
      window.removeEventListener('cardano#initialized', checkProvider);
      window.removeEventListener('load', checkProvider);
      clearInterval(interval);
    };
  }, []);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window === 'undefined') {
        throw new Error('Browser window environment not found.');
      }

      // Debug diagnostics in browser console
      const win = window as any;
      console.log('Window environment inspection:', {
        hasMidnight: !!win.midnight,
        midnightKeys: win.midnight ? Object.keys(win.midnight) : [],
        hasCardano: !!win.cardano,
        cardanoKeys: win.cardano ? Object.keys(win.cardano) : [],
      });

      const provider = await waitForProvider(4500);

      if (!provider) {
        throw new Error(
          'Midnight Lace wallet extension was not detected. Please make sure the Lace extension is unlocked and set to Midnight Preprod, then reload the page.'
        );
      }

      setIsLaceDetected(true);

      // Authenticate via either connect() or enable()
      let api: any = null;
      if (typeof provider.connect === 'function') {
        try {
          api = await provider.connect('preprod');
        } catch {
          api = await provider.connect();
        }
      } else if (typeof provider.enable === 'function') {
        api = await provider.enable();
      } else if (typeof provider.isEnabled === 'function') {
        const isEnabled = await provider.isEnabled();
        api = isEnabled ? await provider.enable() : await provider.enable();
      } else {
        api = provider;
      }

      if (!api) {
        throw new Error('Connection request was declined by the user in Lace.');
      }

      // Resolve address across API schemas
      let addr: string | null = null;
      if (typeof api.getUnshieldedAddress === 'function') {
        addr = await api.getUnshieldedAddress();
      } else if (typeof api.state === 'function') {
        const s = await api.state();
        addr = s?.address || s?.shieldedAddress || s?.unshieldedAddress || null;
      } else if (typeof api.getUsedAddresses === 'function') {
        const addrs = await api.getUsedAddresses();
        addr = addrs?.[0] || null;
      } else if (typeof api.getChangeAddress === 'function') {
        addr = await api.getChangeAddress();
      }

      setWalletApi(api);
      setWalletAddress(addr || 'Connected (Midnight Lace)');
      setIsConnected(true);
    } catch (err: any) {
      console.error('Lace Connection Error:', err);
      const msg = err.message || 'Failed to connect to Midnight Lace.';
      setError(msg);
      setIsConnected(false);
      setWalletApi(null);
      setWalletAddress(null);
      alert(msg);
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
    isLaceDetected,
    error,
    connectWallet,
    disconnectWallet,
  };
}
