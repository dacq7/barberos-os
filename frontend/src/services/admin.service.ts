import type {
  Barbero,
  BarberoCreateRequest,
  Servicio,
  ServicioCreateRequest,
  ServicioUpdateRequest,
  CitaDetalle,
  Cita,
  EstadoCita,
  Pago,
  PagoCreateRequest,
  ResumenAdmin,
  Horario,
  HorarioCreate,
  Inventario,
  InventarioCreate,
  InventarioUpdate,
  AlertaInventario,
} from '../types'
import { api } from './api'

// ── Barberos ──────────────────────────────────────────────────────────────────

export async function getAdminBarberos(): Promise<Barbero[]> {
  const { data } = await api.get<Barbero[]>('/admin/barberos')
  return data
}

export async function createBarbero(payload: BarberoCreateRequest): Promise<Barbero> {
  const { data } = await api.post<Barbero>('/admin/barberos', payload)
  return data
}

// ── Servicios ─────────────────────────────────────────────────────────────────

export async function getAdminServicios(): Promise<Servicio[]> {
  const { data } = await api.get<Servicio[]>('/admin/servicios')
  return data
}

export async function createServicio(payload: ServicioCreateRequest): Promise<Servicio> {
  const { data } = await api.post<Servicio>('/admin/servicios', payload)
  return data
}

export async function updateServicio(
  id: string,
  payload: ServicioUpdateRequest,
): Promise<Servicio> {
  const { data } = await api.put<Servicio>(`/admin/servicios/${id}`, payload)
  return data
}

// ── Citas ─────────────────────────────────────────────────────────────────────

export async function getAdminCitas(): Promise<CitaDetalle[]> {
  const { data } = await api.get<CitaDetalle[]>('/admin/citas')
  return data
}

export async function cambiarEstadoCita(id: string, estado: EstadoCita): Promise<Cita> {
  const { data } = await api.put<Cita>(`/admin/citas/${id}/estado`, { estado })
  return data
}

// ── Pagos ─────────────────────────────────────────────────────────────────────

export async function registrarPago(payload: PagoCreateRequest): Promise<Pago> {
  const { data } = await api.post<Pago>('/admin/pagos', payload)
  return data
}

export async function getResumenAdmin(
  fechaInicio: string,
  fechaFin: string,
): Promise<ResumenAdmin> {
  const { data } = await api.get<ResumenAdmin>('/admin/pagos/resumen', {
    params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
  })
  return data
}

// ── Horarios ──────────────────────────────────────────────────────────────────

export async function getHorarios(): Promise<Horario[]> {
  const { data } = await api.get<Horario[]>('/horarios')
  return data
}

export async function setHorario(payload: HorarioCreate): Promise<Horario> {
  const { data } = await api.post<Horario>('/admin/horarios', payload)
  return data
}

// ── Inventario (admin) ────────────────────────────────────────────────────────

export async function getAdminInventario(): Promise<Inventario[]> {
  const { data } = await api.get<Inventario[]>('/admin/inventario')
  return data
}

export async function crearProducto(payload: InventarioCreate): Promise<Inventario> {
  const { data } = await api.post<Inventario>('/admin/inventario', payload)
  return data
}

export async function actualizarProducto(
  id: string,
  payload: InventarioUpdate,
): Promise<Inventario> {
  const { data } = await api.put<Inventario>(`/admin/inventario/${id}`, payload)
  return data
}

export async function getAlertasInventario(): Promise<AlertaInventario[]> {
  const { data } = await api.get<AlertaInventario[]>('/admin/inventario/alertas')
  return data
}
