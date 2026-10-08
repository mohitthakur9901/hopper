"""Pydantic schemas for Inspections, Media & Detections."""

from datetime import datetime
from pydantic import BaseModel


# ── Detection ──────────────────────────────────────────────
class DetectionOut(BaseModel):
    id: int
    category: str
    confidence: float
    x: float
    y: float
    width: float
    height: float
    severity: str

    model_config = {"from_attributes": True}


# ── Media ──────────────────────────────────────────────────
class MediaOut(BaseModel):
    id: int
    type: str
    original_url: str
    annotated_url: str | None
    detections: list[DetectionOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class InspectionOut(BaseModel):
    id: int
    inspection_uid: str

    user_id: int
    status: str
    decision: str | None
    contamination_score: float | None
    processing_time_ms: int | None
    media: list[MediaOut] = []
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class InspectionBrief(BaseModel):
    """Lightweight schema for listing / history."""
    id: int
    inspection_uid: str

    status: str
    decision: str | None
    contamination_score: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


class InspectionStatusOut(BaseModel):
    inspection_id: str
    status: str


# ── Dashboard ──────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_inspections: int
    pass_count: int
    hold_count: int
    reject_count: int
    contamination_rate: float
    most_detected_category: str | None
