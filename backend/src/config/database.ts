import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env';
import { logger } from './logger';

// Windows DNS SRV resolver fallback for MongoDB Atlas
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}

export interface DatabaseHealth {
  status: 'connected' | 'connecting' | 'disconnected' | 'unhealthy';
  readyState: number;
  latencyMs?: number;
}

let isConnected = false;

export async function connectDatabase(uri: string = env.MONGODB_URI): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const options: mongoose.ConnectOptions = {
    maxPoolSize: 20,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  };

  try {
    const conn = await mongoose.connect(uri, options);
    isConnected = true;
    logger.info({ host: conn.connection.host, name: conn.connection.name }, 'MongoDB connected successfully');
    return conn;
  } catch (error) {
    isConnected = false;
    logger.error({ error: (error as Error).message }, 'MongoDB connection failed');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected && mongoose.connection.readyState === 0) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Error disconnecting MongoDB');
    throw error;
  }
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const readyState = mongoose.connection.readyState;
  const states: Record<number, 'disconnected' | 'connected' | 'connecting' | 'unhealthy'> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnected',
  };

  const status = states[readyState] || 'unhealthy';

  if (readyState !== 1 || !mongoose.connection.db) {
    return { status, readyState };
  }

  const start = Date.now();
  try {
    await mongoose.connection.db.admin().ping();
    const latencyMs = Date.now() - start;
    return { status: 'connected', readyState, latencyMs };
  } catch {
    return { status: 'unhealthy', readyState, latencyMs: Date.now() - start };
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB connection lost. Reconnecting...');
});

mongoose.connection.on('error', (err) => {
  logger.error({ error: err.message }, 'MongoDB connection event error');
});
