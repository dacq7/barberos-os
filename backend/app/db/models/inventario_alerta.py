import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from typing import Optional

from app.db.database import Base


class InventarioAlerta(Base):
    __tablename__ = "inventario_alertas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inventario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("inventario.id"), nullable=False)
    barbero_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("barberos.id"), nullable=True)
    mensaje: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())

    inventario: Mapped["Inventario"] = relationship("Inventario", back_populates="alertas")
    barbero: Mapped[Optional["Barbero"]] = relationship("Barbero", back_populates="alertas")
