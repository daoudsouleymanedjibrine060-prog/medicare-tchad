import OpenAI from 'openai';
import { ChatRole } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/database';

const SYSTEM_PROMPT = `Tu es l'assistant virtuel de MediCare Tchad, une plateforme de prise de rendez-vous médicaux au Tchad.
Réponds toujours en français, de manière claire et bienveillante.
Contexte local :
- Indicatif téléphonique : +235
- Villes principales : N'Djamena, Moundou, Sarh, Abéché, Doba, Bongor, Mongo, Pala, Faya-Largeau, Am-Timan, Massaguet
- Établissements clés : HGRN (Hôpital Général de Référence National), HME (Hôpital de la Mère et de l'Enfant), CHU Moundou
- Laboratoires : Laboratoire National de Santé Publique, Laboratoire Biomédical du Tchad, laboratoires provinciaux
- En cas d'urgence médicale, oriente vers le HGRN ou l'hôpital le plus proche
- Tu peux aider à : comprendre la plateforme, rechercher des spécialités, localiser laboratoires et établissements, expliquer comment prendre un RDV
- Ne pose jamais de diagnostic médical. Recommande toujours de consulter un professionnel de santé.
- Sois concis pour les connexions Internet lentes.`;

class ChatbotService {
  private client: OpenAI | null = null;

  private getClient() {
    if (!env.OPENAI_API_KEY) return null;
    if (!this.client) {
      this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }
    return this.client;
  }

  async chat(userId: string, message: string, sessionId: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.chatMessage.count({
      where: { userId, role: ChatRole.USER, createdAt: { gte: oneHourAgo } },
    });
    if (recentCount >= 20) {
      throw new Error('Limite de messages atteinte. Réessayez dans une heure.');
    }

    await prisma.chatMessage.create({
      data: { userId, role: ChatRole.USER, content: message, sessionId },
    });

    const history = await prisma.chatMessage.findMany({
      where: { userId, sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const client = this.getClient();
    let reply: string;

    if (!client) {
      reply = this.fallbackReply(message);
    } else {
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.map((m) => ({
            role: m.role === ChatRole.USER ? ('user' as const) : ('assistant' as const),
            content: m.content,
          })),
        ],
        max_tokens: 400,
        temperature: 0.7,
      });
      reply = completion.choices[0]?.message?.content ?? this.fallbackReply(message);
    }

    await prisma.chatMessage.create({
      data: { userId, role: ChatRole.ASSISTANT, content: reply, sessionId },
    });

    return { reply, sessionId };
  }

  private fallbackReply(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('rendez-vous') || lower.includes('rdv')) {
      return "Pour prendre un rendez-vous : connectez-vous, recherchez un médecin par spécialité ou ville, choisissez un créneau disponible et confirmez. L'assistant médical validera votre demande.";
    }
    if (lower.includes('urgence')) {
      return "En cas d'urgence médicale, contactez immédiatement l'hôpital le plus proche ou les services d'urgence. MediCare Tchad ne remplace pas les soins d'urgence.";
    }
    if (lower.includes('ndjamena') || lower.includes("n'djamena")) {
      return "N'Djamena compte le HGRN, le HME, l'Hôpital Amitié Tchado-Chinoise, des cliniques privées et des laboratoires (Laboratoire National de Santé Publique, Biomédical du Tchad). Utilisez la carte ou la page Laboratoires pour les localiser.";
    }
    if (lower.includes('laboratoire') || lower.includes('analyse')) {
      return "Consultez la page Laboratoires pour trouver un laboratoire d'analyses près de chez vous : N'Djamena, Moundou, Sarh, Abéché et autres villes. Vous pouvez aussi utiliser la carte pour obtenir l'itinéraire via Google Maps.";
    }
    return "Bonjour ! Je suis l'assistant MediCare Tchad. Je peux vous aider à prendre un rendez-vous, trouver un médecin ou localiser un établissement de santé. Comment puis-je vous aider ?";
  }

  async getHistory(userId: string, sessionId: string) {
    return prisma.chatMessage.findMany({
      where: { userId, sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }
}

export const chatbotService = new ChatbotService();
