import { env } from '../config/env.js';
import { QuestionIngestionService } from './questionIngestionService.js';
import { CompositeQuestionSourceAdapter } from './questionSourceAdapter.js';
import { QuestionSyncLog } from '../models/QuestionSyncLog.js';
import { Exam } from '../models/Exam.js';
import { Subject } from '../models/Subject.js';

export interface SchedulerStatus {
  enabled: boolean;
  isRunning: boolean;
  intervalHours: number;
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastRunStatus?: string;
  sourceUrlConfigured: boolean;
}

export class QuestionSyncScheduler {
  private static instance: QuestionSyncScheduler | null = null;
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private enabled: boolean;
  private intervalHours: number;
  private lastRunAt?: Date;
  private nextRunAt?: Date;
  private lastRunStatus?: string;

  private constructor() {
    this.enabled = env.QUESTION_SYNC_ENABLED;
    this.intervalHours = env.QUESTION_SYNC_INTERVAL_HOURS;
  }

  public static getInstance(): QuestionSyncScheduler {
    if (!QuestionSyncScheduler.instance) {
      QuestionSyncScheduler.instance = new QuestionSyncScheduler();
    }
    return QuestionSyncScheduler.instance;
  }

  /**
   * Start the background scheduler
   */
  public start(): void {
    if (!this.enabled) {
      console.log('ℹ️ [QuestionSyncScheduler] Automatic question synchronization is disabled by configuration.');
      return;
    }

    if (!env.QUESTION_SOURCE_API_URL) {
      console.log('ℹ️ [QuestionSyncScheduler] QUESTION_SOURCE_API_URL is not set. Scheduler standing by for configuration.');
      return;
    }

    console.log(`⏰ [QuestionSyncScheduler] Initializing automated sync interval: every ${this.intervalHours}h.`);
    this.scheduleNextRun(this.intervalHours * 3600 * 1000);
  }

  /**
   * Schedule the next sync execution
   */
  private scheduleNextRun(delayMs: number): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.nextRunAt = new Date(Date.now() + delayMs);
    this.timer = setTimeout(async () => {
      await this.runSyncJob('SCHEDULED');
      if (this.enabled) {
        this.scheduleNextRun(this.intervalHours * 3600 * 1000);
      }
    }, delayMs);
  }

  /**
   * Execute synchronization cycle with non-overlapping mutex lock
   */
  public async runSyncJob(trigger: 'SCHEDULED' | 'MANUAL_ADMIN'): Promise<{
    success: boolean;
    message: string;
    stats?: any;
  }> {
    if (this.isRunning) {
      return {
        success: false,
        message: 'A synchronization job is already running in the background. Skipping overlapping run.',
      };
    }

    if (!env.QUESTION_SOURCE_API_URL) {
      return {
        success: false,
        message: 'Cannot execute sync: QUESTION_SOURCE_API_URL is not configured.',
      };
    }

    this.isRunning = true;
    this.lastRunAt = new Date();

    console.log(`🔄 [QuestionSyncScheduler] Starting ${trigger} sync job...`);

    try {
      const adapter = new CompositeQuestionSourceAdapter();

      // Check adapter health first
      const health = await adapter.validateHealth?.();
      if (health && !health.healthy) {
        throw new Error(`External source health check failed: ${health.details}`);
      }

      // Fetch active exams to synchronize
      const exams = await Exam.find().lean();
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      let totalFailed = 0;

      for (const exam of exams) {
        const subjects = await Subject.find({ examId: exam._id }).lean();
        for (const subject of subjects) {
          try {
            const result = await QuestionIngestionService.ingestFromAdapter(
              adapter,
              {
                examShortCode: exam.shortCode,
                subjectCode: subject.code,
                limit: env.QUESTION_SOURCE_BATCH_SIZE,
              },
              trigger
            );

            totalInserted += result.totalInserted;
            totalUpdated += result.totalUpdated;
            totalSkipped += result.totalSkipped;
            totalFailed += result.totalFailed;
          } catch (itemErr: any) {
            console.warn(
              `⚠️ [QuestionSyncScheduler] Failed to sync ${exam.shortCode} - ${subject.code}: ${itemErr.message}`
            );
            totalFailed++;
          }
        }
      }

      this.lastRunStatus = `Success: +${totalInserted} new, ${totalUpdated} updated, ${totalSkipped} skipped`;
      console.log(`✅ [QuestionSyncScheduler] Sync completed: ${this.lastRunStatus}`);

      return {
        success: true,
        message: `Sync completed: ${totalInserted} questions inserted, ${totalUpdated} updated, ${totalSkipped} skipped.`,
        stats: { totalInserted, totalUpdated, totalSkipped, totalFailed },
      };
    } catch (err: any) {
      this.lastRunStatus = `Failed: ${err.message}`;
      console.error('❌ [QuestionSyncScheduler] Sync job failed safely:', err.message);

      return {
        success: false,
        message: `Sync job failed safely: ${err.message}`,
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get scheduler status for Admin UI
   */
  public async getStatus(): Promise<SchedulerStatus & { lastSyncLog?: any }> {
    const lastSyncLog = await QuestionSyncLog.findOne().sort({ startedAt: -1 }).lean();

    return {
      enabled: this.enabled,
      isRunning: this.isRunning,
      intervalHours: this.intervalHours,
      lastRunAt: this.lastRunAt || lastSyncLog?.startedAt,
      nextRunAt: this.nextRunAt,
      lastRunStatus: this.lastRunStatus || (lastSyncLog ? `${lastSyncLog.status} (${lastSyncLog.totalInserted} inserted)` : 'No sync records yet'),
      sourceUrlConfigured: Boolean(env.QUESTION_SOURCE_API_URL),
      lastSyncLog,
    };
  }

  /**
   * Toggle scheduler runtime state
   */
  public setEnabled(enabled: boolean): boolean {
    this.enabled = enabled;
    if (enabled) {
      this.start();
    } else if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      this.nextRunAt = undefined;
    }
    return this.enabled;
  }

  /**
   * Stop scheduler
   */
  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }
}

export const questionSyncScheduler = QuestionSyncScheduler.getInstance();

