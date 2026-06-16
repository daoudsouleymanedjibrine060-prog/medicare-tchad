export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('00235')) cleaned = '+235' + cleaned.slice(5);
  if (cleaned.startsWith('235') && !cleaned.startsWith('+')) cleaned = '+' + cleaned;
  if (/^6[0-9]{7}$/.test(cleaned) || /^9[0-9]{7}$/.test(cleaned)) {
    cleaned = '+235' + cleaned;
  }
  if (!cleaned.startsWith('+235')) {
    throw new Error('Numéro invalide. Format attendu: +235XXXXXXXX');
  }
  return cleaned;
}

export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function generateSlots(startTime: string, endTime: string, slotDuration: number): string[] {
  const slots: string[] = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  while (current + slotDuration <= end) {
    slots.push(minutesToTime(current));
    current += slotDuration;
  }
  return slots;
}

export function sanitizeUser(user: {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  patient?: unknown;
  doctor?: unknown;
  assistant?: unknown;
  admin?: unknown;
}) {
  const { passwordHash: _, ...rest } = user as typeof user & { passwordHash?: string };
  return rest;
}
