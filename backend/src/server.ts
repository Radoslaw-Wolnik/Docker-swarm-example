import * as http from 'http';
import mongoose from 'mongoose';

import app from './app.js';
import connectDB from './utils/db-connection.util.js';
import environment from './config/environment.js';
import logger from './utils/logger.util';
import { gracefulShutdown } from './utils/server.util';
import { initializeSchedules } from './schedules/init-schedules';
import { initializeAppData } from './utils/init-app-data';

// Set port from environment or fallback to 5000
const PORT: number = environment.app.port || 5000;

const startServer = async () => {
  try {
    // Connect to the database
    const startTime = Date.now();
    await connectDB();
    const connectionTime = Date.now() - startTime;
    logger.info('Connected to database', { connectionTimeMs: connectionTime });

    // Initialize app data (site settings, email templates, and verify email service)
    await initializeAppData();
    logger.info('App data initialized');

    // Initialize cron jobs
    initializeSchedules();
    logger.info('Cron jobs initialized');
    
    const server: http.Server = http.createServer(app);
    server.listen(PORT, () => {
      logger.info(`Server running in ${environment.app.nodeEnv} mode on port ${PORT}`);
    });

    // Global error handler for uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      gracefulShutdown(server, 1);
    });

    // Global error handler for unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection', { reason, promise });
      gracefulShutdown(server, 1);
    });

    // Graceful shutdown on SIGTERM (e.g., Docker, Heroku)
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received. Shutting down gracefully.');
      gracefulShutdown(server, 0);
    });

    // Graceful shutdown on SIGINT (e.g., Ctrl+C)
    process.on('SIGINT', () => {
      logger.info('SIGINT signal received. Shutting down gracefully.');
      gracefulShutdown(server, 0);
    });

    

  } catch (error) {
    logger.error('Failed to start the server:', {
      error,
      stack: (error as Error).stack,
      memoryUsage: process.memoryUsage()
    });
    process.exit(1);
  }
};

startServer();

// set this up in docker container policy
// eg
// restart: unless-stopped