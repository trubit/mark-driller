import mongoose from 'mongoose';
import { connectDatabase } from '../src/server/config/database.js';
import { User } from '../src/server/models/User.js';
import { Profile } from '../src/server/models/Profile.js';
import { Subscription } from '../src/server/models/Subscription.js';
import { Payment } from '../src/server/models/Payment.js';
import { ExamAttempt } from '../src/server/models/ExamAttempt.js';
import { Result } from '../src/server/models/Result.js';

async function purgeAllTestAccounts() {
  await connectDatabase({ maxPoolSize: 10, minPoolSize: 1 });

  const testUsers = await User.find({
    $or: [
      { email: { $regex: /@example\.com$/i } },
      { email: { $regex: /@markdriller\.test$/i } },
    ],
  }).lean();

  console.log(`Found ${testUsers.length} test accounts to purge:`, testUsers.map((u) => u.email));

  if (testUsers.length > 0) {
    const testIds = testUsers.map((u) => u._id);
    const [p, s, pay, a, r, u] = await Promise.all([
      Profile.deleteMany({ userId: { $in: testIds } }),
      Subscription.deleteMany({ userId: { $in: testIds } }),
      Payment.deleteMany({ userId: { $in: testIds } }),
      ExamAttempt.deleteMany({ userId: { $in: testIds } }),
      Result.deleteMany({ userId: { $in: testIds } }),
      User.deleteMany({ _id: { $in: testIds } }),
    ]);

    console.log(`Purged: users=${u.deletedCount}, profiles=${p.deletedCount}, subs=${s.deletedCount}, payments=${pay.deletedCount}, attempts=${a.deletedCount}, results=${r.deletedCount}`);
  }

  const remaining = await User.countDocuments();
  console.log(`Remaining users in database: ${remaining}`);

  await mongoose.disconnect();
}

purgeAllTestAccounts().catch((err) => {
  console.error(err);
  process.exit(1);
});
