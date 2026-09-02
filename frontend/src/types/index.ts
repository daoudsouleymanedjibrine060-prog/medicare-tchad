export type Role = 'PATIENT' | 'DOCTOR' | 'ASSISTANT' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  patient?: Patient;
  doctor?: Doctor;
  assistant?: Assistant;
  admin?: Admin;
}

export interface Patient {
  id: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  cityId?: string;
  city?: City;
}

export interface Doctor {
  id: string;
  specialtyId: string;
  licenseNumber?: string;
  bio?: string;
  photoUrl?: string;
  specialty?: Specialty;
  establishments?: { establishment: Establishment }[];
  schedules?: Schedule[];
}

export interface Assistant {
  id: string;
  doctorId: string;
  doctor?: Doctor & { user?: User; specialty?: Specialty };
}

export interface Admin {
  id: string;
  scope?: string;
}

export interface City {
  id: string;
  name: string;
  region?: string;
}

export interface Specialty {
  id: string;
  name: string;
  nameFr: string;
}

export interface Establishment {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  city?: City;
  parentEstablishmentId?: string;
  parentEstablishment?: { id: string; name: string };
}

export interface Schedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

export interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  reason?: string;
  rejectionReason?: string;
  patient?: Patient & { user?: User };
  doctor?: Doctor & { user?: User; specialty?: Specialty };
  establishment?: Establishment;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  totalAssistants: number;
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  totalEstablishments: number;
  totalCabinets: number;
  totalLaboratories: number;
  totalAdmins?: number;
  inactiveAdmins?: number;
  confirmationRate: number;
  entityOverview?: { name: string; count: number }[];
  appointmentsByCity: { city: string; count: number }[];
  appointmentsBySpecialty: { specialty: string; count: number }[];
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  title: string;
  diagnosis?: string;
  symptoms?: string;
  notes?: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  createdAt: string;
  updatedAt?: string;
  patient?: Patient & { user?: User };
  doctor?: Doctor & { user?: User; specialty?: Specialty };
}

export interface PrescriptionItem {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medicalRecordId?: string;
  appointmentId?: string;
  instructions?: string;
  validUntil?: string;
  createdAt: string;
  patient?: Patient & { user?: User };
  doctor?: Doctor & { user?: User; specialty?: Specialty };
  items?: PrescriptionItem[];
}
