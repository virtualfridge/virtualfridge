import { Router } from 'express';
import { NotificationController } from '../controllers/notification';

const router = Router();
const controller = new NotificationController();

router.post('/test', controller.sendTestNotification.bind(controller));

export default router;
