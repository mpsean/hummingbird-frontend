import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { personnelApi } from '../../api/client'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'

const EMPTY_FORM = {
  employeeCode: '', name: '', surname: '',
  positionId: '', salary: '', dateJoined: '', status: 'Active',
}

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('Active')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fileRef = useRef()
  const [importing, setImporting] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [emps, pos] = await Promise.all([
        personnelApi.getEmployees(statusFilter === 'All' ? undefined : statusFilter),
        personnelApi.getPositions(),
      ])
      setEmployees(emps)
      setPositions(pos)
    } catch {
      toast.error('Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [statusFilter])

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const res = await personnelApi.importEmployeesCsv(file)
      const parts = [`Imported ${res.imported}`]
      if (res.skipped) parts.push(`${res.skipped} skipped`)
      if (res.errors) parts.push(`${res.errors} errors`)
      toast[res.errors > 0 && res.imported === 0 ? 'error' : 'success'](parts.join(', ') + '.')
      res.errorMessages?.slice(0, 3).forEach(m => toast.error(m, { duration: 6000 }))
      if (res.imported > 0) fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed.')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (emp) => {
    setEditTarget(emp)
    setForm({
      employeeCode: emp.employeeCode,
      name: emp.name,
      surname: emp.surname,
      positionId: String(emp.positionId),
      salary: String(emp.salary),
      dateJoined: emp.dateJoined?.split('T')[0] ?? '',
      status: emp.status,
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        positionId: parseInt(form.positionId),
        salary: parseFloat(form.salary),
      }
      if (editTarget) {
        await personnelApi.updateEmployee(editTarget.id, payload)
        toast.success('Employee updated.')
      } else {
        await personnelApi.createEmployee(payload)
        toast.success('Employee created.')
      }
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await personnelApi.deleteEmployee(deleteTarget.id)
      toast.success(`${deleteTarget.name} ${deleteTarget.surname} removed.`)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.')
    }
  }

  const f = form
  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex gap-1">
          {['Active', 'Terminated', 'All'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <button
            className="btn-secondary"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            {importing ? 'Importing…' : '📂 Import CSV'}
          </button>
          <button className="btn-primary" onClick={openCreate}>+ Add Employee</button>
        </div>
      </div>

      {/* CSV format hint */}
      <div className="card p-3 mb-4 bg-slate-50 border-slate-200 text-xs text-slate-500">
        <strong>CSV columns:</strong>{' '}
        Employee_ID, Name, Surname, Position, Salary, Date_Joined, Status (optional — defaults to Active)
        <br />
        <span className="text-slate-400">Position must match exactly: Food and Beverage, Cleaner, Receptionist, Manager</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No employees found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['ID', 'Name', 'Position', 'Salary', 'Date Joined', 'Status', ''].map(h => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="td font-mono text-xs">{emp.employeeCode}</td>
                    <td className="td font-medium">{emp.name} {emp.surname}</td>
                    <td className="td">{emp.positionName}</td>
                    <td className="td">฿{Number(emp.salary).toLocaleString()}</td>
                    <td className="td">{emp.dateJoined?.split('T')[0]}</td>
                    <td className="td">
                      <span className={emp.status === 'Active' ? 'badge-green' : 'badge-red'}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex gap-2">
                        <button
                          className="text-brand-600 hover:text-brand-800 text-sm font-medium"
                          onClick={() => openEdit(emp)}
                        >Edit</button>
                        <button
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                          onClick={() => { setDeleteTarget(emp); setConfirmOpen(true) }}
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Employee Code</label>
              <input className="input" value={f.employeeCode} onChange={set('employeeCode')} required placeholder="EMP001" />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={f.status} onChange={set('status')}>
                <option value="Active">Active</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input className="input" value={f.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" value={f.surname} onChange={set('surname')} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Position</label>
              <select className="input" value={f.positionId} onChange={set('positionId')} required>
                <option value="">Select position</option>
                {positions.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Monthly Salary (฿)</label>
              <input className="input" type="number" min="0" step="0.01"
                value={f.salary} onChange={set('salary')} required />
            </div>
          </div>
          <div>
            <label className="label">Date Joined</label>
            <input className="input" type="date" value={f.dateJoined} onChange={set('dateJoined')} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : (editTarget ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Remove ${deleteTarget?.name} ${deleteTarget?.surname}? This cannot be undone.`}
        danger
      />
    </div>
  )
}
