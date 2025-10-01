import { Express } from 'express';

export type UploadImageRequest = {
  file: Express.Multer.File;
};

export type UploadImageResponse = {
  message: string;
  data?: {
    image: string;
  };
};
