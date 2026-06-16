import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { normalizePhone } from '../../utils/helpers';
import { Role } from '@prisma/client';

const router = Router();

const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  cityId: z.string().uuid().optional(),
  age: z.number().int().min(1).max(120).optional(),
  gender: z.enum(['M', 'F', 'AUTRE']).optional(),
  phone: z.string().optional(),
});

router.get('/profile', authenticate, requireRole(Role.PATIENT), async (req, res) => {
  const patient = await prisma.patient.findUnique({
    where: { userId: req.user!.userId },
    include: { user: true, city: true },
  });
  if (!patient) return res.status(404).json({ error: 'Profil patient introuvable' });
  return res.json(patient);
});

router.patch('/profile', authenticate, requireRole(Role.PATIENT), validateBody(updateProfileSchema), async (req, res) => {
  const { firstName, lastName, dateOfBirth, bloodGroup, address, cityId, age, gender, phone } = req.body;
  const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } });
  if (!patient) return res.status(404).json({ error: 'Profil patient introuvable' });

  if (firstName || lastName || phone) {
    try {
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone && { phone: normalizePhone(phone) }),
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return res.status(409).json({ error: 'Ce numéro est déjà utilisé' });
      }
      throw err;
    }
  }

  const updated = await prisma.patient.update({
    where: { id: patient.id },
    data: {
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      ...(bloodGroup !== undefined && { bloodGroup }),
      ...(address !== undefined && { address }),
      ...(cityId !== undefined && { cityId }),
      ...(age !== undefined && { age }),
      ...(gender !== undefined && { gender }),
    },
    include: { user: true, city: true },
  });

  return res.json(updated);
});

router.get('/', authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: { user: true, city: true },
      orderBy: { user: { lastName: 'asc' } },
    }),
    prisma.patient.count(),
  ]);
  return res.json({ data: patients, total, page, limit });
});

export default router;
