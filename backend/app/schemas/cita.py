import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

from app.db.models.cita import EstadoCita
from app.schemas.barbero import BarberoOut
from app.schemas.servicio import ServicioOut


class CitaCreate(BaseModel):
    cliente_nombre: str
    cliente_email: EmailStr
    cliente_telefono: Optional[str] = None
    barbero_id: uuid.UUID
    servicio_id: uuid.UUID
    fecha_hora: datetime
    notas: Optional[str] = None


class CitaOut(BaseModel):
    id: uuid.UUID
    cliente_id: uuid.UUID
    barbero_id: uuid.UUID
    servicio_id: uuid.UUID
    fecha_hora: datetime
    estado: EstadoCita
    notas: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ClienteSimple(BaseModel):
    nombre: str
    email: Optional[str]
    telefono: Optional[str]

    model_config = {"from_attributes": True}


class CitaDetalleOut(BaseModel):
    id: uuid.UUID
    cliente_id: uuid.UUID
    barbero_id: uuid.UUID
    servicio_id: uuid.UUID
    fecha_hora: datetime
    estado: EstadoCita
    notas: Optional[str]
    created_at: datetime
    barbero: BarberoOut
    servicio: ServicioOut
    cliente: ClienteSimple

    model_config = {"from_attributes": True}


class ReagendarRequest(BaseModel):
    nueva_fecha_hora: datetime


class CancelacionRequest(BaseModel):
    motivo: Optional[str] = None


class CambioEstadoRequest(BaseModel):
    estado: EstadoCita
