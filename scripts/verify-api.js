/**
 * Script de vérification API MediCare Tchad
 * Usage: node scripts/verify-api.js [baseUrl]
 */
const BASE = process.argv[2] || 'http://localhost:4000/api/v1';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function run() {
  const results = [];
  const ok = (name, cond) => results.push({ name, pass: !!cond });

  const health = await request('GET', '/health');
  ok('Health check', health.status === 200 && health.data.status === 'ok');

  const login = await request('POST', '/auth/login', {
    email: 'patient@medicare-td.test',
    password: 'Patient@123',
    expectedRole: 'PATIENT',
  });
  ok('Login patient (portail patient)', login.status === 200 && login.data.accessToken);
  const patientToken = login.data.accessToken;

  const wrongPortal = await request('POST', '/auth/login', {
    email: 'patient@medicare-td.test',
    password: 'Patient@123',
    expectedRole: 'ADMIN',
  });
  ok('Refus patient sur portail admin', wrongPortal.status === 403);

  const patientOnAssistant = await request('POST', '/auth/login', {
    email: 'patient@medicare-td.test',
    password: 'Patient@123',
    expectedRole: 'ASSISTANT',
  });
  ok('Refus patient sur portail assistant', patientOnAssistant.status === 403);

  const assistantLogin = await request('POST', '/auth/login', {
    email: 'assistant1@medicare-td.test',
    password: 'Admin@123',
    expectedRole: 'ASSISTANT',
  });
  ok('Login assistant (portail assistant)', assistantLogin.status === 200);
  const assistantToken = assistantLogin.data.accessToken;

  const adminLogin = await request('POST', '/auth/login', {
    email: 'admin@medicare-td.test',
    password: 'Admin@123',
    expectedRole: 'ADMIN',
  });
  ok('Login admin (portail admin)', adminLogin.status === 200);
  const adminToken = adminLogin.data.accessToken;

  const superLogin = await request('POST', '/auth/login', {
    email: 'superadmin@medicare-td.test',
    password: 'Admin@123',
    expectedRole: 'SUPER_ADMIN',
  });
  ok('Login super admin', superLogin.status === 200);
  const superToken = superLogin.data.accessToken;

  const csvRes = await fetch(`${BASE}/dashboard/export/appointments`, {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  ok('Export CSV super-admin', csvRes.status === 200 && (csvRes.headers.get('content-type') || '').includes('text/csv'));

  const doctors = await request('GET', '/doctors', null, patientToken);
  ok('Liste médecins', doctors.status === 200 && doctors.data.data?.length > 0);
  ok('Photos médecins', doctors.data.data?.some((d) => d.photoUrl));

  const doctor = doctors.data.data?.[0];
  ok('Médecin disponible pour tests RDV', !!doctor);
  if (!doctor) {
    console.log('\n=== Résultats vérification API ===\n');
    let passed = 0;
    for (const r of results) {
      console.log(`${r.pass ? 'PASS' : 'FAIL'} - ${r.name}`);
      if (r.pass) passed++;
    }
    console.log(`\n${passed}/${results.length} tests passés`);
    process.exit(1);
  }
  const doctorId = doctor.id;
  const estId = doctor.establishments?.[0]?.establishment?.id;
  let bookDate = null;
  let bookTime = null;
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + i);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    const dateStr = d.toISOString().slice(0, 10);
    const slotsRes = await request('GET', `/doctors/${doctorId}/slots?date=${dateStr}`, null, patientToken);
    if (slotsRes.status === 200 && slotsRes.data.slots?.length > 0) {
      bookDate = dateStr;
      bookTime = slotsRes.data.slots[slotsRes.data.slots.length - 1];
      break;
    }
  }
  ok('Créneaux médecin (jour ouvré)', bookDate && bookTime);
  if (bookDate) {
    const slotDetailsRes = await request('GET', `/doctors/${doctorId}/slots?date=${bookDate}`, null, patientToken);
    ok('Créneaux avec statut', slotDetailsRes.status === 200
      && Array.isArray(slotDetailsRes.data.slotDetails)
      && slotDetailsRes.data.slotDetails.some((s) => s.status));
  } else {
    ok('Créneaux avec statut', false);
  }

  const book = await request('POST', '/appointments', {
    doctorId,
    establishmentId: estId,
    date: bookDate,
    startTime: bookTime,
    reason: 'Test verify-api',
  }, patientToken);
  ok('Réservation patient', book.status === 201 && book.data.id);

  const cities = await request('GET', '/users/cities');
  ok('Liste villes', cities.status === 200 && cities.data.length >= 11);

  const map = await request('GET', '/establishments/map');
  ok('Carte établissements', map.status === 200 && map.data.length > 0);

  const labs = await request('GET', '/establishments?type=LABORATOIRE');
  ok('Laboratoires', labs.status === 200 && labs.data.length >= 6);
  ok('Laboratoires avec parent', labs.data.some((l) => l.parentEstablishment));

  const appts = await request('GET', '/appointments/mine', null, patientToken);
  ok('Mes rendez-vous', appts.status === 200);

  const pendingAppts = await request('GET', '/appointments/mine?status=PENDING', null, patientToken);
  ok('RDV filtrés PENDING', pendingAppts.status === 200 && Array.isArray(pendingAppts.data.data ?? pendingAppts.data));

  const profilePatch = await request('PATCH', '/patients/profile', { phone: '+23566999999' }, patientToken);
  ok('Mise à jour téléphone patient', profilePatch.status === 200);

  const phoneConflict = await request('PATCH', '/patients/profile', { phone: '+23566100001' }, patientToken);
  ok('Refus téléphone déjà utilisé', phoneConflict.status === 409);

  const messages = await request('GET', '/messages', null, patientToken);
  ok('Messages patient', messages.status === 200 && messages.data.length > 0);

  const msgPost = await request('POST', '/messages', {
    receiverId: (await request('GET', '/messages/contacts', null, patientToken)).data[0]?.id,
    content: 'Test API verify',
  }, patientToken);
  ok('Envoi message', msgPost.status === 201 || msgPost.status === 200);

  const assistantStats = await request('GET', '/appointments/assistant/stats', null, assistantToken);
  ok('Stats assistant (3 métriques)', assistantStats.status === 200
    && assistantStats.data.pending !== undefined
    && assistantStats.data.confirmed !== undefined
    && assistantStats.data.totalPatients !== undefined);

  const myDoctor = await request('GET', '/users/assistant/my-doctor', null, assistantToken);
  ok('Mon médecin assistant', myDoctor.status === 200 && myDoctor.data?.user);

  const tomorrowSlots = await request('GET', '/appointments/assistant/tomorrow-slots', null, assistantToken);
  ok('Planning demain assistant', tomorrowSlots.status === 200 && Array.isArray(tomorrowSlots.data.slots));

  const saveSlots = await request('PUT', '/appointments/assistant/tomorrow-slots', {
    slots: (tomorrowSlots.data.slots || []).map((s) => ({
      time: s.time,
      available: s.available,
    })),
  }, assistantToken);
  ok('Enregistrer planning demain', saveSlots.status === 200 && saveSlots.data.saved);

  const assistantContacts = await request('GET', '/messages/contacts', null, assistantToken);
  ok('Contacts assistant (patients)', assistantContacts.status === 200 && assistantContacts.data.length > 0);

  const schedules = await request('GET', '/schedules', null, assistantToken);
  ok('Horaires assistant', schedules.status === 200 && Array.isArray(schedules.data));
  if (schedules.data.length > 0) {
    const patchSched = await request('PATCH', `/schedules/${schedules.data[0].id}`, {
      dayOfWeek: schedules.data[0].dayOfWeek,
      startTime: schedules.data[0].startTime,
      endTime: schedules.data[0].endTime,
      slotDuration: schedules.data[0].slotDuration,
    }, assistantToken);
    ok('PATCH horaire récurrent', patchSched.status === 200);
  } else {
    ok('PATCH horaire récurrent', true);
  }

  const stats = await request('GET', '/dashboard/stats', null, adminToken);
  ok('Dashboard stats admin', stats.status === 200 && stats.data.totalDoctors > 0 && stats.data.totalLaboratories >= 6);
  ok('Graphique entités', stats.data.entityOverview?.length >= 6);

  const chat = await request('POST', '/chatbot/chat', { message: 'Comment prendre un RDV ?' }, patientToken);
  ok('Chatbot', chat.status === 200 && chat.data.reply);

  console.log('\n=== Résultats vérification API ===\n');
  let passed = 0;
  for (const r of results) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'} - ${r.name}`);
    if (r.pass) passed++;
  }
  console.log(`\n${passed}/${results.length} tests passés`);
  if (passed < results.length) process.exit(1);
}

run().catch((e) => {
  console.error('Erreur:', e.message);
  console.error('Assurez-vous que MySQL est démarré, les migrations appliquées, le seed exécuté, et l\'API lancée.');
  process.exit(1);
});
