import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CultureService } from './culture.service';
import { ActivityService } from './activity.service';
import { HarvestService } from './harvest.service';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { CreateHarvestDto } from './dto/create-harvest.dto';
import { UserRole, CycleStatus, CropType } from '@prisma/client';

@ApiTags('Culture')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('culture-cycles')
export class CultureController {
  constructor(private readonly cultureService: CultureService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CHEF_EQUIPE)
  @ApiOperation({ summary: 'Creer un cycle de culture' })
  create(@Body() dto: CreateCycleDto) {
    return this.cultureService.createCycle(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les cycles de culture' })
  findAll(
    @Query() query: PaginationDto,
    @Query('parcelId') parcelId?: string,
    @Query('farmId') farmId?: string,
    @Query('status') status?: CycleStatus,
    @Query('cropType') cropType?: CropType,
  ) {
    return this.cultureService.findAllCycles(query, { parcelId, farmId, status, cropType });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail d\'un cycle de culture' })
  findOne(@Param('id') id: string) {
    return this.cultureService.findOneCycle(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.CHEF_EQUIPE)
  @ApiOperation({ summary: 'Modifier un cycle de culture' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateCycleDto>) {
    return this.cultureService.updateCycle(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer un cycle de culture' })
  remove(@Param('id') id: string) {
    return this.cultureService.deleteCycle(id);
  }
}

@ApiTags('Culture')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('farm-activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CHEF_EQUIPE, UserRole.OUVRIER)
  @ApiOperation({ summary: 'Enregistrer une activite agricole' })
  create(@Body() dto: CreateActivityDto, @CurrentUser('id') userId: string) {
    return this.activityService.create(dto, userId);
  }

  @Get('cycle/:cycleId')
  @ApiOperation({ summary: 'Activites d\'un cycle' })
  findByCycle(@Param('cycleId') cycleId: string) {
    return this.activityService.findByCycle(cycleId);
  }
}

@ApiTags('Culture')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('harvests')
export class HarvestController {
  constructor(private readonly harvestService: HarvestService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CHEF_EQUIPE)
  @ApiOperation({ summary: 'Enregistrer une recolte' })
  create(@Body() dto: CreateHarvestDto) {
    return this.harvestService.create(dto);
  }

  @Get('cycle/:cycleId')
  @ApiOperation({ summary: 'Recoltes d\'un cycle' })
  findByCycle(@Param('cycleId') cycleId: string) {
    return this.harvestService.findByCycle(cycleId);
  }

  @Get('stats/:farmId')
  @ApiOperation({ summary: 'Statistiques rendement par exploitation' })
  getStats(@Param('farmId') farmId: string) {
    return this.harvestService.getYieldStats(farmId);
  }
}
