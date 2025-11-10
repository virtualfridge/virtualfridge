import { Express } from 'express';

export interface UploadImageRequest {
  file: Express.Multer.File;
}

export type UploadImageResponse = {
  message: string;
  data?: {
    image: string;
  };
};
