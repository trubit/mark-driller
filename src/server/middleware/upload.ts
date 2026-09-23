import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { env } from '../config/env.js';

// Ensure upload directory exists and is located outside web root
export const STORAGE_DIR_ABSOLUTE = path.resolve(process.cwd(), env.STORAGE_DIR);
if (!fs.existsSync(STORAGE_DIR_ABSOLUTE)) {
  fs.mkdirSync(STORAGE_DIR_ABSOLUTE, { recursive: true });
}

// Allowed MIME types and extensions: Strict PDF format
const ALLOWED_MIME_TYPES = new Set(['application/pdf']);
const ALLOWED_EXTENSIONS = new Set(['.pdf']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, STORAGE_DIR_ABSOLUTE);
  },
  filename: (_req, _file, cb) => {
    // Generate cryptographically random storage identifier with .pdf extension
    const storageId = `mat_${crypto.randomUUID()}.pdf`;
    cb(null, storageId);
  },
});

export const materialUpload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB maximum
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('This file type is not supported. Please upload an approved study-material format.'));
    }
    cb(null, true);
  },
});

/**
 * Validates actual binary content (magic bytes) of uploaded file
 * Verifies that the file begins with the standard PDF header: %PDF- (0x25 0x50 0x44 0x46)
 */
export async function validatePdfFileSignature(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) {
      return resolve(false);
    }

    const stream = fs.createReadStream(filePath, { start: 0, end: 7 });
    let buffer = Buffer.alloc(0);

    stream.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk as Buffer]);
    });

    stream.on('end', () => {
      const isPdf =
        buffer.length >= 4 &&
        buffer[0] === 0x25 && // %
        buffer[1] === 0x50 && // P
        buffer[2] === 0x44 && // D
        buffer[3] === 0x46;   // F
      resolve(isPdf);
    });

    stream.on('error', () => {
      resolve(false);
    });
  });
}

// ----------------------------------------------------
// PAYMENT RECEIPT PROOF UPLOADS (Images & PDFs up to 10MB)
// ----------------------------------------------------
export const RECEIPTS_DIR_ABSOLUTE = path.resolve(process.cwd(), 'uploads/receipts');
if (!fs.existsSync(RECEIPTS_DIR_ABSOLUTE)) {
  fs.mkdirSync(RECEIPTS_DIR_ABSOLUTE, { recursive: true });
}

const ALLOWED_RECEIPT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'application/pdf',
]);
const ALLOWED_RECEIPT_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, RECEIPTS_DIR_ABSOLUTE);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const storageId = `rcpt_${Date.now()}_${crypto.randomUUID().slice(0, 8)}${ext}`;
    cb(null, storageId);
  },
});

export const receiptUpload = multer({
  storage: receiptStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum receipt proof size
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_RECEIPT_EXTENSIONS.has(ext) || !ALLOWED_RECEIPT_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Please upload an image screenshot (PNG, JPG, WEBP) or PDF receipt document.'));
    }
    cb(null, true);
  },
});

/**
 * Validates actual binary content (magic bytes) of uploaded payment receipt
 * Verifies that the file begins with legitimate JPEG, PNG, WEBP, or PDF headers
 */
export async function validateReceiptFileSignature(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) {
      return resolve(false);
    }

    const stream = fs.createReadStream(filePath, { start: 0, end: 15 });
    let buffer = Buffer.alloc(0);

    stream.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk as Buffer]);
    });

    stream.on('end', () => {
      if (buffer.length < 4) return resolve(false);

      // PNG: 89 50 4E 47
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;

      // JPEG: FF D8 FF
      const isJpg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

      // PDF: %PDF- (25 50 44 46)
      const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

      // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
      const isWebp =
        buffer.length >= 12 &&
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

      resolve(isPng || isJpg || isPdf || isWebp);
    });

    stream.on('error', () => {
      resolve(false);
    });
  });
}

// ----------------------------------------------------
// USER PROFILE AVATAR UPLOADS (Images up to 2MB)
// ----------------------------------------------------
export const AVATARS_DIR_ABSOLUTE = path.resolve(process.cwd(), 'uploads/avatars');
if (!fs.existsSync(AVATARS_DIR_ABSOLUTE)) {
  fs.mkdirSync(AVATARS_DIR_ABSOLUTE, { recursive: true });
}

const ALLOWED_AVATAR_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
]);
const ALLOWED_AVATAR_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, AVATARS_DIR_ABSOLUTE);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const storageId = `avatar_${Date.now()}_${crypto.randomUUID().slice(0, 8)}${ext}`;
    cb(null, storageId);
  },
});

export const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB maximum avatar size
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_AVATAR_EXTENSIONS.has(ext) || !ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Please upload an authentic image file (JPEG, PNG, or WEBP) under 2MB.'));
    }
    cb(null, true);
  },
});

/**
 * Validates actual binary content (magic bytes) of uploaded avatar image
 * Verifies that the file begins with legitimate JPEG, PNG, or WEBP headers
 */
export async function validateAvatarFileSignature(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) {
      return resolve(false);
    }

    const stream = fs.createReadStream(filePath, { start: 0, end: 15 });
    let buffer = Buffer.alloc(0);

    stream.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk as Buffer]);
    });

    stream.on('end', () => {
      if (buffer.length < 4) return resolve(false);

      // PNG: 89 50 4E 47
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;

      // JPEG: FF D8 FF
      const isJpg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

      // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
      const isWebp =
        buffer.length >= 12 &&
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

      resolve(isPng || isJpg || isWebp);
    });

    stream.on('error', () => {
      resolve(false);
    });
  });
}

