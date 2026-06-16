import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from '../../services/notification.service';
import { paramId } from '../../utils/params';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const unreadOnly = req.query.unread === 'true';
  const notifications = await getUserNotifications(req.user!.userId, unreadOnly);
  const unreadCount = await getUnreadCount(req.user!.userId);
  return res.json({ notifications, unreadCount });
});

router.patch('/read-all', authenticate, async (req, res) => {
  await markAllNotificationsRead(req.user!.userId);
  return res.json({ message: 'Toutes les notifications lues' });
});

router.patch('/:id/read', authenticate, async (req, res) => {
  await markNotificationRead(paramId(req), req.user!.userId);
  return res.json({ message: 'Notification lue' });
});

export default router;
