import { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { taApi } from '../api/client'

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function TimeAttendance() {
  const [availableMonths, setAvailableMonths] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState([])
  const [view, setView] = useState('summary') // 'summary' | 'detail'
  const [importing, setImporting] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const fetchMonths = async () => {
    try {
      const months = await taApi.getMonths()
      setAvailableMonths(months)
      if (months.length > 0 && !selectedMonth) {
        setSelectedMonth(months[0])
      }
    } catch {
      toast.error('Failed to load months.')
    }
  }

  const fetchMonthData = async (m) => {
    if (!m) return
    setLoading(true)
    try {
      const [recs, sum] = await Promise.all([
        taApi.getByMonth(m.year, m.month),
        taApi.getSummary(m.year, m.month),
      ])
      setRecords(recs)
      setSummary(sum)
    } catch {
      toast.error('Failed to load attendance data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMonths() }, [])
  useEffect(() => { fetchMonthData(selectedMonth) }, [selectedMonth])

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const result = await taApi.importCsv(file)
      toast.success(
        `Imported ${result.imported} records${result.skipped ? `, ${result.skipped} skipped` : ''}${result.errors ? `, ${result.errors} errors` : ''}.`
      )
      if (result.errors > 0) {
        result.errorMessages.slice(0, 3).forEach(m => toast.error(m, { duration: 6000 }))
      }
      await fetchMonths()
      const newMonth = { year: result.year, month: result.month }
      setSelectedMonth(newMonth)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed.')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!selectedMonth) return
    if (!window.confirm(`Delete all attendance records for ${MONTH_NAMES[selectedMonth.month]} ${selectedMonth.year}?`)) return
    try {
      await taApi.deleteMonth(selectedMonth.year, selectedMonth.month)
      toast.success('Month deleted.')
      setSelectedMonth(null)
      setRecords([])
      setSummary([])
      fetchMonths()
    } catch {
      toast.error('Delete failed.')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Time &amp; Attendance</h1>
        <p className="text-slate-500 text-sm mt-1">Import and review monthly attendance records</p>
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Month selector */}
        {availableMonths.length > 0 && (
          <select
            className="input w-auto"
            value={selectedMonth ? `${selectedMonth.year}-${selectedMonth.month}` : ''}
            onChange={e => {
              const [y, m] = e.target.value.split('-').map(Number)
              setSelectedMonth({ year: y, month: m })
            }}
          >
            {availableMonths.map(m => (
              <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                {MONTH_NAMES[m.month]} {m.year}
              </option>
            ))}
          </select>
        )}

        {/* Import */}
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
        <button
          className="btn-primary"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
        >
          {importing ? 'Importing…' : '📂 Import CSV'}
        </button>

        {selectedMonth && (
          <>
            {/* View toggle */}
            <div className="flex gap-1 ml-auto">
              {['summary', 'detail'].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    view === v
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button className="btn-danger" onClick={handleDelete}>Delete Month</button>
          </>
        )}
      </div>

      {/* CSV format hint */}
      <div className="card p-4 mb-6 bg-slate-50 border-slate-200 text-xs text-slate-500">
        <strong>Expected CSV columns:</strong>{' '}
        Date, Employee_ID, Name, Department, Shift_Type, Clock_In, Clock_Out, Total_Hours
        <br />
        Leave Clock_In/Clock_Out empty to mark as absent (missing day).
        Late by &gt;30 min from position clock-in = penalty day (−10% daily wage).
      </div>

      {/* Empty state */}
      {availableMonths.length === 0 && !loading && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-500">No attendance data yet. Import a CSV to get started.</p>
        </div>
      )}

      {/* Content */}
      {selectedMonth && !loading && (
        <>
          {/* Month header */}
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-700">
              {MONTH_NAMES[selectedMonth.month]} {selectedMonth.year}
            </h2>
            {summary.length > 0 && (
              <span className="badge-slate">{summary.length} employees</span>
            )}
          </div>

          {view === 'summary' ? (
            <SummaryView summary={summary} />
          ) : (
            <DetailView records={records} />
          )}
        </>
      )}

      {loading && (
        <div className="card p-8 text-center text-slate-400">Loading…</div>
      )}
    </div>
  )
}

function SummaryView({ summary }) {
  if (summary.length === 0) return <div className="card p-8 text-center text-slate-400">No data.</div>

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Employee ID', 'Name', 'Total Days', 'Work Days', 'Penalty Days', 'Missing Days', 'Total Hours'].map(h => (
                <th key={h} className="th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {summary.map(row => (
              <tr key={row.employeeCode} className="hover:bg-slate-50 transition-colors">
                <td className="td font-mono text-xs">{row.employeeCode}</td>
                <td className="td font-medium">{row.employeeName}</td>
                <td className="td">{row.totalDays}</td>
                <td className="td">
                  <span className="badge-green">{row.workDays}</span>
                </td>
                <td className="td">
                  {row.penaltyDays > 0
                    ? <span className="badge-amber">{row.penaltyDays}</span>
                    : <span className="text-slate-400">0</span>}
                </td>
                <td className="td">
                  {row.missingDays > 0
                    ? <span className="badge-red">{row.missingDays}</span>
                    : <span className="text-slate-400">0</span>}
                </td>
                <td className="td">{Number(row.totalHours).toFixed(1)}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DetailView({ records }) {
  if (records.length === 0) return <div className="card p-8 text-center text-slate-400">No data.</div>

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Date', 'Employee ID', 'Name', 'Department', 'Shift', 'Clock-In', 'Clock-Out', 'Hours', 'Status'].map(h => (
                <th key={h} className="th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map(r => (
              <tr key={r.id}
                className={`transition-colors ${r.isMissing ? 'bg-red-50' : r.isPenalty ? 'bg-amber-50' : 'hover:bg-slate-50'}`}
              >
                <td className="td font-mono text-xs">{r.date?.split('T')[0]}</td>
                <td className="td font-mono text-xs">{r.employeeCode}</td>
                <td className="td">{r.employeeName}</td>
                <td className="td">{r.department}</td>
                <td className="td">{r.shiftType}</td>
                <td className="td font-mono text-xs">{r.clockIn ?? '—'}</td>
                <td className="td font-mono text-xs">{r.clockOut ?? '—'}</td>
                <td className="td">{r.isMissing ? '—' : `${Number(r.totalHours).toFixed(1)}h`}</td>
                <td className="td">
                  {r.isMissing
                    ? <span className="badge-red">Absent</span>
                    : r.isPenalty
                      ? <span className="badge-amber">Late</span>
                      : <span className="badge-green">OK</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
