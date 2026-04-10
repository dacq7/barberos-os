import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, admin, horarios, citas, pagos, inventario, public
from app.core.config import settings
from app.services.scheduler_service import scheduler

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    logger.info("Scheduler iniciado")
    yield
    scheduler.shutdown(wait=False)
    logger.info("Scheduler detenido")


app = FastAPI(title="BarberOS API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(horarios.router, prefix="/api/v1")
app.include_router(citas.router, prefix="/api/v1")
app.include_router(pagos.router, prefix="/api/v1")
app.include_router(inventario.router, prefix="/api/v1")
app.include_router(public.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/debug-cors")
async def debug_cors():
    from app.core.config import settings
    return {
        "ALLOWED_ORIGINS_STR": settings.ALLOWED_ORIGINS_STR,
        "ALLOWED_ORIGINS": settings.ALLOWED_ORIGINS
    }
