import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentContext, AgentResponse } from '../core/base-agent';
import { LLMService } from '../core/llm.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class StockAgent extends BaseAgent {
  readonly id = 'stock_agent';
  readonly name = 'Agent Stock';
  readonly nameAr = 'وكيل المخزون';
  readonly nameDar = 'Agent dyal Lmakhzoun';
  readonly emoji = '📦';
  readonly description = 'Expert gestion des stocks, intrants, fournisseurs';
  readonly keywords = [
    'stock', 'produit', 'intrant', 'commande', 'fournisseur', 'livraison', 'inventaire',
    'makhzoun', 'sla3a', 'semences', 'engrais', 'phyto', 'quantite', 'alerte',
  ];

  constructor(private readonly llm: LLMService, private readonly prisma: PrismaService) { super(); }

  getSystemPrompt(context: AgentContext): string {
    const lang = context.locale === 'dar' ? 'Darija marocaine' : context.locale === 'ar' ? 'arabe' : 'francais';
    return `Tu es l'Agent Stock de FLA7A ERP, expert intrants agricoles marocains.
Tu connais les semences, engrais (NPK, uree, DAP), produits phyto homologues ONSSA.
Tu geres les alertes stock bas, la tracabilite des lots, les DAI (delais avant intervention).
Reponds en ${lang}.`;
  }

  async processRequest(message: string, context: AgentContext): Promise<AgentResponse> {
    let stockData = '';
    if (context.farmId) {
      const lowStock = await this.prisma.product.findMany({
        where: { farmId: context.farmId, currentStock: { lte: 0 } },
        select: { name: true, currentStock: true, unit: true, minStock: true },
        take: 10,
      });
      if (lowStock.length > 0) {
        stockData = `\nAlertes stock bas: ${lowStock.map((p: any) => `${p.name}: ${p.currentStock} ${p.unit} (min: ${p.minStock})`).join(', ')}`;
      }
    }
    const response = await this.llm.generate(message, { systemPrompt: this.getSystemPrompt(context) + stockData });
    return { message: response, confidence: 0.85, agentId: this.id };
  }
}
