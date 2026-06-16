"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const PASSWORD = 'Admin@123';
const PATIENT_PASSWORD = 'Patient@123';
async function main() {
    console.log('🌱 Seeding MediCare Tchad database...');
    await prisma.refreshToken.deleteMany();
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
    const passwordHash = await bcryptjs_1.default.hash(PASSWORD, 12);
    const patientHash = await bcryptjs_1.default.hash(PATIENT_PASSWORD, 12);
    const cities = await Promise.all([
        prisma.city.create({ data: { name: "N'Djamena", region: 'Chari-Baguirmi', latitude: 12.1348, longitude: 15.0557 } }),
        prisma.city.create({ data: { name: 'Moundou', region: 'Logone Occidental', latitude: 8.5667, longitude: 16.0833 } }),
        prisma.city.create({ data: { name: 'Sarh', region: 'Moyen-Chari', latitude: 9.1456, longitude: 18.3928 } }),
        prisma.city.create({ data: { name: 'Abéché', region: 'Ouaddaï', latitude: 13.8292, longitude: 20.8324 } }),
        prisma.city.create({ data: { name: 'Doba', region: 'Logone Oriental', latitude: 8.6639, longitude: 16.8497 } }),
        prisma.city.create({ data: { name: 'Bongor', region: 'Mayo-Kebbi Est', latitude: 10.2806, longitude: 15.3722 } }),
        prisma.city.create({ data: { name: 'Mongo', region: 'Guéra', latitude: 12.1844, longitude: 18.6936 } }),
        prisma.city.create({ data: { name: 'Pala', region: 'Mayo-Kebbi Ouest', latitude: 9.3642, longitude: 14.9047 } }),
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
        { name: "Hôpital Général de Référence National", type: client_1.EstablishmentType.HOPITAL, address: "Avenue Charles de Gaulle, N'Djamena", phone: '+23566234501', cityId: cityMap["N'Djamena"], latitude: 12.1067, longitude: 15.0444 },
        { name: "Hôpital de la Mère et de l'Enfant", type: client_1.EstablishmentType.HOPITAL, address: "Quartier Moursal, N'Djamena", phone: '+23566234502', cityId: cityMap["N'Djamena"], latitude: 12.1289, longitude: 15.0611 },
        { name: 'Hôpital de l\'Amitié Tchado-Chinoise', type: client_1.EstablishmentType.HOPITAL, address: "N'Djamena", phone: '+23566234503', cityId: cityMap["N'Djamena"], latitude: 12.1194, longitude: 15.0533 },
        { name: 'Centre Hospitalier Universitaire de Moundou', type: client_1.EstablishmentType.HOPITAL, address: 'Moundou centre', phone: '+23566234504', cityId: cityMap['Moundou'], latitude: 8.5667, longitude: 16.0833 },
        { name: 'Hôpital Provincial de Sarh', type: client_1.EstablishmentType.HOPITAL, address: 'Sarh centre', phone: '+23566234505', cityId: cityMap['Sarh'], latitude: 9.1456, longitude: 18.3928 },
        { name: 'Hôpital Provincial d\'Abéché', type: client_1.EstablishmentType.HOPITAL, address: 'Abéché centre', phone: '+23566234506', cityId: cityMap['Abéché'], latitude: 13.8292, longitude: 20.8324 },
        { name: 'Clinique La Providence', type: client_1.EstablishmentType.CLINIQUE, address: "N'Djamena, Moursal", phone: '+23566234507', cityId: cityMap["N'Djamena"], latitude: 12.1311, longitude: 15.0589 },
        { name: 'Clinique Moundou Santé', type: client_1.EstablishmentType.CLINIQUE, address: 'Moundou', phone: '+23566234508', cityId: cityMap['Moundou'], latitude: 8.5700, longitude: 16.0900 },
        { name: 'Cabinet Médical Dr. Oumar', type: client_1.EstablishmentType.CABINET, address: "N'Djamena, Chagoua", phone: '+23566234509', cityId: cityMap["N'Djamena"], latitude: 12.1400, longitude: 15.0700 },
        { name: 'Centre de Santé de Doba', type: client_1.EstablishmentType.CENTRE_SANTE, address: 'Doba', phone: '+23566234510', cityId: cityMap['Doba'], latitude: 8.6639, longitude: 16.8497 },
        { name: 'Centre de Santé de Bongor', type: client_1.EstablishmentType.CENTRE_SANTE, address: 'Bongor', phone: '+23566234511', cityId: cityMap['Bongor'], latitude: 10.2806, longitude: 15.3722 },
        { name: 'Hôpital de District de Mongo', type: client_1.EstablishmentType.HOPITAL, address: 'Mongo', phone: '+23566234512', cityId: cityMap['Mongo'], latitude: 12.1844, longitude: 18.6936 },
    ].map((e) => prisma.establishment.create({ data: e })));
    const estMap = Object.fromEntries(establishments.map((e) => [e.name, e.id]));
    // Super Admin
    await prisma.user.create({
        data: {
            email: 'superadmin@medicare-td.test',
            phone: '+23566000001',
            passwordHash,
            firstName: 'Super',
            lastName: 'Admin',
            role: client_1.Role.SUPER_ADMIN,
            admin: { create: { scope: 'national' } },
        },
    });
    // Admins
    await prisma.user.create({
        data: {
            email: 'admin@medicare-td.test',
            phone: '+23566000002',
            passwordHash,
            firstName: 'Admin',
            lastName: 'Ndjamena',
            role: client_1.Role.ADMIN,
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
            role: client_1.Role.ADMIN,
            admin: { create: { scope: 'Moundou' } },
        },
    });
    const doctorData = [
        { firstName: 'Mahamat', lastName: 'Hassan', email: 'dr.hassan@medicare-td.test', phone: '+23566100001', specialty: 'Médecine générale', est: "Hôpital Général de Référence National" },
        { firstName: 'Fatimé', lastName: 'Allam', email: 'dr.allam@medicare-td.test', phone: '+23566100002', specialty: 'Pédiatrie', est: "Hôpital de la Mère et de l'Enfant" },
        { firstName: 'Jean-Baptiste', lastName: 'Dingamnayel', email: 'dr.dinga@medicare-td.test', phone: '+23566100003', specialty: 'Cardiologie', est: "Hôpital Général de Référence National" },
        { firstName: 'Amina', lastName: 'Ousmane', email: 'dr.ousmane@medicare-td.test', phone: '+23566100004', specialty: 'Gynécologie', est: 'Clinique La Providence' },
        { firstName: 'Pierre', lastName: 'Ngarmbatina', email: 'dr.ngarmba@medicare-td.test', phone: '+23566100005', specialty: 'Dermatologie', est: 'Cabinet Médical Dr. Oumar' },
        { firstName: 'Hawa', lastName: 'Mahamat', email: 'dr.hawa@medicare-td.test', phone: '+23566100006', specialty: 'Ophtalmologie', est: "Hôpital de l'Amitié Tchado-Chinoise" },
        { firstName: 'Issa', lastName: 'Abakar', email: 'dr.abakar@medicare-td.test', phone: '+23566100007', specialty: 'Dentisterie', est: 'Clinique La Providence' },
        { firstName: 'Rosine', lastName: 'Mbaissoro', email: 'dr.mbaissoro@medicare-td.test', phone: '+23566100008', specialty: 'Orthopédie', est: 'Centre Hospitalier Universitaire de Moundou' },
        { firstName: 'Youssouf', lastName: 'Togo', email: 'dr.togo@medicare-td.test', phone: '+23566100009', specialty: 'Médecine générale', est: 'Hôpital Provincial de Sarh' },
        { firstName: 'Khadi', lastName: 'Zene', email: 'dr.zene@medicare-td.test', phone: '+23566100010', specialty: 'Pédiatrie', est: 'Hôpital Provincial d\'Abéché' },
        { firstName: 'Albert', lastName: 'Mbaidoum', email: 'dr.mbaidoum@medicare-td.test', phone: '+23566100011', specialty: 'Neurologie', est: "Hôpital Général de Référence National" },
        { firstName: 'Mariam', lastName: 'Saleh', email: 'dr.saleh@medicare-td.test', phone: '+23566100012', specialty: 'Psychiatrie', est: 'Clinique La Providence' },
        { firstName: 'Adam', lastName: 'Haroun', email: 'dr.haroun@medicare-td.test', phone: '+23566100013', specialty: 'Urologie', est: 'Centre Hospitalier Universitaire de Moundou' },
        { firstName: 'Clarisse', lastName: 'Nodjitel', email: 'dr.nodjitel@medicare-td.test', phone: '+23566100014', specialty: 'ORL', est: "Hôpital de la Mère et de l'Enfant" },
        { firstName: 'Brahim', lastName: 'Acyl', email: 'dr.acyl@medicare-td.test', phone: '+23566100015', specialty: 'Radiologie', est: "Hôpital Général de Référence National" },
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
                specialtyId: specMap[d.specialty],
                licenseNumber: `TD-${Math.floor(Math.random() * 9000 + 1000)}`,
                bio: `Dr. ${d.firstName} ${d.lastName}, spécialiste en ${d.specialty}.`,
                user: {
                    create: {
                        email: d.email,
                        phone: d.phone,
                        passwordHash,
                        firstName: d.firstName,
                        lastName: d.lastName,
                        role: client_1.Role.DOCTOR,
                    },
                },
                establishments: {
                    create: [{ establishmentId: estMap[d.est] }],
                },
                schedules: {
                    create: [
                        { dayOfWeek: 1, startTime: '08:00', endTime: '12:00', slotDuration: 30 },
                        { dayOfWeek: 1, startTime: '14:00', endTime: '17:00', slotDuration: 30 },
                        { dayOfWeek: 3, startTime: '08:00', endTime: '12:00', slotDuration: 30 },
                        { dayOfWeek: 5, startTime: '08:00', endTime: '12:00', slotDuration: 30 },
                    ],
                },
            },
        });
        doctors.push(doctor);
    }
    // Assistants
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
                role: client_1.Role.ASSISTANT,
                assistant: { create: { doctorId: doctors[a.doctorIdx].id } },
            },
        });
    }
    // Demo patient
    await prisma.user.create({
        data: {
            email: 'patient@medicare-td.test',
            phone: '+23566300001',
            passwordHash: patientHash,
            firstName: 'Demo',
            lastName: 'Patient',
            role: client_1.Role.PATIENT,
            patient: { create: { cityId: cityMap["N'Djamena"], address: "Quartier Chagoua, N'Djamena", bloodGroup: 'O+' } },
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
                role: client_1.Role.PATIENT,
                patient: { create: { cityId: cityMap[cityName], bloodGroup: ['A+', 'B+', 'O+', 'AB+'][i % 4] } },
            },
            include: { patient: true },
        });
        patients.push(user.patient);
    }
    const demoPatient = await prisma.patient.findFirst({ where: { user: { email: 'patient@medicare-td.test' } } });
    const statuses = [
        client_1.AppointmentStatus.PENDING,
        client_1.AppointmentStatus.CONFIRMED,
        client_1.AppointmentStatus.CONFIRMED,
        client_1.AppointmentStatus.COMPLETED,
        client_1.AppointmentStatus.REJECTED,
        client_1.AppointmentStatus.CANCELLED,
    ];
    for (let i = 0; i < 50; i++) {
        const doctor = doctors[i % doctors.length];
        const patient = i === 0 && demoPatient ? demoPatient : patients[i % patients.length];
        const est = establishments[i % establishments.length];
        const daysOffset = Math.floor(i / 5) - 10;
        const date = new Date();
        date.setUTCDate(date.getUTCDate() + daysOffset);
        date.setUTCHours(0, 0, 0, 0);
        const hours = ['08:00', '08:30', '09:00', '09:30', '10:00', '14:00', '14:30', '15:00'];
        const startTime = hours[i % hours.length];
        await prisma.appointment.create({
            data: {
                patientId: patient.id,
                doctorId: doctor.id,
                establishmentId: est.id,
                date,
                startTime,
                endTime: startTime === '08:00' ? '08:30' : `${startTime.split(':')[0]}:${String(Number(startTime.split(':')[1]) + 30).padStart(2, '0')}`,
                status: statuses[i % statuses.length],
                reason: 'Consultation de routine',
            },
        });
    }
    console.log('✅ Seed completed!');
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
//# sourceMappingURL=seed.js.map