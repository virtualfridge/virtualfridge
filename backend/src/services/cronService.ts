import cron from 'node-cron';
import { userModel } from '../models/user';
import { foodItemModel } from '../models/foodItem';
import { foodTypeModel } from '../models/foodType';
import { notificationService } from './notification';

/**
 * CronService handles scheduled tasks for the application
 * Currently manages automated expiration notifications
 */
class CronService {
  private isRunning: boolean = false;

  /**
   * Starts all scheduled cron jobs
   */
  public start(): void {
    if (this.isRunning) {
      console.log('CronService is already running');
      return;
    }

    console.log('Starting CronService...');
    console.log('='.repeat(60));

    // Check Firebase initialization status
    if (notificationService.isInitialized()) {
      console.log('✓ Firebase Admin SDK: INITIALIZED');
    } else {
      console.error('✗ Firebase Admin SDK: NOT INITIALIZED');
      console.error('  Notifications will NOT work!');
      console.error('  Please set FIREBASE_SERVICE_ACCOUNT in your .env file');
    }

    console.log('='.repeat(60));

    // Schedule expiration notifications to run twice daily at 9 AM and 6 PM
    // Cron format: '0 9,18 * * *' means: minute=0, hour=9 or 18, every day
    cron.schedule('0 9,18 * * *', async () => {
      console.log('Running scheduled expiration notification check...');
      await this.checkAndSendExpirationNotifications();
    });

    // For testing/development: Also run every hour (uncomment if needed)
    // cron.schedule('0 * * * *', async () => {
    //   console.log('Running hourly expiration notification check...');
    //   await this.checkAndSendExpirationNotifications();
    // });

    this.isRunning = true;
    console.log('CronService started successfully. Expiration notifications scheduled for 9 AM and 6 PM daily.');
  }

  /**
   * Manually trigger the expiration notification check (for testing/debugging)
   */
  public async triggerNotificationCheck(): Promise<void> {
    console.log('Manually triggering expiration notification check...');
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

      console.log(`Found ${users.length} users with FCM tokens`);

      for (const user of users) {
        try {
          const result = await this.processUserNotifications(user);
          usersProcessed++;
          if (result.sent) {
            notificationsSent++;
          }
        } catch (error) {
          errors++;
          console.error(`Error processing notifications for user ${user._id}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`Expiration notification check completed in ${duration}ms`);
      console.log(`Users processed: ${usersProcessed}, Notifications sent: ${notificationsSent}, Errors: ${errors}`);
    } catch (error) {
      console.error('Error in checkAndSendExpirationNotifications:', error);
    }
  }

  /**
   * Processes expiration notifications for a single user
   */
  private async processUserNotifications(user: any): Promise<{ sent: boolean }> {
    // Get user's notification preferences (default threshold: 2 days)
    const expiryThresholdDays = user.notificationPreferences?.expiryThresholdDays || 2;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + expiryThresholdDays);

    console.log(`Processing user ${user._id}:`);
    console.log(`  - FCM Token: ${user.fcmToken ? 'Present' : 'Missing'}`);
    console.log(`  - Expiry threshold: ${expiryThresholdDays} days`);
    console.log(`  - Checking items expiring before: ${thresholdDate.toISOString()}`);

    // Get all food items for this user
    const foodItems = await foodItemModel.findAllByUserId(user._id);

    console.log(`  - Total food items: ${foodItems.length}`);

    if (foodItems.length === 0) {
      console.log(`  - No food items found for user ${user._id}`);
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
      const foodName = typeMap.get(item.typeId.toString()) || 'Unknown item';

      if (item.expirationDate) {
        itemsWithExpiration++;
        const expirationDate = new Date(item.expirationDate);
        expirationDate.setHours(0, 0, 0, 0); // Reset to start of day

        const daysUntilExpiry = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Include items that are:
        // 1. Already expired (expirationDate < now)
        // 2. Expiring within threshold (expirationDate <= thresholdDate)
        if (expirationDate <= thresholdDate) {
          console.log(`    ✓ EXPIRING: "${foodName}" - ${daysUntilExpiry} days (expires: ${expirationDate.toDateString()})`);

          expiringItems.push({
            name: foodName,
            expirationDate: expirationDate,
          });
        } else {
          console.log(`    • OK: "${foodName}" - ${daysUntilExpiry} days (expires: ${expirationDate.toDateString()})`);
        }
      } else {
        console.log(`    • SKIP: "${foodName}" - No expiration date`);
      }
    }

    console.log(`  - Items with expiration dates: ${itemsWithExpiration}/${foodItems.length}`);
    console.log(`  - Items expiring: ${expiringItems.length}`);

    // Send notification if there are expiring items
    if (expiringItems.length > 0) {
      console.log(`  - Attempting to send notification...`);
      const success = await notificationService.sendExpiryNotifications(
        user.fcmToken,
        expiringItems
      );

      if (success) {
        console.log(`  ✓ SUCCESS: Notification sent to user ${user._id}`);
      } else {
        console.error(`  ✗ FAILED: Could not send notification to user ${user._id}`);
        console.error(`    Check if Firebase is initialized and FCM token is valid`);
      }

      return { sent: success };
    } else {
      console.log(`  - No notification needed (no expiring items)`);
    }

    return { sent: false };
  }

  /**
   * Stops all scheduled cron jobs
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('CronService is not running');
      return;
    }

    // Note: node-cron doesn't provide a direct way to stop all tasks
    // In a production environment, you might want to store task references
    this.isRunning = false;
    console.log('CronService stopped');
  }
}

// Export singleton instance
export const cronService = new CronService();

export default CronService;
