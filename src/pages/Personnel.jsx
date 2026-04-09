import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Employees from './personnel/Employees'
import Positions from './personnel/Positions'

export default function Personnel() {
  const { pathname } = useLocation()

  const tabs = [
    { path: '/personnel', label: '👥 Employees', exact: true },
    { path: '/personnel/positions', label: '🏷️ Positions' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Personnel</h1>
        <p className="text-slate-500 text-sm mt-1">Manage employees and positions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {tabs.map(tab => {
          const active = tab.exact ? pathname === tab.path : pathname.startsWith(tab.path)
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-px
                ${active
                  ? 'border-brand-600 text-brand-600 bg-brand-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <Routes>
        <Route index element={<Employees />} />
        <Route path="positions" element={<Positions />} />
      </Routes>
    </div>
  )
}
