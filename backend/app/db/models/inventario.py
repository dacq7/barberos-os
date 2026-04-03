import uuid
from datetime import datetime
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from typing import Optional

from app.db.database import Base


class Inventario(Base):
    __tablename__ = "inventario"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unidad: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    umbral_minimo: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())

    alertas: Mapped[list["InventarioAlerta"]] = relationship("InventarioAlerta", back_populates="inventario")
