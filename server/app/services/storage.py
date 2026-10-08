"""S3 / MinIO storage service for media uploads."""

import uuid
from io import BytesIO

import boto3
from botocore.exceptions import ClientError
from botocore.config import Config

from app.core.config import settings


def _get_s3_client():
    kwargs = {
        "service_name": "s3",
        "region_name": settings.S3_REGION,
        "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
        "config": Config(s3={'addressing_style': 'path'}),
    }
    if settings.S3_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
    return boto3.client(**kwargs)


def ensure_bucket_exists():
    """Create the S3 bucket if it doesn't exist (useful for local MinIO)."""
    s3 = _get_s3_client()
    try:
        s3.head_bucket(Bucket=settings.S3_BUCKET_NAME)
    except ClientError:
        s3.create_bucket(Bucket=settings.S3_BUCKET_NAME)


def upload_file(file_bytes: bytes, extension: str, folder: str = "originals") -> str:
    """Upload bytes to S3 and return the object key."""
    s3 = _get_s3_client()
    key = f"{folder}/{uuid.uuid4().hex}.{extension}"
    s3.upload_fileobj(
        BytesIO(file_bytes),
        settings.S3_BUCKET_NAME,
        key,
        ExtraArgs={"ContentType": f"image/{extension}"},
    )
    return key


def upload_annotated(file_bytes: bytes, extension: str = "jpg") -> str:
    """Upload an AI-annotated image and return the object key."""
    return upload_file(file_bytes, extension, folder="annotated")


def get_presigned_url(key: str, expires_in: int = 3600) -> str:
    """Generate a presigned URL for downloading a stored object."""
    s3 = _get_s3_client()
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
        ExpiresIn=expires_in,
    )

def generate_presigned_upload_url(key: str, expires_in: int = 3600) -> str:
    """Generate a presigned URL for uploading a stored object (PUT)."""
    s3 = _get_s3_client()
    return s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
        ExpiresIn=expires_in,
    )
