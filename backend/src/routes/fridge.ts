import { Router } from 'express';
import { fridgeService } from '../services/fridge';

const router = Router();

router.get('/', fridgeService.findAllFridgeItemsByUserId);

export default router;
