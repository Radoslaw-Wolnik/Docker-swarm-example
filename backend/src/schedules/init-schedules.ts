import cron from 'node-cron';
import logger from '../utils/logger.util';
import { cronSchedules } from './cron-schedules';

export const initializeSchedules = () => {
  cronSchedules.forEach(({ name, schedule, job }) => {
    cron.schedule(schedule, async () => {
      logger.info(`Starting scheduled job: ${name}`);
      await job();
      logger.info(`Completed scheduled job: ${name}`);
    });
    logger.info(`Scheduled job: ${name} - ${schedule}`);
  });
};