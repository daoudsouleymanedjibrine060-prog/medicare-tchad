import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { paramId } from '../../utils/params';
import { stripUserSecrets } from '../../utils/helpers';

const router = Router();

const recordSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  title: z.string().min(2).max(200),
  diagnosis: z.string().optional(),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
  bloodPressure: z.string().optional(),
  heartRate: z.number().int().min(30).max(250).optional(),
  temperature: z.number().min(30).max(45).optional(),
  weight: z.number().min(1).max(500).optional(),
});

const recordInclude = {
  patient: { include: { user: true } },
  doctor: { include: { user: true, specialty: true } },
  appointment: { include: { establishment: true } },
  prescriptions: { include: { items: true } },
};

async function getDoctorId(userId: string) {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  return doctor?.id ?? null;
}

router.get('/', authenticate, async (req, res) => {
  const { role, userId } = req.user!;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  let where: Record<string, unknown> = {};

  if (role === Role.PATIENT) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return res.json({ data: [], total: 0, page, limit });
    where = { patientId: patient.id };
  } else if (role === Role.DOCTOR) {
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return res.json({ data: [], total: 0, page, limit });
    where = { doctorId };
    if (req.query.patientId) where.patientId = req.query.patientId;
  } else if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
    if (req.query.patientId) where.patientId = req.query.patientId;
    if (req.query.doctorId) where.doctorId = req.query.doctorId;
  } else {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const [data, total] = await Promise.all([
    prisma.medicalRecord.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: recordInclude,
    }),
    prisma.medicalRecord.count({ where }),
  ]);

  return res.json(stripUserSecrets({ data, total, page, limit }));
});

router.get('/:id', authenticate, async (req, res) => {
  const record = await prisma.medicalRecord.findUnique({
    where: { id: paramId(req) },
    include: recordInclude,
  });
  if (!record) return res.status(404).json({ error: 'Dossier introuvable' });

  const { role, userId } = req.user!;
  if (role === Role.PATIENT) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient || patient.id !== record.patientId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
  } else if (role === Role.DOCTOR) {
    const doctorId = await getDoctorId(userId);
    if (!doctorId || doctorId !== record.doctorId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
  } else if (role !== Role.ADMIN && role !== Role.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  return res.json(stripUserSecrets(record));
});

router.post('/', authenticate, requireRole(Role.DOCTOR), validateBody(recordSchema), async (req, res) => {
  const doctorId = await getDoctorId(req.user!.userId);
  if (!doctorId) return res.status(404).json({ error: 'Profil médecin requis' });

  const { patientId, appointmentId, ...fields } = req.body;
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return res.status(404).json({ error: 'Patient introuvable' });

  if (appointmentId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId, patientId },
    });
    if (!appointment) {
      return res.status(400).json({ error: 'RDV invalide pour ce patient et ce médecin' });
    }
  }

  const record = await prisma.medicalRecord.create({
    data: {
      patientId,
      doctorId,
      appointmentId,
      ...fields,
    },
    include: recordInclude,
  });

  return res.status(201).json(stripUserSecrets(record));
});

router.patch('/:id', authenticate, requireRole(Role.DOCTOR), validateBody(recordSchema.partial().omit({ patientId: true })), async (req, res) => {
  const doctorId = await getDoctorId(req.user!.userId);
  if (!doctorId) return res.status(404).json({ error: 'Profil médecin requis' });

  const existing = await prisma.medicalRecord.findUnique({ where: { id: paramId(req) } });
  if (!existing) return res.status(404).json({ error: 'Dossier introuvable' });
  if (existing.doctorId !== doctorId) return res.status(403).json({ error: 'Accès refusé' });

  const record = await prisma.medicalRecord.update({
    where: { id: existing.id },
    data: req.body,
    include: recordInclude,
  });

  return res.json(stripUserSecrets(record));
});

export default router;
