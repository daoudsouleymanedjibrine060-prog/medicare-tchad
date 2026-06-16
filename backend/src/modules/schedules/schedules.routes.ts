import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { paramId } from '../../utils/params';

const router = Router();

const scheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDuration: z.number().min(15).max(120).default(30),
});

router.get('/', authenticate, requireRole(Role.ASSISTANT, Role.ADMIN, Role.SUPER_ADMIN), async (req, res) => {
  let doctorId = req.query.doctorId as string | undefined;

  if (req.user!.role === Role.ASSISTANT) {
    const assistant = await prisma.assistant.findUnique({ where: { userId: req.user!.userId } });
    if (!assistant) return res.status(404).json({ error: 'Assistant introuvable' });
    doctorId = assistant.doctorId;
  }

  if (!doctorId) return res.status(400).json({ error: 'doctorId requis' });

  const schedules = await prisma.schedule.findMany({
    where: { doctorId },
    orderBy: { dayOfWeek: 'asc' },
  });
  return res.json(schedules);
});

router.post('/', authenticate, requireRole(Role.ASSISTANT, Role.ADMIN, Role.SUPER_ADMIN), validateBody(scheduleSchema), async (req, res) => {
  let doctorId = req.body.doctorId as string | undefined;

  if (req.user!.role === Role.ASSISTANT) {
    const assistant = await prisma.assistant.findUnique({ where: { userId: req.user!.userId } });
    if (!assistant) return res.status(404).json({ error: 'Assistant introuvable' });
    doctorId = assistant.doctorId;
  }

  if (!doctorId) return res.status(400).json({ error: 'doctorId requis' });

  const schedule = await prisma.schedule.create({
    data: {
      doctorId,
      dayOfWeek: req.body.dayOfWeek,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      slotDuration: req.body.slotDuration,
    },
  });
  return res.status(201).json(schedule);
});

router.delete('/:id', authenticate, requireRole(Role.ASSISTANT, Role.ADMIN, Role.SUPER_ADMIN), async (req, res) => {
  const schedule = await prisma.schedule.findUnique({ where: { id: paramId(req) } });
  if (!schedule) return res.status(404).json({ error: 'Horaire introuvable' });

  if (req.user!.role === Role.ASSISTANT) {
    const assistant = await prisma.assistant.findUnique({ where: { userId: req.user!.userId } });
    if (!assistant || assistant.doctorId !== schedule.doctorId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
  }

  await prisma.schedule.delete({ where: { id: paramId(req) } });
  return res.json({ message: 'Horaire supprimé' });
});

router.patch('/:id', authenticate, requireRole(Role.ASSISTANT, Role.ADMIN, Role.SUPER_ADMIN), validateBody(scheduleSchema), async (req, res) => {
  const schedule = await prisma.schedule.findUnique({ where: { id: paramId(req) } });
  if (!schedule) return res.status(404).json({ error: 'Horaire introuvable' });

  if (req.user!.role === Role.ASSISTANT) {
    const assistant = await prisma.assistant.findUnique({ where: { userId: req.user!.userId } });
    if (!assistant || assistant.doctorId !== schedule.doctorId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
  }

  const updated = await prisma.schedule.update({
    where: { id: paramId(req) },
    data: {
      dayOfWeek: req.body.dayOfWeek,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      slotDuration: req.body.slotDuration,
    },
  });
  return res.json(updated);
});

export default router;
