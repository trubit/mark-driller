import { Types } from 'mongoose';
import { FreeTrialUsage } from '../models/FreeTrialUsage.js';

export const FREE_TRIAL_QUESTION_LIMIT = 200;
export const MAX_FREE_TRIALS = 3;
export const FREE_PERMITTED_YEAR = 2024;

export interface FreeTrialStatus {
  isPro: boolean;
  allowed: number;
  used: number;
  remaining: number;
  isExhausted: boolean;
  permittedYear: number;
}

export interface FreeTrialUsageInfo {
  used: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
}

export class FreeTrialService {
  /**
   * Get the current CBT Free Trial status for a student account.
   * Pro/Admin users receive full unlimited status.
   * Free users are strictly checked against MAX_FREE_TRIALS (3).
   */
  static async getTrialStatus(
    userId: string | Types.ObjectId,
    isPro = false
  ): Promise<FreeTrialStatus> {
    if (isPro) {
      return {
        isPro: true,
        allowed: MAX_FREE_TRIALS,
        used: 0,
        remaining: MAX_FREE_TRIALS,
        isExhausted: false,
        permittedYear: FREE_PERMITTED_YEAR,
      };
    }

    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const record = await FreeTrialUsage.findOne({ userId: userObjectId }).lean();

    const used = Math.min(MAX_FREE_TRIALS, record?.attemptsCount ?? 0);
    const remaining = Math.max(0, MAX_FREE_TRIALS - used);
    const isExhausted = used >= MAX_FREE_TRIALS;

    return {
      isPro: false,
      allowed: MAX_FREE_TRIALS,
      used,
      remaining,
      isExhausted,
      permittedYear: FREE_PERMITTED_YEAR,
    };
  }

  /**
   * Concurrency-safe atomic attempt consumption for Free Trial users.
   * Ensures that exactly 3 free trial attempts can ever be consumed.
   * If the user has already reached 3 attempts, returns success: false.
   */
  static async consumeTrialAttempt(
    userId: string | Types.ObjectId
  ): Promise<{ success: boolean; usage: FreeTrialStatus }> {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    // Ensure the document exists
    await FreeTrialUsage.updateOne(
      { userId: userObjectId },
      {
        $setOnInsert: {
          userId: userObjectId,
          attemptsCount: 0,
          attemptIds: [],
          accessedQuestionIds: [],
          count: 0,
        },
      },
      { upsert: true }
    );

    // Atomically increment ONLY if strictly less than MAX_FREE_TRIALS (3)
    const updated = await FreeTrialUsage.findOneAndUpdate(
      {
        userId: userObjectId,
        attemptsCount: { $lt: MAX_FREE_TRIALS },
      },
      {
        $inc: { attemptsCount: 1 },
      },
      { new: true }
    );

    if (!updated) {
      // Limit already reached or concurrent race condition prevented over-consumption
      return {
        success: false,
        usage: {
          isPro: false,
          allowed: MAX_FREE_TRIALS,
          used: MAX_FREE_TRIALS,
          remaining: 0,
          isExhausted: true,
          permittedYear: FREE_PERMITTED_YEAR,
        },
      };
    }

    const used = updated.attemptsCount;
    const remaining = Math.max(0, MAX_FREE_TRIALS - used);

    return {
      success: true,
      usage: {
        isPro: false,
        allowed: MAX_FREE_TRIALS,
        used,
        remaining,
        isExhausted: used >= MAX_FREE_TRIALS,
        permittedYear: FREE_PERMITTED_YEAR,
      },
    };
  }

  /**
   * Rollback trial count if attempt initialization failed after consumption.
   */
  static async rollbackTrial(userId: string | Types.ObjectId): Promise<void> {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    await FreeTrialUsage.updateOne(
      { userId: userObjectId, attemptsCount: { $gt: 0 } },
      { $inc: { attemptsCount: -1 } }
    );
  }

  /**
   * Record the created attempt ObjectId into the user's trial history.
   */
  static async recordAttemptId(
    userId: string | Types.ObjectId,
    attemptId: string | Types.ObjectId
  ): Promise<void> {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const attObjectId = typeof attemptId === 'string' ? new Types.ObjectId(attemptId) : attemptId;
    await FreeTrialUsage.updateOne(
      { userId: userObjectId },
      { $addToSet: { attemptIds: attObjectId } }
    );
  }

  /**
   * Get the current Free Trial usage for an authenticated user.
   */
  static async getUsage(userId: string | Types.ObjectId): Promise<FreeTrialUsageInfo> {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const record = await FreeTrialUsage.findOne({ userId: userObjectId }).lean();

    const used = record?.count ?? (record?.accessedQuestionIds?.length || 0);
    const limit = FREE_TRIAL_QUESTION_LIMIT;
    const remaining = Math.max(0, limit - used);
    const isLimitReached = used >= limit;

    return {
      used,
      limit,
      remaining,
      isLimitReached,
    };
  }

  /**
   * Check whether a Free Trial user can access a specific single question ID.
   * If already accessed before, it is allowed with 0 quota consumption (idempotent).
   * If new and quota is available, it atomically records the question ID and allows access.
   * If new and quota is exhausted, access is denied.
   */
  static async checkAndRecordSingleAccess(
    userId: string | Types.ObjectId,
    questionId: string | Types.ObjectId
  ): Promise<{ allowed: boolean; usage: FreeTrialUsageInfo }> {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const qObjectId = typeof questionId === 'string' ? new Types.ObjectId(questionId) : questionId;

    // 1. Fetch current usage record
    let record = await FreeTrialUsage.findOne({ userId: userObjectId });

    if (!record) {
      record = await FreeTrialUsage.create({
        userId: userObjectId,
        accessedQuestionIds: [],
        count: 0,
      });
    }

    const isAlreadyAccessed = record.accessedQuestionIds.some((id) => id.equals(qObjectId));

    // Refetch/re-read of previously accessed question consumes 0 units
    if (isAlreadyAccessed) {
      const used = record.count;
      return {
        allowed: true,
        usage: {
          used,
          limit: FREE_TRIAL_QUESTION_LIMIT,
          remaining: Math.max(0, FREE_TRIAL_QUESTION_LIMIT - used),
          isLimitReached: used >= FREE_TRIAL_QUESTION_LIMIT,
        },
      };
    }

    // New question requested: check if limit already reached
    if (record.count >= FREE_TRIAL_QUESTION_LIMIT) {
      return {
        allowed: false,
        usage: {
          used: record.count,
          limit: FREE_TRIAL_QUESTION_LIMIT,
          remaining: 0,
          isLimitReached: true,
        },
      };
    }

    // Atomically append new question ID capped at 200
    const updated = await FreeTrialUsage.findOneAndUpdate(
      { userId: userObjectId },
      [
        {
          $set: {
            accessedQuestionIds: {
              $slice: [
                {
                  $setUnion: [
                    { $ifNull: ['$accessedQuestionIds', []] },
                    [qObjectId],
                  ],
                },
                FREE_TRIAL_QUESTION_LIMIT,
              ],
            },
          },
        },
        {
          $set: {
            count: { $size: '$accessedQuestionIds' },
            updatedAt: '$$NOW',
          },
        },
      ],
      { new: true, upsert: true }
    );

    const used = updated?.count ?? FREE_TRIAL_QUESTION_LIMIT;
    const allowed = updated?.accessedQuestionIds?.some((id) => id.equals(qObjectId)) ?? false;

    return {
      allowed,
      usage: {
        used,
        limit: FREE_TRIAL_QUESTION_LIMIT,
        remaining: Math.max(0, FREE_TRIAL_QUESTION_LIMIT - used),
        isLimitReached: used >= FREE_TRIAL_QUESTION_LIMIT,
      },
    };
  }

  /**
   * Process a list of candidate questions for a Free Trial user.
   * - Already accessed questions are retained without consuming quota.
   * - New candidate questions are permitted up to the user's remaining quota and atomically recorded.
   * - Any new questions beyond the 200 limit are filtered out.
   */
  static async recordAndFilterQuestions<T extends { _id: any }>(
    userId: string | Types.ObjectId,
    candidateQuestions: T[]
  ): Promise<{
    allowedQuestions: T[];
    usage: FreeTrialUsageInfo;
    hasReachedLimit: boolean;
  }> {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    let record = await FreeTrialUsage.findOne({ userId: userObjectId });
    if (!record) {
      record = await FreeTrialUsage.create({
        userId: userObjectId,
        accessedQuestionIds: [],
        count: 0,
      });
    }

    const existingIdSet = new Set(
      record.accessedQuestionIds.map((id) => id.toString())
    );

    // Partition candidate questions into already-accessed vs new
    const newQuestionsToRegister: T[] = [];
    const currentUsed = record.count;
    let remainingCapacity = Math.max(0, FREE_TRIAL_QUESTION_LIMIT - currentUsed);

    for (const q of candidateQuestions) {
      const qIdStr = q._id.toString();
      if (!existingIdSet.has(qIdStr)) {
        if (remainingCapacity > 0) {
          newQuestionsToRegister.push(q);
          remainingCapacity -= 1;
        }
      }
    }

    // Atomically persist new question accesses
    if (newQuestionsToRegister.length > 0) {
      const newObjectIds = newQuestionsToRegister.map(
        (q) => new Types.ObjectId(q._id)
      );

      const updated = await FreeTrialUsage.findOneAndUpdate(
        { userId: userObjectId },
        [
          {
            $set: {
              accessedQuestionIds: {
                $slice: [
                  {
                    $setUnion: [
                      { $ifNull: ['$accessedQuestionIds', []] },
                      newObjectIds,
                    ],
                  },
                  FREE_TRIAL_QUESTION_LIMIT,
                ],
              },
            },
          },
          {
            $set: {
              count: { $size: '$accessedQuestionIds' },
              updatedAt: '$$NOW',
            },
          },
        ],
        { new: true, upsert: true }
      );

      if (updated) {
        record = updated;
      }
    }

    // The set of allowed question IDs is the user's updated accessedQuestionIds
    const updatedAllowedSet = new Set(
      record.accessedQuestionIds.map((id) => id.toString())
    );

    // Filter candidate questions strictly to those in the user's permitted set
    const allowedQuestions = candidateQuestions.filter((q) =>
      updatedAllowedSet.has(q._id.toString())
    );

    const used = record.count;
    const remaining = Math.max(0, FREE_TRIAL_QUESTION_LIMIT - used);
    const hasReachedLimit = used >= FREE_TRIAL_QUESTION_LIMIT;

    return {
      allowedQuestions,
      usage: {
        used,
        limit: FREE_TRIAL_QUESTION_LIMIT,
        remaining,
        isLimitReached: hasReachedLimit,
      },
      hasReachedLimit,
    };
  }
}
