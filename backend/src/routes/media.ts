import { Router } from 'express';

import { upload } from '../util/storage';
import { authenticateToken } from '../middleware/auth';
import { MediaController } from '../controllers/media';

const router = Router();
const mediaController = new MediaController();

router.post(
  '/upload',
  authenticateToken,
  upload.single('media'),
  mediaController.uploadImage
);

export default router;
