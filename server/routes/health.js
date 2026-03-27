const express = require('express');
const database = require('../config/database');
const router = express.Router();

router.get('/health', async (req, res) => {
    try {
        const dbHealth = await database.healthCheck();
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            database: dbHealth,
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
            },
            version: process.env.npm_package_version || '1.0.0'
        };

        res.status(200).json(health);
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});


router.get('/health/database', async (req, res) => {
    try {
        const dbHealth = await database.healthCheck();
        res.status(200).json(dbHealth);
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

module.exports = router;
