'use client';

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { useDisconnectWallet } from '@mysten/dapp-kit';
import { ChevronDown, LogOut, Copy, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export function WalletConnection() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleDisconnect = () => {
    setIsDropdownOpen(false);
    disconnect();
    toast.success('Wallet disconnected');
  };

  const copyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account.address);
    toast.success('Address copied to clipboard');
    setIsDropdownOpen(false);
  };

  const viewOnExplorer = () => {
    if (!account) return;
    window.open(`https://explorer.sui.io/address/${account.address}`, '_blank');
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.wallet-dropdown') && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className="relative wallet-dropdown">
      {!account ? (
        <div className="flex items-center justify-between rounded-xl bg-gray-900/60 backdrop-blur-md border border-gray-800 p-3 pl-6 pr-3 h-16 shadow-lg">
          <div className="flex items-center">
            <img src="/logo.png" alt="WheatChain" className="h-10 w-58 mr-3" />
          </div>
          <ConnectButton />
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl bg-gray-900/60 backdrop-blur-md border border-gray-800 p-3 pl-6 pr-3 h-16 shadow-lg">
          <div className="flex items-center">
            <img src="/logo.png" alt="WheatChain" className="h-8 w-48 mr-3" />
          </div>
          <button
            onClick={toggleDropdown}
            className="ml-4 flex items-center gap-2 bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 hover:bg-gray-700 transition-colors shadow-md"
          >
            <span className="hidden sm:inline text-sm font-medium">
              {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl z-50 border border-gray-800 overflow-hidden">
              <div className="p-3 border-b border-gray-800">
                <p className="text-xs text-gray-400 mb-1">Connected Wallet</p>
                <p className="text-sm font-medium text-white truncate">
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </p>
              </div>
              <div className="p-2">
                <button
                  onClick={copyAddress}
                  className="w-full text-left text-white py-2 px-3 rounded-md hover:bg-gray-800 transition-colors flex items-center text-sm"
                >
                  <Copy className="w-4 h-4 mr-2 text-gray-400" />
                  Copy Address
                </button>
                <button
                  onClick={viewOnExplorer}
                  className="w-full text-left text-white py-2 px-3 rounded-md hover:bg-gray-800 transition-colors flex items-center text-sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2 text-gray-400" />
                  View on Explorer
                </button>
                <button
                  onClick={handleDisconnect}
                  className="w-full text-left text-white py-2 px-3 rounded-md hover:bg-gray-800 transition-colors flex items-center text-sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
