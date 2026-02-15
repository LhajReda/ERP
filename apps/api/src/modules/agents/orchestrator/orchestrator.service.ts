import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { AgentRegistry } from '../core/agent-registry';
import { LLMService } from '../core/llm.service';
import { AgentContext, AgentResponse } from '../core/base-agent';
import { PrismaService } from '../../../prisma/prisma.service';

type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentId?: string;
};

const MAX_CONVERSATION_MESSAGES = 50;
const MAX_CHAT_MESSAGE_LENGTH = 2000;

const normalizeMessages = (value: unknown): ConversationMessage[] => {
  if (!Array.isArray(value)) return [];
  const normalized: ConversationMessage[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) continue;
    const entry = item as Record<string, unknown>;
    if (entry.role !== 'user' && entry.role !== 'assistant') continue;
    if (typeof entry.content !== 'string') continue;

    const rawDate =
      entry.timestamp instanceof Date
        ? entry.timestamp
        : typeof entry.timestamp === 'string'
          ? new Date(entry.timestamp)
          : new Date();
    const timestamp = Number.isNaN(rawDate.getTime()) ? new Date() : rawDate;
    const normalizedEntry: ConversationMessage = {
      role: entry.role,
      content: entry.content,
      timestamp,
      ...(typeof entry.agentId === 'string' ? { agentId: entry.agentId } : {}),
    };
    normalized.push(normalizedEntry);
  }
  return normalized;
};

@Injectable()
export class OrchestratorService {
  constructor(
    private readonly registry: AgentRegistry,
    private readonly llm: LLMService,
    private readonly prisma: PrismaService,
  ) {}

  async chat(message: string, conversationId: string, context: Partial<AgentContext>) {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
      throw new BadRequestException('Le message ne peut pas etre vide.');
    }
    if (normalizedMessage.length > MAX_CHAT_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Le message depasse la limite autorisee (${MAX_CHAT_MESSAGE_LENGTH} caracteres).`,
      );
    }

    const fullContext: AgentContext = {
      tenantId: context.tenantId || '',
      userId: context.userId || '',
      farmId: context.farmId || '',
      locale: (context.locale as 'fr' | 'ar' | 'dar') || 'fr',
      conversationId,
      userRole: context.userRole || '',
    };

    // Find best agent by keyword matching
    const bestMatch = this.registry.findBestAgent(normalizedMessage);
    if (!bestMatch) {
      return this.handleGeneralQuery(normalizedMessage, fullContext);
    }

    // Execute agent
    const response = await bestMatch.agent.processRequest(
      normalizedMessage,
      fullContext,
    );

    // Save to conversation history
    await this.saveMessage(
      conversationId,
      fullContext.userId,
      fullContext.farmId,
      normalizedMessage,
      response,
    );

    return {
      message: response.message,
      data: response.data,
      actions: response.actions,
      agentUsed: {
        id: bestMatch.agent.id,
        name: bestMatch.agent.name,
        emoji: bestMatch.agent.emoji,
      },
      confidence: response.confidence,
    };
  }

  private async handleGeneralQuery(message: string, context: AgentContext) {
    const response = await this.llm.generate(message, {
      systemPrompt: `Tu es l'assistant FLA7A ERP, un ERP agricole marocain. Reponds en ${context.locale === 'dar' ? 'Darija marocaine' : context.locale === 'ar' ? 'arabe' : 'francais'}. Sois concis et utile.`,
    });
    return { message: response, agentUsed: null, confidence: 0.5 };
  }

  private async saveMessage(
    conversationId: string,
    userId: string,
    farmId: string,
    userMessage: string,
    response: AgentResponse,
  ) {
    const existing = await this.prisma.agentConversation.findUnique({ where: { conversationId } });
    const newMessages: ConversationMessage[] = [
      { role: 'user', content: userMessage, timestamp: new Date() },
      { role: 'assistant', content: response.message, agentId: response.agentId, timestamp: new Date() },
    ];

    if (existing) {
      if (existing.userId !== userId) {
        throw new ForbiddenException(
          'Conversation reservee a son proprietaire.',
        );
      }
      const messages = [
        ...normalizeMessages(existing.messages),
        ...newMessages,
      ].slice(-MAX_CONVERSATION_MESSAGES);
      await this.prisma.agentConversation.update({
        where: { conversationId },
        data: { messages, lastAgentId: response.agentId },
      });
    } else {
      await this.prisma.agentConversation.create({
        data: { conversationId, userId, farmId, messages: newMessages, lastAgentId: response.agentId },
      });
    }
  }

  getAvailableAgents() {
    return this.registry.getAgentList();
  }

  async getHistory(conversationId: string, userId: string) {
    const conv = await this.prisma.agentConversation.findUnique({ where: { conversationId } });
    if (!conv) return [];
    if (conv.userId !== userId) {
      throw new ForbiddenException(
        'Acces refuse a cette conversation.',
      );
    }
    return normalizeMessages(conv.messages);
  }
}
