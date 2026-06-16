import cron from 'node-cron';
import { AppointmentStatus, NotificationType } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { createNotification } from './notification.service';
import { smsService } from './sms.service';
import { formatDateFr } from '../utils/helpers';

function getTomorrowUTC(): Date {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow;
}

export function startReminderCron() {
  // Every day at 8:00 AM UTC
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running appointment reminder cron');
    const tomorrow = getTomorrowUTC();

    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          date: tomorrow,
          status: AppointmentStatus.CONFIRMED,
          reminderSent: false,
        },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
        },
      });

      for (const apt of appointments) {
        const dateStr = formatDateFr(apt.date);
        const doctorName = `${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`;
        const patient = apt.patient.user;

        await createNotification({
          userId: patient.id,
          type: NotificationType.REMINDER,
          title: 'Rappel de rendez-vous',
          message: `Rappel : RDV demain avec Dr. ${doctorName} à ${apt.startTime}.`,
          link: '/patient/rendez-vous',
          sendSms: true,
          phone: patient.phone,
        });

        await smsService.appointmentReminder({
          phone: patient.phone,
          doctorName,
          date: dateStr,
          time: apt.startTime,
        });

        await prisma.appointment.update({
          where: { id: apt.id },
          data: { reminderSent: true },
        });
      }

      logger.info(`Sent ${appointments.length} appointment reminders`);
    } catch (error) {
      logger.error('Reminder cron failed', { error });
    }
  });

  logger.info('Reminder cron scheduled');
}
