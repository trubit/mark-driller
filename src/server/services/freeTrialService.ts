import { Types } from 'mongoose';
import { FreeTrialUsage } from '../models/FreeTrialUsage.js';

export const FREE_TRIAL_QUESTION_LIMIT = 200;

export interface FreeTrialUsageInfo {
  used: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
}

export class FreeTrialService {
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
