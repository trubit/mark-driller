import mongoose from 'mongoose';
import { env } from '../src/server/config/env.js';
import { seedCompleteProductionCurriculum } from '../src/server/utils/productionCurriculumSeed.js';

async function main() {
  console.log('Connecting to MongoDB:', env.MONGODB_URI);
  await mongoose.connect(env.MONGODB_URI);

  try {
    const result = await seedCompleteProductionCurriculum();
    console.log('✔ Successfully verified and seeded curriculum:', result);
  } catch (error) {
    console.error('❌ Error during curriculum seed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

main();
