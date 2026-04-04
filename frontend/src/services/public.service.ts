import type { Servicio, Barbero, DisponibilidadResponse, CitaCreateRequest, CitaDetalle, Cita } from '../types'
import { api } from './api'

export async function getServicios(): Promise<Servicio[]> {
  const { data } = await api.get<Servicio[]>('/public/servicios')
  return data
}

export async function getBarberos(): Promise<Barbero[]> {
  const { data } = await api.get<Barbero[]>('/public/barberos')
  return data
}

export async function getDisponibilidad(
  barberoId: string,
  fecha: string,
): Promise<DisponibilidadResponse> {
  const { data } = await api.get<DisponibilidadResponse>(
    `/disponibilidad/${barberoId}/${fecha}`,
  )
  return data
}

export async function createCita(data: CitaCreateRequest): Promise<CitaDetalle> {
  const { data: res } = await api.post<CitaDetalle>('/citas', data)
  return res
}

export async function getCita(id: string): Promise<CitaDetalle> {
  const { data } = await api.get<CitaDetalle>(`/citas/${id}`)
  return data
}

export async function cancelarCita(id: string): Promise<Cita> {
  const { data } = await api.post<Cita>(`/citas/${id}/cancelar`)
  return data
}
