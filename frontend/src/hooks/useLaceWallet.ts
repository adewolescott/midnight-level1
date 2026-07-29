'use client';

import { useState, useCallback } from 'react';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
  error: string | null;
}

export function useLaceWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    isConnecting: false,
    error: null,
  });

  const connectWallet = useCallback(async () => {
    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const midnightApi = (window as any).midnight?.mnLace;

      if (!midnightApi) {
        throw new Error('Lace Wallet extension not detected in window.midnight.mnLace. Ensure Lace is enabled on Preprod.');
      }

      // Check authorization or request enable
      const isEnabled = await midnightApi.isEnabled?.();
      const walletConnector = isEnabled ? await midnightApi.enable() : await midnightApi.enable();

      setWalletState({
        isConnected: true,
        address: walletConnector?.address || 'mn_preprod1_lace_connected',
        isConnecting: false,
        error: null,
      });
    } catch (err: any) {
      setWalletState({
        isConnected: false,
        address: null,
        isConnecting: false,
        error: err.message || 'Failed to connect Lace Wallet',
      });
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletState({
      isConnected: false,
      address: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
  };
}
