import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentContext, AgentResponse } from '../core/base-agent';
import { LLMService } from '../core/llm.service';

@Injectable()
export class WeatherAgent extends BaseAgent {
  readonly id = 'weather_agent';
  readonly name = 'Agent Meteo';
  readonly nameAr = 'وكيل الطقس';
  readonly nameDar = 'Agent dyal Jjow';
  readonly emoji = '🌤️';
  readonly description = 'Expert meteo, alertes, conseil irrigation';
  readonly keywords = ['meteo', 'pluie', 'temperature', 'vent', 'gel', 'chaleur', 'secheresse', 'chta', 's7ab', 'ri7', 'brd', 'jow'];

  constructor(private readonly llm: LLMService) { super(); }

  getSystemPrompt(context: AgentContext): string {
    const lang = context.locale === 'dar' ? 'Darija marocaine' : context.locale === 'ar' ? 'arabe' : 'francais';
    return `Tu es l'Agent Meteo de FLA7A ERP, expert zones agro-climatiques du Maroc.
Tu connais l'impact du chergui, gel, canicule sur les cultures. Tu conseilles sur l'irrigation et les fenetres de traitement.
Reponds en ${lang}.`;
  }

  async processRequest(message: string, context: AgentContext): Promise<AgentResponse> {
    const response = await this.llm.generate(message, { systemPrompt: this.getSystemPrompt(context) });
    return { message: response, confidence: 0.75, agentId: this.id };
  }
}
