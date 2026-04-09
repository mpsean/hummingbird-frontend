import { Link } from 'react-router-dom'

const modules = [
  {
    path: '/payroll',
    label: 'Payroll',
    description: 'Calculate monthly salary, deductions, and service charge bonuses for all employees.',
    icon: '💰',
    color: 'from-emerald-400 to-teal-500',
    stats: 'Salary · Service Charge · Deductions',
  },
  {
    path: '/personnel',
    label: 'Personnel',
    description: 'Manage employee records, positions, salary, and employment status.',
    icon: '👥',
    color: 'from-blue-400 to-indigo-500',
    stats: 'Employees · Positions · Status',
  },
  {
    path: '/time-attendance',
    label: 'Time & Attendance',
    description: 'Import monthly CSV attendance data, view records, and track late/absent days.',
    icon: '🕐',
    color: 'from-amber-400 to-orange-500',
    stats: 'Clock-In · Clock-Out · Penalties',
  },
]

export default function Home({ config }) {
  const version = config?.ServiceChargeVersion
  const company = config?.CompanyName || 'My Property'

  return (
    <div>
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800">
          Good day, <span className="text-brand-600">{company}</span> 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Hummingbird HR &mdash; Service Charge Model:{' '}
          <span className={`font-semibold ${version === 'B' ? 'text-indigo-600' : 'text-teal-600'}`}>
            Version {version} ({version === 'A' ? 'Fix-rate' : 'Workday-rate'})
          </span>
        </p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map(mod => (
          <Link key={mod.path} to={mod.path} className="group">
            <div className="card overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full">
              <div className={`h-2 bg-gradient-to-r ${mod.color}`} />
              <div className="p-6">
                <div className="text-4xl mb-4">{mod.icon}</div>
                <h2 className="text-xl font-bold text-slate-800 group-hover:text-brand-600 transition-colors">
                  {mod.label}
                </h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{mod.description}</p>
                <div className="mt-4 text-xs text-slate-400 font-medium">{mod.stats}</div>
                <div className="mt-4 inline-flex items-center gap-1 text-brand-600 text-sm font-medium group-hover:gap-2 transition-all">
                  Open module
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick-help */}
      <div className="mt-10 card p-5 bg-brand-50 border-brand-200">
        <h3 className="font-semibold text-brand-800 mb-2">Quick Start Guide</h3>
        <ol className="text-sm text-brand-700 space-y-1 list-decimal list-inside">
          <li>Go to <strong>Personnel</strong> → add positions and employee records.</li>
          <li>Go to <strong>Time &amp; Attendance</strong> → import your monthly CSV file.</li>
          <li>Go to <strong>Payroll</strong> → enter total service charge revenue and calculate.</li>
        </ol>
      </div>
    </div>
  )
}
