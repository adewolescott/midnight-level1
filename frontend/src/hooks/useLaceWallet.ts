'use client';

import { useState, useCallback, useRef } from 'react';

export function useLaceWallet() {
  const walletApiRef = useRef<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connectedWalletName, setConnectedWalletName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window === 'undefined') return;

      const win = window as any;
      let targetProvider: any = null;
      let name = 'Midnight Wallet';

      // 1. Check 1am Wallet
      if (win.oneam) {
        targetProvider = win.oneam;
        name = '1am Wallet';
      } else if (win.midnight?.['1am']) {
        targetProvider = win.midnight['1am'];
        name = '1am Wallet';
      } 
      // 2. Check Midnight Lace
      else if (win.midnight?.mnLace) {
        targetProvider = win.midnight.mnLace;
        name = 'Midnight Lace';
      } else if (win.midnight?.lace) {
        targetProvider = win.midnight.lace;
        name = 'Midnight Lace';
      } 
      // 3. Fallback to any enumerated provider
      else if (win.midnight && typeof win.midnight === 'object') {
        const vals = Object.values(win.midnight) as any[];
        const found = vals.find((v) => v && (typeof v.connect === 'function' || typeof v.enable === 'function'));
        if (found) {
          targetProvider = found;
          name = found.name || 'Midnight Wallet';
        }
      } 
      // 4. Cardano namespace fallback
      else if (win.cardano?.lace) {
        targetProvider = win.cardano.lace;
        name = 'Lace';
      }

      if (!targetProvider) {
        throw new Error('No Midnight-compatible wallet detected. Please install or unlock 1am Wallet or Midnight Lace.');
      }

      // Safe connection handshake
      let session: any = null;
      if (typeof targetProvider.connect === 'function') {
        try {
          session = await targetProvider.connect('preprod');
        } catch {
          session = await targetProvider.connect();
        }
      } else if (typeof targetProvider.enable === 'function') {
        session = await targetProvider.enable();
      } else {
        session = targetProvider;
      }

      if (!session) {
        throw new Error('Connection request was declined.');
      }

      // Store API in ref to avoid React state re-render crashes with Proxy objects
      walletApiRef.current = session;

      // Safely extract address string
      let addrStr = `${name} Connected`;
      try {
        if (typeof session.getUnshieldedAddress === 'function') {
          const uAddr = await session.getUnshieldedAddress();
          if (uAddr) addrStr = String(uAddr);
        } else if (typeof session.getDustAddress === 'function') {
          const dAddr = await session.getDustAddress();
          if (dAddr) addrStr = String(dAddr);
        } else if (typeof session.state === 'function') {
          const st = await session.state();
          if (st?.address) addrStr = String(st.address);
          else if (st?.unshieldedAddress) addrStr = String(st.unshieldedAddress);
        }
      } catch (err) {
        console.warn('Address extraction warning:', err);
      }

      setConnectedWalletName(name);
      setWalletAddress(addrStr);
      setIsConnected(true);
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err?.message || 'Failed to connect wallet');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    walletApiRef.current = null;
    setWalletAddress(null);
    setConnectedWalletName(null);
    setIsConnected(false);
    setError(null);
  }, []);

  return {
    walletApi: walletApiRef.current,
    walletAddress,
    connectedWalletName,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
  };
}
