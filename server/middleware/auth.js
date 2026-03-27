const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Authentication middleware
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "No authorization header provided"
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findById(decodedToken.userId).select("-password");
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.isEmailVerified) {
            return res.status(401).json({
                success: false,
                message: "Email not verified"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
            error: error.message
        });
    }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.split(' ')[1]) {
            const token = authHeader.split(' ')[1];
            const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
            const user = await User.findById(decodedToken.userId).select("-password");
            req.user = user;
        }
        next();
    } catch (error) {
        next();
    }
};

module.exports = {
    authenticate,
    optionalAuth
};
