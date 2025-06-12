#!/bin/bash
set -e

# Load environment variables
source ../.env

echo "Checking PostgreSQL connection..."
if ! pg_isready; then
    echo "Error: PostgreSQL is not running"
    exit 1
fi

echo "Creating database..."
createdb teralynk 2>/dev/null || echo "Database already exists"

echo "Initializing schema..."
psql -d teralynk -f schema.sql

echo "Verifying setup..."
psql -d teralynk -c "\dt workflows"
psql -d teralynk -c "SELECT COUNT(*) FROM workflows;"

echo "Setup complete!"