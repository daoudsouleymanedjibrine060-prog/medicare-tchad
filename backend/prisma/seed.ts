import 'dotenv/config';

import { Role, EstablishmentType, AppointmentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { createPrismaClient } from '../src/config/database';

const prisma = createPrismaClient();

const PASSWORD = 'Admin@123';
const PATIENT_PASSWORD = 'Patient@123';

async function main() {
  console.log('Seeding MediCare Tchad database...');

  await prisma.refreshToken.deleteMany();
  await prisma.blockedSlot.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.doctorEstablishment.deleteMany();
  await prisma.assistant.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.establishment.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const patientHash = await bcrypt.hash(PATIENT_PASSWORD, 12);

  const cities = await Promise.all([
    prisma.city.create({ data: { name: "N'Djamena", region: 'Chari-Baguirmi', latitude: 12.1348, longitude: 15.0557 } }),
    prisma.city.create({ data: { name: 'Moundou', region: 'Logone Occidental', latitude: 8.5667, longitude: 16.0833 } }),
    prisma.city.create({ data: { name: 'Sarh', region: 'Moyen-Chari', latitude: 9.1456, longitude: 18.3928 } }),
    prisma.city.create({ data: { name: 'Abéché', region: 'Ouaddaï', latitude: 13.8292, longitude: 20.8324 } }),
    prisma.city.create({ data: { name: 'Doba', region: 'Logone Oriental', latitude: 8.6639, longitude: 16.8497 } }),
    prisma.city.create({ data: { name: 'Bongor', region: 'Mayo-Kebbi Est', latitude: 10.2806, longitude: 15.3722 } }),
    prisma.city.create({ data: { name: 'Mongo', region: 'Guéra', latitude: 12.1844, longitude: 18.6936 } }),
    prisma.city.create({ data: { name: 'Pala', region: 'Mayo-Kebbi Ouest', latitude: 9.3642, longitude: 14.9047 } }),
    prisma.city.create({ data: { name: 'Faya-Largeau', region: 'Borkou', latitude: 17.9257, longitude: 19.1128 } }),
    prisma.city.create({ data: { name: 'Am-Timan', region: 'Salamat', latitude: 11.0333, longitude: 20.2833 } }),
    prisma.city.create({ data: { name: 'Massaguet', region: 'Hadjer-Lamis', latitude: 12.9961, longitude: 15.7297 } }),
  ]);

  const cityMap = Object.fromEntries(cities.map((c) => [c.name, c.id]));

  const specialties = await Promise.all([
    { name: 'general_medicine', nameFr: 'Médecine générale' },
    { name: 'pediatrics', nameFr: 'Pédiatrie' },
    { name: 'cardiology', nameFr: 'Cardiologie' },
    { name: 'gynecology', nameFr: 'Gynécologie' },
    { name: 'dermatology', nameFr: 'Dermatologie' },
    { name: 'ophthalmology', nameFr: 'Ophtalmologie' },
    { name: 'dentistry', nameFr: 'Dentisterie' },
    { name: 'orthopedics', nameFr: 'Orthopédie' },
    { name: 'neurology', nameFr: 'Neurologie' },
    { name: 'psychiatry', nameFr: 'Psychiatrie' },
    { name: 'urology', nameFr: 'Urologie' },
    { name: 'ent', nameFr: 'ORL' },
    { name: 'radiology', nameFr: 'Radiologie' },
    { name: 'surgery', nameFr: 'Chirurgie générale' },
    { name: 'internal_medicine', nameFr: 'Médecine interne' },
  ].map((s) => prisma.specialty.create({ data: s })));

  const specMap = Object.fromEntries(specialties.map((s) => [s.nameFr, s.id]));

  const establishments = await Promise.all([
    { name: "Hôpital Général de Référence National (HGRN)", type: EstablishmentType.HOPITAL, address: "Avenue Charles de Gaulle, N'Djamena", phone: '+23566234501', cityId: cityMap["N'Djamena"], latitude: 12.1067, longitude: 15.0444 },
    { name: "Hôpital de la Mère et de l'Enfant (HME)", type: EstablishmentType.HOPITAL, address: "Quartier Moursal, N'Djamena", phone: '+23566234502', cityId: cityMap["N'Djamena"], latitude: 12.1289, longitude: 15.0611 },
    { name: "Hôpital de l'Amitié Tchado-Chinoise", type: EstablishmentType.HOPITAL, address: "Avenue Mobutu, N'Djamena", phone: '+23566234503', cityId: cityMap["N'Djamena"], latitude: 12.1194, longitude: 15.0533 },
    { name: 'Centre Hospitalier Universitaire de Moundou (CHU)', type: EstablishmentType.HOPITAL, address: 'Avenue du 11 Janvier, Moundou', phone: '+23566234504', cityId: cityMap['Moundou'], latitude: 8.5667, longitude: 16.0833 },
    { name: 'Hôpital Provincial de Sarh', type: EstablishmentType.HOPITAL, address: 'Avenue de la République, Sarh', phone: '+23566234505', cityId: cityMap['Sarh'], latitude: 9.1456, longitude: 18.3928 },
    { name: "Hôpital Provincial d'Abéché", type: EstablishmentType.HOPITAL, address: "Centre-ville, Abéché", phone: '+23566234506', cityId: cityMap['Abéché'], latitude: 13.8292, longitude: 20.8324 },
    { name: 'Clinique La Providence', type: EstablishmentType.CLINIQUE, address: "N'Djamena, Moursal", phone: '+23566234507', cityId: cityMap["N'Djamena"], latitude: 12.1311, longitude: 15.0589 },
    { name: 'Clinique Moundou Santé', type: EstablishmentType.CLINIQUE, address: 'Quartier commercial, Moundou', phone: '+23566234508', cityId: cityMap['Moundou'], latitude: 8.5700, longitude: 16.0900 },
    { name: 'Cabinet Médical Dr. Oumar', type: EstablishmentType.CABINET, address: "N'Djamena, Chagoua", phone: '+23566234509', cityId: cityMap["N'Djamena"], latitude: 12.1400, longitude: 15.0700 },
    { name: 'Cabinet Médical de Bongor', type: EstablishmentType.CABINET, address: 'Bongor centre', phone: '+23566234513', cityId: cityMap['Bongor'], latitude: 10.2820, longitude: 15.3740 },
    { name: 'Centre de Santé de Doba', type: EstablishmentType.CENTRE_SANTE, address: 'Doba centre', phone: '+23566234510', cityId: cityMap['Doba'], latitude: 8.6639, longitude: 16.8497 },
    { name: 'Centre de Santé de Bongor', type: EstablishmentType.CENTRE_SANTE, address: 'Bongor', phone: '+23566234511', cityId: cityMap['Bongor'], latitude: 10.2806, longitude: 15.3722 },
    { name: 'Hôpital de District de Mongo', type: EstablishmentType.HOPITAL, address: 'Mongo centre', phone: '+23566234512', cityId: cityMap['Mongo'], latitude: 12.1844, longitude: 18.6936 },
    { name: 'Centre de Santé de Massaguet', type: EstablishmentType.CENTRE_SANTE, address: 'Massaguet', phone: '+23566234514', cityId: cityMap['Massaguet'], latitude: 12.9961, longitude: 15.7297 },
    { name: "Laboratoire National de Santé Publique", type: EstablishmentType.LABORATOIRE, address: "N'Djamena, quartier Moursal", phone: '+23592234501', cityId: cityMap["N'Djamena"], latitude: 12.1270, longitude: 15.0590 },
    { name: 'Laboratoire Biomédical du Tchad', type: EstablishmentType.LABORATOIRE, address: "N'Djamena, Avenue Charles de Gaulle", phone: '+23592234502', cityId: cityMap["N'Djamena"], latitude: 12.1080, longitude: 15.0460 },
    { name: 'Laboratoire Moundou Analyses', type: EstablishmentType.LABORATOIRE, address: 'Moundou centre', phone: '+23592234503', cityId: cityMap['Moundou'], latitude: 8.5680, longitude: 16.0850 },
    { name: 'Laboratoire Provincial de Sarh', type: EstablishmentType.LABORATOIRE, address: 'Sarh, près Hôpital Provincial', phone: '+23592234504', cityId: cityMap['Sarh'], latitude: 9.1470, longitude: 18.3940 },
    { name: "Laboratoire d'Abéché", type: EstablishmentType.LABORATOIRE, address: "Abéché centre", phone: '+23592234505', cityId: cityMap['Abéché'], latitude: 13.8310, longitude: 20.8340 },
    { name: 'Laboratoire Pasteur Tchad', type: EstablishmentType.LABORATOIRE, address: "N'Djamena, quartier Chagoua", phone: '+23592234506', cityId: cityMap["N'Djamena"], latitude: 12.1380, longitude: 15.0680 },
    { name: 'Laboratoire Am-Timan Santé', type: EstablishmentType.LABORATOIRE, address: 'Am-Timan centre', phone: '+23592234507', cityId: cityMap['Am-Timan'], latitude: 11.0350, longitude: 20.2850 },
    { name: 'Laboratoire Faya Analyses', type: EstablishmentType.LABORATOIRE, address: 'Faya-Largeau centre', phone: '+23592234508', cityId: cityMap['Faya-Largeau'], latitude: 17.9270, longitude: 19.1140 },
  ].map((e) => prisma.establishment.create({ data: e })));

  const estMap = Object.fromEntries(establishments.map((e) => [e.name, e.id]));
  const clinicalEstablishments = establishments.filter((e) => e.type !== EstablishmentType.LABORATOIRE);

  const labParents: Record<string, string> = {
    "Laboratoire National de Santé Publique": "Hôpital de la Mère et de l'Enfant (HME)",
    'Laboratoire Biomédical du Tchad': "Hôpital Général de Référence National (HGRN)",
    'Laboratoire Moundou Analyses': 'Centre Hospitalier Universitaire de Moundou (CHU)',
    'Laboratoire Provincial de Sarh': 'Hôpital Provincial de Sarh',
    "Laboratoire d'Abéché": "Hôpital Provincial d'Abéché",
    'Laboratoire Pasteur Tchad': 'Clinique La Providence',
    'Laboratoire Am-Timan Santé': 'Centre de Santé de Doba',
    'Laboratoire Faya Analyses': 'Hôpital de District de Mongo',
  };
  for (const [labName, parentName] of Object.entries(labParents)) {
    await prisma.establishment.update({
      where: { id: estMap[labName] },
      data: { parentEstablishmentId: estMap[parentName] },
    });
  }

  await prisma.user.create({
    data: {
      email: 'superadmin@medicare-td.test',
      phone: '+23566000001',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      admin: { create: { scope: 'national' } },
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@medicare-td.test',
      phone: '+23566000002',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Ndjamena',
      role: Role.ADMIN,
      admin: { create: { scope: "N'Djamena" } },
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin.moundou@medicare-td.test',
      phone: '+23566000003',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Moundou',
      role: Role.ADMIN,
      admin: { create: { scope: 'Moundou' } },
    },
  });

  const doctorData = [
    { firstName: 'Mahamat', lastName: 'Hassan', email: 'dr.hassan@medicare-td.test', phone: '+23566100001', specialty: 'Médecine générale', est: "Hôpital Général de Référence National (HGRN)" },
    { firstName: 'Fatimé', lastName: 'Allam', email: 'dr.allam@medicare-td.test', phone: '+23566100002', specialty: 'Pédiatrie', est: "Hôpital de la Mère et de l'Enfant (HME)" },
    { firstName: 'Jean-Baptiste', lastName: 'Dingamnayel', email: 'dr.dinga@medicare-td.test', phone: '+23566100003', specialty: 'Cardiologie', est: "Hôpital Général de Référence National (HGRN)" },
    { firstName: 'Amina', lastName: 'Ousmane', email: 'dr.ousmane@medicare-td.test', phone: '+23566100004', specialty: 'Gynécologie', est: 'Clinique La Providence' },
    { firstName: 'Pierre', lastName: 'Ngarmbatina', email: 'dr.ngarmba@medicare-td.test', phone: '+23566100005', specialty: 'Dermatologie', est: 'Cabinet Médical Dr. Oumar' },
    { firstName: 'Hawa', lastName: 'Mahamat', email: 'dr.hawa@medicare-td.test', phone: '+23566100006', specialty: 'Ophtalmologie', est: "Hôpital de l'Amitié Tchado-Chinoise" },
    { firstName: 'Issa', lastName: 'Abakar', email: 'dr.abakar@medicare-td.test', phone: '+23566100007', specialty: 'Dentisterie', est: 'Clinique La Providence' },
    { firstName: 'Rosine', lastName: 'Mbaissoro', email: 'dr.mbaissoro@medicare-td.test', phone: '+23566100008', specialty: 'Orthopédie', est: 'Centre Hospitalier Universitaire de Moundou (CHU)' },
    { firstName: 'Youssouf', lastName: 'Togo', email: 'dr.togo@medicare-td.test', phone: '+23566100009', specialty: 'Médecine générale', est: 'Hôpital Provincial de Sarh' },
    { firstName: 'Khadi', lastName: 'Zene', email: 'dr.zene@medicare-td.test', phone: '+23566100010', specialty: 'Pédiatrie', est: "Hôpital Provincial d'Abéché" },
    { firstName: 'Albert', lastName: 'Mbaidoum', email: 'dr.mbaidoum@medicare-td.test', phone: '+23566100011', specialty: 'Neurologie', est: "Hôpital Général de Référence National (HGRN)" },
    { firstName: 'Mariam', lastName: 'Saleh', email: 'dr.saleh@medicare-td.test', phone: '+23566100012', specialty: 'Psychiatrie', est: 'Clinique La Providence' },
    { firstName: 'Adam', lastName: 'Haroun', email: 'dr.haroun@medicare-td.test', phone: '+23566100013', specialty: 'Urologie', est: 'Centre Hospitalier Universitaire de Moundou (CHU)' },
    { firstName: 'Clarisse', lastName: 'Nodjitel', email: 'dr.nodjitel@medicare-td.test', phone: '+23566100014', specialty: 'ORL', est: "Hôpital de la Mère et de l'Enfant (HME)" },
    { firstName: 'Brahim', lastName: 'Acyl', email: 'dr.acyl@medicare-td.test', phone: '+23566100015', specialty: 'Radiologie', est: "Hôpital Général de Référence National (HGRN)" },
    { firstName: 'Esther', lastName: 'Djekounda', email: 'dr.djekounda@medicare-td.test', phone: '+23566100016', specialty: 'Chirurgie générale', est: 'Hôpital Provincial de Sarh' },
    { firstName: 'Ousman', lastName: 'Khalil', email: 'dr.khalil@medicare-td.test', phone: '+23566100017', specialty: 'Médecine interne', est: 'Centre de Santé de Doba' },
    { firstName: 'Sandrine', lastName: 'Beassoum', email: 'dr.beassoum@medicare-td.test', phone: '+23566100018', specialty: 'Médecine générale', est: 'Centre de Santé de Bongor' },
    { firstName: 'Idriss', lastName: 'Deby', email: 'dr.deby@medicare-td.test', phone: '+23566100019', specialty: 'Pédiatrie', est: 'Hôpital de District de Mongo' },
    { firstName: 'Nadia', lastName: 'Faki', email: 'dr.faki@medicare-td.test', phone: '+23566100020', specialty: 'Gynécologie', est: 'Clinique Moundou Santé' },
  ];

  const doctors = [];
  for (const d of doctorData) {
    const doctor = await prisma.doctor.create({
      data: {
        specialty: { connect: { id: specMap[d.specialty] } },
        licenseNumber: `TD-${Math.floor(Math.random() * 9000 + 1000)}`,
        bio: `Dr. ${d.firstName} ${d.lastName}, spécialiste en ${d.specialty}.`,
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(d.firstName + '+' + d.lastName)}&background=0d9488&color=fff&size=128`,
        user: {
          create: {
            email: d.email,
            phone: d.phone,
            passwordHash,
            firstName: d.firstName,
            lastName: d.lastName,
            role: Role.DOCTOR,
          },
        },
        establishments: {
          create: [{ establishment: { connect: { id: estMap[d.est] } } }],
        },
        schedules: {
          create: [1, 2, 3, 4, 5].flatMap((dayOfWeek) => [
            { dayOfWeek, startTime: '08:00', endTime: '12:00', slotDuration: 30 },
            { dayOfWeek, startTime: '14:00', endTime: '17:00', slotDuration: 30 },
          ]),
        },
      },
    });
    doctors.push(doctor);
  }

  const assistantData = [
    { firstName: 'Aicha', lastName: 'Moussa', email: 'assistant1@medicare-td.test', phone: '+23566200001', doctorIdx: 0 },
    { firstName: 'Mohamed', lastName: 'Ali', email: 'assistant2@medicare-td.test', phone: '+23566200002', doctorIdx: 1 },
    { firstName: 'Grace', lastName: 'Ngar', email: 'assistant3@medicare-td.test', phone: '+23566200003', doctorIdx: 2 },
    { firstName: 'Salma', lastName: 'Brahim', email: 'assistant4@medicare-td.test', phone: '+23566200004', doctorIdx: 3 },
    { firstName: 'David', lastName: 'Koum', email: 'assistant5@medicare-td.test', phone: '+23566200005', doctorIdx: 7 },
  ];

  for (const a of assistantData) {
    await prisma.user.create({
      data: {
        email: a.email,
        phone: a.phone,
        passwordHash,
        firstName: a.firstName,
        lastName: a.lastName,
        role: Role.ASSISTANT,
        assistant: { create: { doctorId: doctors[a.doctorIdx].id } },
      },
    });
  }

  await prisma.user.create({
    data: {
      email: 'patient@medicare-td.test',
      phone: '+23566300001',
      passwordHash: patientHash,
      firstName: 'Demo',
      lastName: 'Patient',
      role: Role.PATIENT,
      patient: { create: { cityId: cityMap["N'Djamena"], address: "Quartier Chagoua, N'Djamena", bloodGroup: 'O+', age: 35, gender: 'M' } },
    },
  });

  const patientNames = [
    ['Ibrahim', 'Mahamat'], ['Awa', 'Hassan'], ['Emmanuel', 'Doudou'], ['Fanta', 'Ali'],
    ['Gaspard', 'Ngar'], ['Halima', 'Ousman'], ['Jacques', 'Mbaissoro'], ['Kaltouma', 'Saleh'],
    ['Luc', 'Abakar'], ['Maimouna', 'Haroun'], ['Noel', 'Togo'], ['Oumou', 'Zene'],
    ['Paul', 'Acyl'], ['Rachel', 'Beassoum'], ['Sami', 'Khalil'], ['Therese', 'Nodjitel'],
    ['Umar', 'Dingamnayel'], ['Viviane', 'Mbaidoum'], ['William', 'Djekounda'], ['Yasmine', 'Faki'],
    ['Zacharie', 'Ngarmbatina'], ['Aminata', 'Moussa'], ['Benoit', 'Allam'], ['Chantal', 'Oumar'],
    ['Daniel', 'Hassan'], ['Evelyne', 'Mahamat'], ['Fabrice', 'Ali'], ['Gertrude', 'Saleh'],
    ['Henri', 'Abakar'],
  ];

  const patients = [];
  for (let i = 0; i < patientNames.length; i++) {
    const [firstName, lastName] = patientNames[i];
    const cityName = cities[i % cities.length].name;
    const user = await prisma.user.create({
      data: {
        email: `patient${i + 1}@medicare-td.test`,
        phone: `+235663${String(i + 2).padStart(5, '0')}`,
        passwordHash: patientHash,
        firstName,
        lastName,
        role: Role.PATIENT,
        patient: { create: { cityId: cityMap[cityName], bloodGroup: ['A+', 'B+', 'O+', 'AB+'][i % 4], age: 18 + (i % 55), gender: i % 2 === 0 ? 'M' : 'F' } },
      },
      include: { patient: true },
    });
    patients.push(user.patient!);
  }

  const demoPatient = await prisma.patient.findFirst({ where: { user: { email: 'patient@medicare-td.test' } }, include: { user: true } });
  const assistantUser = await prisma.user.findUnique({ where: { email: 'assistant1@medicare-td.test' } });
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@medicare-td.test' } });

  if (demoPatient?.user && assistantUser) {
    await prisma.message.createMany({
      data: [
        { senderId: demoPatient.user.id, receiverId: assistantUser.id, content: 'Bonjour, je souhaite confirmer mon rendez-vous de demain.' },
        { senderId: assistantUser.id, receiverId: demoPatient.user.id, content: 'Bonjour, votre rendez-vous est bien enregistré. Merci de vous présenter 15 minutes avant.' },
        { senderId: demoPatient.user.id, receiverId: assistantUser.id, content: 'Merci beaucoup pour votre réponse.' },
      ],
    });
  }
  if (demoPatient?.user && adminUser) {
    await prisma.message.create({
      data: { senderId: adminUser.id, receiverId: demoPatient.user.id, content: 'Bienvenue sur MediCare Tchad. N\'hésitez pas à nous contacter pour toute question.' },
    });
  }

  const assistantMap = new Map<number, string>();
  for (const a of assistantData) {
    const au = await prisma.user.findUnique({ where: { email: a.email }, include: { assistant: true } });
    if (au?.assistant) assistantMap.set(a.doctorIdx, au.assistant.id);
  }

  const statuses = [
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.REJECTED,
    AppointmentStatus.CANCELLED,
  ];

  for (let i = 0; i < 50; i++) {
    const doctorIdx = i % doctors.length;
    const doctor = doctors[doctorIdx];
    const patient = i === 0 && demoPatient ? demoPatient : patients[i % patients.length];
    const est = clinicalEstablishments[i % clinicalEstablishments.length];
    const status = statuses[i % statuses.length];
    const assistantUserId = status === AppointmentStatus.CONFIRMED ? assistantMap.get(doctorIdx) : undefined;
    const daysOffset = Math.floor(i / 5) - 10;
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + daysOffset);
    date.setUTCHours(0, 0, 0, 0);

    const hours = ['08:00', '08:30', '09:00', '09:30', '10:00', '14:00', '14:30', '15:00'];
    const startTime = hours[i % hours.length];
    const [h, m] = startTime.split(':').map(Number);
    const endMinutes = m + 30;
    const endTime = `${String(h + Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        establishmentId: est.id,
        date,
        startTime,
        endTime,
        status,
        assistantId: assistantUserId,
        reason: 'Consultation de routine',
      },
    });
  }

  console.log('Seed completed!');
  console.log('Comptes de test:');
  console.log('  Super Admin: superadmin@medicare-td.test / Admin@123');
  console.log('  Admin: admin@medicare-td.test / Admin@123');
  console.log('  Assistant: assistant1@medicare-td.test / Admin@123');
  console.log('  Patient: patient@medicare-td.test / Patient@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
