import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentContext, AgentResponse } from '../core/base-agent';
import { LLMService } from '../core/llm.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AgroAgent extends BaseAgent {
  readonly id = 'agro_agent';
  readonly name = 'Agent Agronomie';
  readonly nameAr = 'وكيل الزراعة';
  readonly nameDar = 'Agent dyal Zri3a';
  readonly emoji = '🌱';
  readonly description = 'Expert en cultures, parcelles, irrigation, maladies et rendement';
  readonly keywords = [
    'parcelle', 'culture', 'semis', 'recolte', 'irrigation', 'maladie', 'traitement',
    'engrais', 'labour', 'taille', 'rendement', 'zre3', 'l7ssad', 'ssgi', 'ssmed',
    'ddwa', '9it3a', 'plantation', 'variete', 'sol', 'fertilisation', 'cycle',
    'campagne', 'saison', 'semer', 'planter', 'arroser', 'recolter',
  ];

  constructor(
    private readonly llm: LLMService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  getSystemPrompt(context: AgentContext): string {
    const lang = context.locale === 'dar' ? 'Darija marocaine naturelle' : context.locale === 'ar' ? 'arabe' : 'francais';
    return `Tu es l'Agent Agronomie de FLA7A ERP, expert en agriculture marocaine.
Tu connais les zones agro-climatiques du Maroc, les varietes locales, les calendriers culturaux par region.
Tu conseilles sur les cultures, l'irrigation, les traitements phyto, la fertilisation et la prediction de rendement.
References: INRA Maroc, ONSSA, programme Plan Maroc Vert / Generation Green.
Reponds en ${lang}. Sois precis et pratique. Donne des chiffres concrets.
Si en Darija, utilise un langage naturel (ex: "Khassek tsgi lbrtqal 3 merrat f simana").`;
  }

  async processRequest(message: string, context: AgentContext): Promise<AgentResponse> {
    // Get farm data for context
    let farmData = '';
    if (context.farmId) {
      const farm = await this.prisma.farm.findUnique({
        where: { id: context.farmId },
        include: {
          parcels: { include: { cultureCycles: { where: { status: 'EN_COURS' }, take: 5 } } },
        },
      });
      if (farm) {
        farmData = `\nDonnees exploitation: ${farm.name}, Region: ${farm.region}, ${farm.totalArea} ha, ${farm.waterSource}.
Parcelles: ${farm.parcels.map((p: any) => `${p.name} (${p.area}ha, ${p.soilType}, ${p.status})`).join(', ')}
Cycles en cours: ${farm.parcels.flatMap((p: any) => p.cultureCycles.map((c: any) => `${c.cropType} - ${c.variety}`)).join(', ') || 'aucun'}`;
      }
    }

    const response = await this.llm.generate(message, {
      systemPrompt: this.getSystemPrompt(context) + farmData,
      temperature: 0.3,
    });

    return {
      message: response,
      confidence: 0.85,
      agentId: this.id,
    };
  }
}
