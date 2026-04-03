import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class InventarioCreate(BaseModel):
    nombre: str
    cantidad: int
    unidad: Optional[str] = None
    umbral_minimo: int


class InventarioUpdate(BaseModel):
    nombre: Optional[str] = None
    cantidad: Optional[int] = None
    unidad: Optional[str] = None
    umbral_minimo: Optional[int] = None


class InventarioOut(BaseModel):
    id: uuid.UUID
    nombre: str
    cantidad: int
    unidad: Optional[str]
    umbral_minimo: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertaCreate(BaseModel):
    inventario_id: uuid.UUID
    mensaje: Optional[str] = None


class AlertaOut(BaseModel):
    id: uuid.UUID
    inventario_id: uuid.UUID
    barbero_id: Optional[uuid.UUID]
    mensaje: Optional[str]
    created_at: datetime
    producto_nombre: str
