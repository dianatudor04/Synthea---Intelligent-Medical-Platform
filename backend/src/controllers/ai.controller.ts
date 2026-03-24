import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { aiService } from '../services/ai.service';

// POST /api/ai/chat
export const chatWithBot = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message, sessionId, medicalContext } = req.body;
    if (!message) throw new ApiError(400, 'Message is required');

    // Get or create session
    let session = sessionId
      ? await prisma.aiChatSession.findUnique({ where: { id: sessionId } })
      : null;

    const messages = session ? (session.messages as Array<{ role: string; content: string; timestamp: string }>) : [];

    // Call AI service (OpenAI stub)
    const reply = await aiService.chat(message, messages);

    messages.push(
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: reply, timestamp: new Date().toISOString() }
    );

    if (session) {
      session = await prisma.aiChatSession.update({
        where: { id: session.id },
        data: { messages, ...(medicalContext ? { medicalContext } : {}) },
      });
    } else {
      session = await prisma.aiChatSession.create({
        data: { userId: req.user!.id, messages, medicalContext: medicalContext ?? undefined },
      });
    }

    res.json({ reply, sessionId: session.id });
  } catch (err) {
    next(err);
  }
};

// GET /api/ai/chat/history
export const getChatHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessions = await prisma.aiChatSession.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/triage
export const triageSymptoms = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { patientId, symptoms } = req.body;
    if (!symptoms || !Array.isArray(symptoms)) throw new ApiError(400, 'Symptoms array required');

    const triageResult = await aiService.triage(symptoms);

    const record = await prisma.triageRecord.create({
      data: {
        patientId,
        symptoms,
        triageLevel: triageResult.level,
        recommendedSpecialty: triageResult.specialty,
        aiConfidence: triageResult.confidence,
        reviewedByDoctorId: null,
      },
    });

    res.status(201).json({ triage: record, reasoning: triageResult.reasoning });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/decision-support
export const getDecisionSupport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { symptoms, medicalHistory, labResults } = req.body;

    const support = await aiService.clinicalDecisionSupport({ symptoms, medicalHistory, labResults });

    res.json(support);
  } catch (err) {
    next(err);
  }
};
