import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Policies } from '../../common/decorators/policies.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PolicyGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @Policies('dashboard.kpi.read')
  @ApiOperation({ summary: 'KPIs du tableau de bord' })
  @ApiQuery({
    name: 'farmId',
    required: false,
    description: 'Identifiant de la ferme (optionnel). Si absent, la 1ere ferme du tenant est utilisee.',
  })
  getKPIs(
    @CurrentUser('tenantId') tenantId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.dashboardService.getKPIs(tenantId, farmId);
  }

  @Get('portfolio')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.COMPTABLE,
    UserRole.AUDITEUR,
  )
  @Policies('dashboard.portfolio.read')
  @ApiOperation({
    summary: 'Vue portfolio entreprise (multi-fermes)',
    description:
      'Retourne des KPIs agregees au niveau tenant: performance, risques et repartition regionale.',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    description: 'Nombre de mois pour la serie temporelle (3 a 18, par defaut 6).',
  })
  getPortfolio(
    @CurrentUser('tenantId') tenantId: string,
    @Query('months') months?: string,
  ) {
    const parsedMonths = Number(months);
    return this.dashboardService.getPortfolio(
      tenantId,
      Number.isFinite(parsedMonths) ? parsedMonths : 6,
    );
  }

  @Get('reliability')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.COMPTABLE,
    UserRole.AUDITEUR,
  )
  @Policies('dashboard.portfolio.read')
  @ApiOperation({
    summary: 'Vue fiabilite et performance de l API',
    description:
      'Retourne la disponibilite estimee, latence p95/p99, et routes les plus lentes/en erreur.',
  })
  getReliability() {
    return this.dashboardService.getReliabilityOverview();
  }
}
