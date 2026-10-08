"""HopperAudit – FastAPI application factory."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.routers.auth import router as auth_router

from app.routers.inspections import router as inspections_router, dashboard_router

# ── Logging ────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description=(
            "AI-powered waste-load inspection API for transfer-station supervisors. "
            "Detects contamination via computer vision and provides PASS / HOLD / REJECT decisions."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ── CORS ───────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # tighten for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Create tables ─────────────────────────────────────
    # Import all models so Base.metadata sees them
    from app.models import user, inspection, media, detection  # noqa: F401

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ensured.")

    # ── Register routers ──────────────────────────────────
    app.include_router(auth_router)

    app.include_router(inspections_router)
    app.include_router(dashboard_router)

    # ── Health check ──────────────────────────────────────
    @app.get("/health", tags=["Health"])
    def health():
        return {"status": "ok", "app": settings.APP_NAME}

    logger.info("HopperAudit API ready  (%s)", settings.APP_ENV)
    return app


app = create_app()
