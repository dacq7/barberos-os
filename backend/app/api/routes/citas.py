import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.security import get_current_admin, get_current_barbero
from app.schemas.cita import (
    CitaCreate,
    CitaOut,
    CitaDetalleOut,
    CancelacionRequest,
    CambioEstadoRequest,
)
from app.services import cita_service

router = APIRouter(tags=["citas"])


@router.post("/citas", response_model=CitaDetalleOut, status_code=201)
async def crear_cita(
    data: CitaCreate,
    db: AsyncSession = Depends(get_db),
):
    return await cita_service.crear_cita(data, db)


@router.get("/citas/{cita_id}", response_model=CitaDetalleOut)
async def get_cita(
    cita_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    return await cita_service.get_cita(cita_id, db)


@router.post("/citas/{cita_id}/cancelar", response_model=CitaOut)
async def cancelar_cita(
    cita_id: uuid.UUID,
    _body: CancelacionRequest = CancelacionRequest(),
    db: AsyncSession = Depends(get_db),
):
    return await cita_service.cancelar_cita(cita_id, db)


@router.get("/admin/citas", response_model=list[CitaDetalleOut])
async def listar_citas_admin(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await cita_service.listar_citas_admin(db)


@router.get("/barbero/citas", response_model=list[CitaDetalleOut])
async def listar_citas_barbero(
    db: AsyncSession = Depends(get_db),
    barbero=Depends(get_current_barbero),
):
    return await cita_service.listar_citas_barbero(barbero.id, db)


@router.put("/admin/citas/{cita_id}/estado", response_model=CitaOut)
async def cambiar_estado_cita(
    cita_id: uuid.UUID,
    data: CambioEstadoRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await cita_service.cambiar_estado_cita(cita_id, data, db)
