import mongoose from 'mongoose';

const rawUri = 'mongodb+srv://markdriller_user:TRuson222$@cluster0.19f8n9k.mongodb.net/markdriller?appName=Cluster0';
const encodedUri = 'mongodb+srv://markdriller_user:TRuson222%24@cluster0.19f8n9k.mongodb.net/markdriller?appName=Cluster0';

async function testConnection(uri: string, label: string) {
  console.log(`\nTesting connection with [${label}]...`);
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✅ [${label}] SUCCESS! Connected to:`, conn.connection.name, 'host:', conn.connection.host);
    const admin = conn.connection.db?.admin();
    const ping = await admin?.ping();
    console.log(`✅ [${label}] Ping response:`, ping);
    await mongoose.disconnect();
    return true;
  } catch (err: any) {
    console.error(`❌ [${label}] Connection failed:`, err.message);
    return false;
  }
}

async function run() {
  console.log('Testing MongoDB Atlas connection...');
  const successRaw = await testConnection(rawUri, 'Raw URI');
  if (!successRaw) {
    const successEncoded = await testConnection(encodedUri, 'URL-Encoded Password URI (%24)');
    if (successEncoded) {
      console.log('\nRecommendation: Use URL-encoded password in URI.');
    }
  }
}

run();
