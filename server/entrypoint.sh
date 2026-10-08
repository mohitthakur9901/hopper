#!/bin/bash
set -e

export PYTHONPATH=/app:${PYTHONPATH:-}

echo "Running database migrations..."
alembic upgrade head || echo "Migrations skipped (DB may not be ready or no migrations)"

echo "Starting HopperAudit server..."
exec "$@"
