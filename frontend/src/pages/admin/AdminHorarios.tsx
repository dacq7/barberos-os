import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { getHorarios, setHorario } from '../../services/admin.service'
import type { Horario, HorarioCreate } from '../../types'

// ── Constants ─────────────────────────────────────────────────────────────────

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/** "HH:MM:SS" → "HH:MM" */
function toHHMM(t: string): string {
  return t.slice(0, 5)
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface HorarioForm {
  hora_inicio: string
  hora_fin: string
  activo: boolean
}

function EditarHorarioModal({
  diaSemana,
  diaNombre,
  defaults,
  onClose,
}: {
  diaSemana: number
  diaNombre: string
  defaults: HorarioForm
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<HorarioForm>({
    defaultValues: defaults,
  })

  const mutation = useMutation({
    mutationFn: (data: HorarioForm) => {
      const payload: HorarioCreate = {
        dia_semana: diaSemana,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        activo: data.activo,
      }
      return setHorario(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-horarios'] })
      onClose()
    },
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Editar — {diaNombre}</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Hora de inicio</label>
            <input
              type="time"
              {...register('hora_inicio', { required: true })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c9a84c] [color-scheme:dark]"
            />
            {errors.hora_inicio && (
              <p className="text-red-400 text-xs mt-1">Requerido</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Hora de fin</label>
            <input
              type="time"
              {...register('hora_fin', { required: true })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c9a84c] [color-scheme:dark]"
            />
            {errors.hora_fin && (
              <p className="text-red-400 text-xs mt-1">Requerido</p>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('activo')}
              className="w-4 h-4 accent-[#c9a84c]"
            />
            <span className="text-sm text-neutral-300">Día activo</span>
          </label>

          {mutation.isError && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              No se pudo guardar. Intenta de nuevo.
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-neutral-700 hover:border-neutral-500 text-white py-2.5 rounded-xl transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-[#c9a84c] hover:bg-[#b8973e] disabled:opacity-50 text-black font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {mutation.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface ModalState {
  diaSemana: number
  diaNombre: string
  defaults: HorarioForm
}

export default function AdminHorarios() {
  const [modal, setModal] = useState<ModalState | null>(null)

  const { data: horarios, isLoading } = useQuery({
    queryKey: ['admin-horarios'],
    queryFn: getHorarios,
  })

  function horarioPorDia(dia: number): Horario | undefined {
    return horarios?.find((h) => h.dia_semana === dia)
  }

  function openModal(dia: number) {
    const h = horarioPorDia(dia)
    setModal({
      diaSemana: dia,
      diaNombre: DIAS[dia],
      defaults: {
        hora_inicio: h ? toHHMM(h.hora_inicio) : '08:00',
        hora_fin:    h ? toHHMM(h.hora_fin)    : '18:00',
        activo:      h ? h.activo               : true,
      },
    })
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Horarios</h1>

      {isLoading && (
        <div className="space-y-2">
          {DIAS.map((d) => (
            <div key={d} className="h-14 bg-neutral-900 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-900 border-b border-neutral-800">
                <th className="text-left text-neutral-400 font-medium px-4 py-3">Día</th>
                <th className="text-left text-neutral-400 font-medium px-4 py-3">Apertura</th>
                <th className="text-left text-neutral-400 font-medium px-4 py-3">Cierre</th>
                <th className="text-left text-neutral-400 font-medium px-4 py-3">Estado</th>
                <th className="text-right text-neutral-400 font-medium px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {DIAS.map((nombre, idx) => {
                const h = horarioPorDia(idx)
                const activo = h?.activo ?? false
                return (
                  <tr key={idx} className="bg-neutral-900 hover:bg-neutral-800/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{nombre}</td>
                    <td className="px-4 py-3 text-neutral-300 font-mono">
                      {h ? toHHMM(h.hora_inicio) : '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-300 font-mono">
                      {h ? toHHMM(h.hora_fin) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {activo ? (
                        <span className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border bg-green-500/15 text-green-400 border-green-500/30">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border bg-neutral-700 text-neutral-400 border-neutral-600">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openModal(idx)}
                        className="text-xs text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <EditarHorarioModal
          diaSemana={modal.diaSemana}
          diaNombre={modal.diaNombre}
          defaults={modal.defaults}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
