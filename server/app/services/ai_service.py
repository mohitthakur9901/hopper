"""YOLO-based AI detection service for contamination analysis."""

import io
import time
import logging
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Lazy-load the YOLO model ──────────────────────────────
_model = None


def _get_model():
    global _model
    if _model is None:
        from ultralytics import YOLO, settings as ul_settings

        if settings.ULTRALYTICS_API_KEY:
            ul_settings.update({"api_key": settings.ULTRALYTICS_API_KEY})

        model_path = settings.YOLO_MODEL_PATH
        logger.info("Loading YOLO model from %s …", model_path)
        _model = YOLO(model_path)
        logger.info("YOLO model loaded – classes: %s", list(_model.names.values()))
    return _model


# ── Contamination category mapping ────────────────────────
# Maps COCO class names → HopperAudit contamination categories.
# Extend / retrain for a production model.
CONTAMINATION_MAP: dict[str, str] = {
    # Plastics
    "bottle": "plastic_container",
    "cup": "plastic_container",
    # Electronics / hazardous
    "cell phone": "e_waste",
    "laptop": "e_waste",
    "remote": "e_waste",
    "keyboard": "e_waste",
    "mouse": "e_waste",
    "tv": "e_waste",
    "microwave": "e_waste",
    # Metal
    "knife": "metal",
    "fork": "metal",
    "spoon": "metal",
    "scissors": "metal",
    # Glass
    "wine glass": "glass",
    # General refuse indicators
    "handbag": "plastic_bag",
    "backpack": "plastic_bag",
    "suitcase": "plastic_bag",
    "umbrella": "other_contamination",
    "toothbrush": "other_contamination",
}

# ── Severity mapping per contamination category ───────────
SEVERITY_MAP: dict[str, str] = {
    "battery": "CRITICAL",
    "e_waste": "CRITICAL",
    "hazardous": "CRITICAL",
    "glass": "HIGH",
    "metal": "HIGH",
    "plastic_film": "HIGH",
    "plastic_container": "MEDIUM",
    "plastic_bag": "MEDIUM",
    "other_contamination": "LOW",
}

# ── Score penalties per category (FR-011) ─────────────────
SCORE_PENALTY: dict[str, int] = {
    "battery": 60,
    "hazardous": 80,
    "e_waste": 40,
    "glass": 10,
    "metal": 10,
    "plastic_film": 20,
    "plastic_container": 15,
    "plastic_bag": 15,
    "other_contamination": 5,
}

HAZARDOUS_CATEGORIES = {"battery", "e_waste", "hazardous"}

# ── Detection result dataclass-like dict ──────────────────
DetectionResult = dict  # keys: category, confidence, x, y, width, height, severity


def analyze_image(image_bytes: bytes) -> dict:
    """
    Run YOLO inference on a single image.

    Returns:
        {
            "detections": [ {category, confidence, x, y, w, h, severity}, … ],
            "annotated_image_bytes": bytes (JPEG),
            "processing_time_ms": int,
        }
    """
    t0 = time.time()
    model = _get_model()

    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")

    # Run inference
    results = model.predict(
        source=img,
        conf=settings.CONFIDENCE_THRESHOLD,
        verbose=False,
    )

    detections: list[DetectionResult] = []
    annotated_img = img.copy()

    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls_id = int(box.cls[0])
            cls_name = model.names[cls_id]
            confidence = float(box.conf[0])

            # Map COCO class → contamination category
            category = CONTAMINATION_MAP.get(cls_name)
            if category is None:
                continue  # skip non-contamination objects

            x1, y1, x2, y2 = box.xyxy[0].tolist()
            severity = SEVERITY_MAP.get(category, "LOW")

            detections.append(
                {
                    "category": category,
                    "confidence": round(confidence, 4),
                    "x": round(x1, 2),
                    "y": round(y1, 2),
                    "width": round(x2 - x1, 2),
                    "height": round(y2 - y1, 2),
                    "severity": severity,
                }
            )

            # Draw bounding box on annotated image
            color = {
                "CRITICAL": (0, 0, 255),
                "HIGH": (0, 128, 255),
                "MEDIUM": (0, 255, 255),
                "LOW": (0, 255, 0),
            }.get(severity, (255, 255, 255))

            cv2.rectangle(annotated_img, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
            label = f"{category} {confidence:.0%}"
            cv2.putText(
                annotated_img,
                label,
                (int(x1), int(y1) - 8),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                color,
                2,
            )

    # Encode annotated image as JPEG
    _, buf = cv2.imencode(".jpg", annotated_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    annotated_bytes = buf.tobytes()

    elapsed_ms = int((time.time() - t0) * 1000)
    logger.info("YOLO inference complete: %d detections in %d ms", len(detections), elapsed_ms)

    return {
        "detections": detections,
        "annotated_image_bytes": annotated_bytes,
        "processing_time_ms": elapsed_ms,
    }


def compute_contamination_score(all_detections: list[DetectionResult]) -> dict:
    """
    Aggregate detections from multiple images and compute:
    - contamination_score (0–100, higher = cleaner)
    - decision: PASS | HOLD | REJECT
    - hazardous_override: bool

    Implements FR-011, FR-012, FR-013.
    """
    base_score = 100
    total_penalty = 0
    hazardous_detected = False
    category_counts: dict[str, int] = {}

    for det in all_detections:
        cat = det["category"]
        penalty = SCORE_PENALTY.get(cat, 5)
        # Weight penalty by confidence
        total_penalty += penalty * det["confidence"]
        category_counts[cat] = category_counts.get(cat, 0) + 1

        if cat in HAZARDOUS_CATEGORIES and det["confidence"] >= 0.70:
            hazardous_detected = True

    score = max(0, round(base_score - total_penalty))

    # FR-013: hazardous override
    if hazardous_detected:
        decision = "REJECT"
    elif score >= settings.PASS_THRESHOLD:
        decision = "PASS"
    elif score >= settings.HOLD_THRESHOLD:
        decision = "HOLD"
    else:
        decision = "REJECT"

    # Most-detected category
    most_detected = max(category_counts, key=category_counts.get) if category_counts else None

    return {
        "contamination_score": score,
        "decision": decision,
        "hazardous_override": hazardous_detected,
        "category_counts": category_counts,
        "most_detected": most_detected,
    }
