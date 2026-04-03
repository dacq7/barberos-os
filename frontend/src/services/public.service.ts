import type { Servicio, Barbero } from '../types'
import { api } from './api'

export async function getServicios(): Promise<Servicio[]> {
  const { data } = await api.get<Servicio[]>('/public/servicios')
  return data
}

export async function getBarberos(): Promise<Barbero[]> {
  const { data } = await api.get<Barbero[]>('/public/barberos')
  return data
}
