#!/bin/bash
set -e

# Load environment variables
source ../.env

# Check PostgreSQL connection
if ! pg_isready; then
    echo "Error: PostgreSQL is not running"
    exit 1
fi

# Create database if needed
echo "Creating database if it doesn't exist..."
createdb teralynk 2>/dev/null || echo "Database already exists"

# Apply schema
echo "Applying database schema..."
psql -d teralynk -f schema.sql

# Verify setup
echo "Verifying database setup..."
node check-db.js

echo "Database setup complete!"