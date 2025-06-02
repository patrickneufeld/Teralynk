#!/bin/bash

# Load environment variables
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "❌ .env file not found"
  exit 1
fi

# Validate DB connection string
if [ -z "$DB_CONNECTION_STRING" ]; then
  echo "❌ DB_CONNECTION_STRING is not set in the environment"
  exit 1
fi

# Check PostgreSQL connection
echo "🔍 Testing database connection..."
psql "$DB_CONNECTION_STRING" -c "SELECT NOW();" || {
    echo "❌ Error: Could not connect to database"
    exit 1
}

# List tables for reference
echo "📋 Listing all available tables..."
psql "$DB_CONNECTION_STRING" -c "\dt"

# Verify users table exists
echo "🔍 Checking users table..."
psql "$DB_CONNECTION_STRING" -c "\dt users" || {
    echo "❌ Error: Users table not found"
    exit 1
}

# Check for data in users table
echo "🔍 Checking for user data..."
psql "$DB_CONNECTION_STRING" -c "SELECT COUNT(*) FROM users;"

echo "✅ Database verification complete!"
