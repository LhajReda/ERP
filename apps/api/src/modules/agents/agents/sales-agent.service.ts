import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentContext, AgentResponse } from '../core/base-agent';
import { LLMService } from '../core/llm.service';

@Injectable()
export class SalesAgent extends BaseAgent {
  readonly id = 'sales_agent';
  readonly name = 'Agent Ventes';
  readonly nameAr = 'وكيل المبيعات';
  readonly nameDar = 'Agent dyal Lbi3';
  readonly emoji = '🛒';
  readonly description = 'Expert ventes, clients, prix marche, export';
  readonly keywords = ['client', 'vente', 'commande', 'prix', 'marche', 'export', 'zboun', 'bi3', 'soum', 'souq'];

  constructor(private readonly llm: LLMService) { super(); }

  getSystemPrompt(context: AgentContext): string {
    const lang = context.locale === 'dar' ? 'Darija marocaine' : context.locale === 'ar' ? 'arabe' : 'francais';
    return `Tu es l'Agent Ventes de FLA7A ERP, expert marches agricoles marocains.
Tu connais les marches de gros (Casa, Agadir, Meknes), l'export GlobalGAP, EUR1, incoterms.
Reponds en ${lang}.`;
  }

  async processRequest(message: string, context: AgentContext): Promise<AgentResponse> {
    const response = await this.llm.generate(message, { systemPrompt: this.getSystemPrompt(context) });
    return { message: response, confidence: 0.8, agentId: this.id };
  }
}
