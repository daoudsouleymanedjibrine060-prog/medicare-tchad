import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { paramId } from '../../utils/params';
import { parseDateOnly, stripUserSecrets } from '../../utils/helpers';

const router = Router();

const itemSchema = z.object({
  medication: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().optional(),
});

const prescriptionSchema = z.object({
  patientId: z.string().uuid(),
  medicalRecordId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
  instructions: z.string().optional(),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  items: z.array(itemSchema).min(1),
});

const prescriptionInclude = {
  patient: { include: { user: true } },
  doctor: { include: { user: true, specialty: true } },
  medicalRecord: true,
  appointment: { include: { establishment: true } },
  items: true,
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
    prisma.prescription.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: prescriptionInclude,
    }),
    prisma.prescription.count({ where }),
  ]);

  return res.json(stripUserSecrets({ data, total, page, limit }));
});

router.get('/:id', authenticate, async (req, res) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: paramId(req) },
    include: prescriptionInclude,
  });
  if (!prescription) return res.status(404).json({ error: 'Ordonnance introuvable' });

  const { role, userId } = req.user!;
  if (role === Role.PATIENT) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient || patient.id !== prescription.patientId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
  } else if (role === Role.DOCTOR) {
    const doctorId = await getDoctorId(userId);
    if (!doctorId || doctorId !== prescription.doctorId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
  } else if (role !== Role.ADMIN && role !== Role.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  return res.json(stripUserSecrets(prescription));
});

router.post('/', authenticate, requireRole(Role.DOCTOR), validateBody(prescriptionSchema), async (req, res) => {
  const doctorId = await getDoctorId(req.user!.userId);
  if (!doctorId) return res.status(404).json({ error: 'Profil médecin requis' });

  const { patientId, medicalRecordId, appointmentId, instructions, validUntil, items } = req.body;
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return res.status(404).json({ error: 'Patient introuvable' });

  if (medicalRecordId) {
    const record = await prisma.medicalRecord.findFirst({
      where: { id: medicalRecordId, doctorId, patientId },
    });
    if (!record) return res.status(400).json({ error: 'Dossier médical invalide' });
  }

  if (appointmentId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId, patientId },
    });
    if (!appointment) return res.status(400).json({ error: 'RDV invalide' });
  }

  const prescription = await prisma.prescription.create({
    data: {
      patientId,
      doctorId,
      medicalRecordId,
      appointmentId,
      instructions,
      validUntil: validUntil ? parseDateOnly(validUntil) : undefined,
      items: { create: items },
    },
    include: prescriptionInclude,
  });

  return res.status(201).json(stripUserSecrets(prescription));
});

export default router;
