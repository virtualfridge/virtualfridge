import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { notificationService } from '../services/notification';
import { foodItemModel } from '../models/foodItem';
import { foodTypeModel } from '../models/foodType';

const router = Router();

// Authenticated notification routes
// Notifications are sent automatically via cron at 9 AM and 6 PM daily
// For testing/debugging, use /api/notifications/admin/trigger (no auth required)

/**
 * Trigger notification check for the authenticated user
 * This endpoint is called when the app opens to check for expiring items
 */
router.post(
  '/check',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      const fcmToken = req.user?.fcmToken;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (!fcmToken) {
        // No FCM token registered - can't send notifications, but not an error
        return res.status(200).json({
          message: 'No FCM token registered for this user',
          itemsExpiring: 0,
          notificationSent: false,
        });
      }

      // Get user's expiry threshold (default: 2 days)
      const expiryThresholdDays =
        req.user?.notificationPreferences?.expiryThresholdDays ?? 2;
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + expiryThresholdDays);

      // Get all food items for this user
      const foodItems = await foodItemModel.findAllByUserId(userId);

      if (foodItems.length === 0) {
        return res.status(200).json({
          message: 'No food items found',
          itemsExpiring: 0,
          notificationSent: false,
        });
      }

      // Get all food types to map names
      const typeIds = foodItems.map(item => item.typeId);
      const foodTypes = await foodTypeModel.findByIds(typeIds);
      const typeMap = new Map(
        foodTypes.map(type => [type._id.toString(), type.name])
      );

      // Filter items that are expiring within the threshold or already expired
      const expiringItems: { name: string; expirationDate: Date }[] = [];
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison

      for (const item of foodItems) {
        const foodName = typeMap.get(item.typeId.toString()) ?? 'Unknown item';

        if (item.expirationDate) {
          const expirationDate = new Date(item.expirationDate);
          expirationDate.setHours(0, 0, 0, 0); // Reset to start of day

          // Include items expiring within threshold
          if (expirationDate <= thresholdDate) {
            expiringItems.push({
              name: foodName,
              expirationDate: expirationDate,
            });
          }
        }
      }

      // Send notification if there are expiring items
      let notificationSent = false;
      if (expiringItems.length > 0) {
        notificationSent = await notificationService.sendExpiryNotifications(
          fcmToken,
          expiringItems
        );
      }

      return res.status(200).json({
        message:
          expiringItems.length > 0
            ? `Found ${expiringItems.length} expiring item(s)`
            : 'No expiring items',
        itemsExpiring: expiringItems.length,
        notificationSent,
      });
    } catch (error) {
      console.error('Error checking notifications:', error);
      return res.status(500).json({
        message: 'Failed to check notifications',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
