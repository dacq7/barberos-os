import uuid
from datetime import date
from sqlalchemy import Date, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from typing import Optional

from app.db.database import Base


class BloqueoGeneral(Base):
    __tablename__ = "bloqueos_generales"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date] = mapped_column(Date, nullable=False)
    motivo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
