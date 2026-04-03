import uuid
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel


class PagoCreate(BaseModel):
    cita_id: uuid.UUID
    monto_total: Decimal


class PagoOut(BaseModel):
    id: uuid.UUID
    cita_id: uuid.UUID
    monto_total: Decimal
    monto_barbero: Decimal
    monto_barberia: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumenQuincena(BaseModel):
    barbero_id: uuid.UUID
    barbero_nombre: str
    periodo_inicio: date
    periodo_fin: date
    total_servicios: int
    total_ganado: Decimal


class ResumenAdmin(BaseModel):
    periodo_inicio: date
    periodo_fin: date
    total_ingresos: Decimal
    total_comisiones_barberos: Decimal
    total_barberia: Decimal
    citas_completadas: int
    desglose_por_barbero: list[ResumenQuincena]
