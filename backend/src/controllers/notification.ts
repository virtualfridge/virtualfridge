import { NextFunction, Request, Response } from 'express';
import logger from '../util/logger';
import { notificationService } from '../services/notification';
import { foodItemModel } from '../models/foodItem';
import { foodTypeModel } from '../models/foodType';

export class NotificationController {
  async sendTestNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = (req as any).user!;

      // Check if user has FCM token
      if (!user.fcmToken) {
        return res.status(400).json({
          message: 'No FCM token registered for this user. Please register your device first.',
        });
      }

      // Get user's notification preferences
      const expiryThresholdDays = user.notificationPreferences?.expiryThresholdDays ?? 2;

      // Get all food items for the user
      const foodItems = await foodItemModel.findAllByUserId(user._id);

      if (!foodItems || foodItems.length === 0) {
        return res.status(200).json({
          message: 'No food items found in your fridge',
        });
      }

      // Calculate expiry threshold
      const now = new Date();
      const thresholdDate = new Date();
      thresholdDate.setDate(now.getDate() + expiryThresholdDays);

      // Find expiring items
      const expiringItems = [];

      for (const item of foodItems) {
        if (item.expirationDate && new Date(item.expirationDate) <= thresholdDate) {
          // Get food type info to get the name
          const foodType = await foodTypeModel.findById(item.typeId);
          if (foodType) {
            expiringItems.push({
              name: foodType.name,
              expirationDate: new Date(item.expirationDate),
            });
          }
        }
      }

      // Send notification
      const success = await notificationService.sendExpiryNotifications(
        user.fcmToken,
        expiringItems
      );

      if (success) {
        return res.status(200).json({
          message: 'Test notification sent successfully',
          data: {
            expiringItemsCount: expiringItems.length,
            expiringItems: expiringItems.map(item => ({
              name: item.name,
              expirationDate: item.expirationDate,
            })),
          },
        });
      } else {
        return res.status(500).json({
          message: 'Failed to send notification',
        });
      }
    } catch (error) {
      logger.error('Failed to send test notification:', error);

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to send test notification',
        });
      }

      next(error);
    }
  }
}
