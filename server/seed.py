"""Seed the database with initial data for development/demo."""

import sys
import os

# Ensure the server directory is on the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.user import User

from app.models.inspection import Inspection
from app.models.media import Media
from app.models.detection import Detection

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:

    # ── Users ─────────────────────────────────────────────
    users_data = [
        {
            "name": "Admin User",
            "email": "admin@hopperaudit.com",
            "password": "admin123",
            "role": "admin",

        },
        {
            "name": "Raj Kumar",
            "email": "raj@hopperaudit.com",
            "password": "supervisor123",
            "role": "supervisor",

        },
        {
            "name": "Priya Sharma",
            "email": "priya@hopperaudit.com",
            "password": "supervisor123",
            "role": "supervisor",

        },
        {
            "name": "Station Manager",
            "email": "manager@hopperaudit.com",
            "password": "manager123",
            "role": "manager",

        },
    ]

    for data in users_data:
        existing = db.query(User).filter(User.email == data["email"]).first()
        if not existing:
            u = User(
                name=data["name"],
                email=data["email"],
                password_hash=hash_password(data["password"]),
                role=data["role"],

            )
            db.add(u)
            print(f"  ✅ User: {u.email}  (password: {data['password']})")
        else:
            print(f"  ⏭  User exists: {existing.email}")

    db.commit()
    print("\n🎉 Seed complete!")

finally:
    db.close()
