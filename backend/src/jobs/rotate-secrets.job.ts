import fs from 'fs';
import { spawn } from 'child_process';
import mongoose from 'mongoose';
import User from '../models/user.model';
import logger from '../utils/logger.util';
import environment from '../config/environment';

const ROTATION_STATUS_FILE = '/app/rotation_status.json';
const BATCH_SIZE = 100; // Number of users to process in each batch

interface RotationStatus {
  inProgress: boolean;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  progress?: {
    processedUsers: number;
    totalUsers: number;
  };
}

function getRotationStatus(): RotationStatus {
  if (fs.existsSync(ROTATION_STATUS_FILE)) {
    return JSON.parse(fs.readFileSync(ROTATION_STATUS_FILE, 'utf-8'));
  }
  return { inProgress: false };
}

function updateRotationStatus(status: Partial<RotationStatus>) {
  const currentStatus = getRotationStatus();
  const newStatus = { ...currentStatus, ...status };
  fs.writeFileSync(ROTATION_STATUS_FILE, JSON.stringify(newStatus));
}

async function rotateEncryptionKey(startIndex: number = 0): Promise<number> {
  const users = await User.find({}).skip(startIndex).limit(BATCH_SIZE);

  for (const user of users) {
    try {
      // Get the decrypted email using the old key
      const decryptedEmail = await user.getDecryptedEmail();

      // Update the user's email (this will trigger the pre-save hook to re-encrypt)
      user.email = decryptedEmail;

      await user.save();
      logger.info(`Updated user: ${user._id}`);
    } catch (error) {
      logger.error(`Failed to update user ${user._id}:`, error);
      // Continue with the next user instead of stopping the entire process
    }
  }

  return users.length;
}

export const startRotation = async () => {
  const currentStatus = getRotationStatus();
  if (currentStatus.inProgress) {
    logger.info('Rotation already in progress');
    return;
  }
  
  updateRotationStatus({ inProgress: true, startTime: new Date() });
  
  const rotationProcess = spawn('node', ['-r', 'ts-node/register', __filename, 'rotate'], { detached: true });
  
  rotationProcess.stdout.on('data', (data) => {
    logger.info(`Rotation process: ${data}`);
  });
  
  rotationProcess.stderr.on('data', (data) => {
    logger.error(`Rotation process error: ${data}`);
    updateRotationStatus({ error: data.toString() });
  });
  
  rotationProcess.on('close', (code) => {
    logger.info(`Rotation process exited with code ${code}`);
    updateRotationStatus({ inProgress: false, endTime: new Date() });
  });
  
  rotationProcess.unref();
};

async function rotateSecrets() {
  try {
    if (!environment.auth.oldEncryptionKey || !environment.auth.encryptionKey) {
      throw new Error('Both OLD_ENCRYPTION_KEY and ENCRYPTION_KEY must be provided');
    }
  
    await mongoose.connect(environment.database.uri);
    logger.info('Connected to MongoDB');
  
    logger.info('Starting secret rotation...');
      
    let startIndex = 0;
    let processedUsers = 0;
    let totalUsers = await User.countDocuments();
  
    updateRotationStatus({ progress: { processedUsers, totalUsers } });
  
    while (processedUsers < totalUsers) {
      const batchSize = await rotateEncryptionKey(startIndex);
      processedUsers += batchSize;
      startIndex += batchSize;
  
      updateRotationStatus({ progress: { processedUsers, totalUsers } });
      logger.info(`Progress: ${processedUsers}/${totalUsers} users processed`);
  
      if (batchSize < BATCH_SIZE) {
        break;
      }
  
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  
    logger.info('Secret rotation completed');
  
    delete process.env.OLD_ENCRYPTION_KEY;
      
    await mongoose.disconnect();
  
    updateRotationStatus({ inProgress: false, endTime: new Date() });
  } catch (error) {
    logger.error('Error during secret rotation:', error);
    updateRotationStatus({ error: (error as Error).message });
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

export const checkRotationStatus = () => {
  const status = getRotationStatus();
  logger.info('Current rotation status:', status);
  return status;
};

export const cleanupAfterRotation = () => {
  const status = getRotationStatus();
  if (status.inProgress) {
    logger.info('Rotation still in progress. Cannot cleanup yet.');
    return;
  }

  // Remove the OLD_ENCRYPTION_KEY from the environment
  delete process.env.OLD_ENCRYPTION_KEY;

  // Update Docker service to remove OLD_ENCRYPTION_KEY
  // Note: This part might need to be adjusted based on your deployment setup
  // spawn('docker', ['service', 'update', '--env-rm', 'OLD_ENCRYPTION_KEY', `${environment.backend}`]);

  logger.info('Cleanup completed');
};

if (require.main === module) {
  if (process.argv[2] === 'rotate') {
    rotateSecrets().catch(console.error);
  }
}