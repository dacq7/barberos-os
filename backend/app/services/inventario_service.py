import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.db.models.inventario import Inventario
from app.db.models.inventario_alerta import InventarioAlerta
from app.schemas.inventario import (
    InventarioCreate,
    InventarioUpdate,
    InventarioOut,
    AlertaCreate,
    AlertaOut,
)


async def listar_inventario(db: AsyncSession) -> list[InventarioOut]:
    result = await db.execute(select(Inventario).order_by(Inventario.nombre))
    return [InventarioOut.model_validate(p) for p in result.scalars().all()]


async def crear_producto(data: InventarioCreate, db: AsyncSession) -> InventarioOut:
    producto = Inventario(
        nombre=data.nombre,
        cantidad=data.cantidad,
        unidad=data.unidad,
        umbral_minimo=data.umbral_minimo,
    )
    db.add(producto)
    await db.commit()
    await db.refresh(producto)
    return InventarioOut.model_validate(producto)


async def actualizar_producto(
    producto_id: uuid.UUID, data: InventarioUpdate, db: AsyncSession
) -> InventarioOut:
    result = await db.execute(select(Inventario).where(Inventario.id == producto_id))
    producto = result.scalar_one_or_none()
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(producto, field, value)

    await db.commit()
    await db.refresh(producto)
    return InventarioOut.model_validate(producto)


async def productos_bajo_umbral(db: AsyncSession) -> list[InventarioOut]:
    result = await db.execute(
        select(Inventario).where(
            and_(
                Inventario.umbral_minimo.is_not(None),
                Inventario.cantidad <= Inventario.umbral_minimo,
            )
        )
    )
    return [InventarioOut.model_validate(p) for p in result.scalars().all()]


async def reportar_agotamiento(
    barbero_id: uuid.UUID, data: AlertaCreate, db: AsyncSession
) -> AlertaOut:
    res = await db.execute(select(Inventario).where(Inventario.id == data.inventario_id))
    producto = res.scalar_one_or_none()
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    alerta = InventarioAlerta(
        inventario_id=data.inventario_id,
        barbero_id=barbero_id,
        mensaje=data.mensaje,
    )
    db.add(alerta)
    await db.commit()
    await db.refresh(alerta)

    return AlertaOut(
        id=alerta.id,
        inventario_id=alerta.inventario_id,
        barbero_id=alerta.barbero_id,
        mensaje=alerta.mensaje,
        created_at=alerta.created_at,
        producto_nombre=producto.nombre,
    )


async def listar_alertas(db: AsyncSession) -> list[AlertaOut]:
    result = await db.execute(
        select(InventarioAlerta)
        .options(selectinload(InventarioAlerta.inventario))
        .order_by(InventarioAlerta.created_at.desc())
    )
    alertas = result.scalars().all()
    return [
        AlertaOut(
            id=a.id,
            inventario_id=a.inventario_id,
            barbero_id=a.barbero_id,
            mensaje=a.mensaje,
            created_at=a.created_at,
            producto_nombre=a.inventario.nombre,
        )
        for a in alertas
    ]
