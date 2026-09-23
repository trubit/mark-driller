import { z } from 'zod';
import { Types } from 'mongoose';
import { Exam } from '../models/Exam.js';
import { Subject } from '../models/Subject.js';
import { Topic } from '../models/Topic.js';
import { Question, IQuestion, QuestionReviewStatus } from '../models/Question.js';
import { QuestionSyncLog, SyncTrigger, SyncStatus } from '../models/QuestionSyncLog.js';
import { env } from '../config/env.js';
import {
  IQuestionSourceAdapter,
  NormalizedRawQuestion,
  FetchOptions,
  QuestionSourceUnavailableError,
  AdminFileImportAdapter,
  CompositeQuestionSourceAdapter,
} from './questionSourceAdapter.js';


// Strict schema for validating incoming questions from external sources or file imports
export const rawQuestionSchema = z.object({
  sourceQuestionId: z.string().optional(),
  examShortCode: z.string().min(2, 'Exam shortCode must have at least 2 characters'),
  subjectCode: z.string().min(2, 'Subject code must have at least 2 characters'),
  year: z.number().int().min(1970).max(2035),
  questionNumber: z.number().int().min(1),
  questionText: z.string().min(5, 'Question text must be at least 5 characters'),
  optionA: z.string().min(1, 'Option A is required'),
  optionB: z.string().min(1, 'Option B is required'),
  optionC: z.string().min(1, 'Option C is required'),
  optionD: z.string().min(1, 'Option D is required'),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().default(''),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  topicHint: z.string().optional(),
  sourceReference: z.string().optional(),
  licenseInfo: z.string().optional(),
  imageUrl: z.string().optional(),
});

export interface IngestionResult {
  syncLogId: string;
  provider: string;
  trigger: SyncTrigger;
  status: SyncStatus;
  totalFetched: number;
  totalInserted: number;
  totalUpdated: number;
  totalSkipped: number;
  totalFailed: number;
  insertedIds: string[];
  updatedIds: string[];
  quarantineErrors: Array<{ index: number; reason: string }>;
  durationMs: number;
}

export class QuestionIngestionService {
  /**
   * Core pipeline: Ingest a normalized raw question list into MongoDB with validation,
   * duplicate prevention, and version updates.
   */
  static async processRawQuestionBatch(
    questions: NormalizedRawQuestion[],
    options: {
      providerName: string;
      trigger: SyncTrigger;
      defaultReviewStatus?: QuestionReviewStatus;
      autoPublish?: boolean;
    }
  ): Promise<IngestionResult> {
    const startTime = Date.now();
    const provider = options.providerName;
    const trigger = options.trigger;

    // Create sync audit log in RUNNING state
    const syncLog = await QuestionSyncLog.create({
      sourceProvider: provider,
      trigger,
      startedAt: new Date(),
      status: 'RUNNING',
      totalFetched: questions.length,
    });

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const insertedIds: string[] = [];
    const updatedIds: string[] = [];
    const quarantineErrors: Array<{ index: number; reason: string }> = [];

    // Cache exams and subjects for fast lookups
    const examCache = new Map<string, any>();
    const subjectCache = new Map<string, any>();
    const topicsCache = new Map<string, any[]>();

    for (let idx = 0; idx < questions.length; idx++) {
      const raw = questions[idx];

      // 1. Schema Validation Layer
      const validation = rawQuestionSchema.safeParse(raw);
      if (!validation.success) {
        failedCount++;
        quarantineErrors.push({
          index: idx + 1,
          reason: Object.entries(validation.error.flatten().fieldErrors)
            .map(([field, errs]) => `${field}: ${errs.join(', ')}`)
            .join('; '),
        });
        continue;
      }

      const item = validation.data;

      try {
        // 2. Resolve Exam
        let exam = examCache.get(item.examShortCode.toUpperCase());
        if (!exam) {
          exam = await Exam.findOne({
            $or: [
              { shortCode: { $regex: `^${item.examShortCode.trim()}$`, $options: 'i' } },
              { name: { $regex: item.examShortCode.trim(), $options: 'i' } },
            ],
          });
          if (exam) examCache.set(item.examShortCode.toUpperCase(), exam);
        }

        if (!exam) {
          failedCount++;
          quarantineErrors.push({
            index: idx + 1,
            reason: `Referenced exam '${item.examShortCode}' is not registered in the system.`,
          });
          continue;
        }

        // 3. Resolve Subject
        const subjectKey = `${exam._id.toString()}_${item.subjectCode.toUpperCase()}`;
        let subject = subjectCache.get(subjectKey);
        if (!subject) {
          subject = await Subject.findOne({
            examId: exam._id,
            $or: [
              { code: { $regex: `^${item.subjectCode.trim()}$`, $options: 'i' } },
              { name: { $regex: item.subjectCode.trim(), $options: 'i' } },
            ],
          });
          if (subject) subjectCache.set(subjectKey, subject);
        }

        if (!subject) {
          failedCount++;
          quarantineErrors.push({
            index: idx + 1,
            reason: `Subject '${item.subjectCode}' not found under examination board '${exam.shortCode}'.`,
          });
          continue;
        }

        // 4. Resolve Topic (by topic hint or keyword matching)
        const topicListKey = subject._id.toString();
        let topics = topicsCache.get(topicListKey);
        if (!topics) {
          topics = await Topic.find({ subjectId: subject._id }).lean();
          topicsCache.set(topicListKey, topics);
        }

        let matchedTopicId: Types.ObjectId | undefined = undefined;
        if (item.topicHint && topics.length > 0) {
          const hint = item.topicHint.toLowerCase();
          const found = topics.find((t) => t.name.toLowerCase().includes(hint));
          if (found) matchedTopicId = found._id;
        }

        if (!matchedTopicId && topics.length > 0) {
          const textLower = item.questionText.toLowerCase();
          for (const topic of topics) {
            const keywords = topic.name.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
            if (keywords.some((w: string) => textLower.includes(w))) {
              matchedTopicId = topic._id;
              break;
            }

          }
        }

        // 5. Duplicate & Version Update Detection
        // Scenario A: Check by external Source ID
        let existingQuestion: IQuestion | null = null;
        if (item.sourceQuestionId) {
          existingQuestion = await Question.findOne({
            sourceProvider: provider,
            sourceQuestionId: item.sourceQuestionId,
          });
        }

        // Scenario B: Check by exact content or examination identifier
        if (!existingQuestion) {
          existingQuestion = await Question.findOne({
            examId: exam._id,
            subjectId: subject._id,
            year: item.year,
            $or: [
              { questionText: item.questionText.trim() },
              { questionNumber: item.questionNumber },
            ],
          });
        }

        if (existingQuestion) {
          // Check if content actually changed
          const isContentChanged =
            existingQuestion.questionText !== item.questionText.trim() ||
            existingQuestion.optionA !== item.optionA.trim() ||
            existingQuestion.optionB !== item.optionB.trim() ||
            existingQuestion.optionC !== item.optionC.trim() ||
            existingQuestion.optionD !== item.optionD.trim() ||
            existingQuestion.correctAnswer !== item.correctAnswer ||
            existingQuestion.explanation !== item.explanation.trim();

          if (!isContentChanged) {
            // UNCHANGED QUESTION -> Skip to avoid unnecessary updates
            skippedCount++;
            continue;
          }

          // UPDATED QUESTION -> Update safely with version increment
          existingQuestion.questionText = item.questionText.trim();
          existingQuestion.optionA = item.optionA.trim();
          existingQuestion.optionB = item.optionB.trim();
          existingQuestion.optionC = item.optionC.trim();
          existingQuestion.optionD = item.optionD.trim();
          existingQuestion.correctAnswer = item.correctAnswer;
          existingQuestion.explanation = item.explanation.trim();
          existingQuestion.difficulty = item.difficulty;
          if (matchedTopicId) existingQuestion.topicId = matchedTopicId;
          existingQuestion.syncVersion = (existingQuestion.syncVersion || 1) + 1;
          existingQuestion.lastSyncedAt = new Date();
          if (item.sourceReference) existingQuestion.sourceReference = item.sourceReference;
          if (item.licenseInfo) existingQuestion.licenseInfo = item.licenseInfo;

          await existingQuestion.save();
          updatedCount++;
          updatedIds.push(existingQuestion._id.toString());
          continue;
        }

        // 6. NEW QUESTION -> Insert into MongoDB
        // Compute non-clashing questionNumber if this number is already taken
        const highestQ = await Question.findOne({
          examId: exam._id,
          subjectId: subject._id,
          year: item.year,
        })
          .sort({ questionNumber: -1 })
          .select('questionNumber')
          .lean();

        const resolvedNumber = highestQ ? highestQ.questionNumber + 1 : item.questionNumber;

        const autoPublish = options.autoPublish ?? env.QUESTION_AUTO_PUBLISH;
        const reviewStatus = options.defaultReviewStatus || (autoPublish ? 'PUBLISHED' : 'IMPORTED');

        const newQuestion = await Question.create({
          examId: exam._id,
          subjectId: subject._id,
          topicId: matchedTopicId,
          year: item.year,
          questionNumber: resolvedNumber,
          questionText: item.questionText.trim(),
          optionA: item.optionA.trim(),
          optionB: item.optionB.trim(),
          optionC: item.optionC.trim(),
          optionD: item.optionD.trim(),
          correctAnswer: item.correctAnswer,
          explanation: item.explanation.trim(),
          difficulty: item.difficulty,
          imageUrl: item.imageUrl,
          published: autoPublish,
          sourceProvider: provider,
          sourceQuestionId: item.sourceQuestionId,
          sourceReference: item.sourceReference,
          licenseInfo: item.licenseInfo || 'Authorized Educational Past Question Use',
          syncVersion: 1,
          lastSyncedAt: new Date(),
          reviewStatus,
        });

        insertedCount++;
        insertedIds.push(newQuestion._id.toString());
      } catch (err: any) {
        failedCount++;
        quarantineErrors.push({
          index: idx + 1,
          reason: err.message || 'Database error during question persistence',
        });
      }
    }

    // Refresh exam question count in MongoDB
    for (const exam of examCache.values()) {
      const count = await Question.countDocuments({ examId: exam._id });
      exam.questionCount = count;
      await exam.save();
    }

    // Finalize sync telemetry status
    const durationMs = Date.now() - startTime;
    let finalStatus: SyncStatus = 'SUCCESS';
    if (failedCount > 0 && insertedCount === 0 && updatedCount === 0) {
      finalStatus = 'FAILED';
    } else if (failedCount > 0) {
      finalStatus = 'PARTIAL';
    }

    syncLog.completedAt = new Date();
    syncLog.durationMs = durationMs;
    syncLog.status = finalStatus;
    syncLog.totalInserted = insertedCount;
    syncLog.totalUpdated = updatedCount;
    syncLog.totalSkipped = skippedCount;
    syncLog.totalFailed = failedCount;
    if (quarantineErrors.length > 0) {
      syncLog.errorMessage = `${quarantineErrors.length} questions failed validation or mapping.`;
      syncLog.metadata = { quarantineErrors: quarantineErrors.slice(0, 50) };
    }
    await syncLog.save();

    return {
      syncLogId: syncLog._id.toString(),
      provider,
      trigger,
      status: finalStatus,
      totalFetched: questions.length,
      totalInserted: insertedCount,
      totalUpdated: updatedCount,
      totalSkipped: skippedCount,
      totalFailed: failedCount,
      insertedIds,
      updatedIds,
      quarantineErrors,
      durationMs,
    };
  }

  /**
   * Ingest from an external authorized provider adapter (e.g. REST API feed)
   */
  static async ingestFromAdapter(
    adapter: IQuestionSourceAdapter,
    options: FetchOptions,
    trigger: SyncTrigger = 'MANUAL_ADMIN',
    ingestOpts?: { autoPublish?: boolean; defaultReviewStatus?: QuestionReviewStatus }
  ): Promise<IngestionResult> {
    try {
      const fetchResult = await adapter.fetchQuestions(options);
      return await this.processRawQuestionBatch(fetchResult.questions, {
        providerName: adapter.providerName,
        trigger,
        autoPublish: ingestOpts?.autoPublish ?? env.QUESTION_AUTO_PUBLISH,
        defaultReviewStatus: ingestOpts?.defaultReviewStatus,
      });
    } catch (err: any) {
      // Record failed synchronization in QuestionSyncLog
      const isRateLimited = err instanceof QuestionSourceUnavailableError && err.isRateLimited;
      await QuestionSyncLog.create({
        sourceProvider: adapter.providerName,
        trigger,
        startedAt: new Date(),
        completedAt: new Date(),
        status: isRateLimited ? 'RATE_LIMITED' : 'FAILED',
        totalFetched: 0,
        totalInserted: 0,
        totalUpdated: 0,
        totalSkipped: 0,
        totalFailed: 0,
        errorMessage: err.message,
      });
      throw err;
    }
  }

  /**
   * Ingest from administrative file upload (CSV or JSON)
   */
  static async ingestFromFile(
    fileContent: string,
    fileType: 'csv' | 'json',
    metadata?: { defaultExam?: string; defaultSubject?: string }
  ): Promise<IngestionResult> {
    const rawQuestions =
      fileType === 'json'
        ? AdminFileImportAdapter.parseJson(fileContent, metadata)
        : AdminFileImportAdapter.parseCsv(fileContent, metadata);

    return await this.processRawQuestionBatch(rawQuestions, {
      providerName: fileType === 'csv' ? 'ADMIN_IMPORT_CSV' : 'ADMIN_IMPORT_JSON',
      trigger: 'FILE_IMPORT',
      defaultReviewStatus: 'APPROVED',
      autoPublish: true, // Admin-curated datasets are approved and published
    });
  }

  private static onDemandLocks = new Map<string, Promise<IngestionResult>>();

  /**
   * On-demand dynamic question acquisition for a specific curriculum
   * Coalesces concurrent calls so that duplicate external fetches never occur.
   */
  static async acquireOnDemandForCurriculum(params: {
    examShortCode: string;
    subjectCode: string;
    year?: number;
  }): Promise<IngestionResult> {
    const lockKey = `${params.examShortCode.toUpperCase().trim()}_${params.subjectCode.toUpperCase().trim()}_${params.year || 'ALL'}`;
    const activeLock = this.onDemandLocks.get(lockKey);
    if (activeLock) {
      return await activeLock;
    }

    const taskPromise = (async () => {
      try {
        const adapter = new CompositeQuestionSourceAdapter();
        const res = await this.ingestFromAdapter(
          adapter,
          {
            examShortCode: params.examShortCode,
            subjectCode: params.subjectCode,
            year: params.year,
            limit: 30,
          },
          'SCHEDULED',
          {
            autoPublish: true,
            defaultReviewStatus: 'PUBLISHED',
          }
        );
        return res;
      } finally {
        this.onDemandLocks.delete(lockKey);
      }
    })();

    this.onDemandLocks.set(lockKey, taskPromise);
    return await taskPromise;
  }
}


