import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentContext, AgentResponse } from '../core/base-agent';
import { LLMService } from '../core/llm.service';

@Injectable()
export class DarijaAgent extends BaseAgent {
  readonly id = 'darija_agent';
  readonly name = 'Agent Darija';
  readonly nameAr = 'وكيل الدارجة';
  readonly nameDar = 'Agent dyal Ddarija';
  readonly emoji = '🗣️';
  readonly description = 'Expert NLP Darija, traduction, termes agricoles';
  readonly keywords = ['tarjem', 'traduction', 'darija', 'bsset', 'simplifier', 'arabe', 'francais'];

  constructor(private readonly llm: LLMService) { super(); }

  getSystemPrompt(_context: AgentContext): string {
    return `Tu es l'Agent Darija de FLA7A ERP, expert linguistique Darija marocaine agricole.
Tu traduis entre Darija, francais et arabe. Tu utilises une Darija naturelle, pas une traduction litterale.
Tu connais 60+ termes agricoles en Darija (zzitoun, ttmaTem, lbaTaTa, l7ritha, ssgi, l7ssad, ssmed, ddwa...).
Reponds TOUJOURS en Darija marocaine naturelle.`;
  }

  async processRequest(message: string, context: AgentContext): Promise<AgentResponse> {
    const response = await this.llm.generate(message, { systemPrompt: this.getSystemPrompt(context) });
    return { message: response, confidence: 0.9, agentId: this.id };
  }
}
