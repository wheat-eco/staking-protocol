"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import { Save, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"

interface CampaignSettings {
  token_amounts: {
    min: number
    max: number
  }
  social_rewards: {
    twitter: { min: number; max: number }
    telegram: { min: number; max: number }
    discord: { min: number; max: number }
  }
  referral_bonuses: {
    referrer: number
    referee: number
  }
  campaign_duration: {
    start: string
    end: string
  }
  max_referrals_per_user: number
}

export function Settings() {
  const [settings, setSettings] = useState<CampaignSettings>({
    token_amounts: { min: 100, max: 10000 },
    social_rewards: {
      twitter: { min: 50, max: 500 },
      telegram: { min: 50, max: 500 },
      discord: { min: 50, max: 500 },
    },
    referral_bonuses: { referrer: 500, referee: 250 },
    campaign_duration: {
      start: new Date().toISOString().split("T")[0],
      end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
    max_referrals_per_user: 100,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)

      // Load all campaign settings
      const { data: settingsData, error } = await supabase
        .from("campaign_settings")
        .select("setting_key, setting_value")

      if (error) {
        console.error("Error loading settings:", error)
        toast.error("Failed to load settings")
        return
      }

      if (settingsData && settingsData.length > 0) {
        const settingsMap: Record<string, any> = {}
        settingsData.forEach((setting) => {
          settingsMap[setting.setting_key] = setting.setting_value
        })

        setSettings({
          token_amounts: settingsMap.token_amounts || { min: 100, max: 10000 },
          social_rewards: settingsMap.social_rewards || {
            twitter: { min: 50, max: 500 },
            telegram: { min: 50, max: 500 },
            discord: { min: 50, max: 500 },
          },
          referral_bonuses: settingsMap.referral_bonuses || { referrer: 500, referee: 250 },
          campaign_duration: settingsMap.campaign_duration || {
            start: new Date().toISOString().split("T")[0],
            end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          },
          max_referrals_per_user: settingsMap.max_referrals_per_user || 100,
        })

        toast.success("Settings loaded successfully")
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)

      // Validate settings before saving
      if (settings.token_amounts.min >= settings.token_amounts.max) {
        toast.error("Minimum token amount must be less than maximum")
        return
      }

      if (new Date(settings.campaign_duration.start) >= new Date(settings.campaign_duration.end)) {
        toast.error("Campaign start date must be before end date")
        return
      }

      // Update each setting using upsert to handle both insert and update
      const settingsToUpdate = [
        { key: "token_amounts", value: settings.token_amounts },
        { key: "social_rewards", value: settings.social_rewards },
        { key: "referral_bonuses", value: settings.referral_bonuses },
        { key: "campaign_duration", value: settings.campaign_duration },
        { key: "max_referrals_per_user", value: settings.max_referrals_per_user },
      ]

      // Use Promise.all to update all settings concurrently
      const updatePromises = settingsToUpdate.map(async (setting) => {
        const { error } = await supabase.from("campaign_settings").upsert(
          {
            setting_key: setting.key,
            setting_value: setting.value,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "setting_key", // Specify the conflict column
            ignoreDuplicates: false, // Update on conflict
          },
        )

        if (error) {
          console.error(`Error updating ${setting.key}:`, error)
          throw new Error(`Failed to update ${setting.key}: ${error.message}`)
        }

        return setting.key
      })

      await Promise.all(updatePromises)

      setLastSaved(new Date())
      toast.success("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setSettings({
      token_amounts: { min: 100, max: 10000 },
      social_rewards: {
        twitter: { min: 50, max: 500 },
        telegram: { min: 50, max: 500 },
        discord: { min: 50, max: 500 },
      },
      referral_bonuses: { referrer: 500, referee: 250 },
      campaign_duration: {
        start: new Date().toISOString().split("T")[0],
        end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      max_referrals_per_user: 100,
    })
    toast("Settings reset to defaults")
  }

  const updateNestedSetting = (path: string[], value: any) => {
    setSettings((prev) => {
      const newSettings = { ...prev }
      let current: any = newSettings

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]]
      }

      current[path[path.length - 1]] = value
      return newSettings
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-t-yellow-500 border-yellow-200/20 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Campaign Settings</h2>
            <p className="text-gray-400 text-sm">Configure the token spree campaign parameters</p>
            {lastSaved && (
              <div className="flex items-center mt-2 text-green-500 text-sm">
                <CheckCircle size={16} className="mr-1" />
                Last saved: {lastSaved.toLocaleString()}
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={resetToDefaults}
              className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={loadSettings}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors"
            >
              <RefreshCw size={16} className="mr-2" />
              Reload Settings
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Token Amount Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Token Distribution</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Token Amount</label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={settings.token_amounts.min}
                    onChange={(e) => updateNestedSetting(["token_amounts", "min"], Number.parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Maximum Token Amount</label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={settings.token_amounts.max}
                    onChange={(e) => updateNestedSetting(["token_amounts", "max"], Number.parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
            </div>

            {/* Social Rewards */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Social Task Rewards</h3>
              <div className="space-y-4">
                {Object.entries(settings.social_rewards).map(([platform, rewards]) => (
                  <div key={platform} className="bg-gray-700/50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-300 mb-3 capitalize">{platform}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Min Reward</label>
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={rewards.min}
                          onChange={(e) =>
                            updateNestedSetting(["social_rewards", platform, "min"], Number.parseInt(e.target.value))
                          }
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Max Reward</label>
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={rewards.max}
                          onChange={(e) =>
                            updateNestedSetting(["social_rewards", platform, "max"], Number.parseInt(e.target.value))
                          }
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Referral and Campaign Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Referral System</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Referrer Bonus</label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={settings.referral_bonuses.referrer}
                    onChange={(e) =>
                      updateNestedSetting(["referral_bonuses", "referrer"], Number.parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Tokens given to the person who refers</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Referee Bonus</label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={settings.referral_bonuses.referee}
                    onChange={(e) =>
                      updateNestedSetting(["referral_bonuses", "referee"], Number.parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Tokens given to the person who was referred</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Referrals per User</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.max_referrals_per_user}
                    onChange={(e) =>
                      setSettings({ ...settings, max_referrals_per_user: Number.parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
            </div>

            {/* Campaign Duration */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Campaign Duration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={settings.campaign_duration.start}
                    onChange={(e) => updateNestedSetting(["campaign_duration", "start"], e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                  <input
                    type="date"
                    value={settings.campaign_duration.end}
                    onChange={(e) => updateNestedSetting(["campaign_duration", "end"], e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
            </div>

            {/* Warning Notice */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle size={20} className="text-yellow-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-yellow-500 font-medium mb-1">Important Notice</h4>
                  <p className="text-sm text-gray-300">
                    Changes to these settings will affect new users and actions. Existing user data will not be
                    retroactively modified.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="border-t border-gray-700 pt-6 mt-8">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
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
      </div>
    </div>
  )
}
