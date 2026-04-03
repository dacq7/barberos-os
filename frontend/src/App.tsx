import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

// ── Placeholders ──────────────────────────────────────────────────────────────
const Page = ({ name }: { name: string }) => (
  <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>{name}</div>
)

// Public
const Home = () => <Page name="Home — vista pública" />
const Reservar = () => <Page name="Reservar" />
const CitaEstado = () => <Page name="Cita — estado" />
const CitaCancelar = () => <Page name="Cita — cancelar" />

// Admin
const AdminLogin = () => <Page name="Admin — Login" />
const AdminDashboard = () => <Page name="Admin — Dashboard" />
const AdminBarberos = () => <Page name="Admin — Barberos" />
const AdminServicios = () => <Page name="Admin — Servicios" />
const AdminHorarios = () => <Page name="Admin — Horarios" />
const AdminCitas = () => <Page name="Admin — Citas" />
const AdminPagos = () => <Page name="Admin — Pagos" />
const AdminInventario = () => <Page name="Admin — Inventario" />

// Barbero
const BarberoLogin = () => <Page name="Barbero — Login" />
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
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/barberos" element={<AdminBarberos />} />
          <Route path="/admin/servicios" element={<AdminServicios />} />
          <Route path="/admin/horarios" element={<AdminHorarios />} />
          <Route path="/admin/citas" element={<AdminCitas />} />
          <Route path="/admin/pagos" element={<AdminPagos />} />
          <Route path="/admin/inventario" element={<AdminInventario />} />
        </Route>

        {/* Barbero — auth */}
        <Route path="/barbero/login" element={<BarberoLogin />} />

        {/* Barbero — protected */}
        <Route element={<ProtectedRoute requiredRole="barbero" />}>
          <Route path="/barbero/agenda" element={<BarberoAgenda />} />
          <Route path="/barbero/ganancias" element={<BarberoGanancias />} />
          <Route path="/barbero/inventario" element={<BarberoInventario />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
