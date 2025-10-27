import { NextFunction, Request, Response } from 'express';

import logger from '../util/logger';
import { MediaService } from '../services/media';
import { UploadImageRequest, UploadImageResponse } from '../types/media';
import { sanitizeInput } from '../util/sanitizeInput';

export class MediaController {
  async uploadImage(
    req: Request<unknown, unknown, UploadImageRequest>,
    res: Response<UploadImageResponse>,
    next: NextFunction
  ) {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: 'No file uploaded',
        });
      }

      const user = (req as any).user!;
      const sanitizedFilePath = sanitizeInput(req.file.path);
      const image = await MediaService.saveImage(
        sanitizedFilePath,
        user._id.toString()
      );

      res.status(200).json({
        message: 'Image uploaded successfully',
        data: {
          image,
        },
      });
    } catch (error) {
      logger.error('Error uploading profile picture:', error);

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to upload profile picture',
        });
      }

      next(error);
    }
  }
}
