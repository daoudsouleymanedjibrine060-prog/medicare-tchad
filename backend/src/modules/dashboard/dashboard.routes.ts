import { Router } from 'express';
import { AppointmentStatus, Role, EstablishmentType } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.get('/stats', authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (_req, res) => {
  const [
    totalPatients,
    totalDoctors,
    totalAssistants,
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    totalEstablishments,
    totalCabinets,
    totalLaboratories,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.doctor.count(),
    prisma.assistant.count(),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: AppointmentStatus.PENDING } }),
    prisma.appointment.count({ where: { status: AppointmentStatus.CONFIRMED } }),
    prisma.establishment.count(),
    prisma.establishment.count({ where: { type: { in: [EstablishmentType.CABINET, EstablishmentType.CLINIQUE] } } }),
    prisma.establishment.count({ where: { type: EstablishmentType.LABORATOIRE } }),
  ]);

  const appointmentsByCity = await prisma.appointment.groupBy({
    by: ['establishmentId'],
    _count: true,
  });

  const establishmentIds = appointmentsByCity.map((a) => a.establishmentId);
  const establishments = await prisma.establishment.findMany({
    where: { id: { in: establishmentIds } },
    include: { city: true },
  });

  const cityMap = new Map<string, number>();
  for (const item of appointmentsByCity) {
    const est = establishments.find((e) => e.id === item.establishmentId);
    if (est) {
      cityMap.set(est.city.name, (cityMap.get(est.city.name) || 0) + item._count);
    }
  }

  const appointmentsBySpecialty = await prisma.appointment.groupBy({
    by: ['doctorId'],
    _count: true,
  });

  const doctorIds = appointmentsBySpecialty.map((a) => a.doctorId);
  const doctors = await prisma.doctor.findMany({
    where: { id: { in: doctorIds } },
    include: { specialty: true },
  });

  const specialtyMap = new Map<string, number>();
  for (const item of appointmentsBySpecialty) {
    const doc = doctors.find((d) => d.id === item.doctorId);
    if (doc) {
      specialtyMap.set(doc.specialty.nameFr, (specialtyMap.get(doc.specialty.nameFr) || 0) + item._count);
    }
  }

  const confirmationRate =
    totalAppointments > 0
      ? Math.round((confirmedAppointments / totalAppointments) * 100)
      : 0;

  return res.json({
    totalPatients,
    totalDoctors,
    totalAssistants,
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    totalEstablishments,
    totalCabinets,
    totalLaboratories,
    totalAdmins: await prisma.admin.count(),
    inactiveAdmins: await prisma.user.count({ where: { role: Role.ADMIN, isActive: false } }),
    confirmationRate,
    entityOverview: [
      { name: 'Médecins', count: totalDoctors },
      { name: 'Patients', count: totalPatients },
      { name: 'Cabinets', count: totalCabinets },
      { name: 'Laboratoires', count: totalLaboratories },
      { name: 'Assistants', count: totalAssistants },
      { name: 'Rendez-vous', count: totalAppointments },
    ],
    appointmentsByCity: Array.from(cityMap.entries()).map(([city, count]) => ({ city, count })),
    appointmentsBySpecialty: Array.from(specialtyMap.entries()).map(([specialty, count]) => ({
      specialty,
      count,
    })),
  });
});

router.get('/export/appointments', authenticate, requireRole(Role.SUPER_ADMIN), async (_req, res) => {
  const appointments = await prisma.appointment.findMany({
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true, specialty: true } },
      establishment: { include: { city: true } },
    },
    orderBy: { date: 'desc' },
  });

  const header = 'ID,Date,Heure,Patient,Médecin,Spécialité,Établissement,Ville,Statut\n';
  const rows = appointments
    .map((a) =>
      [
        a.id,
        a.date.toISOString().slice(0, 10),
        a.startTime,
        `${a.patient.user.firstName} ${a.patient.user.lastName}`,
        `Dr. ${a.doctor.user.firstName} ${a.doctor.user.lastName}`,
        a.doctor.specialty.nameFr,
        a.establishment.name,
        a.establishment.city.name,
        a.status,
      ].join(',')
    )
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=rendez-vous.csv');
  return res.send(header + rows);
});

export default router;
