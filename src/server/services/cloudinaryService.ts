import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import { env } from '../config/env.js';

// Configure Cloudinary SDK
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  bytes: number;
  format: string;
}

export class CloudinaryService {
  /**
   * Check if Cloudinary credentials are fully configured
   */
  public static isConfigured(): boolean {
    return Boolean(
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
    );
  }

  /**
   * Upload a local file to Cloudinary as raw PDF
   */
  public static async uploadFile(
    localFilePath: string,
    originalFilename: string
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'Cloudinary is selected as STORAGE_PROVIDER, but CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET is missing.'
      );
    }

    // Refresh config if env changed at runtime
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    const cleanName = originalFilename
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/\.pdf$/i, '');

    const result: UploadApiResponse = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'raw',
      folder: env.CLOUDINARY_FOLDER || 'markdriller/materials',
      public_id: `${cleanName}_${Date.now()}`,
      use_filename: true,
      unique_filename: true,
      overwrite: true,
    });

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      bytes: result.bytes || fs.statSync(localFilePath).size,
      format: result.format || 'pdf',
    };
  }

  /**
   * Delete a file from Cloudinary by public ID
   */
  public static async deleteFile(publicId: string): Promise<void> {
    if (!this.isConfigured()) return;

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    } catch (err) {
      console.warn(`Cloudinary deletion notice for ${publicId}:`, err);
    }
  }

  /**
   * Generate an authorized private download URL for secure server-side streaming
   */
  public static getAuthorizedDownloadUrl(publicIdOrUrl: string): string {
    if (!this.isConfigured()) {
      return publicIdOrUrl;
    }

    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    if (publicIdOrUrl.includes('api.cloudinary.com')) {
      return publicIdOrUrl;
    }

    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.includes('/raw/upload/')) {
      const parts = publicIdOrUrl.split('/raw/upload/');
      if (parts.length > 1) {
        publicId = parts[1].replace(/^v\d+\//, '');
      }
    }

    // Determine extension/format (default to 'pdf')
    const extMatch = publicId.match(/\.([a-zA-Z0-9]+)$/);
    const format = extMatch ? extMatch[1] : 'pdf';

    return cloudinary.utils.private_download_url(publicId, format, {
      resource_type: 'raw',
      type: 'upload',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
  }

  /**
   * Stream a file from Cloudinary directly to client response using authorized download
   */
  public static streamFromCloudinary(fileUrlOrPublicId: string): Promise<http.IncomingMessage> {
    return new Promise((resolve, reject) => {
      const targetUrl = this.getAuthorizedDownloadUrl(fileUrlOrPublicId);
      const client = targetUrl.startsWith('https') ? https : http;
      client
        .get(targetUrl, (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Cloudinary responded with status ${res.statusCode}`));
            return;
          }
          resolve(res);
        })
        .on('error', reject);
    });
  }
}

