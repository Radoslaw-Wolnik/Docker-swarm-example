import User from '../models/user.model';
import logger from '../utils/logger.util';

export const deleteDeactivatedUsers = async () => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await User.deleteMany({
      deactivated: { $lt: oneWeekAgo }
    });
    logger.info(`Deleted ${result.deletedCount} deactivated users`);
  } catch (error) {
    logger.error('Error deleting deactivated users', error);
  }
};