.PHONY: help up down install migrate seed dev clean all

# Default target
help:
	@echo "HopperAudit Server Makefile"
	@echo ""
	@echo "Available commands:"
	@echo "  make up       - Start background services (PostgreSQL & Floci) via Docker"
	@echo "  make down     - Stop background services"
	@echo "  make install  - Install Python dependencies"
	@echo "  make migrate  - Run database migrations (Alembic)"
	@echo "  make seed     - Seed the database with initial demo data"
	@echo "  make dev      - Start the FastAPI development server (auto-reload)"
	@echo "  make clean    - Remove __pycache__ and .pytest_cache directories"
	@echo "  make all      - Start services, run migrations, seed DB, and start dev server"

up:
	docker-compose up db floci -d

down:
	docker-compose down

install:
	.venv/bin/pip install -r requirements.txt

migrate:
	.venv/bin/alembic upgrade head

seed:
	.venv/bin/python seed.py

dev:
	.venv/bin/uvicorn app.main:app --reload --port 8000

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +

all: up migrate seed dev
