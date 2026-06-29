import { Router } from 'express';
import { z } from 'zod';
import { Prisma, EstablishmentType, Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate, optionalAuth, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { normalizePhone, stripUserSecrets } from '../../utils/helpers';
import { paramId } from '../../utils/params';

const router = Router();

const createSchema = z.object({
  name: z.string().min(2),
  type: z.nativeEnum(EstablishmentType),
  address: z.string(),
  phone: z.string(),
  cityId: z.string().uuid(),
  latitude: z.number(),
  longitude: z.number(),
  parentEstablishmentId: z.string().uuid().optional().nullable(),
});

const updateSchema = createSchema.partial();

router.get('/', optionalAuth, async (req, res) => {
  const city = req.query.city as string | undefined;
  const type = req.query.type as EstablishmentType | undefined;
  const search = req.query.search as string | undefined;

  const establishments = await prisma.establishment.findMany({
    where: {
      ...(city && { cityId: city }),
      ...(type && { type }),
      ...(search && { name: { contains: search } }),
    },
    include: {
      city: true,
      parentEstablishment: { select: { id: true, name: true } },
      doctors: { include: { doctor: { include: { user: true, specialty: true } } } },
    },
    orderBy: { name: 'asc' },
  });
  return res.json(stripUserSecrets(establishments));
});

router.get('/map', optionalAuth, async (req, res) => {
  const city = req.query.city as string | undefined;
  const type = req.query.type as EstablishmentType | undefined;

  const markers = await prisma.establishment.findMany({
    where: {
      ...(city && { cityId: city }),
      ...(type && { type }),
    },
    select: {
      id: true,
      name: true,
      type: true,
      address: true,
      phone: true,
      latitude: true,
      longitude: true,
      city: { select: { id: true, name: true } },
    },
  });
  return res.json(markers);
});

router.post('/', authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN), validateBody(createSchema), async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const establishment = await prisma.establishment.create({
      data: {
        ...req.body,
        phone,
        parentEstablishmentId: req.body.parentEstablishmentId || null,
      },
      include: { city: true, parentEstablishment: { select: { id: true, name: true } } },
    });
    return res.status(201).json(establishment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur création';
    return res.status(400).json({ error: message });
  }
});

router.patch('/:id', authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN), validateBody(updateSchema), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.phone) data.phone = normalizePhone(data.phone);
    const establishment = await prisma.establishment.update({
      where: { id: paramId(req) },
      data,
      include: { city: true, parentEstablishment: { select: { id: true, name: true } } },
    });
    return res.json(establishment);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ error: 'Établissement introuvable' });
    }
    throw err;
  }
});

router.delete('/:id', authenticate, requireRole(Role.SUPER_ADMIN), async (req, res) => {
  try {
    await prisma.establishment.delete({ where: { id: paramId(req) } });
    return res.json({ message: 'Établissement supprimé' });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ error: 'Établissement introuvable' });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      return res.status(409).json({ error: 'Impossible de supprimer : rendez-vous associés' });
    }
    throw err;
  }
});

export default router;
