#!/bin/bash

# Load environment variables
source .env

# Run the initialization script
psql "$DB_CONNECTION_STRING" -f init_database.sql

# Test the connection
echo "Testing database connection..."
psql "$DB_CONNECTION_STRING" -c "\dt workflows;"

echo "Database setup complete!"