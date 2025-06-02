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

# Create database if it doesn't exist
echo "Creating database..."
createdb teralynk || echo "Database may already exist"

# Apply schema
echo "Applying database schema..."
psql -d teralynk -f schema.sql

# Verify setup
echo "Verifying database setup..."
node db_verify.js

# Print status
echo "Database initialization complete!"