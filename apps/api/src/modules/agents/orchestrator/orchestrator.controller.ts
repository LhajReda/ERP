import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../../common/decorators/tenant.decorator';
import { OrchestratorService } from './orchestrator.service';

class ChatMessageDto {
  message: string;
  conversationId: string;
  farmId: string;
  locale?: string;
}

@ApiTags('AI Agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class OrchestratorController {
  constructor(private readonly orchestrator: OrchestratorService) {}

  @Post()
  @ApiOperation({ summary: 'Envoyer un message au systeme d\'agents IA' })
  async chat(@CurrentTenant() tenantId: string, @CurrentUser() user: any, @Body() dto: ChatMessageDto) {
    return this.orchestrator.chat(dto.message, dto.conversationId, {
      tenantId,
      userId: user.id,
      farmId: dto.farmId,
      locale: (dto.locale || user.language || 'fr') as any,
      userRole: user.role,
    });
  }

  @Get('agents')
  @ApiOperation({ summary: 'Liste des agents disponibles' })
  getAgents() {
    return this.orchestrator.getAvailableAgents();
  }

  @Get('history/:conversationId')
  @ApiOperation({ summary: 'Historique conversation' })
  getHistory(@Param('conversationId') id: string) {
    return this.orchestrator.getHistory(id);
  }
}
