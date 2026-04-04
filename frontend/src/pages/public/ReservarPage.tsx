import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  getServicios,
  getBarberos,
  getDisponibilidad,
  createCita,
} from '../../services/public.service'
import { brand } from '../../config/brand'
import type { CitaCreateRequest } from '../../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3

interface ClienteForm {
  nombre: string
  email: string
  telefono: string
  notas: string
}

function formatCOP(value: string | number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(value))
}

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatHora(hora: string): string {
  return hora.slice(0, 5) // "HH:MM:SS" → "HH:MM"
}

const today = new Date().toISOString().split('T')[0]
const maxDate = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
})()

// ── Avatar ────────────────────────────────────────────────────────────────────

function BarberoAvatar({ id, nombre }: { id: string; nombre: string }) {
  const [err, setErr] = useState(false)
  if (err) {
    return (
      <div className="w-14 h-14 rounded-full bg-neutral-700 flex items-center justify-center text-white font-bold text-xl shrink-0">
        {nombre[0].toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={`/images/barbers/${id}.png`}
      alt={nombre}
      onError={() => setErr(true)}
      className="w-14 h-14 rounded-full object-cover bg-neutral-700 shrink-0"
    />
  )
}

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const labels = ['Servicio y barbero', 'Fecha y hora', 'Tus datos']
  return (
    <div className="flex items-start mb-8">
      {labels.map((label, i) => {
        const n = (i + 1) as Step
        const done = current > n
        const active = current === n
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  done || active
                    ? 'bg-[#c9a84c] text-black'
                    : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                {done ? '✓' : n}
              </div>
              <span
                className={`text-xs hidden sm:block text-center leading-tight ${
                  active ? 'text-white' : 'text-neutral-500'
                }`}
              >
                {label}
              </span>
            </div>
            {i < 2 && <div className="flex-1 h-px bg-neutral-800 mx-2 mt-[-16px]" />}
          </div>
        )
      })}
    </div>
  )
}

// ── Summary row ───────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-neutral-400 text-sm shrink-0">{label}</span>
      <span className="text-white text-sm text-right">{value}</span>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonGrid({ cols = 2 }: { cols?: number }) {
  return (
    <div className={`grid gap-3 grid-cols-${cols}`}>
      {Array.from({ length: cols * 2 }).map((_, i) => (
        <div key={i} className="h-20 bg-neutral-900 rounded-xl animate-pulse" />
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReservarPage() {
  const navigate = useNavigate()

  const [paso, setPaso] = useState<Step>(1)
  const [servicioId, setServicioId] = useState<string | null>(null)
  const [barberoId, setBarberoId] = useState<string | null>(null) // null = sin preferencia
  const [fecha, setFecha] = useState('')
  const [horaSlot, setHoraSlot] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClienteForm>()

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: servicios, isLoading: loadingServicios } = useQuery({
    queryKey: ['servicios-publicos'],
    queryFn: getServicios,
  })

  const { data: barberos, isLoading: loadingBarberos } = useQuery({
    queryKey: ['barberos-publicos'],
    queryFn: getBarberos,
  })

  // When "sin preferencia", use the first barbero in the list for slot queries
  const resolvedBarberoId = barberoId ?? (barberos?.[0]?.id ?? null)

  const { data: disponibilidad, isLoading: loadingSlots } = useQuery({
    queryKey: ['disponibilidad', resolvedBarberoId, fecha],
    queryFn: () => getDisponibilidad(resolvedBarberoId!, fecha),
    enabled: paso === 2 && !!fecha && !!resolvedBarberoId,
  })

  const availableSlots = disponibilidad?.slots.filter((s) => s.disponible) ?? []

  // ── Mutation ──────────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: CitaCreateRequest) => createCita(data),
    onSuccess: (cita) => {
      navigate(`/citas/${cita.id}`, { state: { nuevo: true } })
    },
  })

  // ── Derived ───────────────────────────────────────────────────────────────────

  const selectedServicio = servicios?.find((s) => s.id === servicioId)
  const selectedBarbero = barberoId ? barberos?.find((b) => b.id === barberoId) : null

  // ── Submit ────────────────────────────────────────────────────────────────────

  function onSubmit(form: ClienteForm) {
    if (!servicioId || !resolvedBarberoId || !fecha || !horaSlot) return
    const body: CitaCreateRequest = {
      cliente_nombre: form.nombre,
      cliente_email: form.email,
      barbero_id: resolvedBarberoId,
      servicio_id: servicioId,
      fecha_hora: `${fecha}T${horaSlot}`,
    }
    if (form.telefono) body.cliente_telefono = form.telefono
    if (form.notas) body.notas = form.notas
    createMutation.mutate(body)
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <img src="/brand/logo.png" alt={brand.nombre} className="h-8 w-auto" />
          </Link>
          <span className="text-neutral-400 text-sm">Reservar cita</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <StepIndicator current={paso} />

        {/* ── Paso 1 ── */}
        {paso === 1 && (
          <div className="space-y-8">
            {/* Servicios */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Elige un servicio</h2>
              {loadingServicios && <SkeletonGrid />}
              {servicios && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {servicios.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setServicioId(s.id)}
                      className={`p-4 rounded-xl border text-left transition-colors ${
                        servicioId === s.id
                          ? 'border-[#c9a84c] bg-[#c9a84c]/10'
                          : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
                      }`}
                    >
                      <div className="font-semibold text-white">{s.nombre}</div>
                      {s.descripcion && (
                        <div className="text-sm text-neutral-400 mt-1 line-clamp-2">
                          {s.descripcion}
                        </div>
                      )}
                      <div className="text-[#c9a84c] font-bold mt-2">{formatCOP(s.precio)}</div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Barberos */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Elige un barbero</h2>
              {loadingBarberos && <SkeletonGrid cols={3} />}
              {barberos && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Sin preferencia */}
                  <button
                    onClick={() => setBarberoId(null)}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${
                      barberoId === null
                        ? 'border-[#c9a84c] bg-[#c9a84c]/10'
                        : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-neutral-700 flex items-center justify-center">
                      {/* Generic scissors icon */}
                      <svg
                        className="w-6 h-6 text-neutral-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.044l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664"
                        />
                      </svg>
                    </div>
                    <span className="text-sm text-white font-medium text-center leading-tight">
                      Sin preferencia
                    </span>
                  </button>

                  {barberos.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBarberoId(b.id)}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${
                        barberoId === b.id
                          ? 'border-[#c9a84c] bg-[#c9a84c]/10'
                          : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
                      }`}
                    >
                      <BarberoAvatar id={b.id} nombre={b.nombre} />
                      <span className="text-sm text-white font-medium text-center leading-tight">
                        {b.nombre}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <button
              disabled={!servicioId}
              onClick={() => setPaso(2)}
              className="w-full bg-[#c9a84c] hover:bg-[#b8973e] disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-xl transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}

        {/* ── Paso 2 ── */}
        {paso === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Elige fecha y hora</h2>

            <div>
              <label className="block text-sm text-neutral-400 mb-2">Fecha</label>
              <input
                type="date"
                min={today}
                max={maxDate}
                value={fecha}
                onChange={(e) => {
                  setFecha(e.target.value)
                  setHoraSlot(null)
                }}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c9a84c] [color-scheme:dark]"
              />
            </div>

            {fecha && (
              <div>
                <label className="block text-sm text-neutral-400 mb-3">Horarios disponibles</label>

                {loadingSlots && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="h-10 bg-neutral-800 rounded-lg animate-pulse" />
                    ))}
                  </div>
                )}

                {!loadingSlots && availableSlots.length === 0 && (
                  <p className="text-neutral-500 text-center py-10">
                    No hay disponibilidad ese día
                  </p>
                )}

                {!loadingSlots && availableSlots.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.hora}
                        onClick={() => setHoraSlot(slot.hora)}
                        className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                          horaSlot === slot.hora
                            ? 'bg-[#c9a84c] text-black'
                            : 'bg-neutral-800 text-white hover:bg-neutral-700'
                        }`}
                      >
                        {formatHora(slot.hora)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPaso(1)}
                className="flex-1 border border-neutral-700 hover:border-neutral-500 text-white py-3 rounded-xl transition-colors"
              >
                Atrás
              </button>
              <button
                disabled={!horaSlot}
                onClick={() => setPaso(3)}
                className="flex-1 bg-[#c9a84c] hover:bg-[#b8973e] disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-xl transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 3 ── */}
        {paso === 3 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Tus datos</h2>

            {/* Resumen */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
              <p className="text-[#c9a84c] text-sm font-semibold mb-1">Resumen de tu reserva</p>
              <SummaryRow label="Servicio" value={selectedServicio?.nombre ?? ''} />
              <SummaryRow
                label="Barbero"
                value={selectedBarbero ? selectedBarbero.nombre : 'Cualquier barbero disponible'}
              />
              <SummaryRow label="Fecha" value={formatFecha(fecha)} />
              <SummaryRow label="Hora" value={horaSlot ? formatHora(horaSlot) : ''} />
              {selectedServicio && (
                <SummaryRow label="Precio" value={formatCOP(selectedServicio.precio)} />
              )}
            </div>

            {/* Campos */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">Nombre completo *</label>
                <input
                  {...register('nombre', { required: 'El nombre es obligatorio' })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c9a84c]"
                  placeholder="Tu nombre completo"
                />
                {errors.nombre && (
                  <p className="text-red-400 text-xs mt-1">{errors.nombre.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">Email *</label>
                <input
                  {...register('email', {
                    required: 'El email es obligatorio',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' },
                  })}
                  type="email"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c9a84c]"
                  placeholder="tu@email.com"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">Teléfono</label>
                <input
                  {...register('telefono')}
                  type="tel"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c9a84c]"
                  placeholder="300 000 0000"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">Notas (opcional)</label>
                <textarea
                  {...register('notas')}
                  rows={3}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c9a84c] resize-none"
                  placeholder="Algo que debamos saber..."
                />
              </div>
            </div>

            {createMutation.isError && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl py-3 px-4">
                No se pudo confirmar la reserva. Verifica los datos e intenta de nuevo.
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPaso(2)}
                className="flex-1 border border-neutral-700 hover:border-neutral-500 text-white py-3 rounded-xl transition-colors"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 bg-[#c9a84c] hover:bg-[#b8973e] disabled:opacity-60 text-black font-semibold py-3 rounded-xl transition-colors"
              >
                {createMutation.isPending ? 'Confirmando...' : 'Confirmar reserva'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
