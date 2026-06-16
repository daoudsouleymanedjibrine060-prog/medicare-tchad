import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { paramId } from '../../utils/params';

const router = Router();

const sendSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

router.get('/', authenticate, requireRole(Role.PATIENT, Role.ASSISTANT, Role.ADMIN, Role.SUPER_ADMIN), async (req, res) => {
  const userId = req.user!.userId;
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      receiver: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
  });
  return res.json(messages);
});

router.get('/contacts', authenticate, async (req, res) => {
  const role = req.user!.role;
  if (role === Role.PATIENT) {
    const assistants = await prisma.user.findMany({
      where: { role: Role.ASSISTANT, isActive: true },
      select: { id: true, firstName: true, lastName: true, role: true },
      take: 20,
    });
    const admins = await prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] }, isActive: true },
      select: { id: true, firstName: true, lastName: true, role: true },
      take: 5,
    });
    return res.json([...assistants, ...admins]);
  }
  if (role === Role.ASSISTANT) {
    const messageUserIds = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user!.userId },
          { receiverId: req.user!.userId },
        ],
      },
      select: { senderId: true, receiverId: true },
    });
    const ids = new Set<string>();
    for (const m of messageUserIds) {
      if (m.senderId !== req.user!.userId) ids.add(m.senderId);
      if (m.receiverId !== req.user!.userId) ids.add(m.receiverId);
    }
    const patients = await prisma.user.findMany({
      where: { id: { in: Array.from(ids) }, role: Role.PATIENT },
      select: { id: true, firstName: true, lastName: true, role: true },
    });
    if (patients.length === 0) {
      const allPatients = await prisma.user.findMany({
        where: { role: Role.PATIENT, isActive: true },
        select: { id: true, firstName: true, lastName: true, role: true },
        take: 20,
      });
      return res.json(allPatients);
    }
    return res.json(patients);
  }
  return res.json([]);
});

router.post('/', authenticate, validateBody(sendSchema), async (req, res) => {
  const message = await prisma.message.create({
    data: {
      senderId: req.user!.userId,
      receiverId: req.body.receiverId,
      content: req.body.content,
    },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      receiver: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
  });
  return res.status(201).json(message);
});

router.patch('/:id/read', authenticate, async (req, res) => {
  const message = await prisma.message.findUnique({ where: { id: paramId(req) } });
  if (!message || message.receiverId !== req.user!.userId) {
    return res.status(404).json({ error: 'Message introuvable' });
  }
  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { isRead: true },
  });
  return res.json(updated);
});

export default router;
