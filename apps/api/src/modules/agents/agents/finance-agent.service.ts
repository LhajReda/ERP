import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentContext, AgentResponse } from '../core/base-agent';
import { LLMService } from '../core/llm.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class FinanceAgent extends BaseAgent {
  readonly id = 'finance_agent';
  readonly name = 'Agent Finance';
  readonly nameAr = 'وكيل المالية';
  readonly nameDar = 'Agent dyal Lflous';
  readonly emoji = '💰';
  readonly description = 'Expert en comptabilite PCGE, TVA, factures DGI, tresorerie';
  readonly keywords = [
    'facture', 'paiement', 'depense', 'recette', 'tva', 'comptabilite', 'tresorerie',
    'bilan', 'rentabilite', 'is', 'impot', 'faktura', 'flous', 'msaref', 'dakhel',
    'kharj', 'rib7', 'prix', 'cout', 'benefice', 'perte', 'credit', 'debit',
  ];

  constructor(private readonly llm: LLMService, private readonly prisma: PrismaService) { super(); }

  getSystemPrompt(context: AgentContext): string {
    const lang = context.locale === 'dar' ? 'Darija marocaine' : context.locale === 'ar' ? 'arabe' : 'francais';
    return `Tu es l'Agent Finance de FLA7A ERP, expert comptabilite agricole marocaine.
PCGE marocain, TVA agricole (0/7/10/14/20%), IS agricole exonere si CA < 5M MAD.
CNSS: salarie 4.48%, employeur 8.98%, plafond 6000 MAD. AMO: salarie 2.26%, employeur 4.11%.
Facturation conforme DGI. Devise: MAD (Dirham). Reponds en ${lang}.`;
  }

  async processRequest(message: string, context: AgentContext): Promise<AgentResponse> {
    let financeData = '';
    if (context.farmId) {
      const accounts = await this.prisma.bankAccount.findMany({ where: { farmId: context.farmId } });
      const unpaidInvoices = await this.prisma.invoice.count({ where: { farmId: context.farmId, status: { in: ['VALIDEE', 'ENVOYEE', 'PARTIELLEMENT_PAYEE'] } } });
      financeData = `\nComptes: ${accounts.map((a: any) => `${a.bankName}: ${a.balance} MAD`).join(', ')}. Factures impayees: ${unpaidInvoices}.`;
    }
    const response = await this.llm.generate(message, { systemPrompt: this.getSystemPrompt(context) + financeData });
    return { message: response, confidence: 0.85, agentId: this.id };
  }
}
