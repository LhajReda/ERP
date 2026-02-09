import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class LLMService {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({ apiKey: this.config.get('ANTHROPIC_API_KEY') });
    this.model = this.config.get('LLM_MODEL') || 'claude-sonnet-4-20250514';
  }

  async generate(prompt: string, options?: { systemPrompt?: string; history?: any[]; maxTokens?: number; temperature?: number }): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens || 2048,
      system: options?.systemPrompt,
      messages: [...(options?.history || []), { role: 'user' as const, content: prompt }],
      temperature: options?.temperature || 0.3,
    });
    return response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  }

  async generateJSON<T = any>(prompt: string): Promise<T> {
    const response = await this.generate(prompt + '\n\nReponds UNIQUEMENT en JSON valide, sans backticks.', { temperature: 0.1 });
    return JSON.parse(response.replace(/```json\n?|```/g, '').trim());
  }
}
