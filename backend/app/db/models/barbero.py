import uuid
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from typing import Optional

from app.db.database import Base


class Barbero(Base):
    __tablename__ = "barberos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    telefono: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    foto_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())

    servicios: Mapped[list["BarberoServicio"]] = relationship("BarberoServicio", back_populates="barbero")
    bloqueos: Mapped[list["BarberoBloqueo"]] = relationship("BarberoBloqueo", back_populates="barbero")
    citas: Mapped[list["Cita"]] = relationship("Cita", back_populates="barbero")
    alertas: Mapped[list["InventarioAlerta"]] = relationship("InventarioAlerta", back_populates="barbero")
