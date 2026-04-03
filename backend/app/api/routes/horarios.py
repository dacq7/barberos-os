import uuid
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.security import get_current_admin
from app.schemas.horario import (
    HorarioCreate,
    HorarioOut,
    BarberoBloqueoCreate,
    BarberoBloqueoOut,
    BloqueoGeneralCreate,
    DisponibilidadResponse,
)
from app.services import horario_service

router = APIRouter(tags=["horarios"])


@router.get("/horarios", response_model=list[HorarioOut])
async def get_horarios(db: AsyncSession = Depends(get_db)):
    return await horario_service.get_horario_barberia(db)


@router.post("/admin/horarios", response_model=HorarioOut)
async def set_horario(
    data: HorarioCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await horario_service.set_horario(data, db)


@router.get("/disponibilidad/{barbero_id}/{fecha}", response_model=DisponibilidadResponse)
async def get_disponibilidad(
    barbero_id: uuid.UUID,
    fecha: date,
    db: AsyncSession = Depends(get_db),
):
    return await horario_service.get_disponibilidad(barbero_id, fecha, db)


@router.post("/admin/bloqueos/barbero", response_model=BarberoBloqueoOut, status_code=201)
async def crear_bloqueo_barbero(
    data: BarberoBloqueoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await horario_service.crear_bloqueo_barbero(data, db)


@router.post("/admin/bloqueos/general", status_code=201)
async def crear_bloqueo_general(
    data: BloqueoGeneralCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await horario_service.crear_bloqueo_general(data, db)
