export interface AgentContext {
  tenantId: string;
  userId: string;
  farmId: string;
  locale: 'fr' | 'ar' | 'dar';
  conversationId: string;
  userRole: string;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any, context: AgentContext) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface AgentResponse {
  message: string;
  data?: any;
  actions?: AgentAction[];
  confidence: number;
  agentId: string;
}

export interface AgentAction {
  type: 'navigate' | 'create' | 'update' | 'export' | 'notify';
  label: string;
  route?: string;
  payload?: any;
}

export abstract class BaseAgent {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly nameAr: string;
  abstract readonly nameDar: string;
  abstract readonly emoji: string;
  abstract readonly description: string;
  abstract readonly keywords: string[];

  abstract getSystemPrompt(context: AgentContext): string;
  abstract processRequest(message: string, context: AgentContext): Promise<AgentResponse>;

  getRelevanceScore(message: string): number {
    const lower = message.toLowerCase();
    const matches = this.keywords.filter((kw) => lower.includes(kw));
    return matches.length / Math.max(this.keywords.length, 1);
  }
}
