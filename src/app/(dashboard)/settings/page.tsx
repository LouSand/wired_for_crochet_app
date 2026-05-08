import { getSettings } from '@/lib/actions/settings'
import SettingsForm from './settings-form'
import DeleteAccountSection from './delete-account-section'

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-600">
        Manage your default preferences for pricing, currency, and other features.
      </p>

      <div className="mt-6 max-w-md">
        <SettingsForm
          defaultHourlyRate={settings.default_hourly_rate}
          defaultCurrency={settings.default_currency}
          defaultProfitMargin={settings.default_profit_margin}
        />
      </div>

      <div className="max-w-md">
        <DeleteAccountSection />
      </div>
    </div>
  )
}
