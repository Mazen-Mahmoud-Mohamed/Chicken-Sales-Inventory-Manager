import mongoose from 'mongoose';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { runMigrations } from './migrate.js';

let isConnected = false;

/**
 * Connect to MongoDB using Mongoose.
 * Only the server machine should establish this connection.
 */
export async function connectDatabase() {
  if (isConnected) return mongoose.connection;

  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    logger.info(`MongoDB connected: ${config.mongoUri}`);

    await runMigrations();

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

export async function disconnectDatabase() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected gracefully');
}

export function getConnectionStatus() {
  return {
    connected: isConnected,
    readyState: mongoose.connection.readyState,
  };
}
