#!/bin/bash

# Load environment variables
set -a
source .env
set +a

echo "Creating database if it doesn't exist..."
createdb teralynk || true

echo "Applying database schema..."
psql -d teralynk -f init_database.sql

echo "Verifying database setup..."
psql -d teralynk -c "\dt workflows;"
psql -d teralynk -c "SELECT count(*) FROM workflows;"

echo "Database initialization complete!"