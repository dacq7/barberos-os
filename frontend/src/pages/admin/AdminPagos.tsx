import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getResumenAdmin } from '../../services/admin.service'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCOP(value: string | number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(value))
}

interface Quincena {
  label: string
  fechaInicio: string
  fechaFin: string
}

/** Retorna [quincenaActual, quincenaAnterior] */
function calcularQuincenas(): [Quincena, Quincena] {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const d = now.getDate()
  const mes = String(m).padStart(2, '0')
  const lastDay = new Date(y, m, 0).getDate()

  let actual: Quincena
  let anterior: Quincena

  if (d <= 15) {
    // Estamos en la 1ª quincena del mes actual
    actual = {
      label: `1ª quincena ${mes}/${y}`,
      fechaInicio: `${y}-${mes}-01`,
      fechaFin: `${y}-${mes}-15`,
    }
    // La anterior es la 2ª del mes pasado
    const prevDate = new Date(y, m - 2, 1)
    const py = prevDate.getFullYear()
    const pm = String(prevDate.getMonth() + 1).padStart(2, '0')
    const pLastDay = new Date(py, prevDate.getMonth() + 1, 0).getDate()
    anterior = {
      label: `2ª quincena ${pm}/${py}`,
      fechaInicio: `${py}-${pm}-16`,
      fechaFin: `${py}-${pm}-${String(pLastDay).padStart(2, '0')}`,
    }
  } else {
    // Estamos en la 2ª quincena del mes actual
    actual = {
      label: `2ª quincena ${mes}/${y}`,
      fechaInicio: `${y}-${mes}-16`,
      fechaFin: `${y}-${mes}-${String(lastDay).padStart(2, '0')}`,
    }
    // La anterior es la 1ª del mes actual
    anterior = {
      label: `1ª quincena ${mes}/${y}`,
      fechaInicio: `${y}-${mes}-01`,
      fechaFin: `${y}-${mes}-15`,
    }
  }

  return [actual, anterior]
}

type PeriodoKey = 'actual' | 'anterior' | 'personalizado'

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, accent = false }: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
      <p className="text-neutral-400 text-sm">{label}</p>
      <p className={`text-3xl font-bold mt-1 tabular-nums ${accent ? 'text-[#c9a84c]' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-neutral-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPagos() {
  const [quincenaActual, quincenaAnterior] = calcularQuincenas()

  const [periodo, setPeriodo] = useState<PeriodoKey>('actual')
  const [customInicio, setCustomInicio] = useState('')
  const [customFin, setCustomFin]       = useState('')

  function resolverRango(): { fechaInicio: string; fechaFin: string } | null {
    if (periodo === 'actual')   return { fechaInicio: quincenaActual.fechaInicio,   fechaFin: quincenaActual.fechaFin }
    if (periodo === 'anterior') return { fechaInicio: quincenaAnterior.fechaInicio, fechaFin: quincenaAnterior.fechaFin }
    if (customInicio && customFin) return { fechaInicio: customInicio, fechaFin: customFin }
    return null
  }

  const rango = resolverRango()

  const { data: resumen, isLoading, isError } = useQuery({
    queryKey: ['admin-resumen', rango?.fechaInicio, rango?.fechaFin],
    queryFn: () => getResumenAdmin(rango!.fechaInicio, rango!.fechaFin),
    enabled: rango !== null,
  })

  const labelPeriodo =
    periodo === 'actual'   ? quincenaActual.label   :
    periodo === 'anterior' ? quincenaAnterior.label :
    rango ? `${rango.fechaInicio} → ${rango.fechaFin}` : 'Personalizado'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Pagos y comisiones</h1>

      {/* Selector de período */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4">
        <p className="text-sm text-neutral-400 font-medium">Período</p>

        <div className="flex flex-wrap gap-2">
          {([
            ['actual',       quincenaActual.label],
            ['anterior',     quincenaAnterior.label],
            ['personalizado','Personalizado'],
          ] as [PeriodoKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriodo(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                periodo === key
                  ? 'bg-[#c9a84c] border-[#c9a84c] text-black'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {periodo === 'personalizado' && (
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Desde</label>
              <input
                type="date"
                value={customInicio}
                onChange={(e) => setCustomInicio(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c] [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Hasta</label>
              <input
                type="date"
                value={customFin}
                onChange={(e) => setCustomFin(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c] [color-scheme:dark]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Cards de resumen */}
      {rango === null && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl py-14 text-center">
          <p className="text-neutral-500">Selecciona un rango de fechas para ver el resumen</p>
        </div>
      )}

      {rango && isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-neutral-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {rango && isError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          No se pudo cargar el resumen. Verifica el rango de fechas.
        </div>
      )}

      {resumen && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Ingresos totales"
              value={formatCOP(resumen.total_ingresos)}
              sub={`${resumen.citas_completadas} citas completadas`}
              accent
            />
            <MetricCard
              label="Comisiones barberos"
              value={formatCOP(resumen.total_comisiones_barberos)}
              sub="40% por barbero"
            />
            <MetricCard
              label="Ganancia barbería"
              value={formatCOP(resumen.total_barberia)}
              sub="60% del total"
            />
          </div>

          {/* Desglose por barbero */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              Desglose por barbero — {labelPeriodo}
            </h2>

            {resumen.desglose_por_barbero.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl py-10 text-center">
                <p className="text-neutral-500 text-sm">Sin citas completadas en este período</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-900 border-b border-neutral-800">
                      <th className="text-left text-neutral-400 font-medium px-4 py-3">Barbero</th>
                      <th className="text-right text-neutral-400 font-medium px-4 py-3">Servicios</th>
                      <th className="text-right text-neutral-400 font-medium px-4 py-3">Comisión (40%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {resumen.desglose_por_barbero.map((b) => (
                      <tr key={b.barbero_id} className="bg-neutral-900 hover:bg-neutral-800/50 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{b.barbero_nombre}</td>
                        <td className="px-4 py-3 text-neutral-300 text-right tabular-nums">
                          {b.total_servicios}
                        </td>
                        <td className="px-4 py-3 text-[#c9a84c] font-semibold text-right tabular-nums">
                          {formatCOP(b.total_ganado)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-neutral-700 bg-neutral-800/50">
                      <td className="px-4 py-3 text-neutral-400 text-sm">Total</td>
                      <td className="px-4 py-3 text-white font-semibold text-right tabular-nums">
                        {resumen.desglose_por_barbero.reduce((s, b) => s + b.total_servicios, 0)}
                      </td>
                      <td className="px-4 py-3 text-[#c9a84c] font-bold text-right tabular-nums">
                        {formatCOP(resumen.total_comisiones_barberos)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
