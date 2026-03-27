const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.SECRET_KEY,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.REFRESH_TOKEN_SECRET || process.env.SECRET_KEY,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

// Generate random token for email verification and password reset
const generateRandomToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Verify JWT token
const verifyToken = (token, secret = process.env.SECRET_KEY) => {
    return jwt.verify(token, secret);
};

// Generate token with expiration
const generateTokenWithExpiry = (payload, expiresIn = '1h') => {
    return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn });
};

// Decode token without verification (for debugging)
const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateTokens,
    generateRandomToken,
    verifyToken,
    generateTokenWithExpiry,
    decodeToken
};
