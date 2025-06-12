#!/bin/bash

# Source environment variables
source .env

# Drop and recreate database
echo "Dropping and recreating database..."
dropdb teralynk
createdb teralynk

# Initialize schema
echo "Initializing database schema..."
psql -d teralynk -f init-database.sql

# Verify setup
echo "Verifying database setup..."
./verify-db.sh

echo "Database reset complete!"