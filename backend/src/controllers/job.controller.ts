import { Request, Response } from 'express';
import { manualJobs } from '../schedules/cron-schedules';
import logger from '../utils/logger.util';

export const runJob = async (req: Request, res: Response) => {
  const { jobName } = req.params;
  
  if (jobName in manualJobs) {
    try {
      logger.info(`Starting manual job: ${jobName}`);
      await manualJobs[jobName as keyof typeof manualJobs]();
      res.status(200).json({ message: `Job ${jobName} completed successfully` });
    } catch (error) {
      logger.error(`Error running job ${jobName}:`, error);
      res.status(500).json({ message: `Error running job ${jobName}`, error: (error as Error).message });
    }
  } else {
    res.status(404).json({ message: `Job ${jobName} not found` });
  }
};

export const getJobStatus = (req: Request, res: Response) => {
  const { jobName } = req.params;
  
  if (jobName === 'checkRotationStatus') {
    try {
      const status = manualJobs.checkRotationStatus();
      res.status(200).json(status);
    } catch (error) {
      logger.error('Error checking rotation status:', error);
      res.status(500).json({ message: 'Error checking rotation status', error: (error as Error).message });
    }
  } else {
    res.status(404).json({ message: `Status check for job ${jobName} not available` });
  }
};