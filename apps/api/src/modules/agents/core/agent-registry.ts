import { Injectable } from '@nestjs/common';
import { BaseAgent } from './base-agent';

@Injectable()
export class AgentRegistry {
  private agents: Map<string, BaseAgent> = new Map();

  register(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
  }

  get(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  getAll(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  findBestAgent(message: string): { agent: BaseAgent; score: number } | null {
    const scored = this.getAll()
      .map((agent) => ({ agent, score: agent.getRelevanceScore(message) }))
      .sort((a, b) => b.score - a.score);
    return scored[0]?.score > 0.1 ? scored[0] : null;
  }

  getAgentList() {
    return this.getAll().map((a) => ({
      id: a.id,
      name: a.name,
      nameAr: a.nameAr,
      nameDar: a.nameDar,
      emoji: a.emoji,
      description: a.description,
    }));
  }
}
