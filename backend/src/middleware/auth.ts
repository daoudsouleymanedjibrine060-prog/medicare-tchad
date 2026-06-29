import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/database';

export interface AuthPayload {
  userId: string;
  role: Role;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, email: true, isActive: true },
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Compte désactivé ou introuvable' });
    }
    req.user = { userId: user.id, role: user.role, email: user.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), env.JWT_SECRET) as AuthPayload;
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    next();
  };
}

export async function loadUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      patient: { include: { city: true } },
      doctor: { include: { specialty: true, establishments: { include: { establishment: true } } } },
      assistant: { include: { doctor: { include: { user: true, specialty: true } } } },
      admin: true,
    },
  });
}
