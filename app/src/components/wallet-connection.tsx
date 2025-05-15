"use client"

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit"
import { useDisconnectWallet } from "@mysten/dapp-kit"
import { ChevronDown, LogOut, Copy, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import styles from "./header.module.css"

export function WalletConnection() {
  const account = useCurrentAccount()
  const { mutate: disconnect } = useDisconnectWallet()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleDisconnect = () => {
    setIsDropdownOpen(false)
    disconnect()
    toast.success("Wallet disconnected")
  }

  const copyAddress = () => {
    if (!account) return
    navigator.clipboard.writeText(account.address)
    toast.success("Address copied to clipboard")
    setIsDropdownOpen(false)
  }

  const viewOnExplorer = () => {
    if (!account) return
    window.open(`https://explorer.sui.io/address/${account.address}`, "_blank")
    setIsDropdownOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest(`.${styles.walletDropdown}`) && isDropdownOpen) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  return (
    <div className={styles.walletDropdown}>
      {!account ? (
        <div className={styles.headerContainer}>
          <div className={styles.logoContainer}>
            <img src="/logo.png" alt="WheatChain" className={styles.logo} />
          </div>
          <div className={styles.connectButtonWrapper}>
            <ConnectButton className={styles.customConnectButton} />
          </div>
        </div>
      ) : (
        <div className={styles.headerContainer}>
          <div className={styles.logoContainer}>
            <img src="/logo.png" alt="WheatChain" className={styles.logo} />
          </div>
          <button
            onClick={toggleDropdown}
            className={styles.walletButton}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <span className={styles.walletAddress}>
              {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </span>
            <ChevronDown className={`${styles.chevronIcon} ${isDropdownOpen ? styles.rotate : ""}`} />
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownLabel}>Connected Wallet</p>
                <p className={styles.dropdownAddress}>
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </p>
              </div>
              <div className={styles.dropdownActions}>
                <button onClick={copyAddress} className={styles.dropdownItem}>
                  <Copy className={styles.dropdownIcon} />
                  Copy Address
                </button>
                <button onClick={viewOnExplorer} className={styles.dropdownItem}>
                  <ExternalLink className={styles.dropdownIcon} />
                  View on Explorer
                </button>
                <button onClick={handleDisconnect} className={styles.dropdownItem}>
                  <LogOut className={styles.dropdownIcon} />
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
