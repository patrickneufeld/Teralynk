const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa'); // Use JWKS to cache public keys
const { promisify } = require('util');

const JWT_AUDIENCE = process.env.COGNITO_AUDIENCE; // Cognito App Client ID
const COGNITO_POOL_ID = process.env.COGNITO_POOL_ID; // AWS Cognito Pool ID
const COGNITO_REGION = process.env.COGNITO_REGION; // AWS Cognito Region

// URL to fetch public keys from Cognito
const JWKS_URL = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_POOL_ID}/.well-known/jwks.json`;

// **Set up JWKS client to cache AWS Cognito public keys**
const jwksClientInstance = jwksClient({
    jwksUri: JWKS_URL,
    cache: true, // Cache public keys
    rateLimit: true, // Limit rate of requests to the JWKS endpoint
    cacheMaxEntries: 5, // Cache up to 5 public keys
    cacheMaxAge: 600000, // Cache for 10 minutes
});

// **Get the signing key for the JWT**
const getKey = (header, callback) => {
    jwksClientInstance.getSigningKey(header.kid, (error, key) => {
        if (error) {
            console.error('Error fetching JWKS key:', error);
            callback(error, null);
        } else {
            const signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
        }
    });
};

// **Middleware to authenticate and extract user data from the token**
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token is required for authentication.' });
        }

        // **Verify JWT with JWKS**
        const decoded = await promisify(jwt.verify)(token, getKey, {
            audience: JWT_AUDIENCE,
            issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_POOL_ID}`,
            algorithms: ['RS256']
        });

        // **Attach user data to the request object**
        req.userId = decoded.sub; // Unique user ID from Cognito token
        req.userEmail = decoded.email; // User's email from token
        req.role = decoded['cognito:groups']?.[0] || 'Viewer'; // Default to Viewer if no role
        req.permissions = decoded.scope ? decoded.scope.split(' ') : []; // Custom scope/permissions if present

        next(); // Continue to next middleware
    } catch (error) {
        console.error('Authentication Error:', error);
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

module.exports = authenticateUser;
