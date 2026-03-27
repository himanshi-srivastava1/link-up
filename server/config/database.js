/**
 * Professional Database Connection
 * 
 * This module provides a professional MongoDB connection with proper
 * error handling, connection pooling, and event listeners.
 */

const mongoose = require('mongoose');

class Database {
    constructor() {
        this.connection = null;
        this.connectionString = process.env.CONN_STRING;
    }

    async connect() {
        try {
            const mongoUri = process.env.CONN_STRING;
            
            if (!mongoUri) {
                throw new Error('MongoDB connection string is required');
            }

            // Simple connection without deprecated options
            await mongoose.connect(mongoUri);
            
            console.log('✅ Connected to MongoDB successfully');
            
            // Setup event listeners
            this.setupEventListeners();
            
            return mongoose.connection;
        } catch (error) {
            console.error('❌ MongoDB connection error:', error.message);
            throw error;
        }
    }

    setupEventListeners() {
        const db = mongoose.connection;

        db.on('connected', () => {
            console.log('🔗 Mongoose connected to MongoDB');
        });

        db.on('error', (err) => {
            console.error('❌ Mongoose connection error:', err);
        });

        db.on('disconnected', () => {
            console.log('🔌 Mongoose disconnected from MongoDB');
        });

        // Application termination
        process.on('SIGINT', async () => {
            await this.gracefulShutdown();
        });

        process.on('SIGTERM', async () => {
            await this.gracefulShutdown();
        });
    }

    async gracefulShutdown() {
        try {
            console.log('🔄 Closing MongoDB connection...');
            await mongoose.connection.close();
            console.log('✅ MongoDB connection closed successfully');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error closing MongoDB connection:', error.message);
            process.exit(1);
        }
    }

    async healthCheck() {
        try {
            const state = mongoose.connection.readyState;
            const states = {
                0: 'disconnected',
                1: 'connected',
                2: 'connecting',
                3: 'disconnecting'
            };
            
            return {
                status: 'healthy',
                connectionState: states[state],
                databaseName: mongoose.connection.name,
                host: mongoose.connection.host,
                port: mongoose.connection.port
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
}

// Create and export singleton instance
const database = new Database();

module.exports = database;
