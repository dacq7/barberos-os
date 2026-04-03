import uuid
from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class BarberoServicio(Base):
    __tablename__ = "barbero_servicios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    barbero_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("barberos.id"), nullable=False)
    servicio_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("servicios.id"), nullable=False)
    duracion_minutos: Mapped[int] = mapped_column(Integer, nullable=False)

    barbero: Mapped["Barbero"] = relationship("Barbero", back_populates="servicios")
    servicio: Mapped["Servicio"] = relationship("Servicio", back_populates="barberos")
