const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query } = require('./db'); // Database integration for user info
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'defaultSecretKey';
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '1h';

// Register a new user
const registerUser = async (email, password, role) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *',
        [email, hashedPassword, role]
    );
    return result.rows[0];
};

// Authenticate user and generate JWT token
const authenticateUser = async (email, password) => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) throw new Error('User not found.');
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new Error('Invalid password.');

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
    return token;
};

// Verify JWT token
const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

module.exports = {
    registerUser,
    authenticateUser,
    verifyToken,
};
