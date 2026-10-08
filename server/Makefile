.PHONY: help up down install migrate seed dev clean all docker-up docker-down docker-build docker-logs

# Default target
help:
	@echo "HopperAudit Server Makefile"
	@echo ""
	@echo "Available commands:"
	@echo "  make up          - Start background services (PostgreSQL & LocalStack) via Docker"
	@echo "  make down        - Stop background services"
	@echo "  make install     - Install Python dependencies"
	@echo "  make migrate     - Run database migrations (Alembic)"
	@echo "  make seed        - Seed the database with initial demo data"
	@echo "  make dev         - Start the FastAPI development server (auto-reload)"
	@echo "  make clean       - Remove __pycache__ and .pytest_cache directories"
	@echo "  make all         - Start services, run migrations, seed DB, and start dev server"
	@echo ""
	@echo "Docker commands:"
	@echo "  make docker-up   - Start the entire stack in Docker (DB + S3 + API)"
	@echo "  make docker-down - Stop the entire Docker stack"
	@echo "  make docker-build- Rebuild the API Docker image"
	@echo "  make docker-logs - Tail logs from all Docker services"

up:
	docker-compose up db localstack -d

down:
	docker-compose down

install:
	.venv/bin/pip install -r requirements.txt

migrate:
	.venv/bin/alembic upgrade head

seed:
	.venv/bin/python seed.py

dev:
	.venv/bin/uvicorn app.main:app --host 0.0.0.0 --reload --port 8000

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +

all: up migrate seed dev

# ── Docker (full stack) ──────────────────────────────────
docker-build:
	docker-compose build --no-cache api

docker-up:
	docker-compose up -d --build

docker-down:
	docker-compose down -v

docker-logs:
	docker-compose logs -f
