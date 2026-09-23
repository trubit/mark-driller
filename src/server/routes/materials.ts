import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';
import { StudyMaterial } from '../models/StudyMaterial.js';
import { Exam } from '../models/Exam.js';
import { Subject } from '../models/Subject.js';
import { Subscription } from '../models/Subscription.js';
import { authenticateToken, requireAdmin, requireVerified, AuthenticatedRequest } from '../middleware/auth.js';
import { materialUpload, validatePdfFileSignature, STORAGE_DIR_ABSOLUTE } from '../middleware/upload.js';
import { materialDownloadLimiter, materialUploadLimiter } from '../middleware/rateLimiter.js';
import { CloudinaryService } from '../services/cloudinaryService.js';

const router = Router();

const createMaterialSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(1000).default(''),
  storageFilename: z.string().min(1, 'Storage identifier is required'),
  fileUrl: z.string().optional(),
  originalFilename: z.string().min(1, 'Original filename is required'),
  fileSize: z.number().nonnegative(),
  isPublished: z.boolean().default(true),
  isPremium: z.boolean().default(false),
});

// Helper: Sanitizes search queries against ReDoS attacks
function escapeRegex(text: string): string {
  return text.slice(0, 60).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// -------------------------------------------------------------
// 1. PUBLIC / STUDENT: Filterable list of published materials
// -------------------------------------------------------------
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { examId, subjectId, year, search, premiumOnly, page, limit, sort, paginated } = req.query;
    const filter: any = { isPublished: true };

    if (examId && typeof examId === 'string') filter.examId = examId;
    if (subjectId && typeof subjectId === 'string') filter.subjectId = subjectId;
    if (year && !isNaN(Number(year))) filter.year = Number(year);
    if (premiumOnly === 'true') filter.isPremium = true;
    if (premiumOnly === 'false') filter.isPremium = false;

    if (search && typeof search === 'string' && search.trim()) {
      const sanitized = escapeRegex(search.trim());
      filter.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
        { originalFilename: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const sortMap: Record<string, any> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      title: { title: 1 },
      downloads: { downloadCount: -1 },
    };
    const sortValue = typeof sort === 'string' && sortMap[sort] ? sortMap[sort] : sortMap.newest;

    const query = StudyMaterial.find(filter)
      .select('_id examId subjectId title description originalFilename fileType fileSize isPublished isPremium downloadCount year createdAt')
      .populate('examId', 'name shortCode')
      .populate('subjectId', 'name code')
      .sort(sortValue);

    if (paginated === 'true') {
      const pageNumber = Math.max(1, Number(page) || 1);
      const limitNumber = Math.min(48, Math.max(6, Number(limit) || 12));
      const skip = (pageNumber - 1) * limitNumber;

      const [materials, total] = await Promise.all([
        query.clone().skip(skip).limit(limitNumber).lean(),
        StudyMaterial.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: {
          items: materials,
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.max(1, Math.ceil(total / limitNumber)),
        },
      });
      return;
    }

    const materials = await query.lean();

    res.status(200).json({ success: true, data: materials });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 2. PUBLIC / STUDENT: Single material details
// -------------------------------------------------------------
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const materialId = Array.isArray(rawId) ? rawId[0] : rawId;

    const material = await StudyMaterial.findById(materialId)
      .select('_id examId subjectId title description originalFilename fileType fileSize isPublished isPremium downloadCount year createdAt')
      .populate('examId', 'name shortCode')
      .populate('subjectId', 'name code');

    if (!material || !material.isPublished) {
      res.status(404).json({ success: false, error: { message: 'This study material is currently unavailable.' } });
      return;
    }

    res.status(200).json({ success: true, data: material });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 3. ADMIN ONLY: Upload physical revision PDF with signature check
// -------------------------------------------------------------
router.post(
  '/upload',
  materialUploadLimiter,
  authenticateToken,
  requireAdmin,
  (req: Request, res: Response) => {
    materialUpload.single('file')(req, res, async (err: any) => {
      if (err) {
        res.status(400).json({
          success: false,
          error: { message: err.message || 'File upload failed.' },
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { message: 'Please select a valid PDF file to upload.' },
        });
        return;
      }

      const filePath = path.resolve(STORAGE_DIR_ABSOLUTE, req.file.filename);

      // Deep verification: Verify actual binary magic bytes (%PDF-)
      const isValidPdf = await validatePdfFileSignature(filePath);
      if (!isValidPdf) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        res.status(400).json({
          success: false,
          error: { message: 'This file type is not supported. Please upload an approved study-material format.' },
        });
        return;
      }

      const safeOriginalName = path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');

      // Upload to Cloudinary if configured as storage provider
      if (env.STORAGE_PROVIDER === 'cloudinary') {
        if (!CloudinaryService.isConfigured()) {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          res.status(500).json({
            success: false,
            error: { message: 'Cloudinary is selected as STORAGE_PROVIDER, but CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET is not configured in .env' },
          });
          return;
        }

        try {
          const cloudRes = await CloudinaryService.uploadFile(filePath, safeOriginalName);
          // Delete temporary local file after cloud upload
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          res.status(201).json({
            success: true,
            message: 'Study material uploaded successfully to Cloudinary.',
            data: {
              storageFilename: cloudRes.publicId,
              fileUrl: cloudRes.secureUrl,
              originalFilename: safeOriginalName,
              fileSize: cloudRes.bytes,
              mimeType: 'application/pdf',
            },
          });
          return;
        } catch (cloudErr: any) {
          console.error('Cloudinary upload failure:', cloudErr);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          res.status(500).json({
            success: false,
            error: { message: `Cloud storage upload failed: ${cloudErr.message || 'Unknown error'}` },
          });
          return;
        }
      }

      // Local storage
      res.status(201).json({
        success: true,
        message: 'Study material uploaded successfully.',
        data: {
          storageFilename: req.file.filename,
          fileUrl: `/api/materials/storage/${req.file.filename}`,
          originalFilename: safeOriginalName,
          fileSize: req.file.size,
          mimeType: 'application/pdf',
        },
      });
    });
  }
);

// -------------------------------------------------------------
// 4. ADMIN ONLY: Save study material metadata to database
// -------------------------------------------------------------
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createMaterialSchema.parse(req.body);

      // Verify referenced exam and subject exist
      const [exam, subject] = await Promise.all([
        Exam.findById(data.examId),
        Subject.findById(data.subjectId),
      ]);

      if (!exam || !subject) {
        res.status(400).json({
          success: false,
          error: { message: 'The referenced examination board or syllabus subject does not exist.' },
        });
        return;
      }

      const isCloudinary = Boolean(data.fileUrl && data.fileUrl.startsWith('http'));

      if (!isCloudinary) {
        // Verify physical file exists in local storage root
        const physicalPath = path.resolve(STORAGE_DIR_ABSOLUTE, path.basename(data.storageFilename));
        if (!physicalPath.startsWith(STORAGE_DIR_ABSOLUTE + path.sep) || !fs.existsSync(physicalPath)) {
          res.status(400).json({
            success: false,
            error: { message: 'The uploaded file could not be verified on storage.' },
          });
          return;
        }
      }

      const material = await StudyMaterial.create({
        examId: exam._id,
        subjectId: subject._id,
        title: data.title,
        description: data.description,
        fileUrl: isCloudinary ? data.fileUrl : `/api/materials/storage/${path.basename(data.storageFilename)}`,
        storageFilename: data.storageFilename,
        originalFilename: data.originalFilename,
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileSize: data.fileSize,
        isPublished: data.isPublished,
        isPremium: data.isPremium,
        downloadCount: 0,
        createdBy: req.user!._id,
      });

      res.status(201).json({
        success: true,
        message: 'Study material created successfully.',
        data: material,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: error.flatten().fieldErrors },
        });
        return;
      }
      next(error);
    }
  }
);

// -------------------------------------------------------------
// 5. AUTHENTICATED DOWNLOAD: Secure physical file streaming
// -------------------------------------------------------------
router.get(
  '/:id/download',
  materialDownloadLimiter,
  authenticateToken,
  requireVerified,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawId = req.params.id;
      const materialId = Array.isArray(rawId) ? rawId[0] : rawId;
      const user = req.user!;
      const isAdmin = user.role === 'ADMIN';

      const material = await StudyMaterial.findById(materialId)
        .populate('examId', 'shortCode')
        .populate('subjectId', 'code');

      if (!material) {
        res.status(404).json({ success: false, error: { message: 'This study material is currently unavailable.' } });
        return;
      }

      // Unpublished materials are invisible to regular students
      if (!material.isPublished && !isAdmin) {
        res.status(404).json({ success: false, error: { message: 'This study material is currently unavailable.' } });
        return;
      }

      // Premium Access Check: Requires active Pro subscription for non-admins
      if (material.isPremium && !isAdmin) {
        const activeSub = await Subscription.findOne({
          userId: user._id,
          status: 'ACTIVE',
          plan: { $in: ['PRO_MONTHLY', 'PRO_ANNUAL'] },
          $or: [{ endDate: { $gt: new Date() } }, { endDate: null }],
        });

        if (!activeSub) {
          res.status(403).json({
            success: false,
            error: {
              code: 'SUBSCRIPTION_REQUIRED',
              message: 'This premium revision pack requires an active Pro subscription.',
              requiresUpgrade: true,
            },
          });
          return;
        }
      }

      // Increment download counter atomically
      await StudyMaterial.findByIdAndUpdate(materialId, { $inc: { downloadCount: 1 } });

      const downloadName = `${material.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

      // Set security and download headers
      res.setHeader('Content-Type', material.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // 1. Cloudinary Streaming Support
      if (material.fileUrl && material.fileUrl.startsWith('http')) {
        try {
          const cloudStream = await CloudinaryService.streamFromCloudinary(material.fileUrl);
          if (cloudStream.headers['content-length']) {
            res.setHeader('Content-Length', cloudStream.headers['content-length']);
          }
          cloudStream.pipe(res);
          return;
        } catch (streamErr) {
          console.error('Error streaming from Cloudinary:', streamErr);
          res.status(502).json({
            success: false,
            error: { message: 'Failed to retrieve study material from cloud storage.' },
          });
          return;
        }
      }

      // 2. Local Disk Storage Streaming
      const safeFilename = path.basename(material.storageFilename || material.fileUrl);
      const safeFilePath = path.resolve(STORAGE_DIR_ABSOLUTE, safeFilename);

      if (!safeFilePath.startsWith(STORAGE_DIR_ABSOLUTE + path.sep)) {
        res.status(403).json({ success: false, error: { message: 'Access denied: invalid file path.' } });
        return;
      }

      // Physical File Verification — Zero mock/fallback strings
      if (!fs.existsSync(safeFilePath)) {
        res.status(404).json({
          success: false,
          error: { message: 'This study material is currently unavailable.' },
        });
        return;
      }

      const stat = fs.statSync(safeFilePath);
      res.setHeader('Content-Length', stat.size);

      // Stream physical file
      const stream = fs.createReadStream(safeFilePath);
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
);

// -------------------------------------------------------------
// 6. ADMIN ONLY: Toggle publish status
// -------------------------------------------------------------
router.patch(
  '/:id/publish',
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawId = req.params.id;
      const materialId = Array.isArray(rawId) ? rawId[0] : rawId;

      const material = await StudyMaterial.findById(materialId);
      if (!material) {
        res.status(404).json({ success: false, error: { message: 'This study material was not found.' } });
        return;
      }

      material.isPublished = !material.isPublished;
      await material.save();

      res.status(200).json({
        success: true,
        message: `Study material ${material.isPublished ? 'published' : 'unpublished'} successfully.`,
        data: {
          _id: material._id,
          isPublished: material.isPublished,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// -------------------------------------------------------------
// 7. ADMIN ONLY: Delete study material & physical file
// -------------------------------------------------------------
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawId = req.params.id;
      const materialId = Array.isArray(rawId) ? rawId[0] : rawId;

      const deleted = await StudyMaterial.findByIdAndDelete(materialId);
      if (!deleted) {
        res.status(404).json({ success: false, error: { message: 'This study material was not found.' } });
        return;
      }

      // Remove physical file from Cloudinary or local storage disk
      if (deleted.storageFilename) {
        if (deleted.fileUrl && deleted.fileUrl.startsWith('http')) {
          await CloudinaryService.deleteFile(deleted.storageFilename);
        } else {
          const safeFilename = path.basename(deleted.storageFilename);
          const physicalPath = path.resolve(STORAGE_DIR_ABSOLUTE, safeFilename);
          if (physicalPath.startsWith(STORAGE_DIR_ABSOLUTE + path.sep) && fs.existsSync(physicalPath)) {
            try {
              fs.unlinkSync(physicalPath);
            } catch (unlinkErr) {
              console.error('Failed to unlink physical file:', unlinkErr);
            }
          }
        }
      }

      res.status(200).json({ success: true, message: 'Study material deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

