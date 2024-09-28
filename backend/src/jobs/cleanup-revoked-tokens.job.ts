import RevokedToken from '../models/revoked-token.model';
import logger from '../utils/logger.util';

export const cleanupRevokedTokens = async () => {
  try {
    const result = await RevokedToken.deleteMany({ expiresAt: { $lt: new Date() } });
    logger.info(`Cleaned up ${result.deletedCount} expired revoked tokens`);
  } catch (error) {
    logger.error('Error cleaning up revoked tokens:', error);
  }
};