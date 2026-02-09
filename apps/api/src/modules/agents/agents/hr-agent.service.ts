import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentContext, AgentResponse } from '../core/base-agent';
import { LLMService } from '../core/llm.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class HRAgent extends BaseAgent {
  readonly id = 'hr_agent';
  readonly name = 'Agent RH';
  readonly nameAr = 'وكيل الموارد البشرية';
  readonly nameDar = 'Agent dyal L3ommal';
  readonly emoji = '👷';
  readonly description = 'Expert RH, paie CNSS, pointage, code du travail';
  readonly keywords = [
    'employe', 'ouvrier', 'pointage', 'salaire', 'paie', 'cnss', 'conge', 'contrat',
    'kheddam', '3ammel', 'lkhlass', 'smag', 'heures', 'presence', 'absence', 'bulletin',
  ];

  constructor(private readonly llm: LLMService, private readonly prisma: PrismaService) { super(); }

  getSystemPrompt(context: AgentContext): string {
    const lang = context.locale === 'dar' ? 'Darija marocaine' : context.locale === 'ar' ? 'arabe' : 'francais';
    return `Tu es l'Agent RH de FLA7A ERP, expert droit du travail agricole marocain.
SMAG 2026: 84.37 MAD/jour (8h). CNSS: salarie 4.48%, employeur 8.98%, plafond 6000 MAD.
AMO: salarie 2.26%, employeur 4.11%. Heures sup: +25% jour, +50% nuit/weekend, +100% nuit weekend.
Code du travail: conges payes 1.5j/mois, jours feries payes, preavis selon anciennete.
Reponds en ${lang}.`;
  }

  async processRequest(message: string, context: AgentContext): Promise<AgentResponse> {
    let hrData = '';
    if (context.farmId) {
      const [empCount, todayPresent] = await Promise.all([
        this.prisma.employee.count({ where: { farmId: context.farmId, isActive: true } }),
        this.prisma.attendance.count({ where: { employee: { farmId: context.farmId }, date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, status: 'PRESENT' } }),
      ]);
      hrData = `\nEmployes actifs: ${empCount}. Presents aujourd'hui: ${todayPresent}.`;
    }
    const response = await this.llm.generate(message, { systemPrompt: this.getSystemPrompt(context) + hrData });
    return { message: response, confidence: 0.85, agentId: this.id };
  }
}
