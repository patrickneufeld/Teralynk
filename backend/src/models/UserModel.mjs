import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false, require: true },
});

export class User {
    static async create({ name, email, password, role = 'user' }) {
        const query = `
            INSERT INTO users (name, email, password, role, is_active, created_at)
            VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)
            RETURNING *
        `;
        const values = [name, email, password, role];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async findById(id) {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    static async findAll() {
        const query = 'SELECT * FROM users ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows;
    }

    static async update(id, updateData) {
        const allowedUpdates = ['name', 'email', 'password', 'role', 'is_active'];
        const updates = Object.keys(updateData)
            .filter(key => allowedUpdates.includes(key) && updateData[key] !== undefined)
            .map((key, index) => `${key} = $${index + 2}`);

        if (updates.length === 0) return null;

        const query = `
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
        `;
        
        const values = [id, ...Object.values(updateData)
            .filter((_, index) => allowedUpdates.includes(Object.keys(updateData)[index]))];
        
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async delete(id) {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async findByRole(role) {
        const query = 'SELECT * FROM users WHERE role = $1';
        const result = await pool.query(query, [role]);
        return result.rows;
    }

    static async updatePassword(id, newPassword) {
        const query = `
            UPDATE users 
            SET password = $2
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [id, newPassword]);
        return result.rows[0];
    }

    static async toggleActive(id) {
        const query = `
            UPDATE users 
            SET is_active = NOT is_active
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
}

// SQL to create the users table (run this in your database):
/*
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- Index for role-based queries
CREATE INDEX idx_users_role ON users(role);
*/
