import uuid
from decimal import Decimal
from sqlalchemy import String, Boolean, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from typing import Optional

from app.db.database import Base


class Servicio(Base):
    __tablename__ = "servicios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())

    barberos: Mapped[list["BarberoServicio"]] = relationship("BarberoServicio", back_populates="servicio")
    citas: Mapped[list["Cita"]] = relationship("Cita", back_populates="servicio")
