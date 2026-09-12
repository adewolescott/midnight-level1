'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Polls for the Midnight Lace provider object if the browser extension
 * finishes injecting script tags after React's initial mount.
 */
async function getMidnightLaceProvider(timeoutMs = 3500): Promise<any> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (typeof window !== 'undefined') {
      const midnight = (window as any).midnight;
      if (midnight?.mnLace) return midnight.mnLace;
      if (midnight?.lace) return midnight.lace;
      // Fallback for standard CIP wallet registry
      if ((window as any).cardano?.midnight) return (window as any).cardano.midnight;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  // Final check
  const midnight = typeof window !== 'undefined' ? (window as any).midnight : undefined;
  return midnight?.mnLace || midnight?.lace || null;
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
      const provider = await getMidnightLaceProvider(2000);
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

      // Resolve provider with dynamic wait
      const laceProvider = await getMidnightLaceProvider(4000);

      if (!laceProvider) {
        throw new Error(
          'Midnight Lace wallet extension was not detected. Please ensure Midnight Lace is installed, enabled, and unlocked in your browser.'
        );
      }

      setIsLaceDetected(true);

      // Check authorization state
      let api: any;
      if (typeof laceProvider.isEnabled === 'function') {
        const enabled = await laceProvider.isEnabled();
        api = enabled ? await laceProvider.enable() : await laceProvider.enable();
      } else if (typeof laceProvider.enable === 'function') {
        api = await laceProvider.enable();
      } else {
        api = laceProvider;
      }

      if (!api) {
        throw new Error('Connection request was declined or returned an empty API session.');
      }

      // Query account/state
      let address: string | null = null;
      if (typeof api.state === 'function') {
        const state = await api.state();
        address = state?.address || state?.shieldedAddress || state?.unshieldedAddress || null;
      } else if (typeof api.getUnshieldedAddress === 'function') {
        address = await api.getUnshieldedAddress();
      } else if (typeof api.getChangeAddress === 'function') {
        address = await api.getChangeAddress();
      }

      if (!address && typeof api.getUsedAddresses === 'function') {
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
