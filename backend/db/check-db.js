const { Pool } = require('pg');
require('dotenv').config();

async function checkDatabase() {
    const pool = new Pool({
        connectionString: process.env.DB_CONNECTION_STRING
    });

    try {
        // Test connection
        const client = await pool.connect();
        console.log('Database connection successful');

        // Check workflows table
        const result = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'workflows'
            )`);

        if (!result.rows[0].exists) {
            console.error('Workflows table missing');
            process.exit(1);
        }

        console.log('Workflows table exists');
        client.release();
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('Database check failed:', error);
        process.exit(1);
    }
}

checkDatabase();