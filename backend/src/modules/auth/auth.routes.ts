import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { validateBody } from '../../middleware/validate';
import { authenticate, loadUserProfile } from '../../middleware/auth';
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  createRefreshToken,
  revokeRefreshToken,
  verifyRefreshToken,
  buildAuthPayload,
} from '../../services/auth.service';
import { normalizePhone, sanitizeUser } from '../../utils/helpers';
import { env } from '../../config/env';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  age: z.number().int().min(1).max(120).optional(),
  gender: z.enum(['M', 'F', 'AUTRE']).optional(),
  role: z.enum(['PATIENT']).default('PATIENT'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  expectedRole: z.enum(['PATIENT', 'ASSISTANT', 'ADMIN', 'SUPER_ADMIN']).optional(),
});

router.post('/register', validateBody(registerSchema), async (req, res) => {
  try {
    const { email, phone, password, firstName, lastName, age, gender } = req.body;
    const normalizedPhone = normalizePhone(phone);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone: normalizedPhone }] },
    });
    if (existing) {
      return res.status(409).json({ error: 'Email ou téléphone déjà utilisé' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        phone: normalizedPhone,
        passwordHash,
        firstName,
        lastName,
        role: Role.PATIENT,
        patient: { create: { age, gender } },
      },
      include: { patient: true },
    });

    const payload = buildAuthPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = await createRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inscription';
    return res.status(400).json({ error: message });
  }
});

router.post('/login', validateBody(loginSchema), async (req, res) => {
  const { email, password, expectedRole } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  if (expectedRole && user.role !== expectedRole) {
    return res.status(403).json({ error: 'Accès refusé pour ce portail' });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  const payload = buildAuthPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = await createRefreshToken(user.id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const fullUser = await loadUserProfile(user.id);
  return res.json({ accessToken, user: sanitizeUser(fullUser!) });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token manquant' });

  try {
    const user = await verifyRefreshToken(token);
    await revokeRefreshToken(token);
    const payload = buildAuthPayload(user);
    const accessToken = signAccessToken(payload);
    const newRefresh = await createRefreshToken(user.id);

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: 'Session expirée' });
  }
});

router.post('/logout', async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) await revokeRefreshToken(token);
  res.clearCookie('refreshToken');
  return res.json({ message: 'Déconnecté' });
});

router.get('/me', authenticate, async (req, res) => {
  const user = await loadUserProfile(req.user!.userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  return res.json(sanitizeUser(user));
});

export default router;
