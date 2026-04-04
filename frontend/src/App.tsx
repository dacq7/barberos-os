import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/layouts/AdminLayout'
import BarberoLayout from './components/layouts/BarberoLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminBarberos from './pages/admin/AdminBarberos'
import AdminServicios from './pages/admin/AdminServicios'
import AdminCitas from './pages/admin/AdminCitas'
import BarberoLogin from './pages/barbero/BarberoLogin'
import BarberoAgendaPage from './pages/barbero/BarberoAgenda'
import BarberoGananciasPage from './pages/barbero/BarberoGanancias'
import BarberoInventarioPage from './pages/barbero/BarberoInventario'
import HomePage from './pages/public/HomePage'
import ReservarPage from './pages/public/ReservarPage'
import CitaPage from './pages/public/CitaPage'

// ── Placeholders ──────────────────────────────────────────────────────────────
const Page = ({ name }: { name: string }) => (
  <div className="text-neutral-300">{name}</div>
)
const AdminHorarios = () => <Page name="Admin — Horarios" />
const AdminPagos = () => <Page name="Admin — Pagos" />
const AdminInventario = () => <Page name="Admin — Inventario" />
const BarberoAgenda = BarberoAgendaPage
const BarberoGanancias = BarberoGananciasPage
const BarberoInventario = BarberoInventarioPage

// ── Router ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/reservar" element={<ReservarPage />} />
        <Route path="/citas/:id" element={<CitaPage />} />
        <Route path="/citas/:id/cancelar" element={<CitaPage />} />

        {/* Admin — auth */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin — protected */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/barberos" element={<AdminBarberos />} />
            <Route path="/admin/servicios" element={<AdminServicios />} />
            <Route path="/admin/horarios" element={<AdminHorarios />} />
            <Route path="/admin/citas" element={<AdminCitas />} />
            <Route path="/admin/pagos" element={<AdminPagos />} />
            <Route path="/admin/inventario" element={<AdminInventario />} />
          </Route>
        </Route>

        {/* Barbero — auth */}
        <Route path="/barbero/login" element={<BarberoLogin />} />

        {/* Barbero — protected */}
        <Route element={<ProtectedRoute requiredRole="barbero" />}>
          <Route element={<BarberoLayout />}>
            <Route path="/barbero/agenda" element={<BarberoAgenda />} />
            <Route path="/barbero/ganancias" element={<BarberoGanancias />} />
            <Route path="/barbero/inventario" element={<BarberoInventario />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
