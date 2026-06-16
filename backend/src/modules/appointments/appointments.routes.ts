import { Router } from 'express';
import { z } from 'zod';
import { AppointmentStatus, NotificationType, Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  getAvailableSlots,
  computeEndTime,
  getDoctorSlotDuration,
} from '../../services/appointment.service';
import { createNotification } from '../../services/notification.service';
import { smsService } from '../../services/sms.service';
import { formatDateFr, parseDateOnly, generateSlots } from '../../utils/helpers';
import { paramId } from '../../utils/params';

const router = Router();

const bookSchema = z.object({
  doctorId: z.string().uuid(),
  establishmentId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(['CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED']),
  rejectionReason: z.string().optional(),
});

router.post('/', authenticate, requireRole(Role.PATIENT), validateBody(bookSchema), async (req, res) => {
  const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } });
  if (!patient) return res.status(404).json({ error: 'Profil patient requis' });

  const { doctorId, establishmentId, date, startTime, reason } = req.body;
  const slots = await getAvailableSlots(doctorId, date);
  if (!slots.includes(startTime)) {
    return res.status(400).json({ error: 'Créneau non disponible' });
  }

  const parsedDate = parseDateOnly(date);
  const dayOfWeek = parsedDate.getUTCDay();
  const slotDuration = await getDoctorSlotDuration(doctorId, dayOfWeek);
  const endTime = computeEndTime(startTime, slotDuration);

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId,
      establishmentId,
      date: parsedDate,
      startTime,
      endTime,
      reason,
      status: AppointmentStatus.PENDING,
    },
    include: {
      doctor: { include: { user: true, assistants: { include: { user: true } } } },
      patient: { include: { user: true } },
      establishment: true,
    },
  });

  for (const assistant of appointment.doctor.assistants) {
    await createNotification({
      userId: assistant.userId,
      type: NotificationType.APPOINTMENT,
      title: 'Nouvelle demande de RDV',
      message: `${appointment.patient.user.firstName} ${appointment.patient.user.lastName} demande un RDV le ${formatDateFr(parsedDate)} à ${startTime}`,
      link: '/assistant/demandes',
    });
  }

  await createNotification({
    userId: req.user!.userId,
    type: NotificationType.APPOINTMENT,
    title: 'Demande envoyée',
    message: `Votre demande de RDV le ${formatDateFr(parsedDate)} à ${startTime} est en attente de validation.`,
    link: '/patient/rendez-vous',
  });

  return res.status(201).json(appointment);
});

router.get('/mine', authenticate, async (req, res) => {
  const { role, userId } = req.user!;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as AppointmentStatus | undefined;
  const upcoming = req.query.upcoming === 'true';

  let where: Record<string, unknown> = {};
  if (role === Role.PATIENT) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return res.json({ data: [], total: 0, page, limit });
    where = { patientId: patient.id };
  } else if (role === Role.ASSISTANT) {
    const assistant = await prisma.assistant.findUnique({ where: { userId } });
    if (!assistant) return res.json({ data: [], total: 0, page, limit });
    where = { doctorId: assistant.doctorId };
  }

  if (status) {
    where.status = status;
  } else if (upcoming) {
    where.status = { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] };
  } else if (req.query.history === 'true') {
    where.status = { in: [AppointmentStatus.REJECTED, AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED] };
  }

  const [data, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, specialty: true } },
        establishment: { include: { city: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return res.json({ data, total, page, limit });
});

router.get('/assistant/stats', authenticate, requireRole(Role.ASSISTANT), async (req, res) => {
  const assistant = await prisma.assistant.findUnique({ where: { userId: req.user!.userId } });
  if (!assistant) return res.status(404).json({ error: 'Assistant introuvable' });

  const doctorId = assistant.doctorId;
  const [pending, confirmed, totalPatients] = await Promise.all([
    prisma.appointment.count({ where: { doctorId, status: AppointmentStatus.PENDING } }),
    prisma.appointment.count({ where: { doctorId, status: AppointmentStatus.CONFIRMED } }),
    prisma.appointment.groupBy({ by: ['patientId'], where: { doctorId } }).then((g) => g.length),
  ]);

  return res.json({ pending, confirmed, totalPatients });
});

router.get('/assistant/tomorrow-slots', authenticate, requireRole(Role.ASSISTANT), async (req, res) => {
  const assistant = await prisma.assistant.findUnique({ where: { userId: req.user!.userId } });
  if (!assistant) return res.status(404).json({ error: 'Assistant introuvable' });

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);
  const date = parseDateOnly(dateStr);
  const dayOfWeek = date.getUTCDay();

  const schedules = await prisma.schedule.findMany({
    where: { doctorId: assistant.doctorId, dayOfWeek },
  });

  const booked = await prisma.appointment.findMany({
    where: {
      doctorId: assistant.doctorId,
      date,
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
    },
    select: { startTime: true },
  });
  const blocked = await prisma.blockedSlot.findMany({
    where: { doctorId: assistant.doctorId, date },
    select: { startTime: true },
  });
  const appointmentTimes = new Set(booked.map((b) => b.startTime));
  const blockedTimes = new Set(blocked.map((b) => b.startTime));

  const slots: { time: string; available: boolean; hasAppointment: boolean }[] = [];
  for (const schedule of schedules) {
    const generated = generateSlots(schedule.startTime, schedule.endTime, schedule.slotDuration);
    for (const time of generated) {
      const hasAppointment = appointmentTimes.has(time);
      const isBlocked = blockedTimes.has(time);
      slots.push({
        time,
        available: !hasAppointment && !isBlocked,
        hasAppointment,
      });
    }
  }

  return res.json({ date: dateStr, slots: slots.sort((a, b) => a.time.localeCompare(b.time)) });
});

const tomorrowSlotsSchema = z.object({
  slots: z.array(z.object({
    time: z.string().regex(/^\d{2}:\d{2}$/),
    available: z.boolean(),
  })),
});

router.put('/assistant/tomorrow-slots', authenticate, requireRole(Role.ASSISTANT), validateBody(tomorrowSlotsSchema), async (req, res) => {
  const assistant = await prisma.assistant.findUnique({ where: { userId: req.user!.userId } });
  if (!assistant) return res.status(404).json({ error: 'Assistant introuvable' });

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);
  const date = parseDateOnly(dateStr);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: assistant.doctorId,
      date,
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
    },
    select: { startTime: true },
  });
  const appointmentTimes = new Set(appointments.map((a) => a.startTime));

  const { slots } = req.body as z.infer<typeof tomorrowSlotsSchema>;

  for (const slot of slots) {
    if (appointmentTimes.has(slot.time)) continue;

    if (!slot.available) {
      await prisma.blockedSlot.upsert({
        where: {
          doctorId_date_startTime: {
            doctorId: assistant.doctorId,
            date,
            startTime: slot.time,
          },
        },
        create: { doctorId: assistant.doctorId, date, startTime: slot.time },
        update: {},
      });
    } else {
      await prisma.blockedSlot.deleteMany({
        where: { doctorId: assistant.doctorId, date, startTime: slot.time },
      });
    }
  }

  const blocked = await prisma.blockedSlot.findMany({
    where: { doctorId: assistant.doctorId, date },
    select: { startTime: true },
  });
  const blockedTimes = new Set(blocked.map((b) => b.startTime));

  const result = slots.map((slot) => ({
    time: slot.time,
    available: slot.available && !appointmentTimes.has(slot.time),
    hasAppointment: appointmentTimes.has(slot.time),
  }));

  // Include any slots not in request but with appointments
  for (const t of appointmentTimes) {
    if (!result.find((s) => s.time === t)) {
      result.push({ time: t, available: false, hasAppointment: true });
    }
  }

  return res.json({
    date: dateStr,
    slots: result.sort((a, b) => a.time.localeCompare(b.time)),
    saved: true,
    blockedCount: blockedTimes.size,
  });
});

router.get('/', authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as AppointmentStatus | undefined;

  const [data, total] = await Promise.all([
    prisma.appointment.findMany({
      where: status ? { status } : {},
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, specialty: true } },
        establishment: { include: { city: true } },
      },
    }),
    prisma.appointment.count({ where: status ? { status } : {} }),
  ]);

  return res.json({ data, total, page, limit });
});

router.patch('/:id/status', authenticate, validateBody(statusSchema), async (req, res) => {
  const { status, rejectionReason } = req.body;
  const appointmentId = paramId(req);
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true, assistants: true } },
    },
  });
  if (!appointment) return res.status(404).json({ error: 'RDV introuvable' });

  const { role, userId } = req.user!;

  if (role === Role.ASSISTANT) {
    const assistant = await prisma.assistant.findUnique({ where: { userId } });
    if (!assistant || assistant.doctorId !== appointment.doctorId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
  } else if (role === Role.PATIENT) {
    if (status !== 'CANCELLED') return res.status(403).json({ error: 'Accès refusé' });
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient || patient.id !== appointment.patientId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
  } else if (role !== Role.ADMIN && role !== Role.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status,
      rejectionReason,
      ...(role === Role.ASSISTANT && status === AppointmentStatus.CONFIRMED
        ? { assistantId: (await prisma.assistant.findUnique({ where: { userId } }))?.id }
        : {}),
    },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
      establishment: true,
    },
  });

  const dateStr = formatDateFr(appointment.date);
  const doctorName = `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`;
  const patientUser = appointment.patient.user;

  if (status === AppointmentStatus.CONFIRMED) {
    const msg = `Votre RDV avec Dr. ${doctorName} le ${dateStr} à ${appointment.startTime} est confirmé.`;
    await createNotification({
      userId: patientUser.id,
      type: NotificationType.APPOINTMENT,
      title: 'RDV confirmé',
      message: msg,
      link: '/patient/rendez-vous',
      sendSms: true,
      phone: patientUser.phone,
    });
    await smsService.appointmentConfirmed({
      phone: patientUser.phone,
      doctorName,
      date: dateStr,
      time: appointment.startTime,
      ref: appointment.id.slice(0, 8),
    });
  } else if (status === AppointmentStatus.REJECTED) {
    await createNotification({
      userId: patientUser.id,
      type: NotificationType.APPOINTMENT,
      title: 'RDV refusé',
      message: `Votre demande de RDV le ${dateStr} a été refusée.`,
      link: '/patient/rendez-vous',
      sendSms: true,
      phone: patientUser.phone,
    });
    await smsService.appointmentRejected({
      phone: patientUser.phone,
      doctorName,
      date: dateStr,
      reason: rejectionReason,
    });
  } else if (status === AppointmentStatus.CANCELLED) {
    await createNotification({
      userId: patientUser.id,
      type: NotificationType.APPOINTMENT,
      title: 'RDV annulé',
      message: `Votre RDV du ${dateStr} a été annulé.`,
      link: '/patient/rendez-vous',
      sendSms: true,
      phone: patientUser.phone,
    });
    await smsService.appointmentCancelled({ phone: patientUser.phone, doctorName, date: dateStr });
  }

  return res.json(updated);
});

export default router;
