import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { chatbotService } from '../../services/chatbot.service';
import { paramId } from '../../utils/params';
import crypto from 'crypto';

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  sessionId: z.string().optional(),
});

router.post('/chat', authenticate, requireRole(Role.PATIENT), validateBody(chatSchema), async (req, res) => {
  try {
    const sessionId = req.body.sessionId || crypto.randomUUID();
    const result = await chatbotService.chat(req.user!.userId, req.body.message, sessionId);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur chatbot';
    return res.status(429).json({ error: message });
  }
});

router.get('/history/:sessionId', authenticate, requireRole(Role.PATIENT), async (req, res) => {
  const history = await chatbotService.getHistory(req.user!.userId, paramId(req, 'sessionId'));
  return res.json(history);
});

export default router;
