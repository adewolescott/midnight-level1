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
      const midnightObj = (window as any).midnight;

      // 1. Check if the root window.midnight object exists
      if (!midnightObj) {
        throw new Error(
          'No Midnight wallet extension detected on window.midnight. Please ensure your Lace Midnight extension is installed and active on this tab.'
        );
      }

      // 2. Dynamic wallet detection (check legacy mnLace or enumerate UUID keys)
      let initialApi = midnightObj.mnLace;

      if (!initialApi) {
        const availableWallets = Object.values(midnightObj);
        if (availableWallets.length > 0) {
          initialApi = availableWallets[0];
        }
      }

      if (!initialApi) {
        throw new Error('Midnight wallet extension object found, but no initial API connector is exposed.');
      }

      // 3. Connect to network (Preprod)
      let connectedApi;
      if (typeof initialApi.connect === 'function') {
        connectedApi = await initialApi.connect('preprod');
      } else if (typeof initialApi.enable === 'function') {
        connectedApi = await initialApi.enable();
      } else {
        throw new Error('Selected Midnight wallet does not expose a connect() or enable() method.');
      }

      // 4. Retrieve address safely
      let walletAddress = 'mn_preprod1_lace_connected';
      try {
        if (typeof connectedApi?.getUnshieldedAddress === 'function') {
          const { unshieldedAddress } = await connectedApi.getUnshieldedAddress();
          if (unshieldedAddress) walletAddress = unshieldedAddress;
        } else if (typeof connectedApi?.state === 'function') {
          const state = await connectedApi.state();
          if (state?.address) walletAddress = state.address;
        }
      } catch (addrErr) {
        console.warn('Could not fetch exact address, using default connected state:', addrErr);
      }

      setWalletState({
        isConnected: true,
        address: walletAddress,
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
