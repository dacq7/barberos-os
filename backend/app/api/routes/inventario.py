import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.security import get_current_admin, get_current_barbero
from app.schemas.inventario import (
    InventarioCreate,
    InventarioUpdate,
    InventarioOut,
    AlertaCreate,
    AlertaOut,
)
from app.services import inventario_service

router = APIRouter(tags=["inventario"])


@router.get("/admin/inventario", response_model=list[InventarioOut])
async def listar_inventario(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await inventario_service.listar_inventario(db)


@router.post("/admin/inventario", response_model=InventarioOut, status_code=201)
async def crear_producto(
    data: InventarioCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await inventario_service.crear_producto(data, db)


@router.put("/admin/inventario/{producto_id}", response_model=InventarioOut)
async def actualizar_producto(
    producto_id: uuid.UUID,
    data: InventarioUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await inventario_service.actualizar_producto(producto_id, data, db)


@router.get("/admin/inventario/alertas", response_model=list[AlertaOut])
async def listar_alertas(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await inventario_service.listar_alertas(db)


@router.post("/barbero/inventario/alertas", response_model=AlertaOut, status_code=201)
async def reportar_agotamiento(
    data: AlertaCreate,
    db: AsyncSession = Depends(get_db),
    barbero=Depends(get_current_barbero),
):
    return await inventario_service.reportar_agotamiento(barbero.id, data, db)
