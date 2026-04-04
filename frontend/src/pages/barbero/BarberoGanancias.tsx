import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCitasBarbero, getResumenBarbero } from '../../services/barbero.service'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCOP(value: string | number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(value))
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function mesNombre(year: number, month: number): string {
  return new Date(year, month).toLocaleString('es-CO', { month: 'long' })
}

function lastDayOf(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// ── Quincena calculator ───────────────────────────────────────────────────────

interface Periodo {
  label: string
  inicio: string
  fin: string
}

function getQuincenas(): { current: Periodo; prev: Periodo } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()
  const isFirstHalf = day <= 15

  if (isFirstHalf) {
    const y = String(year)
    const m = pad(month + 1)
    const current: Periodo = {
      label: `1–15 ${mesNombre(year, month)}`,
      inicio: `${y}-${m}-01`,
      fin: `${y}-${m}-15`,
    }
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const prevLast = lastDayOf(prevYear, prevMonth)
    const prev: Periodo = {
      label: `16–${prevLast} ${mesNombre(prevYear, prevMonth)}`,
      inicio: `${prevYear}-${pad(prevMonth + 1)}-16`,
      fin: `${prevYear}-${pad(prevMonth + 1)}-${prevLast}`,
    }
    return { current, prev }
  } else {
    const y = String(year)
    const m = pad(month + 1)
    const last = lastDayOf(year, month)
    const current: Periodo = {
      label: `16–${last} ${mesNombre(year, month)}`,
      inicio: `${y}-${m}-16`,
      fin: `${y}-${m}-${last}`,
    }
    const prev: Periodo = {
      label: `1–15 ${mesNombre(year, month)}`,
      inicio: `${y}-${m}-01`,
      fin: `${y}-${m}-15`,
    }
    return { current, prev }
  }
}

const QUINCENAS = getQuincenas()

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
      <p className="text-neutral-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-[#c9a84c] mt-1 tabular-nums">{value}</p>
      {sub && <p className="text-neutral-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type PeriodoKey = 'current' | 'prev' | 'custom'

export default function BarberoGanancias() {
  const [periodoKey, setPeriodoKey] = useState<PeriodoKey>('current')
  const [customInicio, setCustomInicio] = useState('')
  const [customFin, setCustomFin] = useState('')

  const periodo =
    periodoKey === 'current'
      ? QUINCENAS.current
      : periodoKey === 'prev'
      ? QUINCENAS.prev
      : null

  const inicio = periodo?.inicio ?? customInicio
  const fin = periodo?.fin ?? customFin
  const canFetch = !!inicio && !!fin && inicio <= fin

  const { data: resumen, isLoading: loadingResumen } = useQuery({
    queryKey: ['barbero-resumen', inicio, fin],
    queryFn: () => getResumenBarbero(inicio, fin),
    enabled: canFetch,
  })

  const { data: todasCitas } = useQuery({
    queryKey: ['barbero-citas'],
    queryFn: getCitasBarbero,
  })

  // Citas completadas en el período → lista de ingresos
  const citasPeriodo = (todasCitas ?? []).filter((c) => {
    if (c.estado !== 'completada') return false
    if (!canFetch) return false
    const fechaCita = new Date(c.fecha_hora).toLocaleDateString('en-CA')
    return fechaCita >= inicio && fechaCita <= fin
  }).sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora))

  const COMISION_BARBERO = 0.4

  const promedio =
    resumen && resumen.total_servicios > 0
      ? Number(resumen.total_ganado) / resumen.total_servicios
      : null

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Ganancias</h1>

      {/* Selector de período */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: 'current' as PeriodoKey, label: `Esta quincena (${QUINCENAS.current.label})` },
            { key: 'prev' as PeriodoKey, label: `Quincena anterior (${QUINCENAS.prev.label})` },
            { key: 'custom' as PeriodoKey, label: 'Personalizado' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriodoKey(key)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              periodoKey === key
                ? 'bg-[#c9a84c] text-black'
                : 'bg-neutral-900 border border-neutral-700 text-neutral-300 hover:border-neutral-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Rango personalizado */}
      {periodoKey === 'custom' && (
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Desde</label>
            <input
              type="date"
              value={customInicio}
              onChange={(e) => setCustomInicio(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c] [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Hasta</label>
            <input
              type="date"
              value={customFin}
              min={customInicio}
              onChange={(e) => setCustomFin(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c] [color-scheme:dark]"
            />
          </div>
        </div>
      )}

      {/* Métricas */}
      {canFetch && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Total ganado"
              value={
                loadingResumen
                  ? '…'
                  : resumen
                  ? formatCOP(resumen.total_ganado)
                  : '—'
              }
              sub="Comisión 40%"
            />
            <MetricCard
              label="Servicios"
              value={
                loadingResumen ? '…' : resumen ? String(resumen.total_servicios) : '—'
              }
            />
            <MetricCard
              label="Promedio"
              value={
                loadingResumen
                  ? '…'
                  : promedio !== null
                  ? formatCOP(promedio)
                  : '—'
              }
              sub="por servicio"
            />
          </div>

          {/* Lista de ingresos por cita */}
          <section>
            <h2 className="text-base font-semibold text-white mb-3">
              Detalle por servicio
            </h2>

            {citasPeriodo.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl py-10 text-center">
                <p className="text-neutral-500 text-sm">
                  No hay servicios completados en este período
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-900 border-b border-neutral-800">
                      <th className="text-left text-neutral-400 font-medium px-4 py-3">
                        Fecha
                      </th>
                      <th className="text-left text-neutral-400 font-medium px-4 py-3">
                        Servicio
                      </th>
                      <th className="text-right text-neutral-400 font-medium px-4 py-3">
                        Precio total
                      </th>
                      <th className="text-right text-neutral-400 font-medium px-4 py-3">
                        Tu ganancia
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {citasPeriodo.map((c) => {
                      const fecha = new Date(c.fecha_hora).toLocaleDateString('es-CO', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      const ganancia = Number(c.servicio.precio) * COMISION_BARBERO
                      return (
                        <tr
                          key={c.id}
                          className="bg-neutral-900 hover:bg-neutral-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                            {fecha}
                          </td>
                          <td className="px-4 py-3 text-white">{c.servicio.nombre}</td>
                          <td className="px-4 py-3 text-right text-neutral-400">
                            {formatCOP(c.servicio.precio)}
                          </td>
                          <td className="px-4 py-3 text-right text-[#c9a84c] font-semibold">
                            {formatCOP(ganancia)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {!canFetch && periodoKey === 'custom' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl py-10 text-center">
          <p className="text-neutral-500 text-sm">Selecciona un rango de fechas</p>
        </div>
      )}
    </div>
  )
}
