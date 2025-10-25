import { Router } from 'express';
import { fridgeService } from '../services/fridge';
import { validateBody } from '../middleware/validation';
import { barcodeRequestSchema } from '../types/fridge';

const router = Router();

router.get('/', fridgeService.findAllFridgeItemsByUserId);

router.post('/barcode', validateBody(barcodeRequestSchema));

export default router;
