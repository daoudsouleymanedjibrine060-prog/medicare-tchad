import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { hashPassword } from '../../services/auth.service';
import { normalizePhone } from '../../utils/helpers';
import { paramId } from '../../utils/params';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  phone: z.string(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: z.nativeEnum(Role),
  doctorId: z.string().uuid().optional(),
  specialtyId: z.string().uuid().optional(),
  establishmentIds: z.array(z.string().uuid()).optional(),
  scope: z.string().optional(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
});

router.get('/cities', async (_req, res) => {
  const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } });
  return res.json(cities);
});

router.get('/assistant/my-doctor', authenticate, requireRole(Role.ASSISTANT), async (req, res) => {
  const assistant = await prisma.assistant.findUnique({
    where: { userId: req.user!.userId },
    include: {
      doctor: {
        include: {
          user: true,
          specialty: true,
          schedules: { orderBy: { dayOfWeek: 'asc' } },
          establishments: { include: { establishment: { include: { city: true } } } },
        },
      },
    },
  });
  if (!assistant) return res.status(404).json({ error: 'Assistant introuvable' });
  return res.json(assistant.doctor);
});

router.get('/', authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req, res) => {
  const role = req.query.role as Role | undefined;
  const users = await prisma.user.findMany({
    where: role ? { role } : {},
    include: { patient: true, doctor: { include: { specialty: true } }, assistant: true, admin: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(users.map(({ passwordHash, ...u }) => u));
});

router.post('/', authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN), validateBody(createUserSchema), async (req, res) => {
  const data = req.body;

  if (data.role === Role.SUPER_ADMIN && req.user!.role !== Role.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Seul un super admin peut créer un super admin' });
  }
  if (data.role === Role.ADMIN && req.user!.role !== Role.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Seul un super admin peut créer un admin' });
  }

  try {
    const phone = normalizePhone(data.phone);
    const passwordHash = await hashPassword(data.password);

    const userData: Parameters<typeof prisma.user.create>[0]['data'] = {
      email: data.email,
      phone,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    };

    if (data.role === Role.PATIENT) {
      userData.patient = { create: {} };
    } else if (data.role === Role.DOCTOR) {
      if (!data.specialtyId) return res.status(400).json({ error: 'specialtyId requis' });
      userData.doctor = {
        create: {
          specialtyId: data.specialtyId,
          ...(data.establishmentIds?.length && {
            establishments: {
              create: data.establishmentIds.map((eid: string) => ({ establishmentId: eid })),
            },
          }),
        },
      };
    } else if (data.role === Role.ASSISTANT) {
      if (!data.doctorId) return res.status(400).json({ error: 'doctorId requis' });
      userData.assistant = { create: { doctorId: data.doctorId } };
    } else if (data.role === Role.ADMIN || data.role === Role.SUPER_ADMIN) {
      userData.admin = { create: { scope: data.scope } };
    }

    const user = await prisma.user.create({
      data: userData,
      include: { patient: true, doctor: true, assistant: true, admin: true },
    });

    const { passwordHash: _, ...safe } = user;
    return res.status(201).json(safe);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur création utilisateur';
    return res.status(400).json({ error: message });
  }
});

router.patch('/:id', authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN), validateBody(updateUserSchema), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: paramId(req) } });
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  if (user.role === Role.SUPER_ADMIN && req.user!.role !== Role.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { email, phone, firstName, lastName } = req.body;
  const updated = await prisma.user.update({
    where: { id: paramId(req) },
    data: {
      ...(email && { email }),
      ...(phone && { phone: normalizePhone(phone) }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
    },
  });
  const { passwordHash, ...safe } = updated;
  return res.json(safe);
});

router.patch('/:id/toggle', authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: paramId(req) } });
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  if (user.role === Role.SUPER_ADMIN && req.user!.role !== Role.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const updated = await prisma.user.update({
    where: { id: paramId(req) },
    data: { isActive: !user.isActive },
  });
  const { passwordHash, ...safe } = updated;
  return res.json(safe);
});

export default router;
