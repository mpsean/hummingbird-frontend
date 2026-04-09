import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { payrollApi, taApi } from '../api/client'

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const NOW = new Date()

export default function Payroll({ config }) {
  const version = config?.ServiceChargeVersion || 'A'

  const [calcMonth, setCalcMonth] = useState({ year: NOW.getFullYear(), month: NOW.getMonth() + 1 })
  const [serviceCharge, setServiceCharge] = useState('')
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState(null)

  const [calculatedMonths, setCalculatedMonths] = useState([])
  const [viewMonth, setViewMonth] = useState(null)
  const [viewing, setViewing] = useState(false)

  const fetchCalculatedMonths = async () => {
    try {
      const months = await payrollApi.getMonths()
      setCalculatedMonths(months)
      if (months.length > 0 && !viewMonth) setViewMonth(months[0])
    } catch { /* silent */ }
  }

  const fetchViewMonth = async (m) => {
    if (!m) return
    setViewing(true)
    try {
      const data = await payrollApi.get(m.year, m.month)
      setResult(data)
    } catch {
      setResult(null)
    } finally {
      setViewing(false)
    }
  }

  useEffect(() => { fetchCalculatedMonths() }, [])
  useEffect(() => { if (viewMonth) fetchViewMonth(viewMonth) }, [viewMonth])

  const handleCalculate = async (e) => {
    e.preventDefault()
    const sc = parseFloat(serviceCharge)
    if (isNaN(sc) || sc < 0) return toast.error('Enter a valid service charge amount.')
    setCalculating(true)
    try {
      const data = await payrollApi.calculate({
        year: calcMonth.year,
        month: calcMonth.month,
        serviceChargeTotal: sc,
      })
      toast.success(`Payroll calculated for ${MONTH_NAMES[calcMonth.month]} ${calcMonth.year}.`)
      setResult(data)
      await fetchCalculatedMonths()
      setViewMonth({ year: calcMonth.year, month: calcMonth.month })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Calculation failed.')
    } finally {
      setCalculating(false)
    }
  }

  const fmt = (n) => `฿${Number(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Payroll</h1>
        <p className="text-slate-500 text-sm mt-1">
          Calculate monthly payroll &mdash; Service Charge Version{' '}
          <span className={`font-semibold ${version === 'B' ? 'text-indigo-600' : 'text-teal-600'}`}>
            {version} ({version === 'A' ? 'Fix-rate' : 'Workday-rate'})
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Calculate panel */}
        <div className="lg:col-span-1">
          <div className="card p-5">
            <h2 className="font-semibold text-slate-700 mb-4">Calculate Payroll</h2>
            <form onSubmit={handleCalculate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Year</label>
                  <input
                    className="input"
                    type="number"
                    min="2000"
                    max="2100"
                    value={calcMonth.year}
                    onChange={e => setCalcMonth(m => ({ ...m, year: parseInt(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <label className="label">Month</label>
                  <select
                    className="input"
                    value={calcMonth.month}
                    onChange={e => setCalcMonth(m => ({ ...m, month: parseInt(e.target.value) }))}
                  >
                    {MONTH_NAMES.slice(1).map((name, i) => (
                      <option key={i + 1} value={i + 1}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Total Service Charge Revenue (฿)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={serviceCharge}
                  onChange={e => setServiceCharge(e.target.value)}
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  Total SC revenue collected this month.
                </p>
              </div>

              <button type="submit" className="btn-primary w-full justify-center" disabled={calculating}>
                {calculating ? 'Calculating…' : '⚡ Calculate Payroll'}
              </button>
            </form>

            {/* SC Version info */}
            <div className="mt-4 p-3 rounded-lg bg-slate-50 text-xs text-slate-500 leading-relaxed">
              <strong>Version {version}:</strong>{' '}
              {version === 'A'
                ? 'Each position gets its SC%, split equally among employees in that position.'
                : 'Each position gets its SC%, split proportionally by workdays of each employee.'}
            </div>

            {/* History */}
            {calculatedMonths.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-medium text-slate-600 mb-2">Calculated Months</h3>
                <div className="space-y-1">
                  {calculatedMonths.map(m => (
                    <button
                      key={`${m.year}-${m.month}`}
                      onClick={() => setViewMonth(m)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        viewMonth?.year === m.year && viewMonth?.month === m.month
                          ? 'bg-brand-600 text-white'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {MONTH_NAMES[m.month]} {m.year}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Results panel */}
        <div className="lg:col-span-2">
          {viewing && (
            <div className="card p-8 text-center text-slate-400">Loading…</div>
          )}

          {!viewing && result && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                {[
                  { label: 'Employees', value: result.employeeCount, raw: true },
                  { label: 'Gross Salary', value: fmt(result.totalBaseSalary) },
                  { label: 'Deductions', value: fmt(result.totalDeductions), neg: true },
                  { label: 'Service Charge', value: fmt(result.totalServiceCharge), pos: true },
                ].map(card => (
                  <div key={card.label} className="card p-4">
                    <div className="text-xs text-slate-500 mb-1">{card.label}</div>
                    <div className={`font-bold text-lg ${card.neg ? 'text-red-600' : card.pos ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {card.raw ? card.value : card.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Net salary highlight */}
              <div className="card p-4 mb-5 bg-brand-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-brand-100 text-sm">Total Net Payroll</div>
                    <div className="text-3xl font-bold mt-1">{fmt(result.totalNetSalary)}</div>
                  </div>
                  <div className="text-right text-brand-200 text-sm">
                    <div>{MONTH_NAMES[result.month]} {result.year}</div>
                    <div>SC Ver. {result.serviceChargeVersion}</div>
                  </div>
                </div>
              </div>

              {/* Per-employee table */}
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 text-sm font-semibold text-slate-700">
                  Employee Breakdown
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['Employee', 'Position', 'Base Salary', 'Work / Penalty / Absent', 'Deductions', 'SC Bonus', 'Net Salary'].map(h => (
                          <th key={h} className="th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.records.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="td">
                            <div className="font-medium">{r.employeeName}</div>
                            <div className="text-xs text-slate-400 font-mono">{r.employeeCode}</div>
                          </td>
                          <td className="td text-sm">{r.positionName}</td>
                          <td className="td">{fmt(r.baseSalary)}</td>
                          <td className="td">
                            <div className="flex gap-1 text-xs">
                              <span className="badge-green">{r.workDays}w</span>
                              {r.penaltyDays > 0 && <span className="badge-amber">{r.penaltyDays}p</span>}
                              {r.missingDays > 0 && <span className="badge-red">{r.missingDays}a</span>}
                              {r.workDays === 0 && r.penaltyDays === 0 && r.missingDays === 0 &&
                                <span className="text-slate-400">No records</span>}
                            </div>
                          </td>
                          <td className="td text-red-600">
                            {r.deductions > 0 ? `-${fmt(r.deductions)}` : '—'}
                          </td>
                          <td className="td text-emerald-600">
                            {r.serviceChargeBonus > 0 ? `+${fmt(r.serviceChargeBonus)}` : '—'}
                          </td>
                          <td className="td font-bold text-slate-800">{fmt(r.netSalary)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!viewing && !result && (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">💰</div>
              <p className="text-slate-500">Calculate payroll for a month to see results here.</p>
              <p className="text-slate-400 text-sm mt-1">Make sure attendance data is imported first.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
