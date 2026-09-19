import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * MongoDB Connection Pool Configuration
 * Engineered for 4,000+ concurrent users across horizontally scaled replicas
 */
export async function connectDatabase(options: { maxPoolSize?: number; minPoolSize?: number } = {}): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', true);

    const isProd = env.NODE_ENV === 'production';
    const maxPoolSize = options.maxPoolSize || (isProd ? 100 : 50);
    const minPoolSize = options.minPoolSize || (isProd ? 2 : 1);

    const connection = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize,
      minPoolSize,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      autoIndex: !isProd, // Disable automatic index creation in production (managed ahead of time)
    });

    console.log(`🍃 Connected to MongoDB: ${connection.connection.name} @ ${connection.connection.host} [pool: ${minPoolSize}-${maxPoolSize}]`);
    return connection;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    console.warn('⚠️ Server will remain running and operational. Retrying MongoDB connection in 5 seconds...');
    setTimeout(() => {
      connectDatabase(options).catch(() => {});
    }, 5000);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close(false);
    console.log('🍃 MongoDB connection closed cleanly.');
  } catch (err) {
    console.error('Error during MongoDB disconnect:', err);
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

