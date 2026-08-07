import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';
import { startReminderCron } from './services/cron.service';

import authRoutes from './modules/auth/auth.routes';
import patientsRoutes from './modules/patients/patients.routes';
import doctorsRoutes from './modules/doctors/doctors.routes';
import appointmentsRoutes from './modules/appointments/appointments.routes';
import schedulesRoutes from './modules/schedules/schedules.routes';
import establishmentsRoutes from './modules/establishments/establishments.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import chatbotRoutes from './modules/chatbot/chatbot.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import messagesRoutes from './modules/messages/messages.routes';
import usersRoutes from './modules/users/users.routes';

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 10 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez plus tard.' },
});

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MediCare Tchad API', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/patients', patientsRoutes);
app.use('/api/v1/doctors', doctorsRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/v1/schedules', schedulesRoutes);
app.use('/api/v1/establishments', establishmentsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/chatbot', chatbotRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/users', usersRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

async function start() {
  await connectDatabase();
  startReminderCron();
  app.listen(env.PORT, () => {
    logger.info(`MediCare Tchad API running on port ${env.PORT}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err });
  process.exit(1);
});

export default app;
