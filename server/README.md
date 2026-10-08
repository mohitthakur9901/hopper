# HopperAudit Server

AI-powered waste-load inspection API built with **FastAPI**, **PostgreSQL**, **YOLO v8**, and **S3/MinIO**.

## Architecture

```
Mobile App → FastAPI API → PostgreSQL
                  ↓
             S3 / MinIO (media)
                  ↓
          YOLO AI Service (detections)
```

## Quick Start

### Option 1: Docker Compose (recommended)

```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **MinIO** (S3) on `localhost:9000` (console: `localhost:9001`)
- **FastAPI** on `localhost:8000`

### Option 2: Local Development

```bash
# 1. Create venv and install deps
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# 2. Start PostgreSQL & MinIO (or use Docker for just these)
docker-compose up db minio -d

# 3. Run the server
.venv/bin/uvicorn app.main:app --reload --port 8000

# 4. Seed demo data
.venv/bin/python seed.py
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Login & get JWT token |
| GET | `/api/v1/stations/` | List transfer stations |
| POST | `/api/v1/stations/` | Create station (admin) |
| POST | `/api/v1/inspections/` | Create new inspection |
| POST | `/api/v1/inspections/{id}/media` | Upload images |
| POST | `/api/v1/inspections/{id}/analyze` | Run AI analysis |
| GET | `/api/v1/inspections/{id}` | Get inspection details |
| GET | `/api/v1/inspections/` | List inspection history |
| GET | `/api/v1/dashboard/stats` | Dashboard statistics |
| GET | `/health` | Health check |

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hopperaudit.com | admin123 |
| Supervisor | raj@hopperaudit.com | supervisor123 |
| Supervisor | priya@hopperaudit.com | supervisor123 |
| Manager | manager@hopperaudit.com | manager123 |

## Project Structure

```
server/
├── app/
│   ├── core/
│   │   ├── config.py          # Pydantic Settings
│   │   ├── database.py        # SQLAlchemy engine & session
│   │   └── security.py        # JWT & password hashing
│   ├── models/
│   │   ├── user.py
│   │   ├── station.py
│   │   ├── inspection.py
│   │   ├── media.py
│   │   └── detection.py
│   ├── schemas/
│   │   ├── user.py
│   │   ├── station.py
│   │   └── inspection.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── stations.py
│   │   └── inspections.py
│   ├── services/
│   │   ├── ai_service.py      # YOLO detection + scoring
│   │   └── storage.py         # S3/MinIO helper
│   └── main.py                # FastAPI app factory
├── alembic/                   # Database migrations
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── seed.py
└── .env
```

## Inspection Workflow

```
1. POST /inspections         → CREATED
2. POST /inspections/{id}/media  → UPLOADING
3. POST /inspections/{id}/analyze → PROCESSING → COMPLETED
4. GET  /inspections/{id}    → Full result with detections
```

## AI Detection

Uses YOLOv8 for object detection, mapping COCO classes to contamination categories:

| Category | Severity | Score Penalty |
|----------|----------|---------------|
| Battery | CRITICAL | -60 |
| E-waste | CRITICAL | -40 |
| Glass | HIGH | -10 |
| Metal | HIGH | -10 |
| Plastic film | HIGH | -20 |
| Plastic container | MEDIUM | -15 |
| Plastic bag | MEDIUM | -15 |

### Decision Logic

- Score ≥ 85 → **PASS**
- Score 60–84 → **HOLD**
- Score < 60 → **REJECT**
- Hazardous material (confidence ≥ 70%) → **REJECT** (override)
