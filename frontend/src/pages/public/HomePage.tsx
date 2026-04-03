import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getServicios } from '../../services/public.service'
import { brand } from '../../config/brand'
import type { Servicio } from '../../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCOP(value: string | number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(value))
}

// ── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-neutral-950/90 backdrop-blur border-b border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <img src="/brand/logo.png" alt={brand.nombre} className="h-8 w-auto" />

        <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-300">
          <button
            onClick={() => scrollTo('servicios')}
            className="hover:text-white transition"
          >
            Servicios
          </button>
          <button
            onClick={() => scrollTo('galeria')}
            className="hover:text-white transition"
          >
            Galería
          </button>
          <button
            onClick={() => scrollTo('contacto')}
            className="hover:text-white transition"
          >
            Contacto
          </button>
        </nav>

        <Link
          to="/reservar"
          className="bg-[#c9a84c] hover:bg-[#b8973e] text-black text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          Reservar
        </Link>
      </div>
    </header>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center text-center px-4"
      style={{
        backgroundImage: 'url(/images/hero.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-neutral-950/70" />

      <div className="relative z-10 max-w-2xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
          {brand.nombre}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-neutral-300">{brand.tagline}</p>
        <Link
          to="/reservar"
          className="mt-8 inline-block bg-[#c9a84c] hover:bg-[#b8973e] text-black font-semibold px-8 py-3 rounded-lg text-base transition"
        >
          Reservar ahora
        </Link>
      </div>
    </section>
  )
}

// ── Servicios ─────────────────────────────────────────────────────────────────

function ServicioCard({ servicio }: { servicio: Servicio }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col gap-3">
      <h3 className="text-white font-semibold text-lg">{servicio.nombre}</h3>
      {servicio.descripcion && (
        <p className="text-neutral-400 text-sm flex-1">{servicio.descripcion}</p>
      )}
      <span className="text-[#c9a84c] font-bold text-xl">{formatCOP(servicio.precio)}</span>
    </div>
  )
}

function Servicios() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['servicios-publicos'],
    queryFn: getServicios,
  })

  return (
    <section id="servicios" className="py-20 px-4 bg-neutral-950">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Nuestros servicios
        </h2>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-40 animate-pulse"
              />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-center text-neutral-500">No se pudieron cargar los servicios.</p>
        )}

        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((s) => (
              <ServicioCard key={s.id} servicio={s} />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            to="/reservar"
            className="inline-block bg-[#c9a84c] hover:bg-[#b8973e] text-black font-semibold px-8 py-3 rounded-lg transition"
          >
            Reservar cita
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Galería ───────────────────────────────────────────────────────────────────

function Galeria() {
  const fotos = [
    { src: '/images/interior-1.png', alt: 'Interior barbería 1' },
    { src: '/images/interior-2.png', alt: 'Interior barbería 2' },
    { src: '/images/interior-3.png', alt: 'Interior barbería 3' },
  ]

  return (
    <section id="galeria" className="py-20 px-4 bg-neutral-900">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Galería
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fotos.map(({ src, alt }) => (
            <div key={src} className="overflow-hidden rounded-2xl aspect-square">
              <img
                src={src}
                alt={alt}
                className="w-full h-full object-cover hover:scale-105 transition duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Contacto ──────────────────────────────────────────────────────────────────

function Contacto() {
  return (
    <section id="contacto" className="py-20 px-4 bg-neutral-950">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Contacto
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="text-[#c9a84c] text-2xl">📍</span>
            <h3 className="text-white font-semibold">Dirección</h3>
            <p className="text-neutral-400 text-sm">{brand.direccion}</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <span className="text-[#c9a84c] text-2xl">📞</span>
            <h3 className="text-white font-semibold">Teléfono</h3>
            <a
              href={`https://wa.me/${brand.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 text-sm hover:text-[#c9a84c] transition"
            >
              {brand.telefono}
            </a>
          </div>

          <div className="flex flex-col items-center gap-3">
            <span className="text-[#c9a84c] text-2xl">🌐</span>
            <h3 className="text-white font-semibold">Redes sociales</h3>
            <div className="flex gap-4 text-sm">
              <a
                href={brand.instagram}
                target="_blank"
                rel="noreferrer"
                className="text-neutral-400 hover:text-[#c9a84c] transition"
              >
                Instagram
              </a>
              <a
                href={brand.facebook}
                target="_blank"
                rel="noreferrer"
                className="text-neutral-400 hover:text-[#c9a84c] transition"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-neutral-900 border-t border-neutral-800 py-6 px-4 text-center">
      <p className="text-neutral-500 text-sm">
        © {new Date().getFullYear()} {brand.nombre}. Todos los derechos reservados.
      </p>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="bg-neutral-950">
      <Navbar />
      <Hero />
      <Servicios />
      <Galeria />
      <Contacto />
      <Footer />
    </div>
  )
}
