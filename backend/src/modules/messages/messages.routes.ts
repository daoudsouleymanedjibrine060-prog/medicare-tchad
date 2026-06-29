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

const contactSelect = { id: true, firstName: true, lastName: true, role: true } as const;

async function getAssistantDoctorId(userId: string) {
  const assistant = await prisma.assistant.findUnique({ where: { userId } });
  return assistant?.doctorId ?? null;
}

async function patientHasRelationWithUser(patientUserId: string, otherUserId: string) {
  const patient = await prisma.patient.findUnique({ where: { userId: patientUserId } });
  if (!patient) return false;

  const other = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!other) return false;

  if (other.role === Role.ADMIN || other.role === Role.SUPER_ADMIN) return true;

  if (other.role === Role.ASSISTANT) {
    const assistant = await prisma.assistant.findUnique({ where: { userId: otherUserId } });
    if (!assistant) return false;
    const apt = await prisma.appointment.findFirst({
      where: { patientId: patient.id, doctorId: assistant.doctorId },
    });
    return !!apt;
  }

  return false;
}

router.get('/', authenticate, requireRole(Role.PATIENT, Role.ASSISTANT, Role.ADMIN, Role.SUPER_ADMIN), async (req, res) => {
  const userId = req.user!.userId;
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      sender: { select: contactSelect },
      receiver: { select: contactSelect },
    },
  });
  return res.json(messages);
});

router.get('/contacts', authenticate, async (req, res) => {
  const role = req.user!.role;
  if (role === Role.PATIENT) {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) return res.json([]);

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      select: { doctorId: true },
      distinct: ['doctorId'],
    });
    const doctorIds = appointments.map((a) => a.doctorId);

    const assistants = doctorIds.length
      ? await prisma.user.findMany({
          where: {
            role: Role.ASSISTANT,
            isActive: true,
            assistant: { doctorId: { in: doctorIds } },
          },
          select: contactSelect,
        })
      : [];

    const admins = await prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] }, isActive: true },
      select: contactSelect,
      take: 5,
    });
    return res.json([...assistants, ...admins]);
  }
  if (role === Role.ASSISTANT) {
    const doctorId = await getAssistantDoctorId(req.user!.userId);
    if (!doctorId) return res.json([]);

    const patientIds = await prisma.appointment.findMany({
      where: { doctorId },
      select: { patientId: true },
      distinct: ['patientId'],
    });
    const ids = patientIds.map((p) => p.patientId);
    if (ids.length === 0) return res.json([]);

    const patients = await prisma.user.findMany({
      where: {
        role: Role.PATIENT,
        isActive: true,
        patient: { id: { in: ids } },
      },
      select: contactSelect,
    });
    return res.json(patients);
  }
  return res.json([]);
});

router.post('/', authenticate, validateBody(sendSchema), async (req, res) => {
  const { receiverId, content } = req.body;
  const senderRole = req.user!.role;

  if (senderRole === Role.PATIENT) {
    const allowed = await patientHasRelationWithUser(req.user!.userId, receiverId);
    if (!allowed) {
      return res.status(403).json({ error: 'Vous ne pouvez pas contacter cet utilisateur' });
    }
  }

  if (senderRole === Role.ASSISTANT) {
    const doctorId = await getAssistantDoctorId(req.user!.userId);
    if (!doctorId) return res.status(403).json({ error: 'Assistant non assigné' });
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      include: { patient: true },
    });
    if (!receiver?.patient) {
      return res.status(403).json({ error: 'Destinataire invalide' });
    }
    const apt = await prisma.appointment.findFirst({
      where: { doctorId, patientId: receiver.patient.id },
    });
    if (!apt) {
      return res.status(403).json({ error: 'Patient non lié à votre médecin' });
    }
  }

  const message = await prisma.message.create({
    data: {
      senderId: req.user!.userId,
      receiverId,
      content,
    },
    include: {
      sender: { select: contactSelect },
      receiver: { select: contactSelect },
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
