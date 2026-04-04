export type UserRole = 'admin' | 'barbero'

export type EstadoCita =
  | 'pendiente'
  | 'confirmada'
  | 'completada'
  | 'cancelada'
  | 'no_show'

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Admin {
  id: string
  nombre: string
  email: string
  activo: boolean
}

export interface Barbero {
  id: string
  nombre: string
  email: string
  telefono: string | null
  foto_url: string | null
  activo: boolean
}

export interface Servicio {
  id: string
  nombre: string
  descripcion: string | null
  precio: string
  activo: boolean
}

export interface ClienteSimple {
  nombre: string
  email: string | null
  telefono: string | null
}

export interface Cita {
  id: string
  cliente_id: string
  barbero_id: string
  servicio_id: string
  fecha_hora: string
  estado: EstadoCita
  notas: string | null
  created_at: string
}

export interface CitaDetalle extends Cita {
  barbero: Barbero
  servicio: Servicio
  cliente: ClienteSimple
}

export interface Pago {
  id: string
  cita_id: string
  monto_total: string
  monto_barbero: string
  monto_barberia: string
  created_at: string
}

export interface ResumenQuincena {
  barbero_id: string
  barbero_nombre: string
  periodo_inicio: string
  periodo_fin: string
  total_servicios: number
  total_ganado: string
}

export interface ResumenAdmin {
  periodo_inicio: string
  periodo_fin: string
  total_ingresos: string
  total_comisiones_barberos: string
  total_barberia: string
  citas_completadas: number
  desglose_por_barbero: ResumenQuincena[]
}

export interface Inventario {
  id: string
  nombre: string
  cantidad: number
  unidad: string | null
  umbral_minimo: number | null
  created_at: string
}

export interface AlertaInventario {
  id: string
  inventario_id: string
  barbero_id: string | null
  mensaje: string | null
  created_at: string
  producto_nombre: string
}

export interface SlotDisponible {
  hora: string      // "HH:MM:SS"
  disponible: boolean
}

export interface DisponibilidadResponse {
  fecha: string
  barbero_id: string
  slots: SlotDisponible[]
}

export interface CitaCreateRequest {
  cliente_nombre: string
  cliente_email: string
  cliente_telefono?: string
  barbero_id: string
  servicio_id: string
  fecha_hora: string    // ISO datetime "YYYY-MM-DDTHH:MM:SS"
  notas?: string
}

export interface BarberoCreateRequest {
  nombre: string
  email: string
  password: string
  telefono?: string
}

export interface ServicioCreateRequest {
  nombre: string
  descripcion?: string
  precio: number
}

export interface ServicioUpdateRequest {
  nombre?: string
  descripcion?: string
  precio?: number
  activo?: boolean
}

export interface PagoCreateRequest {
  cita_id: string
  monto_total: number
}
