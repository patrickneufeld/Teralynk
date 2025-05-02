# Setup Instructions for Teralynk Workflows

1. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Update the database connection string with your PostgreSQL credentials
   - Ensure PostgreSQL is running on your system

2. **Database Setup**
   ```sql
   CREATE DATABASE teralynk;
   \c teralynk

   CREATE TABLE workflows (
       id SERIAL PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       description TEXT,
       created_at TIMESTAMP DEFAULT NOW(),
       deleted BOOLEAN DEFAULT FALSE
   );

   CREATE INDEX idx_workflows_deleted ON workflows(deleted);
   CREATE INDEX idx_workflows_created_at ON workflows(created_at);
   ```

3. **Starting the Application**
   ```bash
   # Start backend
   cd backend
   npm install
   npm start

   # Start frontend (in another terminal)
   cd frontend
   npm install
   npm start
   ```

4. **Troubleshooting Common Issues**
   - If getWorkflows fails:
     1. Check browser console for CORS errors
     2. Verify database connection in backend logs
     3. Ensure API endpoints are correctly configured
     4. Verify `.env` file configuration
     5. Check if PostgreSQL service is running