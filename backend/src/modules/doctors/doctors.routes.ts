import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate, optionalAuth, requireRole } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validate';
import { hashPassword } from '../../services/auth.service';
import { normalizePhone, stripUserSecrets } from '../../utils/helpers';
import { getAvailableSlots, getSlotsWithStatus } from '../../services/appointment.service';
import { paramId } from '../../utils/params';

const router = Router();

const searchSchema = z.object({
  specialty: z.string().optional(),
  city: z.string().optional(),
  name: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

const createDoctorSchema = z.object({
  email: z.string().email(),
  phone: z.string(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  specialtyId: z.string().uuid(),
  licenseNumber: z.string().optional(),
  bio: z.string().optional(),
  establishmentIds: z.array(z.string().uuid()).optional(),
});

router.get('/', optionalAuth, validateQuery(searchSchema), async (req, res) => {
  const { specialty, city, name, page, limit } = res.locals.parsedQuery as z.infer<typeof searchSchema>;
  const where: Record<string, unknown> = { user: { isActive: true } };

  if (specialty) where.specialtyId = specialty;
  if (name) {
    where.user = {
      isActive: true,
      OR: [
        { firstName: { contains: name } },
        { lastName: { contains: name } },
      ],
    };
  }
  if (city) {
    where.establishments = {
      some: { establishment: { cityId: city } },
    };
  }

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: true,
        specialty: true,
        establishments: { include: { establishment: { include: { city: true } } } },
        schedules: true,
      },
    }),
    prisma.doctor.count({ where }),
  ]);

  return res.json(stripUserSecrets({ data: doctors, total, page, limit }));
});

router.get('/specialties/list', async (_req, res) => {
  const specialties = await prisma.specialty.findMany({ orderBy: { nameFr: 'asc' } });
  return res.json(specialties);
});

router.get('/:id', optionalAuth, async (req, res) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: paramId(req) },
    include: {
      user: true,
      specialty: true,
      establishments: { include: { establishment: { include: { city: true } } } },
      schedules: true,
    },
  });
  if (!doctor) return res.status(404).json({ error: 'Médecin introuvable' });
  const { passwordHash, ...userSafe } = doctor.user;
  return res.json(stripUserSecrets({ ...doctor, user: userSafe }));
});

router.get('/:id/slots', async (req, res) => {
  const { date } = req.query;
  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: 'Paramètre date requis (YYYY-MM-DD)' });
  }
  const doctorId = paramId(req);
  const [slots, slotDetails] = await Promise.all([
    getAvailableSlots(doctorId, date),
    getSlotsWithStatus(doctorId, date),
  ]);
  return res.json({ date, slots, slotDetails });
});

router.post('/', authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN), validateBody(createDoctorSchema), async (req, res) => {
  try {
    const data = req.body;
    const phone = normalizePhone(data.phone);
    const passwordHash = await hashPassword(data.password);

    const doctor = await prisma.doctor.create({
      data: {
        licenseNumber: data.licenseNumber,
        bio: data.bio,
        specialty: { connect: { id: data.specialtyId } },
        user: {
          create: {
            email: data.email,
            phone,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            role: Role.DOCTOR,
          },
        },
        ...(data.establishmentIds?.length && {
          establishments: {
            create: data.establishmentIds.map((eid: string) => ({ establishmentId: eid })),
          },
        }),
      },
      include: { user: true, specialty: true },
    });

    const { passwordHash: _, ...userSafe } = doctor.user;
    return res.status(201).json({ ...doctor, user: userSafe });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur création médecin';
    return res.status(400).json({ error: message });
  }
});

export default router;
