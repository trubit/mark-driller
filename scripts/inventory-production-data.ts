import mongoose from 'mongoose';
import { env } from '../src/server/config/env.js';
import { connectDatabase } from '../src/server/config/database.js';
import { User } from '../src/server/models/User.js';
import { Profile } from '../src/server/models/Profile.js';
import { Subscription } from '../src/server/models/Subscription.js';
import { Payment } from '../src/server/models/Payment.js';
import { ExamAttempt } from '../src/server/models/ExamAttempt.js';
import { Result } from '../src/server/models/Result.js';
import { Bookmark } from '../src/server/models/Bookmark.js';
import { SupportTicket } from '../src/server/models/SupportTicket.js';

async function runInventory() {
  const uri = env.MONGODB_URI;
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  console.log(`\n======================================================`);
  console.log(`🔍 MARKDRILLER DATABASE & USER INVENTORY (READ-ONLY)`);
  console.log(`======================================================`);
  console.log(`Target Connection: ${maskedUri}`);

  try {
    await connectDatabase({ maxPoolSize: 10, minPoolSize: 1 });
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection failed - db instance is undefined');
    }

    console.log(`Connected Database: [${mongoose.connection.name}] on host [${mongoose.connection.host}]`);
    console.log(`Configured ADMIN_EMAIL: ${env.ADMIN_EMAIL}`);
    console.log(`NODE_ENV: ${env.NODE_ENV}`);

    // 1. Inspect all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n--- ALL COLLECTIONS IN DATABASE (${collections.length}) ---`);
    const questionCollections: Record<string, number> = {};
    const otherCollections: Record<string, number> = {};

    for (const coll of collections) {
      try {
        const count = await db.collection(coll.name).countDocuments();
        const lower = coll.name.toLowerCase();
        if (
          lower.includes('question') ||
          lower.includes('subject') ||
          lower.includes('topic') ||
          (lower.includes('exam') && !lower.includes('examattempt')) ||
          lower.includes('studymaterial') ||
          lower.includes('institution')
        ) {
          questionCollections[coll.name] = count;
        } else {
          otherCollections[coll.name] = count;
        }
      } catch (err: any) {
        console.warn(`Could not count ${coll.name}: ${err.message}`);
      }
    }

    console.log('\n📚 Examination / Curriculum / Question Collections (READ-ONLY):');
    for (const [name, count] of Object.entries(questionCollections)) {
      console.log(`  • ${name.padEnd(25)} : ${count} documents`);
    }

    console.log('\n👥 User & System Collections:');
    for (const [name, count] of Object.entries(otherCollections)) {
      console.log(`  • ${name.padEnd(25)} : ${count} documents`);
    }

    // 2. Fetch and inventory all users
    const allUsers = await User.find({}).sort({ createdAt: 1 }).lean();
    console.log(`\n======================================================`);
    console.log(`👥 TOTAL USERS IN DATABASE: ${allUsers.length}`);
    console.log(`======================================================`);

    const userAudit = [];

    for (const u of allUsers) {
      const uId = u._id;
      const [
        profileCount,
        subCount,
        subs,
        paymentCount,
        payments,
        attemptCount,
        resultCount,
        bookmarkCount,
        ticketCount,
      ] = await Promise.all([
        Profile.countDocuments({ userId: uId }),
        Subscription.countDocuments({ userId: uId }),
        Subscription.find({ userId: uId }).lean(),
        Payment.countDocuments({ userId: uId }),
        Payment.find({ userId: uId }).lean(),
        ExamAttempt.countDocuments({ userId: uId }),
        Result.countDocuments({ userId: uId }),
        Bookmark.countDocuments({ userId: uId }),
        SupportTicket.countDocuments({ userId: uId }),
      ]);

      userAudit.push({
        id: u._id.toString(),
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        isVerified: u.isVerified,
        createdAt: u.createdAt,
        profileCount,
        subCount,
        subs: subs.map((s) => ({ plan: s.plan, status: s.status })),
        paymentCount,
        payments: payments.map((p) => ({ status: p.status, amount: p.amount, reference: p.reference })),
        attemptCount,
        resultCount,
        bookmarkCount,
        ticketCount,
      });
    }

    // Print summary of each user
    for (let i = 0; i < userAudit.length; i++) {
      const u = userAudit[i];
      console.log(`\n[${i + 1}/${userAudit.length}] User: ${u.email} (${u.fullName})`);
      console.log(`  ID: ${u.id} | Role: ${u.role} | Verified: ${u.isVerified} | Created: ${u.createdAt}`);
      console.log(`  Subs: ${u.subCount} | Payments: ${u.paymentCount} | Attempts: ${u.attemptCount} | Results: ${u.resultCount} | Tickets: ${u.ticketCount}`);
      if (u.subs.length > 0) {
        console.log(`  Subscriptions:`, JSON.stringify(u.subs));
      }
      if (u.payments.length > 0) {
        console.log(`  Payments:`, JSON.stringify(u.payments));
      }
    }

    await mongoose.disconnect();
    console.log(`\nInventory complete.`);
    process.exit(0);
  } catch (err: any) {
    console.error(`❌ Inventory error:`, err);
    process.exit(1);
  }
}

runInventory();
