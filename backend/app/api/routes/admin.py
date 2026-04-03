import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.security import get_current_admin
from app.schemas.barbero import BarberoCreate, BarberoOut
from app.schemas.servicio import ServicioCreate, ServicioUpdate, ServicioOut
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/barberos", response_model=list[BarberoOut])
async def listar_barberos(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await admin_service.listar_barberos(db)


@router.post("/barberos", response_model=BarberoOut, status_code=201)
async def crear_barbero(
    data: BarberoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await admin_service.crear_barbero(data, db)


@router.get("/servicios", response_model=list[ServicioOut])
async def listar_servicios(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await admin_service.listar_servicios(db)


@router.post("/servicios", response_model=ServicioOut, status_code=201)
async def crear_servicio(
    data: ServicioCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await admin_service.crear_servicio(data, db)


@router.put("/servicios/{servicio_id}", response_model=ServicioOut)
async def actualizar_servicio(
    servicio_id: uuid.UUID,
    data: ServicioUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await admin_service.actualizar_servicio(servicio_id, data, db)
