const TZ = 'America/Bogota'

/** "lunes, 6 de abril de 2026" */
export function formatFecha(isoString: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TZ,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(isoString))
}

/** "08:30 a. m." */
export function formatHora(isoString: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString))
}

/** "6 abr, 08:30 a. m." — fecha y hora compactas */
export function formatFechaHora(isoString: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString))
}

/** Fecha actual en Bogotá como "YYYY-MM-DD" */
export function todayBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
}

/** Convierte un ISO datetime a "YYYY-MM-DD" en zona horaria Bogotá */
export function toDateKeyBogota(isoString: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(
    new Date(isoString),
  )
}
