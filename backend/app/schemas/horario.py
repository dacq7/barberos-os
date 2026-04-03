import uuid
from datetime import date, time
from typing import Optional
from pydantic import BaseModel


class HorarioCreate(BaseModel):
    dia_semana: int  # 0=lunes, 6=domingo
    hora_inicio: time
    hora_fin: time
    activo: bool = True


class HorarioOut(BaseModel):
    id: uuid.UUID
    dia_semana: int
    hora_inicio: time
    hora_fin: time
    activo: bool

    model_config = {"from_attributes": True}


class BarberoBloqueoCreate(BaseModel):
    barbero_id: uuid.UUID
    fecha_inicio: date
    fecha_fin: date
    motivo: Optional[str] = None


class BarberoBloqueoOut(BaseModel):
    id: uuid.UUID
    barbero_id: uuid.UUID
    fecha_inicio: date
    fecha_fin: date
    motivo: Optional[str]

    model_config = {"from_attributes": True}


class BloqueoGeneralCreate(BaseModel):
    fecha_inicio: date
    fecha_fin: date
    motivo: Optional[str] = None


class SlotDisponible(BaseModel):
    hora: time
    disponible: bool


class DisponibilidadResponse(BaseModel):
    fecha: date
    barbero_id: uuid.UUID
    slots: list[SlotDisponible]
