import uuid
from datetime import date
from sqlalchemy import Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from typing import Optional

from app.db.database import Base


class BarberoBloqueo(Base):
    __tablename__ = "barbero_bloqueos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    barbero_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("barberos.id"), nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date] = mapped_column(Date, nullable=False)
    motivo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    barbero: Mapped["Barbero"] = relationship("Barbero", back_populates="bloqueos")
