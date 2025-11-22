import { Express } from 'express';

export interface UploadImageRequest {
  file: Express.Multer.File;
}

export interface UploadImageResponse {
  message: string;
  data?: {
    image: string;
  };
}
