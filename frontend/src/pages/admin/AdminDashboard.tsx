import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getAdminCitas, getResumenAdmin } from '../../services/admin.service'
import { formatFecha, formatHora, todayBogota, toDateKeyBogota } from '../../utils/date'
import type { EstadoCita } from '../../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCOP(value: string | number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(value))
}

const ESTADO_BADGE: Record<EstadoCita, { label: string; cls: string }> = {
  pendiente:  { label: 'Pendiente',     cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  confirmada: { label: 'Confirmada',    cls: 'bg-green-500/15  text-green-400  border-green-500/30'  },
  completada: { label: 'Completada',    cls: 'bg-blue-500/15   text-blue-400   border-blue-500/30'   },
  cancelada:  { label: 'Cancelada',     cls: 'bg-red-500/15    text-red-400    border-red-500/30'    },
  no_show:    { label: 'No presentado', cls: 'bg-neutral-700   text-neutral-400 border-neutral-600'  },
}

function currentMonthRange(): { fechaInicio: string; fechaFin: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return {
    fechaInicio: `${y}-${m}-01`,
    fechaFin: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
  }
}

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
      <p className="text-3xl font-bold text-[#c9a84c] mt-1 tabular-nums">{value}</p>
      {sub && <p className="text-neutral-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { fechaInicio, fechaFin } = currentMonthRange()

  const { data: citas, isLoading: loadingCitas } = useQuery({
    queryKey: ['admin-citas'],
    queryFn: getAdminCitas,
  })

  const { data: resumen } = useQuery({
    queryKey: ['admin-resumen', fechaInicio, fechaFin],
    queryFn: () => getResumenAdmin(fechaInicio, fechaFin),
  })

  const todayKey = todayBogota()

  const citasHoy = citas?.filter((c) => toDateKeyBogota(c.fecha_hora) === todayKey) ?? []

  const pendientes = citas?.filter((c) => c.estado === 'pendiente').length ?? 0
  const confirmadas = citas?.filter((c) => c.estado === 'confirmada').length ?? 0

  const citasHoyOrdenadas = [...citasHoy].sort((a, b) =>
    a.fecha_hora.localeCompare(b.fecha_hora),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <span className="text-neutral-500 text-sm">
          {formatFecha(new Date().toISOString())}
        </span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Citas hoy"
          value={loadingCitas ? '…' : String(citasHoy.length)}
        />
        <MetricCard
          label="Pendientes"
          value={loadingCitas ? '…' : String(pendientes)}
        />
        <MetricCard
          label="Confirmadas"
          value={loadingCitas ? '…' : String(confirmadas)}
        />
        <MetricCard
          label="Ingresos del mes"
          value={resumen ? formatCOP(resumen.total_ingresos) : '—'}
          sub={resumen ? `${resumen.citas_completadas} citas completadas` : undefined}
        />
      </div>

      {/* Citas de hoy */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Citas de hoy</h2>
          <Link
            to="/admin/citas"
            className="text-sm text-[#c9a84c] hover:underline"
          >
            Ver todas
          </Link>
        </div>

        {loadingCitas && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-neutral-900 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loadingCitas && citasHoyOrdenadas.length === 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl py-12 text-center">
            <p className="text-neutral-500">No hay citas programadas para hoy</p>
          </div>
        )}

        {!loadingCitas && citasHoyOrdenadas.length > 0 && (
          <div className="space-y-2">
            {citasHoyOrdenadas.map((c) => {
              const hora = formatHora(c.fecha_hora)
              const { label, cls } = ESTADO_BADGE[c.estado]
              return (
                <div
                  key={c.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[#c9a84c] font-mono text-sm shrink-0 w-12">
                      {hora}
                    </span>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {c.cliente.nombre}
                      </p>
                      <p className="text-neutral-400 text-xs truncate">
                        {c.servicio.nombre} · {c.barbero.nombre}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${cls}`}
                  >
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
