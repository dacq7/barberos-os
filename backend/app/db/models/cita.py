import uuid
import enum
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from typing import Optional

from app.db.database import Base


class EstadoCita(str, enum.Enum):
    pendiente = "pendiente"
    confirmada = "confirmada"
    completada = "completada"
    cancelada = "cancelada"
    no_show = "no_show"


class Cita(Base):
    __tablename__ = "citas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cliente_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clientes.id"), nullable=False)
    barbero_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("barberos.id"), nullable=False)
    servicio_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("servicios.id"), nullable=False)
    fecha_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    estado: Mapped[EstadoCita] = mapped_column(SAEnum(EstadoCita), nullable=False, default=EstadoCita.pendiente)
    notas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recordatorio_24h_enviado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    recordatorio_2h_enviado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())

    cliente: Mapped["Cliente"] = relationship("Cliente", back_populates="citas")
    barbero: Mapped["Barbero"] = relationship("Barbero", back_populates="citas")
    servicio: Mapped["Servicio"] = relationship("Servicio", back_populates="citas")
    pago: Mapped[Optional["Pago"]] = relationship("Pago", back_populates="cita", uselist=False)
