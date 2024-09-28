import express from 'express';
import { getBasicHealth, getDetailedHealth } from '../controllers/health.controller';

const router = express.Router();

// Basic health check route
router.get('/basic', getBasicHealth);

// Detailed health check route
router.get('/details', getDetailedHealth);

export default router;

/* To check eg in docker-container
* healthcheck:
*      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
*      interval: 30s
*      timeout: 10s
*      retries: 3
*      start_period: 40s 
*/