#!/bin/bash

# Ensure PostgreSQL is running
if ! pg_isready; then
    echo "PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Create database
echo "Creating database..."
createdb teralynk || echo "Database may already exist"

# Run initialization script
echo "Initializing database schema..."
psql -d teralynk -f init.sql

# Verify setup
echo "Verifying database setup..."
psql -d teralynk -c "\dt workflows"
psql -d teralynk -c "SELECT COUNT(*) FROM workflows;"

echo "Setup complete!"