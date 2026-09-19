import mongoose from 'mongoose';

const testUris = [
  {
    label: 'truson-portfolio_user (encoded %24)',
    uri: 'mongodb+srv://truson-portfolio_user:TRuson222%24@cluster0.19f8n9k.mongodb.net/markdriller?retryWrites=true&w=majority&appName=Cluster0',
  },
  {
    label: 'truson-portfolio_user (raw $)',
    uri: 'mongodb+srv://truson-portfolio_user:TRuson222$@cluster0.19f8n9k.mongodb.net/markdriller?retryWrites=true&w=majority&appName=Cluster0',
  },
];

async function run() {
  for (const item of testUris) {
    console.log(`\nTesting: [${item.label}]...`);
    try {
      const conn = await mongoose.connect(item.uri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`🎉 SUCCESS! Connected to database [${conn.connection.name}] at [${conn.connection.host}]`);
      const admin = conn.connection.db?.admin();
      const ping = await admin?.ping();
      console.log(`Ping result:`, ping);
      await mongoose.disconnect();
      console.log(`\n🏆 THIS IS THE WORKING CONNECTION STRING:`);
      console.log(item.uri);
      process.exit(0);
    } catch (err: any) {
      console.error(`❌ Failed:`, err.message);
    }
  }
  process.exit(1);
}

run();
