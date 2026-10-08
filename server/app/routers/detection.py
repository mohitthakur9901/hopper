from fastapi import APIRouter, UploadFile, File, HTTPException
import logging
from app.services import ai_service
from app.services import storage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/detection", tags=["Detection"])

@router.post("/")
async def analyze_standalone_image(file: UploadFile = File(...)):
    """
    Standalone endpoint to upload an image, run it through the YOLO model,
    and return the detections directly (without creating an inspection).
    Optionally uploads the annotated image to S3.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
        
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ["jpg", "jpeg", "png"]:
        raise HTTPException(status_code=400, detail="Only JPG/PNG images are supported")
        
    try:
        contents = await file.read()
        
        # Upload original image to S3
        original_key = storage.upload_file(contents, ext)
        original_url = storage.get_presigned_url(original_key)
        
        # Run YOLO inference
        result = ai_service.analyze_image(contents)
        
        # Upload annotated image to S3 to get a URL to display
        annotated_key = storage.upload_annotated(result["annotated_image_bytes"], ext)
        annotated_url = storage.get_presigned_url(annotated_key)
        
        return {
            "detections": result["detections"],
            "processing_time_ms": result["processing_time_ms"],
            "original_url": original_url,
            "annotated_url": annotated_url
        }
    except Exception as e:
        logger.exception("Standalone YOLO detection failed")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
