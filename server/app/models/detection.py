"""Detection ORM model."""

from datetime import datetime, timezone

from sqlalchemy import Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    media_id: Mapped[int] = mapped_column(Integer, ForeignKey("media.id"), nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    x: Mapped[float] = mapped_column(Float, nullable=False)  # bbox x
    y: Mapped[float] = mapped_column(Float, nullable=False)  # bbox y
    width: Mapped[float] = mapped_column(Float, nullable=False)  # bbox width
    height: Mapped[float] = mapped_column(Float, nullable=False)  # bbox height
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False, default="LOW"
    )  # LOW | MEDIUM | HIGH | CRITICAL
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    media = relationship("Media", back_populates="detections")
