import { AppointmentStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { generateSlots, parseDateOnly, timeToMinutes, minutesToTime } from '../utils/helpers';

export async function getAvailableSlots(doctorId: string, dateStr: string) {
  const date = parseDateOnly(dateStr);
  const dayOfWeek = date.getUTCDay();

  const schedules = await prisma.schedule.findMany({
    where: { doctorId, dayOfWeek },
  });

  if (schedules.length === 0) return [];

  const existing = await prisma.appointment.findMany({
    where: {
      doctorId,
      date,
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
    },
  });

  const blocked = await prisma.blockedSlot.findMany({
    where: { doctorId, date },
  });

  const bookedStarts = new Set([
    ...existing.map((a) => a.startTime),
    ...blocked.map((b) => b.startTime),
  ]);
  const allSlots: string[] = [];

  for (const schedule of schedules) {
    const slots = generateSlots(schedule.startTime, schedule.endTime, schedule.slotDuration);
    for (const slot of slots) {
      if (!bookedStarts.has(slot)) {
        allSlots.push(slot);
      }
    }
  }

  return allSlots.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
}

export type SlotStatus = 'available' | 'booked' | 'unavailable';

export async function getSlotsWithStatus(doctorId: string, dateStr: string) {
  const date = parseDateOnly(dateStr);
  const dayOfWeek = date.getUTCDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return [] as { time: string; status: SlotStatus }[];
  }

  const schedules = await prisma.schedule.findMany({
    where: { doctorId, dayOfWeek },
  });

  if (schedules.length === 0) return [];

  const existing = await prisma.appointment.findMany({
    where: {
      doctorId,
      date,
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
    },
  });

  const blocked = await prisma.blockedSlot.findMany({
    where: { doctorId, date },
  });

  const bookedStarts = new Set(existing.map((a) => a.startTime));
  const blockedStarts = new Set(blocked.map((b) => b.startTime));
  const result: { time: string; status: SlotStatus }[] = [];

  for (const schedule of schedules) {
    const generated = generateSlots(schedule.startTime, schedule.endTime, schedule.slotDuration);
    for (const time of generated) {
      if (bookedStarts.has(time)) {
        result.push({ time, status: 'booked' });
      } else if (blockedStarts.has(time)) {
        result.push({ time, status: 'unavailable' });
      } else {
        result.push({ time, status: 'available' });
      }
    }
  }

  return result.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

export function computeEndTime(startTime: string, slotDuration: number) {
  return minutesToTime(timeToMinutes(startTime) + slotDuration);
}

export async function getDoctorSlotDuration(doctorId: string, dayOfWeek: number) {
  const schedule = await prisma.schedule.findFirst({ where: { doctorId, dayOfWeek } });
  return schedule?.slotDuration ?? 30;
}
