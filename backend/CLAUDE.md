# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BarberOS backend — a FastAPI + PostgreSQL REST API for a barbershop management system. The frontend (in `../frontend/`) is not yet scaffolded.

## Commands

All commands should be run from `backend/` with the virtualenv active:

```bash
source venv/bin/activate
```

**Run the dev server:**
```bash
uvicorn app.main:app --reload
```

**Run database migrations:**
```bash
alembic upgrade head
```

**Create a new migration after model changes:**
```bash
alembic revision --autogenerate -m "description"
```

**Install dependencies:**
```bash
pip install -r requirements.txt
```

## Architecture

The app follows a layered structure under `app/`:

- `main.py` — FastAPI app instantiation, middleware, and router registration
- `core/config.py` — Settings loaded from `.env` via pydantic-settings (`DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, token expiry, `RESEND_API_KEY`)
- `core/security.py` — JWT creation/verification (HS256), password hashing via passlib/bcrypt
- `db/database.py` — SQLAlchemy async engine and `get_db` session dependency
- `db/models/` — SQLAlchemy ORM models; `base.py` holds the declarative `Base`
- `schemas/` — Pydantic v2 request/response schemas (separate from ORM models)
- `services/` — Business logic, decoupled from HTTP layer
- `api/routes/` — FastAPI routers, one file per domain; imported and mounted in `main.py`

## Key Dependencies & Conventions

- **FastAPI 0.135** with **Pydantic v2** — use `model_config` instead of inner `class Config`
- **SQLAlchemy 2.0** — use the new `select()` style, not legacy `Query`
- **Alembic** for migrations — models must be imported in `env.py` for autogenerate to detect them
- **python-jose** for JWT, **passlib[bcrypt]** for passwords
- **Resend** (`resend` SDK) for transactional email
- **APScheduler** available for background/scheduled jobs
- Environment config lives in `.env` (see `.env.example` for required variables)


## Proyecto: BarberOS — Backend

Sistema de gestión para barberías. Single-tenant, arquitectura lista para escalar.

## Roles del sistema
- ADMIN: acceso total a la operación, métricas, pagos, inventario
- BARBERO: agenda propia, ganancias, reportes de inventario
- CLIENTE: reservas públicas sin cuenta (nombre, email, teléfono)

## Modelos de base de datos (orden de creación)
1. admins
2. barberos
3. servicios
4. barbero_servicios (relación barbero ↔ servicio con duración propia)
5. horarios (horario general de la barbería)
6. barbero_bloqueos (días libres y vacaciones)
7. bloqueos_generales (festivos y eventos)
8. clientes
9. citas (estado: pendiente, confirmada, completada, cancelada, no_show)
10. pagos (comisión: 40% barbero / 60% barbería)
11. inventario
12. inventario_alertas

## Reglas de negocio críticas
- Reserva mínima: 30 min antes. Máxima: 1 mes adelante
- Cancelación por cliente: hasta 1 hora antes
- Comisión barbero: 40% del valor del servicio
- Recordatorios: 24h antes y 2h antes por email (Resend)
- Un barbero atiende un cliente a la vez

## Convenciones
- Modelos SQLAlchemy en app/db/models/ un archivo por modelo
- Schemas Pydantic en app/schemas/ un archivo por módulo
- Lógica de negocio en app/services/ no en los routes
- Routes solo reciben, validan y delegan a services
- No instalar dependencias sin consultarme
- No modificar .env ni requirements.txt sin pedirlo
