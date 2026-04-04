import type {
  CitaDetalle,
  Cita,
  EstadoCita,
  Inventario,
  AlertaInventario,
  AlertaCreateRequest,
  ResumenQuincena,
} from '../types'
import { api } from './api'

// ── Citas ─────────────────────────────────────────────────────────────────────

export async function getCitasBarbero(): Promise<CitaDetalle[]> {
  const { data } = await api.get<CitaDetalle[]>('/barbero/citas')
  return data
}

export async function cambiarEstadoCitaBarbero(
  id: string,
  estado: EstadoCita,
): Promise<Cita> {
  const { data } = await api.put<Cita>(`/barbero/citas/${id}/estado`, { estado })
  return data
}

// ── Ganancias ─────────────────────────────────────────────────────────────────

export async function getResumenBarbero(
  fechaInicio: string,
  fechaFin: string,
): Promise<ResumenQuincena> {
  const { data } = await api.get<ResumenQuincena>('/barbero/pagos/resumen', {
    params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
  })
  return data
}

// ── Inventario ────────────────────────────────────────────────────────────────

export async function getBarberoInventario(): Promise<Inventario[]> {
  const { data } = await api.get<Inventario[]>('/barbero/inventario')
  return data
}

export async function reportarAgotamiento(
  payload: AlertaCreateRequest,
): Promise<AlertaInventario> {
  const { data } = await api.post<AlertaInventario>(
    '/barbero/inventario/alertas',
    payload,
  )
  return data
}
