"""Inspection router – create, upload media, analyze, get results, history."""

import logging
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.detection import Detection
from app.models.inspection import Inspection
from app.models.media import Media
from app.models.user import User
from app.schemas.inspection import (
    DashboardStats,
    InspectionBrief,
    InspectionOut,
    InspectionStatusOut,
)
from app.services import ai_service, storage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/inspections", tags=["Inspections"])


def _generate_uid() -> str:
    """Generate a unique inspection ID like INS-20261008-001042."""
    now = datetime.now(timezone.utc)
    return f"INS-{now.strftime('%Y%m%d-%H%M%S')}"


# ───────────────────────────────────────────────────────────
# POST /api/v1/inspections  –  FR-003
# ───────────────────────────────────────────────────────────
@router.post("/", response_model=InspectionStatusOut, status_code=status.HTTP_201_CREATED)
def create_inspection(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inspection = Inspection(
        inspection_uid=_generate_uid(),

        user_id=current_user.id,
        status="CREATED",
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    return InspectionStatusOut(
        id=inspection.id,
        inspection_uid=inspection.inspection_uid, 
        status=inspection.status
    )


# ───────────────────────────────────────────────────────────
# POST /api/v1/inspections/{id}/media  –  FR-004, FR-005
# ───────────────────────────────────────────────────────────
@router.post("/{inspection_id}/media")
async def upload_media(
    inspection_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inspection = (
        db.query(Inspection)
        .filter(Inspection.id == inspection_id, Inspection.user_id == current_user.id)
        .first()
    )
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    if inspection.status not in ("CREATED", "UPLOADING"):
        raise HTTPException(status_code=400, detail="Inspection is not accepting uploads")

    existing_count = db.query(Media).filter(Media.inspection_id == inspection.id).count()
    if existing_count + len(files) > settings.MAX_IMAGES_PER_INSPECTION:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {settings.MAX_IMAGES_PER_INSPECTION} images per inspection",
        )

    inspection.status = "UPLOADING"
    uploaded = []

    for f in files:
        ext = f.filename.rsplit(".", 1)[-1].lower() if f.filename else ""
        if ext not in settings.allowed_extensions_set:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

        contents = await f.read()
        if len(contents) > settings.max_file_size_bytes:
            raise HTTPException(status_code=400, detail="Maximum file size exceeded")

        key = storage.upload_file(contents, ext)
        media = Media(
            inspection_id=inspection.id,
            type="image",
            original_url=key,
        )
        db.add(media)
        uploaded.append(key)

    db.commit()
    total = db.query(Media).filter(Media.inspection_id == inspection.id).count()
    return {
        "inspection_id": inspection.inspection_uid,
        "media_count": total,
        "status": inspection.status,
    }


from pydantic import BaseModel
class PresignedUrlRequest(BaseModel):
    files_count: int
    extension: str = "jpg"

class PresignedUrlResponse(BaseModel):
    urls: list[str]

@router.post("/{inspection_id}/media/presigned-urls", response_model=PresignedUrlResponse)
def get_upload_urls(
    inspection_id: int,
    request: PresignedUrlRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inspection = (
        db.query(Inspection)
        .filter(Inspection.id == inspection_id, Inspection.user_id == current_user.id)
        .first()
    )
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    if inspection.status not in ("CREATED", "UPLOADING"):
        raise HTTPException(status_code=400, detail="Inspection is not accepting uploads")

    existing_count = db.query(Media).filter(Media.inspection_id == inspection.id).count()
    if existing_count + request.files_count > settings.MAX_IMAGES_PER_INSPECTION:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {settings.MAX_IMAGES_PER_INSPECTION} images per inspection",
        )

    inspection.status = "UPLOADING"
    urls = []

    import uuid
    for _ in range(request.files_count):
        key = f"originals/{uuid.uuid4().hex}.{request.extension}"
        
        media = Media(
            inspection_id=inspection.id,
            type="image",
            original_url=key,
        )
        db.add(media)
        
        url = storage.generate_presigned_upload_url(key)
        urls.append(url)

    db.commit()
    return {"urls": urls}



# ───────────────────────────────────────────────────────────
# POST /api/v1/inspections/{id}/analyze  –  FR-006 → FR-013
# ───────────────────────────────────────────────────────────
@router.post("/{inspection_id}/analyze", response_model=InspectionOut)
def analyze_inspection(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inspection = (
        db.query(Inspection)
        .options(joinedload(Inspection.media))
        .filter(Inspection.id == inspection_id, Inspection.user_id == current_user.id)
        .first()
    )
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    if not inspection.media:
        raise HTTPException(status_code=400, detail="No media uploaded for this inspection")

    inspection.status = "PROCESSING"
    db.commit()

    all_detections = []
    total_time_ms = 0

    try:
        for media_item in inspection.media:
            # Download original image from S3
            import boto3
            from app.services.storage import _get_s3_client

            s3 = _get_s3_client()
            obj = s3.get_object(Bucket=settings.S3_BUCKET_NAME, Key=media_item.original_url)
            image_bytes = obj["Body"].read()

            # Run YOLO inference
            result = ai_service.analyze_image(image_bytes)
            total_time_ms += result["processing_time_ms"]

            # Save annotated image
            annotated_key = storage.upload_annotated(result["annotated_image_bytes"])
            media_item.annotated_url = annotated_key

            # Save detections
            for det in result["detections"]:
                detection = Detection(
                    media_id=media_item.id,
                    category=det["category"],
                    confidence=det["confidence"],
                    x=det["x"],
                    y=det["y"],
                    width=det["width"],
                    height=det["height"],
                    severity=det["severity"],
                )
                db.add(detection)
                all_detections.append(det)

        # Compute contamination score & decision (FR-011, FR-012, FR-013)
        scoring = ai_service.compute_contamination_score(all_detections)

        inspection.contamination_score = scoring["contamination_score"]
        inspection.decision = scoring["decision"]
        inspection.processing_time_ms = total_time_ms
        inspection.status = "COMPLETED"
        inspection.completed_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(inspection)

    except Exception as e:
        logger.exception("AI analysis failed for inspection %s", inspection.inspection_uid)
        inspection.status = "FAILED"
        db.commit()
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

    # Reload with relationships for the response
    inspection = (
        db.query(Inspection)
        .options(joinedload(Inspection.media).joinedload(Media.detections))
        .filter(Inspection.id == inspection.id)
        .first()
    )
    return inspection


# ───────────────────────────────────────────────────────────
# GET /api/v1/inspections/{id}  –  FR-014, FR-016
# ───────────────────────────────────────────────────────────
@router.get("/{inspection_id}", response_model=InspectionOut)
def get_inspection(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inspection = (
        db.query(Inspection)
        .options(joinedload(Inspection.media).joinedload(Media.detections))
        .filter(Inspection.id == inspection_id, Inspection.user_id == current_user.id)
        .first()
    )
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return inspection


# ───────────────────────────────────────────────────────────
# GET /api/v1/inspections  –  FR-015 (history)
# ───────────────────────────────────────────────────────────
@router.get("/", response_model=list[InspectionBrief])
def list_inspections(

    decision: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Inspection).options(joinedload(Inspection.media)).filter(Inspection.user_id == current_user.id)

    if decision:
        q = q.filter(Inspection.decision == decision.upper())
    return q.order_by(Inspection.created_at.desc()).offset(skip).limit(limit).all()


# ───────────────────────────────────────────────────────────
# GET /api/v1/dashboard/stats  –  FR-017
# ───────────────────────────────────────────────────────────
dashboard_router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@dashboard_router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Inspection).filter(Inspection.status == "COMPLETED", Inspection.user_id == current_user.id)


    total = q.count()
    pass_count = q.filter(Inspection.decision == "PASS").count()
    hold_count = q.filter(Inspection.decision == "HOLD").count()
    reject_count = q.filter(Inspection.decision == "REJECT").count()

    contamination_rate = (
        round((hold_count + reject_count) / total * 100, 1) if total > 0 else 0.0
    )

    # Most-detected category
    most_detected = (
        db.query(Detection.category, func.count(Detection.id).label("cnt"))
        .join(Media)
        .join(Inspection)
        .filter(Inspection.status == "COMPLETED", Inspection.user_id == current_user.id)
        .group_by(Detection.category)
        .order_by(func.count(Detection.id).desc())
        .first()
    )

    return DashboardStats(
        total_inspections=total,
        pass_count=pass_count,
        hold_count=hold_count,
        reject_count=reject_count,
        contamination_rate=contamination_rate,
        most_detected_category=most_detected[0] if most_detected else None,
    )
