import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { personnelApi } from '../../api/client'
import { configApi } from '../../api/client'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'

const SHIFTS = ['Morning', 'Afternoon', 'Evening']

const EMPTY_FORM = {
  name: '', defaultSalary: '', shiftType: 'Morning',
  clockInTime: '08:00', clockOutTime: '17:00', totalHours: '9',
  serviceChargePercentage: '0',
}

export default function Positions() {
  const [positions, setPositions] = useState([])
  const [version, setVersion] = useState('A')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pos, cfg] = await Promise.all([
        personnelApi.getPositions(),
        configApi.getAll(),
      ])
      setPositions(pos)
      setVersion(cfg.ServiceChargeVersion || 'A')
    } catch {
      toast.error('Failed to load positions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (pos) => {
    setEditTarget(pos)
    setForm({
      name: pos.name,
      defaultSalary: String(pos.defaultSalary),
      shiftType: pos.shiftType,
      clockInTime: pos.clockInTime,
      clockOutTime: pos.clockOutTime,
      totalHours: String(pos.totalHours),
      serviceChargePercentage: String(pos.serviceChargePercentage),
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        defaultSalary: parseFloat(form.defaultSalary),
        totalHours: parseFloat(form.totalHours),
        serviceChargePercentage: parseFloat(form.serviceChargePercentage),
      }
      if (editTarget) {
        await personnelApi.updatePosition(editTarget.id, payload)
        toast.success('Position updated.')
      } else {
        await personnelApi.createPosition(payload)
        toast.success('Position created.')
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
      await personnelApi.deletePosition(deleteTarget.id)
      toast.success(`Position "${deleteTarget.name}" removed.`)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.')
    }
  }

  const f = form
  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  // Recalculate total hours when times change
  const recalcHours = (key, val) => {
    const times = { clockInTime: f.clockInTime, clockOutTime: f.clockOutTime, [key]: val }
    try {
      const [ih, im] = times.clockInTime.split(':').map(Number)
      const [oh, om] = times.clockOutTime.split(':').map(Number)
      const diff = (oh * 60 + om) - (ih * 60 + im)
      if (diff > 0) setForm(prev => ({ ...prev, [key]: val, totalHours: String(diff / 60) }))
      else setForm(prev => ({ ...prev, [key]: val }))
    } catch {
      setForm(prev => ({ ...prev, [key]: val }))
    }
  }

  const totalPct = positions.reduce((s, p) => s + Number(p.serviceChargePercentage), 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-slate-500">
          Total SC allocation:{' '}
          <span className={`font-semibold ${totalPct > 100 ? 'text-red-600' : 'text-brand-600'}`}>
            {totalPct}%
          </span>
          {totalPct > 100 && <span className="text-red-500 ml-2">(exceeds 100%!)</span>}
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Add Position</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Position', 'Default Salary', 'Shift', 'Clock-In', 'Clock-Out', 'Hours',
                    ...(version === 'A' ? ['SC %'] : []), 'Employees', ''].map(h => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {positions.map(pos => (
                  <tr key={pos.id} className="hover:bg-slate-50 transition-colors">
                    <td className="td font-medium">{pos.name}</td>
                    <td className="td">฿{Number(pos.defaultSalary).toLocaleString()}</td>
                    <td className="td">
                      <span className="badge-slate">{pos.shiftType}</span>
                    </td>
                    <td className="td font-mono text-xs">{pos.clockInTime}</td>
                    <td className="td font-mono text-xs">{pos.clockOutTime}</td>
                    <td className="td">{pos.totalHours}h</td>
                    {version === 'A' && (
                      <td className="td">
                        <span className="badge-green">{pos.serviceChargePercentage}%</span>
                      </td>
                    )}
                    <td className="td">{pos.employeeCount} active</td>
                    <td className="td">
                      <div className="flex gap-2">
                        <button className="text-brand-600 hover:text-brand-800 text-sm font-medium"
                          onClick={() => openEdit(pos)}>Edit</button>
                        <button className="text-red-500 hover:text-red-700 text-sm font-medium"
                          onClick={() => { setDeleteTarget(pos); setConfirmOpen(true) }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Position' : 'Add Position'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Position Name</label>
            <input className="input" value={f.name} onChange={set('name')} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Default Salary (฿)</label>
              <input className="input" type="number" min="0" step="0.01"
                value={f.defaultSalary} onChange={set('defaultSalary')} required />
            </div>
            <div>
              <label className="label">Shift Type</label>
              <select className="input" value={f.shiftType} onChange={set('shiftType')}>
                {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Clock-In</label>
              <input className="input" type="time" value={f.clockInTime}
                onChange={e => recalcHours('clockInTime', e.target.value)} required />
            </div>
            <div>
              <label className="label">Clock-Out</label>
              <input className="input" type="time" value={f.clockOutTime}
                onChange={e => recalcHours('clockOutTime', e.target.value)} required />
            </div>
            <div>
              <label className="label">Total Hours</label>
              <input className="input" type="number" min="0" step="0.5"
                value={f.totalHours} onChange={set('totalHours')} required />
            </div>
          </div>
          {version === 'A' && (
            <div>
              <label className="label">Service Charge % (Version A only)</label>
              <input className="input" type="number" min="0" max="100" step="0.01"
                value={f.serviceChargePercentage} onChange={set('serviceChargePercentage')} required />
              <p className="text-xs text-slate-400 mt-1">
                Percentage of total monthly service charge revenue allocated to this position.
              </p>
            </div>
          )}
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
        title="Delete Position"
        message={`Delete position "${deleteTarget?.name}"? This will fail if employees are assigned.`}
        danger
      />
    </div>
  )
}
