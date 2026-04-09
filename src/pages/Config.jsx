import { useState } from 'react'
import toast from 'react-hot-toast'
import { configApi } from '../api/client'

export default function Config({ config, onSave }) {
  const [companyName, setCompanyName] = useState(config?.CompanyName || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    if (!companyName.trim()) return toast.error('Company name is required.')
    setSaving(true)
    try {
      await configApi.set('CompanyName', companyName)
      toast.success('Settings saved.')
      await onSave()
    } catch {
      toast.error('Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const version = config?.ServiceChargeVersion || '—'

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Workspace preferences</p>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <div>
          <label className="label">Company / Property Name</label>
          <input
            className="input"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="e.g. The Grand Hotel"
            required
          />
        </div>

        {/* Version is read-only — managed by admin */}
        <div>
          <label className="label">Service Charge Model</label>
          <div className={`p-4 rounded-xl border-2 border-slate-200 bg-slate-50`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-slate-700">
                  Version {version} — {version === 'A' ? 'Fix-rate' : version === 'B' ? 'Workday-rate' : 'Unknown'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {version === 'A'
                    ? 'SC% ÷ number of employees in position'
                    : 'SC% ÷ total work days × employee work days'}
                </div>
              </div>
              <span className="badge-slate text-xs">Admin-managed</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Contact your system administrator to change the service charge model.
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>

      <div className="card p-4 mt-4 bg-slate-50 border-slate-200">
        <h3 className="text-sm font-semibold text-slate-600 mb-2">Current Configuration</h3>
        <div className="space-y-1">
          {config && Object.entries(config).map(([k, v]) => (
            <div key={k} className="flex gap-2 text-xs">
              <span className="text-slate-400 font-mono w-48 flex-shrink-0">{k}</span>
              <span className="text-slate-700 font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
