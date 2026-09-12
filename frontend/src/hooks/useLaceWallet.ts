'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Enumerates window.midnight to discover wallets registered under UUID keys (CAIP-372 standard)
 * or legacy static keys (mnLace / lace).
 */
function findInjectedMidnightWallet(): any | null {
  if (typeof window === 'undefined') return null;

  const midnight = (window as any).midnight;
  if (!midnight) {
    // Also check window.cardano fallback
    if ((window as any).cardano?.midnight) return (window as any).cardano.midnight;
    return null;
  }

  // Check legacy direct properties first
  if (midnight.mnLace) return midnight.mnLace;
  if (midnight.lace) return midnight.lace;

  // CAIP-372 Standard: Enumerate UUID keys on window.midnight
  const walletEntries = Object.values(midnight);
  if (walletEntries.length > 0) {
    // Find lace-specific wallet or take the first available Midnight wallet
    const laceWallet = walletEntries.find((w: any) => 
      w?.name?.toLowerCase().includes('lace') || 
      w?.rdns?.toLowerCase().includes('lace')
    );
    return laceWallet || walletEntries[0];
  }

  return null;
}

/**
 * Polls for the Midnight provider object if the browser extension
 * finishes injecting script tags after React's initial mount.
 */
async function waitForMidnightWallet(timeoutMs = 4000): Promise<any> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const wallet = findInjectedMidnightWallet();
    if (wallet) return wallet;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return findInjectedMidnightWallet();
}

export function useLaceWallet() {
  const [walletApi, setWalletApi] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLaceDetected, setIsLaceDetected] = useState<boolean>(false);

  // Probe for extension on mount
  useEffect(() => {
    let mounted = true;

    async function detect() {
      const provider = await waitForMidnightWallet(2500);
      if (mounted && provider) {
        setIsLaceDetected(true);
      }
    }

    detect();
    return () => {
      mounted = false;
    };
  }, []);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window === 'undefined') {
        throw new Error('Window environment unavailable.');
      }

      // Resolve provider via UUID enumeration & polling
      const walletProvider = await waitForMidnightWallet(4500);

      if (!walletProvider) {
        throw new Error(
          'Midnight Lace wallet extension was not detected. Please ensure Midnight Lace is installed, enabled, and unlocked in your browser.'
        );
      }

      setIsLaceDetected(true);

      // Establish connection: Support connect('preprod') [CAIP-372] or enable() [CIP-30]
      let api: any = null;
      if (typeof walletProvider.connect === 'function') {
        try {
          api = await walletProvider.connect('preprod');
        } catch (connErr) {
          api = await walletProvider.connect();
        }
      } else if (typeof walletProvider.enable === 'function') {
        api = await walletProvider.enable();
      } else if (typeof walletProvider.isEnabled === 'function') {
        const enabled = await walletProvider.isEnabled();
        api = enabled ? await walletProvider.enable() : await walletProvider.enable();
      } else {
        api = walletProvider;
      }

      if (!api) {
        throw new Error('Connection request was declined or returned an empty API session.');
      }

      // Query account/state across all DApp connector specs
      let address: string | null = null;
      if (typeof api.getUnshieldedAddress === 'function') {
        address = await api.getUnshieldedAddress();
      } else if (typeof api.state === 'function') {
        const state = await api.state();
        address = state?.address || state?.shieldedAddress || state?.unshieldedAddress || null;
      } else if (typeof api.getDustAddress === 'function') {
        address = await api.getDustAddress();
      } else if (typeof api.getUsedAddresses === 'function') {
        const addrs = await api.getUsedAddresses();
        address = addrs?.[0] || null;
      }

      setWalletApi(api);
      setWalletAddress(address || 'Connected (Midnight Lace)');
      setIsConnected(true);
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      const msg = err.message || 'Failed to connect to Midnight Lace';
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
