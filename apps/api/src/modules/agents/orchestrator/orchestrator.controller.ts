import { randomUUID } from 'node:crypto';
import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../../common/decorators/tenant.decorator';
import { OrchestratorService } from './orchestrator.service';
import { ChatMessageDto } from './dto/chat-message.dto';

type AuthUser = {
  id: string;
  language?: string;
  role?: string;
};

const normalizeLocale = (value?: string): 'fr' | 'ar' | 'dar' => {
  if (value === 'ar' || value === 'dar') return value;
  return 'fr';
};

@ApiTags('AI Agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class OrchestratorController {
  constructor(private readonly orchestrator: OrchestratorService) {}

  @Post()
  @ApiOperation({ summary: 'Envoyer un message au systeme d\'agents IA' })
  async chat(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ChatMessageDto,
  ) {
    const conversationId = dto.conversationId || `conv_${randomUUID().replace(/-/g, '')}`;
    const locale = normalizeLocale(dto.locale || user.language);

    return this.orchestrator.chat(dto.message, conversationId, {
      tenantId,
      userId: user.id,
      farmId: dto.farmId,
      locale,
      userRole: user.role || '',
    });
  }

  @Get('agents')
  @ApiOperation({ summary: 'Liste des agents disponibles' })
  getAgents() {
    return this.orchestrator.getAvailableAgents();
  }

  @Get('history/:conversationId')
  @ApiOperation({ summary: 'Historique conversation' })
  getHistory(
    @Param('conversationId') conversationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.orchestrator.getHistory(conversationId, userId);
  }
}
