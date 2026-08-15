'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DAppConnectorWalletAPI {
  serviceUriConfig?: () => Promise<{
    indexerUri?: string;
    proverServerUri?: string;
    substrateNodeUri?: string;
  }>;
  state?: () => Promise<unknown>;
  balanceTx?: (tx: unknown, config?: unknown) => Promise<unknown>;
  submitTx?: (tx: unknown) => Promise<string>;
  [key: string]: unknown;
}

export function useLaceWallet() {
  const [walletApi, setWalletApi] = useState<DAppConnectorWalletAPI | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !(window as unknown as { midnight?: { mnLace?: unknown } }).midnight?.mnLace) {
        return;
      }

      const midnight = (window as unknown as {
        midnight: {
          mnLace: {
            isEnabled: () => Promise<boolean>;
            enable: () => Promise<DAppConnectorWalletAPI>;
          };
        };
      }).midnight;

      const isEnabled = await midnight.mnLace.isEnabled();
      if (isEnabled) {
        const api = await midnight.mnLace.enable();
        setWalletApi(api);
        setIsConnected(true);
        setWalletAddress('mn_preprod1qz0pay...9zk');
      }
    } catch (err: unknown) {
      console.warn('Lace auto-connect check:', err);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window === 'undefined' || !(window as unknown as { midnight?: { mnLace?: unknown } }).midnight?.mnLace) {
        throw new Error('Midnight Lace wallet extension not found. Please install Lace.');
      }

      const midnight = (window as unknown as {
        midnight: {
          mnLace: {
            enable: () => Promise<DAppConnectorWalletAPI>;
          };
        };
      }).midnight;

      const api = await midnight.mnLace.enable();
      setWalletApi(api);
      setIsConnected(true);
      setWalletAddress('mn_preprod1qz0pay...9zk');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect Midnight Lace Wallet';
      setError(msg);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletApi(null);
    setWalletAddress(null);
    setIsConnected(false);
  };

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
