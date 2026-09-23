import mongoose from 'mongoose';
import { env } from '../src/server/config/env.js';

async function run() {
  const uri = env.MONGODB_URI;
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  console.log(`\nTesting MongoDB Atlas connectivity...`);
  console.log(`Target: ${maskedUri}`);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log(`🎉 SUCCESS! Connected to database [${conn.connection.name}] at host [${conn.connection.host}]`);
    const admin = conn.connection.db?.admin();
    const ping = await admin?.ping();
    console.log(`Ping response:`, ping);
    await mongoose.disconnect();
    console.log(`\n🏆 MongoDB Atlas production connection verified successfully.`);
    process.exit(0);
  } catch (err: any) {
    console.error(`❌ MongoDB Atlas Connection Failed:`, err.message);
    process.exit(1);
  }
}

run();
