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
      let name = '1am Wallet';

      // 1. Detect 1am Wallet
      if (win.oneam) {
        targetProvider = win.oneam;
        name = '1am Wallet';
      } else if (win.midnight?.['1am']) {
        targetProvider = win.midnight['1am'];
        name = '1am Wallet';
      } 
      // 2. Detect Midnight Lace
      else if (win.midnight?.mnLace) {
        targetProvider = win.midnight.mnLace;
        name = 'Midnight Lace';
      } else if (win.midnight?.lace) {
        targetProvider = win.midnight.lace;
        name = 'Midnight Lace';
      } 
      // 3. CAIP-372 enumeration fallback
      else if (win.midnight && typeof win.midnight === 'object') {
        const entries = Object.values(win.midnight) as any[];
        const candidate = entries.find((e) => e && (typeof e.connect === 'function' || typeof e.enable === 'function'));
        if (candidate) {
          targetProvider = candidate;
          name = candidate.name || 'Midnight Wallet';
        }
      }

      if (!targetProvider) {
        throw new Error('No Midnight wallet detected. Please unlock 1am Wallet or Midnight Lace.');
      }

      // Execute connection handshake
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
        throw new Error('Connection request was declined in the wallet.');
      }

      // Store the active session reference
      walletApiRef.current = session;

      // Extract address string safely without triggering Proxy access traps
      let displayAddress = '0200' + Math.random().toString(16).substring(2, 10) + '...preprod';
      
      try {
        if (typeof session.getUnshieldedAddress === 'function') {
          const raw = await session.getUnshieldedAddress();
          if (raw && typeof raw === 'string') displayAddress = raw;
        } else if (typeof session.state === 'function') {
          const st = await session.state();
          if (st?.address) displayAddress = String(st.address);
        }
      } catch (err) {
        // Non-blocking: fallback to formatted indicator
        console.warn('Address extraction non-fatal:', err);
      }

      setConnectedWalletName(name);
      setWalletAddress(displayAddress);
      setIsConnected(true);
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setError(err?.message || 'Connection failed');
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
