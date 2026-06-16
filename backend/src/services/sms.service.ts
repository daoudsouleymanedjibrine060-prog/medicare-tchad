import AfricasTalking from 'africastalking';
import { env } from '../config/env';
import { logger } from '../config/logger';

class SmsService {
  private sms: { send: (opts: { to: string[]; message: string; from?: string }) => Promise<unknown> } | null = null;

  private init() {
    if (!env.SMS_ENABLED || !env.AFRICASTALKING_USERNAME || !env.AFRICASTALKING_API_KEY) {
      return null;
    }
    if (!this.sms) {
      const client = AfricasTalking({
        apiKey: env.AFRICASTALKING_API_KEY,
        username: env.AFRICASTALKING_USERNAME,
      });
      this.sms = client.SMS;
    }
    return this.sms;
  }

  async send(phone: string, message: string) {
    const sms = this.init();
    if (!sms) {
      logger.info('SMS disabled or not configured', { phone, message: message.slice(0, 50) });
      return { simulated: true };
    }
    return sms.send({
      to: [phone],
      message,
      from: env.AFRICASTALKING_SENDER_ID,
    });
  }

  appointmentConfirmed(params: { phone: string; doctorName: string; date: string; time: string; ref: string }) {
    return this.send(
      params.phone,
      `MediCare Tchad : Votre RDV avec Dr. ${params.doctorName} le ${params.date} à ${params.time} est confirmé. Réf: ${params.ref}`
    );
  }

  appointmentRejected(params: { phone: string; doctorName: string; date: string; reason?: string }) {
    return this.send(
      params.phone,
      `MediCare Tchad : Votre demande de RDV avec Dr. ${params.doctorName} le ${params.date} a été refusée.${params.reason ? ' Motif: ' + params.reason : ''}`
    );
  }

  appointmentReminder(params: { phone: string; doctorName: string; date: string; time: string }) {
    return this.send(
      params.phone,
      `MediCare Tchad : Rappel - RDV demain avec Dr. ${params.doctorName} le ${params.date} à ${params.time}.`
    );
  }

  appointmentCancelled(params: { phone: string; doctorName: string; date: string }) {
    return this.send(
      params.phone,
      `MediCare Tchad : Votre RDV avec Dr. ${params.doctorName} le ${params.date} a été annulé.`
    );
  }
}

export const smsService = new SmsService();
