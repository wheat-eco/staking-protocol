"use client"

import { ConnectButton as DappKitConnectButton } from "@mysten/dapp-kit"
import styles from "./header.module.css"

export function CustomConnectButton() {
  return <DappKitConnectButton className={styles.customConnectButton} />
}
