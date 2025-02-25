const db = require('./config/db');

async function verifyDatabase() {
    try {
        // Test connection
        await db.query('SELECT NOW()');
        console.log('Database connection successful');

        // Check if workflows table exists
        const tableCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'workflows'
            )`);

        if (!tableCheck.rows[0].exists) {
            console.error('Workflows table does not exist');
            process.exit(1);
        }

        // Check for data
        const dataCheck = await db.query('SELECT COUNT(*) FROM workflows');
        console.log(`Found ${dataCheck.rows[0].count} workflows`);

        process.exit(0);
    } catch (error) {
        console.error('Database verification failed:', error);
        process.exit(1);
    }
}

verifyDatabase();