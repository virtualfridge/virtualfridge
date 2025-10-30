import admin from 'firebase-admin';
import logger from '../util/logger';

class NotificationService {
  private initialized = false;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Check if already initialized
      if (admin.apps.length > 0) {
        this.initialized = true;
        return;
      }

      // Check if Firebase credentials are provided
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

      if (!serviceAccount) {
        logger.warn('Firebase service account not configured. Notifications will not work.');
        return;
      }

      const credentials = JSON.parse(serviceAccount);

      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });

      this.initialized = true;
      logger.info('Firebase Admin initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin:', error);
    }
  }

  async sendNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    if (!this.initialized) {
      logger.warn('Firebase not initialized. Cannot send notification.');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        data: data ?? {},
        token: fcmToken,
      };

      const response = await admin.messaging().send(message);
      logger.info('Successfully sent notification:', response);
      return true;
    } catch (error) {
      logger.error('Error sending notification:', error);
      return false;
    }
  }

  async sendExpiryNotifications(
    fcmToken: string,
    expiringItems: { name: string; expirationDate: Date }[]
  ): Promise<boolean> {
    if (!this.initialized) {
      logger.warn('Firebase not initialized. Cannot send notification.');
      return false;
    }

    if (expiringItems.length === 0) {
      return this.sendNotification(
        fcmToken,
        'No Expiring Items',
        'Great news! You have no items expiring soon.'
      );
    }

    const itemCount = expiringItems.length;
    const title = `${itemCount} Item${itemCount > 1 ? 's' : ''} Expiring Soon!`;

    let body: string;
    if (itemCount === 1) {
      const item = expiringItems[0];
      const daysUntilExpiry = Math.ceil(
        (item.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      body = `${item.name} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`;
    } else {
      const itemNames = expiringItems.slice(0, 3).map(item => item.name).join(', ');
      body = `${itemNames}${itemCount > 3 ? ` and ${itemCount - 3} more` : ''}`;
    }

    return this.sendNotification(fcmToken, title, body, {
      itemCount: itemCount.toString(),
      type: 'expiry',
    });
  }
}

export const notificationService = new NotificationService();
