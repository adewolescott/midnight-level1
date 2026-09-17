'use client';

import { useState, useCallback, useEffect } from 'react';

export interface DiscoveredWallet {
  id: string;
  name: string;
  provider: any;
}

/**
 * Discovers any Midnight-compatible wallet extension (1am, Lace, etc.)
 * by probing standard injected namespaces and CAIP-372 objects.
 */
function findMidnightWallets(): DiscoveredWallet[] {
  if (typeof window === 'undefined') return [];
  const win = window as any;
  const wallets: DiscoveredWallet[] = [];

  // 1. Direct 1am wallet namespace checks
  if (win.oneam) {
    wallets.push({ id: 'oneam', name: '1am Wallet', provider: win.oneam });
  }
  if (win.midnight?.['1am']) {
    wallets.push({ id: '1am', name: '1am Wallet', provider: win.midnight['1am'] });
  }

  // 2. Check window.midnight root and dynamic UUIDs
  if (win.midnight) {
    if (win.midnight.mnLace) {
      wallets.push({ id: 'mnLace', name: 'Midnight Lace', provider: win.midnight.mnLace });
    }
    if (win.midnight.lace) {
      wallets.push({ id: 'lace', name: 'Midnight Lace', provider: win.midnight.lace });
    }

    // CAIP-372 enumeration
    for (const [key, val] of Object.entries(win.midnight)) {
      if (val && typeof val === 'object' && key !== 'mnLace' && key !== 'lace' && key !== '1am') {
        const candidate = val as any;
        const nameLower = (candidate.name || '').toLowerCase();
        const rdnsLower = (candidate.rdns || '').toLowerCase();

        if (nameLower.includes('1am') || rdnsLower.includes('1am')) {
          wallets.push({ id: key, name: '1am Wallet', provider: candidate });
        } else if (nameLower.includes('lace') || rdnsLower.includes('lace')) {
          wallets.push({ id: key, name: 'Midnight Lace', provider: candidate });
        } else if (candidate.connect || candidate.enable) {
          wallets.push({ id: key, name: candidate.name || 'Midnight Wallet', provider: candidate });
        }
      }
    }
  }

  // 3. Fallbacks on window.cardano
  if (win.cardano?.lace) {
    wallets.push({ id: 'cardano-lace', name: 'Lace', provider: win.cardano.lace });
  }
  if (win.cardano?.['1am']) {
    wallets.push({ id: 'cardano-1am', name: '1am Wallet', provider: win.cardano['1am'] });
  }

  // Deduplicate by provider reference
  const unique: DiscoveredWallet[] = [];
  const seen = new Set();
  for (const w of wallets) {
    if (w.provider && !seen.has(w.provider)) {
      seen.add(w.provider);
      unique.push(w);
    }
  }

  return unique;
}

export function useLaceWallet() {
  const [walletApi, setWalletApi] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connectedWalletName, setConnectedWalletName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<DiscoveredWallet[]>([]);

  // Scan for extensions periodically
  useEffect(() => {
    const scan = () => {
      const found = findMidnightWallets();
      setAvailableWallets(found);
    };

    scan();
    window.addEventListener('load', scan);
    const interval = setInterval(scan, 1200);

    return () => {
      window.removeEventListener('load', scan);
      clearInterval(interval);
    };
  }, []);

  const connectWallet = useCallback(async (preferredWalletId?: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      const foundWallets = findMidnightWallets();
      if (foundWallets.length === 0) {
        throw new Error(
          'No Midnight wallet detected. Please ensure 1am Wallet or Midnight Lace is installed, set to Preprod, and unlocked.'
        );
      }

      // Default to 1am Wallet if available, otherwise Lace/first detected
      const targetWallet = preferredWalletId
        ? foundWallets.find((w) => w.id === preferredWalletId) || foundWallets[0]
        : foundWallets.find((w) => w.name.toLowerCase().includes('1am')) || foundWallets[0];

      const provider = targetWallet.provider;

      // Safe connection handshake with an 8-second timeout
      const connectPromise = (async () => {
        if (typeof provider.connect === 'function') {
          try {
            return await provider.connect('preprod');
          } catch {
            return await provider.connect();
          }
        }
        if (typeof provider.enable === 'function') {
          return await provider.enable();
        }
        return provider;
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Connection to ${targetWallet.name} timed out. Please check your wallet extension popup.`)),
          8000
        )
      );

      const api: any = await Promise.race([connectPromise, timeoutPromise]);
      if (!api) throw new Error(`${targetWallet.name} connection was rejected.`);

      // Non-blocking address resolution across API specifications
      let addr: string | null = null;
      try {
        if (typeof api.getUnshieldedAddress === 'function') {
          addr = await Promise.race([api.getUnshieldedAddress(), new Promise((r) => setTimeout(() => r(null), 2500))]);
        }
        if (!addr && typeof api.getDustAddress === 'function') {
          addr = await Promise.race([api.getDustAddress(), new Promise((r) => setTimeout(() => r(null), 2500))]);
        }
        if (!addr && typeof api.state === 'function') {
          const s = await Promise.race([api.state(), new Promise((r) => setTimeout(() => r(null), 2500))]);
          addr = s?.address || s?.unshieldedAddress || s?.dustAddress || null;
        }
        if (!addr && typeof api.getUsedAddresses === 'function') {
          const addrs = await Promise.race([api.getUsedAddresses(), new Promise((r) => setTimeout(() => r(null), 2500))]);
          addr = addrs?.[0] || null;
        }
      } catch (e) {
        console.warn('Address extraction non-fatal warning:', e);
      }

      setWalletApi(api);
      setConnectedWalletName(targetWallet.name);
      setWalletAddress(addr || `Connected (${targetWallet.name})`);
      setIsConnected(true);
    } catch (err: any) {
      console.error('Wallet connect error:', err);
      const msg = err.message || 'Connection failed';
      setError(msg);
      alert(msg);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletApi(null);
    setWalletAddress(null);
    setConnectedWalletName(null);
    setIsConnected(false);
    setError(null);
  }, []);

  return {
    walletApi,
    walletAddress,
    address: walletAddress,
    connectedWalletName,
    isConnected,
    isConnecting,
    isLaceDetected: availableWallets.length > 0,
    availableWallets,
    error,
    connectWallet,
    disconnectWallet,
  };
}
