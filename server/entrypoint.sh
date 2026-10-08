#!/bin/bash
set -e

echo "Running database migrations..."
alembic upgrade head || echo "Migrations skipped (DB may not be ready or no migrations)"

echo "Starting HopperAudit server..."
exec "$@"
