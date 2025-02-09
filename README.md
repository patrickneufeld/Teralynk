# Backend Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your database credentials
# Then run the database setup script
chmod +x setup_database.sh
./setup_database.sh
```

3. Start the server:
```bash
npm start
```

## Troubleshooting

If you encounter issues with getWorkflows:

1. Check the database connection:
```bash
psql $DB_CONNECTION_STRING -c "SELECT NOW();"
```

2. Verify the workflows table:
```bash
psql $DB_CONNECTION_STRING -c "SELECT * FROM workflows LIMIT 1;"
```

3. Test the API endpoint:
```bash
curl http://localhost:5001/api/v1/workflows
```

4. Check the logs:
```bash
tail -f server.log
```