import { Router, Request, Response } from 'express';
import { cronService } from '../services/cronService';
import { userModel } from '../models/user';
import { foodItemModel } from '../models/foodItem';
import { notificationService } from '../services/notification';

const router = Router();

// Admin/Testing routes for notifications (NO AUTH REQUIRED)
// These are for testing and debugging purposes

// Manual trigger endpoint for testing/debugging (checks ALL users)
router.post('/trigger', async (req: Request, res: Response) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('Manual notification trigger requested via API');
    console.log('='.repeat(60) + '\n');

    // Trigger the notification check immediately
    await cronService.triggerNotificationCheck();

    return res.status(200).json({
      message: 'Notification check triggered successfully. Check server logs for details.',
    });
  } catch (error) {
    console.error('Error triggering notification check:', error);
    return res.status(500).json({
      message: 'Failed to trigger notification check',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Debug endpoint to check current state
router.get('/debug', async (req: Request, res: Response) => {
  try {
    const users = await userModel.findUsersWithFcmTokens();
    const debugInfo: any = {
      firebaseInitialized: notificationService.isInitialized(),
      totalUsersWithTokens: users.length,
      users: [],
    };

    for (const user of users) {
      const foodItems = await foodItemModel.findAllByUserId(user._id);
      const itemsWithExpiry = foodItems.filter(item => item.expirationDate);

      debugInfo.users.push({
        userId: user._id,
        email: user.email,
        hasFcmToken: !!user.fcmToken,
        fcmTokenPreview: user.fcmToken ? user.fcmToken.substring(0, 20) + '...' : null,
        fcmTokenFull: user.fcmToken, // TEMPORARY: Show full token for debugging
        totalItems: foodItems.length,
        itemsWithExpiry: itemsWithExpiry.length,
        expiryThreshold: user.notificationPreferences?.expiryThresholdDays || 2,
      });
    }

    return res.status(200).json(debugInfo);
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return res.status(500).json({
      message: 'Debug failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
