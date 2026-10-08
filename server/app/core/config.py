"""HopperAudit – application configuration via Pydantic Settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── App ────────────────────────────────────────────────
    APP_NAME: str = "HopperAudit"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # ── Database ───────────────────────────────────────────
    DATABASE_URL: str = "postgresql+psycopg://hopper:hopper_pass@localhost:5432/hopperaudit"

    # ── JWT Auth ───────────────────────────────────────────
    SECRET_KEY: str = "CHANGE-ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 h

    # ── S3 / Media Storage ─────────────────────────────────
    S3_BUCKET_NAME: str = "hopperaudit-media"
    S3_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    S3_ENDPOINT_URL: str | None = None  # set for MinIO

    # ── AI / YOLO ──────────────────────────────────────────
    YOLO_MODEL_PATH: str = "yolov8n.pt"
    ULTRALYTICS_API_KEY: str | None = None
    CONFIDENCE_THRESHOLD: float = 0.25

    # ── Contamination thresholds ───────────────────────────
    PASS_THRESHOLD: int = 85
    HOLD_THRESHOLD: int = 60

    # ── Upload limits ──────────────────────────────────────
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png"
    MAX_IMAGES_PER_INSPECTION: int = 5

    @property
    def allowed_extensions_set(self) -> set[str]:
        return {ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",")}

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
