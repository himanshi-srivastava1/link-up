/**
 * Async Handler Middleware
 * 
 * This middleware wraps async route handlers to automatically catch errors
 * and pass them to the error handling middleware, eliminating the need
 * for try-catch blocks in route handlers.
 */

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
