# BarberOS

Full-stack barbershop management system — online booking, barber schedules, commission tracking, and inventory in one platform.

![Python](https://img.shields.io/badge/Python-3.12-blue?style=flat-square) ![FastAPI](https://img.shields.io/badge/FastAPI-0.135-green?style=flat-square) ![React](https://img.shields.io/badge/React-19-cyan?style=flat-square) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat-square) ![Docker](https://img.shields.io/badge/Docker-blue?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square) [![Live Demo](https://img.shields.io/badge/Live%20Demo-brightgreen?style=flat-square)](https://barberos-os.vercel.app)

---

## Screenshots

![Homepage](https://raw.githubusercontent.com/dacq7/barberos-os/main/.github/screenshots/01-homepage.png)
<p align="center"><em>Public landing page</em></p>

<table>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/dacq7/barberos-os/main/.github/screenshots/02-booking-step1-services.png" alt="Step 1"><br><em>Step 1 — Service &amp; barber</em></td>
    <td align="center"><img src="https://raw.githubusercontent.com/dacq7/barberos-os/main/.github/screenshots/03-booking-step2-slots.png" alt="Step 2"><br><em>Step 2 — Date &amp; time</em></td>
    <td align="center"><img src="https://raw.githubusercontent.com/dacq7/barberos-os/main/.github/screenshots/04-booking-step3-form.png" alt="Step 3"><br><em>Step 3 — Your details</em></td>
  </tr>
</table>

![Booking Confirmation](https://raw.githubusercontent.com/dacq7/barberos-os/main/.github/screenshots/05-booking-confirmation.png)
<p align="center"><em>Booking confirmation with reschedule option</em></p>

![Admin Dashboard](https://raw.githubusercontent.com/dacq7/barberos-os/main/.github/screenshots/06-admin-dashboard.png)
<p align="center"><em>Admin dashboard — real-time metrics</em></p>

<table>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/dacq7/barberos-os/main/.github/screenshots/07-admin-appointments.png" alt="Appointments"><br><em>Appointment management</em></td>
    <td align="center"><img src="https://raw.githubusercontent.com/dacq7/barberos-os/main/.github/screenshots/08-admin-payments.png" alt="Payments"><br><em>Payments &amp; commissions</em></td>
  </tr>
</table>

![Inventory](https://raw.githubusercontent.com/dacq7/barberos-os/main/.github/screenshots/09-admin-inventory.png)
<p align="center"><em>Inventory management with low-stock alerts</em></p>

![Barber Schedule](https://raw.githubusercontent.com/dacq7/barberos-os/main/.github/screenshots/10-barber-schedule.png)
<p align="center"><em>Barber panel — daily schedule</em></p>

<table>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/dacq7/barberos-os/main/.github/screenshots/11-api-docs_1.png" alt="API Docs 1"><br><em>OpenAPI documentation — auth, admin &amp; scheduling endpoints</em></td>
    <td align="center"><img src="https://raw.githubusercontent.com/dacq7/barberos-os/main/.github/screenshots/12-api-docs_2.png" alt="API Docs 2"><br><em>OpenAPI documentation — payments, inventory &amp; public endpoints</em></td>
  </tr>
</table>

---

## Live Demo

| Role | Login URL | Email | Password |
|------|-----------|-------|----------|
| Admin | https://barberos-os.vercel.app/admin/login | admin@barberos.com | demo1234 |
| Barber | https://barberos-os.vercel.app/barbero/login | carlos@barberos.com | demo1234 |
| Client | https://barberos-os.vercel.app/reservar | No account required | — |

> Seed data includes 3 barbers, 5 services, 8 appointments across all statuses, and 6 inventory items.

---

## Features

- 🗓️ **3-step public booking** — no account required, clients book in under 2 minutes
- 👥 **Three-role system** — Admin, Barber, and Client with fully isolated dashboards and auth flows
- 💰 **Automated commission split** — 40% barber / 60% shop, with bi-weekly earnings reports per barber
- 📧 **Automated email reminders** — APScheduler sends reminders at 24h and 2h before each appointment via Resend
- 📅 **Client rescheduling** — clients reschedule directly from their confirmation email link, no account needed
- 📦 **Inventory management** — stock tracking with configurable minimum thresholds and low-stock alerts
- 🔐 **JWT auth with refresh tokens** — separate OAuth2 flows for Admin and Barber roles, bcrypt password hashing
- 📊 **Real-time admin dashboard** — daily appointments, monthly revenue, pending count, and per-barber commission breakdown
- 🐳 **Docker ready** — full local environment with docker-compose in one command, includes PostgreSQL and nginx
- ✅ **15 passing tests** — pytest suite covering JWT security, booking business rules, and commission calculations
- 📖 **OpenAPI documentation** — 25+ documented endpoints at /docs with request/response schemas

---

## Tech Stack

### Backend

| Technology | Version | Role |
|---|---|---|
| Python | 3.12 | Language |
| FastAPI | 0.135 | HTTP framework / REST API |
| SQLAlchemy | 2.0 | Async ORM |
| PostgreSQL | 15 | Relational database |
| Alembic | — | Schema migrations |
| Pydantic | v2 | Schema validation |
| python-jose | — | JWT authentication (HS256) |
| passlib / bcrypt | — | Password hashing |
| APScheduler | — | Email reminder jobs |
| Resend | — | Transactional email delivery |
| Docker | — | Containerization |
| pytest | — | Testing (15 passing tests) |

### Frontend

| Technology | Version | Role |
|---|---|---|
| React | 19 | UI library |
| TypeScript | 5.9 | Strict typing |
| Vite | 8 | Bundler / dev server |
| Tailwind CSS | v4 | Styling (Vite plugin) |
| react-router-dom | v7 | SPA routing |
| TanStack Query | v5 | Server state / API cache |
| Zustand | v5 | Auth session state |
| axios | — | HTTP client with JWT interceptor |
| react-hook-form | v7 | Form management |

---

## Architecture Decisions

- **Async SQLAlchemy 2.0 + asyncpg** — non-blocking DB operations handle concurrent booking requests without thread overhead
- **Pydantic v2 schemas** — 2x faster validation vs v1; strict typing enforced across all API boundaries with zero `Any` types
- **TanStack Query v5** — server state per role with automatic cache invalidation; no redundant API calls across dashboards
- **APScheduler in-process** — reminder jobs run inside uvicorn without Redis or Celery; ±15 min tolerance windows prevent duplicate sends

---

## Project Structure

```
barberos/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/            # One router per domain (auth, admin, citas, horarios, pagos, inventario, public)
│   │   ├── core/
│   │   │   ├── config.py          # Environment variables via pydantic-settings
│   │   │   └── security.py        # JWT creation/verification + bcrypt hashing
│   │   ├── db/
│   │   │   ├── database.py        # Async engine + get_db dependency
│   │   │   └── models/            # 12 SQLAlchemy models (one file per entity)
│   │   ├── schemas/               # Pydantic v2 request/response schemas per domain
│   │   ├── services/              # Business logic decoupled from HTTP layer
│   │   └── main.py                # FastAPI app, CORS middleware, router registration
│   ├── alembic/                   # Schema migration history
│   ├── scripts/
│   │   └── seed.py                # Demo data seeder (barbers, services, appointments)
│   ├── tests/                     # pytest suite — security, booking rules, commissions
│   ├── .env.example
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── api/                   # Axios instance + per-domain request functions
        ├── components/            # Shared components (layouts, route guards, UI)
        ├── pages/
        │   ├── admin/             # AdminDashboard, AdminBarberos, AdminServicios,
        │   │                      #   AdminCitas, AdminHorarios, AdminPagos, AdminInventario
        │   ├── barbero/           # BarberoAgenda, BarberoGanancias, BarberoInventario
        │   └── public/            # HomePage, ReservarPage, CitaPage (3-step booking flow)
        ├── store/                 # Zustand stores (authStore per role)
        ├── types/                 # TypeScript interfaces mirroring backend schemas
        └── utils/                 # Date/time helpers (Bogotá timezone)
```

---

## Quick Start

### Option A — Docker (recommended)

```bash
git clone https://github.com/dacq7/barberos-os.git
cd barberos-os
cp .env.example .env        # configure SECRET_KEY and RESEND_API_KEY
docker compose up --build -d
docker compose exec backend alembic upgrade head
docker compose exec backend python3 scripts/seed.py
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option B — Manual setup

**Backend:**

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # configure your variables
alembic upgrade head
python3 scripts/seed.py
uvicorn app.main:app --reload
# API available at http://localhost:8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL async connection string | `postgresql+asyncpg://user:pass@localhost:5432/barberos_db` |
| `SECRET_KEY` | JWT signing secret (use a strong random string) | `your-secret-key-here` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL in minutes | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL in days | `7` |
| `RESEND_API_KEY` | Resend API key for transactional emails | `re_your_key_here` |
| `ALLOWED_ORIGINS_STR` | Comma-separated list of allowed CORS origins | `https://your-frontend.vercel.app` |
| `BASE_URL` | Frontend base URL (used in email links) | `https://your-frontend.vercel.app` |

---

## Data Model

**12 entities:** `admins` · `barberos` · `servicios` · `barbero_servicios` · `horarios` · `barbero_bloqueos` · `bloqueos_generales` · `clientes` · `citas` · `pagos` · `inventario` · `inventario_alertas`

**Key business rules:**

- Minimum booking: 30 minutes in advance — maximum: 1 month ahead
- Client cancellation deadline: 1 hour before appointment
- Client rescheduling deadline: 30 minutes before appointment
- Commission split: 40% barber / 60% barbershop per completed service
- Email reminders: dispatched at 24h and 2h windows with ±15 min polling tolerance to prevent duplicates
- Appointment statuses: `pending` → `confirmed` → `completed` / `cancelled` / `no_show`

---

## Running Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

Expected output:

```
tests/test_cita_service.py::test_crear_cita_falla_fecha_menos_30_min PASSED
tests/test_cita_service.py::test_crear_cita_falla_slot_no_disponible PASSED
tests/test_cita_service.py::test_cancelar_cita_cambia_estado PASSED
tests/test_cita_service.py::test_cancelar_cita_falla_si_ya_cancelada PASSED
tests/test_cita_service.py::test_cancelar_cita_falla_menos_de_1_hora PASSED
tests/test_cita_service.py::test_cambiar_estado_cita_actualiza_correctamente PASSED
tests/test_pago_service.py::test_registrar_pago_calcula_comisiones_correctamente PASSED
tests/test_pago_service.py::test_registrar_pago_falla_si_cita_no_completada PASSED
tests/test_pago_service.py::test_registrar_pago_falla_si_ya_existe_pago PASSED
tests/test_pago_service.py::test_get_resumen_barbero_calcula_total_correcto PASSED
tests/test_security.py::test_hash_password_difiere_del_texto_plano PASSED
tests/test_security.py::test_verify_password_correcto PASSED
tests/test_security.py::test_verify_password_incorrecto PASSED
tests/test_security.py::test_create_access_token_genera_jwt_valido PASSED
tests/test_security.py::test_create_refresh_token_incluye_type_refresh PASSED

15 passed in 3.75s
```

---

## Author

**Diego Alejandro Correa** — Full-Stack Developer · Medellín, Colombia

- GitHub: [@dacq7](https://github.com/dacq7)
- LinkedIn: 
- Upwork: 

---

<p align="center">Built with FastAPI + React · Deployed on Railway &amp; Vercel</p>
