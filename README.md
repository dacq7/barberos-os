# BarberOS

Sistema de gestión integral para barberías. Centraliza la operación diaria — reservas de clientes, agenda de barberos, pagos y comisiones, e inventario — en una sola plataforma con tres paneles diferenciados según el rol del usuario.

---

## El problema que resuelve

Las barberías suelen operar con agendas en papel, cobros manuales y sin trazabilidad de inventario ni comisiones. BarberOS digitaliza ese flujo completo: los clientes reservan en línea sin crear una cuenta, los barberos ven su agenda y ganancias en tiempo real, y el administrador tiene visibilidad total de la operación.

---

## Roles del sistema

| Rol | Acceso | Funciones principales |
|---|---|---|
| **Admin** | Panel `/admin/*` con login | Dashboard de métricas, gestión de barberos y servicios, configuración de horarios, vista de todas las citas, resumen de pagos y comisiones, control de inventario |
| **Barbero** | Panel `/barbero/*` con login | Agenda del día, resumen de ganancias por quincena, reporte de productos agotados |
| **Cliente** | Flujo público `/reservar` | Reserva de cita en 3 pasos (servicio → barbero/fecha → confirmación) sin necesidad de cuenta; consulta y cancelación de cita por enlace |

---

## Stack tecnológico

### Backend

| Tecnología | Versión | Rol |
|---|---|---|
| **Python** | 3.12 | Lenguaje |
| **FastAPI** | 0.135 | Framework HTTP / REST API |
| **SQLAlchemy** | 2.0 | ORM (async) |
| **PostgreSQL** | — | Base de datos relacional |
| **Alembic** | — | Migraciones de esquema |
| **Pydantic v2** | — | Validación de esquemas |
| **python-jose** | — | Autenticación JWT (HS256) |
| **passlib / bcrypt** | — | Hash de contraseñas |
| **APScheduler** | — | Recordatorios por email (24 h y 2 h antes) |
| **Resend** | — | Envío de emails transaccionales |
| **uvicorn** | — | Servidor ASGI |

### Frontend

| Tecnología | Versión | Rol |
|---|---|---|
| **React** | 19 | UI |
| **TypeScript** | 5.9 | Tipado estricto |
| **Vite** | 8 | Bundler / dev server |
| **Tailwind CSS** | v4 | Estilos (Vite plugin, sin config separada) |
| **react-router-dom** | v7 | Enrutamiento SPA |
| **TanStack Query** | v5 | Server state / caché de API |
| **zustand** | v5 | Estado global (auth/sesión) |
| **axios** | — | Cliente HTTP con interceptor JWT |
| **react-hook-form** | v7 | Formularios |

---

## Estructura del repositorio

```
barberos/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/        # Un router por dominio (auth, admin, citas, horarios, pagos, inventario, public)
│   │   ├── core/
│   │   │   ├── config.py      # Variables de entorno (pydantic-settings)
│   │   │   └── security.py    # JWT + hashing
│   │   ├── db/
│   │   │   ├── database.py    # Engine async + dependencia get_db
│   │   │   └── models/        # Modelos SQLAlchemy (12 tablas)
│   │   ├── schemas/           # Esquemas Pydantic por dominio
│   │   ├── services/          # Lógica de negocio desacoplada de HTTP
│   │   └── main.py            # App FastAPI, middleware, routers
│   ├── alembic/               # Migraciones
│   ├── .env.example
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── api/               # Instancia axios + funciones por dominio
        ├── components/        # Componentes reutilizables (layouts, guards)
        ├── pages/
        │   ├── admin/         # AdminDashboard, AdminBarberos, AdminServicios,
        │   │                  #   AdminCitas, AdminHorarios, AdminPagos, AdminInventario
        │   ├── barbero/       # BarberoAgenda, BarberoGanancias, BarberoInventario
        │   └── public/        # HomePage, ReservarPage, CitaPage
        ├── services/          # Llamadas HTTP agrupadas por rol
        ├── store/             # Zustand stores (authStore)
        ├── types/             # Interfaces TypeScript que reflejan los schemas del backend
        └── utils/             # Helpers de fecha/hora (zona horaria Bogotá)
```

---

## Correr el proyecto localmente

### Requisitos previos

- Python 3.12+
- Node.js 20+
- PostgreSQL 15+ corriendo localmente

### 1. Backend

```bash
cd backend

# Crear y activar entorno virtual
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL, SECRET_KEY y RESEND_API_KEY

# Aplicar migraciones
alembic upgrade head

# Iniciar servidor de desarrollo
uvicorn app.main:app --reload
```

La API queda disponible en `http://localhost:8000`.  
Documentación interactiva: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend

npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

> El frontend apunta a `http://localhost:8000/api/v1` por defecto. Asegúrate de que el backend esté corriendo antes de usar el frontend.

### Comandos adicionales (frontend)

```bash
npm run build     # Build de producción (type-check + Vite)
npm run lint      # ESLint
npm run preview   # Preview del build de producción
```

---

## Variables de entorno (backend)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL (`postgresql+asyncpg://...`) |
| `SECRET_KEY` | Clave secreta para firmar los JWT |
| `ALGORITHM` | Algoritmo JWT (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del access token en minutos |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Expiración del refresh token en días |
| `RESEND_API_KEY` | API key de Resend para emails transaccionales |

---

## Modelo de datos

El backend gestiona 12 entidades principales:

`admins` · `barberos` · `servicios` · `barbero_servicios` · `horarios` · `barbero_bloqueos` · `bloqueos_generales` · `clientes` · `citas` · `pagos` · `inventario` · `inventario_alertas`

**Reglas de negocio clave:**
- Reserva mínima 30 minutos antes, máxima 1 mes adelante
- Cancelación por cliente hasta 1 hora antes
- Comisión: 40 % barbero / 60 % barbería sobre cada servicio

---

## Capturas de pantalla

Las capturas de pantalla del sistema (vista pública, panel admin y panel barbero) se encuentran en `/docs/screenshots/`.

---

## Autor

**Diego Alejandro Correa**
