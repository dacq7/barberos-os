import type { LoginRequest, TokenResponse } from '../types'
import { api } from './api'

export async function loginAdmin(email: string, password: string): Promise<TokenResponse> {
  const body: LoginRequest = { email, password }
  const { data } = await api.post<TokenResponse>('/auth/admin/login', body)
  return data
}

export async function loginBarbero(email: string, password: string): Promise<TokenResponse> {
  const body: LoginRequest = { email, password }
  const { data } = await api.post<TokenResponse>('/auth/barbero/login', body)
  return data
}
