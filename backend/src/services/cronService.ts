import cron from 'node-cron';
import { userModel } from '../models/user';
import { foodItemModel } from '../models/foodItem';
import { foodTypeModel } from '../models/foodType';
import { notificationService } from './notification';
import logger from '../util/logger';
import { IUser } from '../types/user';

/**
 * CronService handles scheduled tasks for the application
 * Currently manages automated expiration notifications
 */
class CronService {
  private isRunning = false;

  /**
   * Starts all scheduled cron jobs
   */
  public start(): void {
    if (this.isRunning) {
      logger.info('CronService is already running');
      return;
    }

    logger.info('Starting CronService...');

    // Check Firebase initialization status
    if (notificationService.isInitialized()) {
      logger.info('✓ Firebase Admin SDK: INITIALIZED');
    } else {
      logger.error('✗ Firebase Admin SDK: NOT INITIALIZED');
      logger.error('  Notifications will NOT work!');
      logger.error('  Please set FIREBASE_SERVICE_ACCOUNT in your .env file');
    }

    // Schedule expiration notifications to run twice daily at 9 AM and 6 PM
    cron.schedule('0 9,18 * * *', async () => {
      logger.info('Running scheduled expiration notification check...');
      await this.checkAndSendExpirationNotifications();
    });

    this.isRunning = true;
    logger.info(
      'CronService started successfully. Expiration notifications scheduled for 9 AM and 6 PM daily.'
    );
  }

  /**
   * Manually trigger the expiration notification check (for testing/debugging)
   */
  public async triggerNotificationCheck(): Promise<void> {
    logger.info('Manually triggering expiration notification check...');
    await this.checkAndSendExpirationNotifications();
  }

  /**
   * Checks all users' food items and sends expiration notifications
   */
  private async checkAndSendExpirationNotifications(): Promise<void> {
    try {
      const startTime = Date.now();
      let usersProcessed = 0;
      let notificationsSent = 0;
      let errors = 0;

      // Get all users who have FCM tokens (able to receive notifications)
      const users = await userModel.findUsersWithFcmTokens();

      logger.info(`Found ${users.length} users with FCM tokens`);

      for (const user of users) {
        try {
          const result = await this.processUserNotifications(user);
          usersProcessed++;
          if (result.sent) {
            notificationsSent++;
          }
        } catch (error) {
          errors++;
          logger.error(
            `Error processing notifications for user ${user._id.toString()}:`,
            error
          );
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`Expiration notification check completed in ${duration}ms`);
      logger.info(
        `Users processed: ${usersProcessed}, Notifications sent: ${notificationsSent}, Errors: ${errors}`
      );
    } catch (error) {
      logger.error('Error in checkAndSendExpirationNotifications:', error);
    }
  }

  /**
   * Processes expiration notifications for a single user
   */
  private async processUserNotifications(
    user: IUser
  ): Promise<{ sent: boolean }> {
    // Get user's notification preferences (default threshold: 2 days)
    const expiryThresholdDays =
      user.notificationPreferences?.expiryThresholdDays ?? 2;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + expiryThresholdDays);

    logger.info(`Processing user ${user._id.toString()}:`);
    logger.info(`  - FCM Token: ${user.fcmToken ? 'Present' : 'Missing'}`);
    logger.info(`  - Expiry threshold: ${expiryThresholdDays} days`);
    logger.info(
      `  - Checking items expiring before: ${thresholdDate.toISOString()}`
    );

    // Get all food items for this user
    const foodItems = await foodItemModel.findAllByUserId(user._id);

    logger.info(`  - Total food items: ${foodItems.length}`);

    if (foodItems.length === 0) {
      logger.info(`  - No food items found for user ${user._id.toString()}`);
      return { sent: false };
    }

    // Get all food types to map names
    const typeIds = foodItems.map(item => item.typeId);
    const foodTypes = await foodTypeModel.findByIds(typeIds);
    const typeMap = new Map(foodTypes.map(type => [type._id.toString(), type.name]));

    // Filter items that are expiring within the threshold or already expired
    const expiringItems: { name: string; expirationDate: Date }[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison

    let itemsWithExpiration = 0;
    for (const item of foodItems) {
      const foodName = typeMap.get(item.typeId.toString()) ?? 'Unknown item';

      if (item.expirationDate) {
        itemsWithExpiration++;
        const expirationDate = new Date(item.expirationDate);
        expirationDate.setHours(0, 0, 0, 0); // Reset to start of day

        const daysUntilExpiry = Math.ceil(
          (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Include items that are:
        // 1. Already expired (expirationDate < now)
        // 2. Expiring within threshold (expirationDate <= thresholdDate)
        if (expirationDate <= thresholdDate) {
          logger.info(
            `    ✓ EXPIRING: "${foodName}" - ${daysUntilExpiry} days (expires: ${expirationDate.toDateString()})`
          );

          expiringItems.push({
            name: foodName,
            expirationDate,
          });
        } else {
          logger.info(
            `    • OK: "${foodName}" - ${daysUntilExpiry} days (expires: ${expirationDate.toDateString()})`
          );
        }
      } else {
        logger.info(`    • SKIP: "${foodName}" - No expiration date`);
      }
    }

    logger.info(
      `  - Items with expiration dates: ${itemsWithExpiration}/${foodItems.length}`
    );
    logger.info(`  - Items expiring: ${expiringItems.length}`);

    // Send notification if there are expiring items
    if (expiringItems.length > 0 && user.fcmToken) {
      logger.info(`  - Attempting to send notification...`);
      const success = await notificationService.sendExpiryNotifications(
        user.fcmToken,
        expiringItems
      );

      if (success) {
        logger.info(
          `  ✓ SUCCESS: Notification sent to user ${user._id.toString()}`
        );
      } else {
        logger.error(
          `  ✗ FAILED: Could not send notification to user ${user._id.toString()}`
        );
        logger.error(
          `    Check if Firebase is initialized and FCM token is valid`
        );
      }

      return { sent: success };
    } else {
      logger.info(`  - No notification needed (no expiring items)`);
    }

    return { sent: false };
  }

  /**
   * Stops all scheduled cron jobs
   */
  public stop(): void {
    if (!this.isRunning) {
      logger.info('CronService is not running');
      return;
    }

    // Note: node-cron doesn't provide a direct way to stop all tasks
    // In a production environment, you might want to store task references
    this.isRunning = false;
    logger.info('CronService stopped');
  }
}

// Export singleton instance
export const cronService = new CronService();

export default CronService;
