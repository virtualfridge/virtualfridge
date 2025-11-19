import { Router } from 'express';

const router = Router();

// Authenticated notification routes
// Currently empty - the old /test endpoint has been removed
// Notifications are now sent automatically via cron at 9 AM and 6 PM daily
// For testing/debugging, use /api/notifications/admin/trigger (no auth required)

export default router;
