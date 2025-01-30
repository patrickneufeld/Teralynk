#!/bin/bash

# Source environment variables
source .env

# Check PostgreSQL connection
echo "Testing database connection..."
psql "$DB_CONNECTION_STRING" -c "SELECT NOW();" || {
    echo "Error: Could not connect to database"
    exit 1
}

# Verify workflows table exists
echo "Checking workflows table..."
psql "$DB_CONNECTION_STRING" -c "\dt workflows" || {
    echo "Error: Workflows table not found"
    exit 1
}

# Check for data
echo "Checking for workflow data..."
psql "$DB_CONNECTION_STRING" -c "SELECT COUNT(*) FROM workflows;"

echo "Database verification complete!"