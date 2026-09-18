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

