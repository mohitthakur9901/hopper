"""Pydantic schemas for Users & Auth."""

from datetime import datetime
from pydantic import BaseModel, EmailStr


# ── Auth ───────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── User ───────────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "supervisor"



class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    created_at: datetime

    model_config = {"from_attributes": True}
