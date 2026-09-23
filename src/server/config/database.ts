import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

// Configure reliable public DNS servers to prevent querySrv ECONNREFUSED on Windows & local ISP resolvers
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

// Optional direct standard replica-set URI fallback (bypasses SRV lookups if provided in environment)
const ATLAS_DIRECT_FALLBACK_URI = process.env.MONGODB_DIRECT_FALLBACK_URI || process.env.MONGODB_FALLBACK_URI || '';

/**
 * MongoDB Connection Pool Configuration
 * Engineered for 4,000+ concurrent users across horizontally scaled replicas
 */
export async function connectDatabase(options: { maxPoolSize?: number; minPoolSize?: number } = {}): Promise<typeof mongoose> {
  const isProd = env.NODE_ENV === 'production';
  const maxPoolSize = options.maxPoolSize || (isProd ? 150 : 50);
  const minPoolSize = options.minPoolSize || (isProd ? 20 : 1);

  const connectOptions: mongoose.ConnectOptions = {
    maxPoolSize,
    minPoolSize,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 20000,
    socketTimeoutMS: 45000,
    autoIndex: !isProd, // Disable automatic index creation in production (managed ahead of time)
  };

  mongoose.set('strictQuery', true);

  // Helper to attempt connection
  async function attemptConnect(uri: string): Promise<typeof mongoose> {
    const connection = await mongoose.connect(uri, connectOptions);
    console.log(`🍃 Connected to MongoDB: ${connection.connection.name} @ ${connection.connection.host} [pool: ${minPoolSize}-${maxPoolSize}]`);
    return connection;
  }

  try {
    return await attemptConnect(env.MONGODB_URI);
  } catch (error: any) {
    const isSrvError = error?.code === 'ECONNREFUSED' || error?.syscall === 'querySrv' || error?.message?.includes('querySrv');
    if (isSrvError && env.MONGODB_URI.startsWith('mongodb+srv://')) {
      console.warn('⚠️ SRV DNS lookup failed on local resolver. Attempting direct replica-set connection fallback...');
      try {
        return await attemptConnect(ATLAS_DIRECT_FALLBACK_URI);
      } catch (fallbackError) {
        console.error('❌ Direct replica-set fallback also failed:', fallbackError);
      }
    }

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


