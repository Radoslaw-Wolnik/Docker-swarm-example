import { Request, Response, NextFunction } from 'express';
import { checkDBHealth } from '../utils/db-connection.util';
import logger from '../utils/logger.util'; 
import { InternalServerError, ServiceUnavailableError } from '../utils/custom-errors.util';


// Basic health check logic
export const getBasicHealth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    res.status(200).json({ status: 'OK' });
  } catch (error) {
    next(new InternalServerError('Error in basic health check'));
  }
};

// Detailed health check logic
export const getDetailedHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    database: 'Unknown', // Default value
  };

  try {
    // Check database connection state
    healthcheck.database = checkDBHealth();

    // Add more checks if needed (e.g., Redis, external services)
    res.status(200).json(healthcheck);
  } catch (error) {
    logger.error('Detailed health check failed', { error: (error as Error).message });
    next(new ServiceUnavailableError('Health check failed'));
  }
};

