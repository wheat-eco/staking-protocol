"use client"

import type React from "react"

import { useState } from "react"
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"
import { toast } from "react-hot-toast"
import { Save, RefreshCw } from "lucide-react"

export function Settings() {
  const [settings, setSettings] = useState({
    campaignActive: true,
    minTokenAmount: 100,
    maxTokenAmount: 10000,
    referralBonus: 500,
    refereeBonus: 250,
    twitterFollowRequired: true,
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : type === "number" ? Number.parseInt(value) : value,
    })
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const db = getFirestore()
      await setDoc(doc(db, "settings", "campaign"), {
        ...settings,
        endDate: new Date(settings.endDate),
        lastUpdated: new Date(),
      })

      toast.success("Settings saved successfully")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    setLoading(true)

    try {
      const db = getFirestore()
      const settingsDoc = await getDoc(doc(db, "settings", "campaign"))

      if (settingsDoc.exists()) {
        const data = settingsDoc.data()
        setSettings({
          ...data,
          endDate: data.endDate.toDate().toISOString().split("T")[0],
        } as any)
        toast.success("Settings loaded")
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-card">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Campaign Settings</h2>
          <p className="text-gray-400 text-sm">Configure the token spree campaign parameters</p>
        </div>
        <button
          onClick={loadSettings}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
        >
          <RefreshCw size={16} className="mr-2" />
          Reload Settings
        </button>
      </div>

      <form onSubmit={handleSaveSettings}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Status</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="campaignActive"
                  name="campaignActive"
                  checked={settings.campaignActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
                />
                <label htmlFor="campaignActive" className="ml-2 text-sm text-gray-300">
                  Campaign is active
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={settings.endDate}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Twitter Follow Required</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="twitterFollowRequired"
                  name="twitterFollowRequired"
                  checked={settings.twitterFollowRequired}
                  onChange={handleChange}
                  className="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
                />
                <label htmlFor="twitterFollowRequired" className="ml-2 text-sm text-gray-300">
                  Require Twitter follow to claim tokens
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <label htmlFor="minTokenAmount" className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Token Amount
              </label>
              <input
                type="number"
                id="minTokenAmount"
                name="minTokenAmount"
                value={settings.minTokenAmount}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="maxTokenAmount" className="block text-sm font-medium text-gray-300 mb-2">
                Maximum Token Amount
              </label>
              <input
                type="number"
                id="maxTokenAmount"
                name="maxTokenAmount"
                value={settings.maxTokenAmount}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label htmlFor="referralBonus" className="block text-sm font-medium text-gray-300 mb-2">
                  Referrer Bonus
                </label>
                <input
                  type="number"
                  id="referralBonus"
                  name="referralBonus"
                  value={settings.referralBonus}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="refereeBonus" className="block text-sm font-medium text-gray-300 mb-2">
                  Referee Bonus
                </label>
                <input
                  type="number"
                  id="refereeBonus"
                  name="refereeBonus"
                  value={settings.refereeBonus}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-md"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-t-transparent border-black rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
