import { ForbiddenException } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';

type RegistryMock = {
  findBestAgent: jest.Mock;
  getAgentList: jest.Mock;
};

type LlmMock = {
  generate: jest.Mock;
};

type PrismaMock = {
  agentConversation: {
    findUnique: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
  };
};

describe('OrchestratorService', () => {
  let service: OrchestratorService;
  let prisma: PrismaMock;

  beforeEach(() => {
    const registry: RegistryMock = {
      findBestAgent: jest.fn(),
      getAgentList: jest.fn(),
    };
    const llm: LlmMock = {
      generate: jest.fn(),
    };
    prisma = {
      agentConversation: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    };

    service = new OrchestratorService(
      registry as unknown as never,
      llm as unknown as never,
      prisma as unknown as never,
    );
  });

  it('returns empty history when conversation does not exist', async () => {
    prisma.agentConversation.findUnique.mockResolvedValue(null);

    const history = await service.getHistory('conv_unknown', 'user_1');

    expect(history).toEqual([]);
  });

  it('throws forbidden when reading another user conversation', async () => {
    prisma.agentConversation.findUnique.mockResolvedValue({
      conversationId: 'conv_123',
      userId: 'user_2',
      messages: [],
    });

    await expect(service.getHistory('conv_123', 'user_1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('normalizes malformed history payload to safe array', async () => {
    prisma.agentConversation.findUnique.mockResolvedValue({
      conversationId: 'conv_123',
      userId: 'user_1',
      messages: { invalid: true },
    });

    const history = await service.getHistory('conv_123', 'user_1');

    expect(history).toEqual([]);
  });
});
