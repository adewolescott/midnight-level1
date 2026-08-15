'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DAppConnectorWalletAPI } from '@midnight-ntwrk/dapp-connector-api';

export function useLaceWallet() {
  const [walletApi, setWalletApi] = useState<DAppConnectorWalletAPI | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const midnight = (window as any).midnight;
      if (midnight?.mnLace) {
        const isAuth = await midnight.mnLace.isEnabled?.();
        if (isAuth) {
          const api: DAppConnectorWalletAPI = await midnight.mnLace.enable();
          setWalletApi(api);
          const state: any = await api.state();
          setAddress(state.address || state.shieldedAddress || 'addr_midnight_preprod_connected');
          setIsConnected(true);
        }
      }
    } catch (err: any) {
      console.warn('Silent wallet check skipped:', err.message);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const midnight = (window as any).midnight;
      if (!midnight?.mnLace) {
        throw new Error('Midnight Lace wallet extension not detected. Please install and switch to Midnight Preprod.');
      }
      const api: DAppConnectorWalletAPI = await midnight.mnLace.enable();
      setWalletApi(api);
      const state: any = await api.state();
      setAddress(state.address || state.shieldedAddress || 'addr_midnight_preprod_user');
      setIsConnected(true);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Midnight Lace.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletApi(null);
    setAddress(null);
    setIsConnected(false);
  };

  return {
    walletApi,
    address,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet
  };
}
