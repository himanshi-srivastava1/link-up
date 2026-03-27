/**
 * Professional CORS Configuration
 * 
 * This module provides a comprehensive CORS configuration that follows security best practices
 * and adapts to different environments (development, staging, production).
 */

const cors = require('cors');

// Allowed origins based on environment
const getAllowedOrigins = () => {
    const env = process.env.NODE_ENV || 'development';
    const frontendUrl = process.env.FRONTEND_URL;
    
    const origins = [];
    
    // Always include the configured frontend URL
    if (frontendUrl) {
        origins.push(frontendUrl);
    }
    
    // Development origins
    if (env === 'development') {
        origins.push(
            'http://localhost:3002',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://localhost:5173', 
            'http://127.0.0.1:5173'
        );
    }
    
   
    if (env === 'staging') {
        origins.push(
            'https://staging.linkup.com',
            'https://staging.linkup-client.onrender.com'
        );
    }
    
    if (env === 'production') {
        origins.push(
            'https://linkup.com',
            'https://www.linkup.com',
           
            process.env.FRONTEND_URL,
           
            'https://*.onrender.com'
        );
    }
    
    
    return [...new Set(origins.filter(Boolean))];
};


const getCorsOptions = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    
    return {
        
        origin: (origin, callback) => {
            const allowedOrigins = getAllowedOrigins();
            
            if (!origin) {
                return callback(null, true);
            }
            
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`CORS: Origin ${origin} not allowed`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        
        // Methods
        methods: [
            'GET',
            'POST',
            'PUT',
            'DELETE',
            'PATCH',
            'OPTIONS'
        ],
        
        // Headers
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'Cache-Control',
            'X-API-Key',
            'X-Client-Version'
        ],
        
        // Exposed headers (headers that client can access)
        exposedHeaders: [
            'X-Total-Count',
            'X-Page-Count',
            'X-Current-Page',
            'X-Rate-Limit-Limit',
            'X-Rate-Limit-Remaining',
            'X-Rate-Limit-Reset'
        ],
        
        // Credentials (cookies, authorization headers)
        credentials: true,
        
        // Pre-flight cache duration (in seconds)
        maxAge: isDevelopment ? 600 : 86400, // 10 min in dev, 24 hours in prod
        
        // Pass pre-flight continue to next handler
        preflightContinue: false,
        
        // Options success status
        optionsSuccessStatus: 204
    };
};

// Development-specific CORS (more permissive)
const getDevelopmentCorsOptions = () => ({
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: '*',
    credentials: true,
    maxAge: 600,
    preflightContinue: false,
    optionsSuccessStatus: 204
});

// Production-specific CORS (more restrictive)
const getProductionCorsOptions = () => {
    const allowedOrigins = getAllowedOrigins();
    
    return {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization'
        ],
        exposedHeaders: [
            'X-Total-Count',
            'X-Rate-Limit-Limit',
            'X-Rate-Limit-Remaining'
        ],
        credentials: true,
        maxAge: 86400, // 24 hours
        preflightContinue: false,
        optionsSuccessStatus: 204
    };
};

// Get appropriate CORS configuration based on environment
const corsConfig = () => {
    const env = process.env.NODE_ENV || 'development';
    
    switch (env) {
        case 'development':
            return cors(getDevelopmentCorsOptions());
        case 'production':
            return cors(getProductionCorsOptions());
        case 'staging':
            return cors(getCorsOptions());
        default:
            return cors(getCorsOptions());
    }
};

// Middleware function with logging
const corsMiddleware = (req, res, next) => {
    const corsHandler = corsConfig();
    
    // Log CORS requests in development
    if (process.env.NODE_ENV === 'development') {
        const origin = req.headers.origin;
        const method = req.method;
        const path = req.path;
        
        if (origin) {
            console.log(`CORS: ${method} ${path} - Origin: ${origin}`);
        }
    }
    
    return corsHandler(req, res, next);
};

// Utility functions for dynamic origin management
const corsUtils = {
    // Add a new origin dynamically
    addOrigin: (origin) => {
        if (!process.env.ALLOWED_ORIGINS) {
            process.env.ALLOWED_ORIGINS = '';
        }
        const origins = process.env.ALLOWED_ORIGINS.split(',').filter(Boolean);
        if (!origins.includes(origin)) {
            origins.push(origin);
            process.env.ALLOWED_ORIGINS = origins.join(',');
        }
    },
    
    // Remove an origin dynamically
    removeOrigin: (origin) => {
        if (process.env.ALLOWED_ORIGINS) {
            const origins = process.env.ALLOWED_ORIGINS.split(',').filter(Boolean);
            const index = origins.indexOf(origin);
            if (index > -1) {
                origins.splice(index, 1);
                process.env.ALLOWED_ORIGINS = origins.join(',');
            }
        }
    },
    
    // Get current allowed origins
    getAllowedOrigins: getAllowedOrigins,
    
    // Check if origin is allowed
    isOriginAllowed: (origin) => {
        return getAllowedOrigins().includes(origin);
    }
};

module.exports = {
    corsMiddleware,
    corsConfig,
    getCorsOptions,
    getDevelopmentCorsOptions,
    getProductionCorsOptions,
    getAllowedOrigins,
    corsUtils
};
