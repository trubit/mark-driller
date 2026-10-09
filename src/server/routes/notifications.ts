import { Router, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Notification } from '../models/Notification.js';
import { authenticateToken, checkStudentSubscription, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// All student notification routes require authentication
router.use(authenticateToken);

/**
 * GET /api/notifications — Fetch notifications targeted for current student
 */
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const userRole = req.user!.role;

    // Determine student entitlement tier
    const { isPro } = await checkStudentSubscription(userId);

    const eligibleAudiences: string[] = ['ALL'];
    if (isPro || userRole === 'ADMIN') {
      eligibleAudiences.push('PREMIUM');
    } else {
      eligibleAudiences.push('FREE');
    }

    if (userRole === 'ADMIN') {
      eligibleAudiences.push('JAMB', 'WAEC', 'NECO', 'POST_UTME');
    }

    const now = new Date();
    const notifications = await Notification.find({
      status: 'ACTIVE',
      audience: { $in: eligibleAudiences },
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const userObjectId = new Types.ObjectId(userId);

    const mapped = notifications.map((n) => {
      const readByList = (n.readBy || []) as Types.ObjectId[];
      const isRead = readByList.some((rId) => rId.toString() === userObjectId.toString());

      return {
        _id: n._id,
        title: n.title,
        message: n.message,
        audience: n.audience,
        type: n.type,
        priority: n.priority,
        actionText: n.actionText,
        actionLink: n.actionLink,
        isRead,
        createdAt: n.createdAt,
      };
    });

    const unreadCount = mapped.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      data: mapped,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/notifications/:id/read — Mark single notification as read
 */
router.post('/:id/read', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const notifId = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = req.user!._id;

    if (!Types.ObjectId.isValid(notifId)) {
      res.status(400).json({ success: false, error: { message: 'Invalid notification ID' } });
      return;
    }

    await Notification.findByIdAndUpdate(notifId, {
      $addToSet: { readBy: new Types.ObjectId(userId) },
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/notifications/read-all — Mark all eligible notifications as read
 */
router.post('/read-all', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { isPro } = await checkStudentSubscription(userId);

    const eligibleAudiences = ['ALL'];
    if (isPro || req.user!.role === 'ADMIN') {
      eligibleAudiences.push('PREMIUM');
    } else {
      eligibleAudiences.push('FREE');
    }

    await Notification.updateMany(
      {
        status: 'ACTIVE',
        audience: { $in: eligibleAudiences },
      },
      {
        $addToSet: { readBy: new Types.ObjectId(userId) },
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
