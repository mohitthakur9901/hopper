"""Inspection ORM model."""

from datetime import datetime, timezone

from sqlalchemy import Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Inspection(Base):
    __tablename__ = "inspections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    inspection_uid: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False, index=True
    )  # e.g. INS-20261008-001042
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="CREATED"
    )  # CREATED | UPLOADING | PROCESSING | COMPLETED | FAILED
    decision: Mapped[str | None] = mapped_column(
        String(10), nullable=True
    )  # PASS | HOLD | REJECT
    contamination_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    processing_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user = relationship("User", back_populates="inspections")
    media = relationship("Media", back_populates="inspection", cascade="all, delete-orphan")
