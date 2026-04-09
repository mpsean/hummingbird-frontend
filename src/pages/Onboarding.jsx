import { useState } from 'react'
import { configApi } from '../api/client'
import toast from 'react-hot-toast'

export default function Onboarding({ onComplete }) {
  const [form, setForm] = useState({ companyName: '', serviceChargeVersion: 'A' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.companyName.trim()) return toast.error('Company name is required.')
    setLoading(true)
    try {
      await configApi.onboard({
        companyName: form.companyName,
        serviceChargeVersion: form.serviceChargeVersion,
      })
      toast.success('Welcome to Hummingbird HR!')
      await onComplete()
    } catch {
      toast.error('Setup failed. Is the API running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🐦</div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome to Hummingbird HR</h1>
          <p className="text-slate-500 text-sm mt-1">Let's set up your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Company / Property Name</label>
            <input
              className="input"
              placeholder="e.g. The Grand Hotel"
              value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">Service Charge Model</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {[
                { value: 'A', label: 'Version A', sub: 'Fix-rate — split equally among employees in position' },
                { value: 'B', label: 'Version B', sub: 'Workday-rate — split proportional to days worked' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, serviceChargeVersion: opt.value }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.serviceChargeVersion === opt.value
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`font-semibold text-sm ${
                    form.serviceChargeVersion === opt.value ? 'text-brand-700' : 'text-slate-700'
                  }`}>{opt.label}</div>
                  <div className="text-xs text-slate-500 mt-1 leading-snug">{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            {loading ? 'Setting up…' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  )
}
