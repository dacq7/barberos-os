# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BarberOS frontend — React + TypeScript + Vite + Tailwind CSS SPA that consumes the FastAPI backend at `../backend/`. The frontend is currently at the default Vite scaffold; all application code is yet to be built.

## Commands

Run from `frontend/`:

```bash
npm run dev        # Start Vite dev server (HMR)
npm run build      # Type-check + production build
npm run lint       # ESLint
npm run preview    # Preview production build locally
```

## Architecture Plan

The backend (see `../backend/CLAUDE.md`) defines three roles — **ADMIN**, **BARBERO**, **CLIENTE** — which should map to separate route trees in the SPA.

Planned stack conventions (align new code to these):

- **Routing** — `react-router-dom` v7
- **Server state** — `@tanstack/react-query` for all API calls; keep cache keys in a central file
- **Client state** — `zustand` for auth/session and any UI state that crosses route boundaries
- **Forms** — `react-hook-form`
- **HTTP** — `axios` with a shared instance that injects the JWT `Authorization` header
- **Styles** — Tailwind CSS v4 (Vite plugin, no separate config file)

Suggested `src/` structure to build toward:

```
src/
  api/          # axios instance + per-domain request functions
  components/   # shared/reusable UI components
  pages/        # one folder per role (admin/, barbero/, cliente/)
  store/        # zustand stores (auth, etc.)
  hooks/        # custom React Query hooks wrapping api/ calls
  types/        # TypeScript interfaces mirroring backend schemas
```

## Backend Contract

- JWT-secured endpoints; token stored in zustand/localStorage and sent as `Authorization: Bearer <token>`
- Roles: `ADMIN`, `BARBERO`, `CLIENTE` (clients book without an account — name, email, phone only)
- Booking rules enforced by the API: min 30 min ahead, max 1 month ahead, cancellation up to 1 hour before
- Barber commission is display-only on the frontend (40% barber / 60% shop)

## Key Constraints

- No new dependencies without asking first
- `tsconfig.app.json` has `strict`, `noUnusedLocals`, `noUnusedParameters` — fix type errors, don't suppress them with `any` or `@ts-ignore`


## Proyecto: BarberOS — Frontend

Sistema de gestión para barberías con tres vistas diferenciadas.

## Estructura de rutas

Rutas públicas (sin auth):
- / → vista pública de la barbería (hero, servicios, reserva)
- /reservar → flujo de reserva para clientes
- /citas/:id → ver estado de una cita
- /citas/:id/cancelar → cancelar cita

Rutas admin (/admin/*):
- /admin/login → login administrador
- /admin/dashboard → métricas generales
- /admin/barberos → gestión de barberos
- /admin/servicios → gestión de servicios
- /admin/horarios → configuración de horarios
- /admin/citas → todas las citas
- /admin/pagos → registro de pagos y resumen
- /admin/inventario → gestión de inventario

Rutas barbero (/barbero/*):
- /barbero/login → login barbero
- /barbero/agenda → citas del día
- /barbero/ganancias → resumen de quincena
- /barbero/inventario → reportar agotamiento

## API Base URL
http://localhost:8000/api/v1

## Estado global (Zustand)
- authStore: token, rol (admin|barbero), usuario, login(), logout()

## Convenciones
- Componentes en PascalCase
- Hooks con prefijo use
- Tipos TypeScript en src/types/
- Llamadas API en src/services/ con axios
- No usar any ni @ts-ignore
- Tailwind para todos los estilos
- No crear archivos CSS adicionales
