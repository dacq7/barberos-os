import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/barberos', label: 'Barberos' },
  { to: '/admin/servicios', label: 'Servicios' },
  { to: '/admin/horarios', label: 'Horarios' },
  { to: '/admin/citas', label: 'Citas' },
  { to: '/admin/pagos', label: 'Pagos' },
  { to: '/admin/inventario', label: 'Inventario' },
] as const

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-neutral-950">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-neutral-800">
          <span className="text-2xl font-bold tracking-tight text-[#c9a84c]">
            Barber<span className="text-white">OS</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition',
                  isActive
                    ? 'bg-[#c9a84c]/10 text-[#c9a84c]'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0">
          <span className="text-sm text-neutral-400">Admin</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-300 truncate max-w-48">
              {user?.email ?? ''}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-neutral-400 hover:text-red-400 transition"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 text-white overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
