import { Injectable } from '@nestjs/common';
import { AgentRegistry } from '../core/agent-registry';
import { LLMService } from '../core/llm.service';
import { AgentContext, AgentResponse } from '../core/base-agent';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class OrchestratorService {
  constructor(
    private readonly registry: AgentRegistry,
    private readonly llm: LLMService,
    private readonly prisma: PrismaService,
  ) {}

  async chat(message: string, conversationId: string, context: Partial<AgentContext>) {
    const fullContext: AgentContext = {
      tenantId: context.tenantId || '',
      userId: context.userId || '',
      farmId: context.farmId || '',
      locale: (context.locale as 'fr' | 'ar' | 'dar') || 'fr',
      conversationId,
      userRole: context.userRole || '',
    };

    // Find best agent by keyword matching
    const bestMatch = this.registry.findBestAgent(message);
    if (!bestMatch) {
      return this.handleGeneralQuery(message, fullContext);
    }

    // Execute agent
    const response = await bestMatch.agent.processRequest(message, fullContext);

    // Save to conversation history
    await this.saveMessage(conversationId, fullContext.userId, fullContext.farmId, message, response);

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

  private async saveMessage(conversationId: string, userId: string, farmId: string, userMessage: string, response: AgentResponse) {
    const existing = await this.prisma.agentConversation.findUnique({ where: { conversationId } });
    const newMessages = [
      { role: 'user', content: userMessage, timestamp: new Date() },
      { role: 'assistant', content: response.message, agentId: response.agentId, timestamp: new Date() },
    ];

    if (existing) {
      const messages = [...(existing.messages as any[]), ...newMessages].slice(-50);
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

  async getHistory(conversationId: string) {
    const conv = await this.prisma.agentConversation.findUnique({ where: { conversationId } });
    return conv?.messages || [];
  }
}
