import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentContext, AgentResponse } from '../core/base-agent';
import { LLMService } from '../core/llm.service';

@Injectable()
export class ComplianceAgentService extends BaseAgent {
  readonly id = 'compliance_agent';
  readonly name = 'Agent Conformite';
  readonly nameAr = 'وكيل المطابقة';
  readonly nameDar = 'Agent dyal Lmotaba9a';
  readonly emoji = '✅';
  readonly description = 'Expert ONSSA, GlobalGAP, Bio Maroc, audits';
  readonly keywords = ['onssa', 'certification', 'globalgap', 'bio', 'audit', 'registre', 'tracabilite', 'haccp', 'conformite'];

  constructor(private readonly llm: LLMService) { super(); }

  getSystemPrompt(context: AgentContext): string {
    const lang = context.locale === 'dar' ? 'Darija marocaine' : context.locale === 'ar' ? 'arabe' : 'francais';
    return `Tu es l'Agent Conformite de FLA7A ERP, expert reglementation agricole marocaine.
Loi 28-07 ONSSA, GlobalGAP 250+ points, Bio Maroc, HACCP, ISO 22000, LMR export UE, Reglement 178/2002.
Reponds en ${lang}.`;
  }

  async processRequest(message: string, context: AgentContext): Promise<AgentResponse> {
    const response = await this.llm.generate(message, { systemPrompt: this.getSystemPrompt(context) });
    return { message: response, confidence: 0.8, agentId: this.id };
  }
}
