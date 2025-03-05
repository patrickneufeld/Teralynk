import jwt from "jsonwebtoken";

/**
 * Middleware to authenticate the user by verifying the JWT token
 */
const authenticateUser = (req, res, next) => {
    // Check if authorization header exists
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication token is required.',
        });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token.',
            });
        }

        // Attach user information to the request
        req.user = decoded;  // Assuming the token contains user details like id
        next();  // Proceed to the next middleware/route handler
    });
};

module.exports = { authenticateUser };
