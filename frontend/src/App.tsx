import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/layouts/AdminLayout'
import BarberoLayout from './components/layouts/BarberoLayout'
import AdminLogin from './pages/admin/AdminLogin'
import BarberoLogin from './pages/barbero/BarberoLogin'

// ── Placeholders ──────────────────────────────────────────────────────────────
const Page = ({ name }: { name: string }) => (
  <div className="text-neutral-300">{name}</div>
)

const Home = () => <Page name="Home — vista pública" />
const Reservar = () => <Page name="Reservar" />
const CitaEstado = () => <Page name="Cita — estado" />
const CitaCancelar = () => <Page name="Cita — cancelar" />
const AdminDashboard = () => <Page name="Admin — Dashboard" />
const AdminBarberos = () => <Page name="Admin — Barberos" />
const AdminServicios = () => <Page name="Admin — Servicios" />
const AdminHorarios = () => <Page name="Admin — Horarios" />
const AdminCitas = () => <Page name="Admin — Citas" />
const AdminPagos = () => <Page name="Admin — Pagos" />
const AdminInventario = () => <Page name="Admin — Inventario" />
const BarberoAgenda = () => <Page name="Barbero — Agenda" />
const BarberoGanancias = () => <Page name="Barbero — Ganancias" />
const BarberoInventario = () => <Page name="Barbero — Inventario" />

// ── Router ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/reservar" element={<Reservar />} />
        <Route path="/citas/:id" element={<CitaEstado />} />
        <Route path="/citas/:id/cancelar" element={<CitaCancelar />} />

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
