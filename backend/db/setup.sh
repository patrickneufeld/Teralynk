#!/bin/bash
set -e

echo "Loading environment variables..."
source ../.env

echo "Checking PostgreSQL connection..."
if ! pg_isready; then
    echo "Error: PostgreSQL is not running"
    exit 1
fi

echo "Creating database if it doesn't exist..."
createdb teralynk 2>/dev/null || echo "Database already exists"

echo "Applying schema..."
psql -d teralynk -f init.sql

echo "Verifying setup..."
psql -d teralynk -c "\dt workflows"
psql -d teralynk -c "SELECT COUNT(*) FROM workflows;"

echo "Setup complete"