import uuid
from decimal import Decimal
from datetime import datetime
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class Pago(Base):
    __tablename__ = "pagos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cita_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("citas.id"), unique=True, nullable=False)
    monto_total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    monto_barbero: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    monto_barberia: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())

    cita: Mapped["Cita"] = relationship("Cita", back_populates="pago")
