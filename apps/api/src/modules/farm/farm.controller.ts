import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FarmService } from './farm.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';

/**
 * Controleur REST pour la gestion des exploitations agricoles (fermes).
 * Toutes les routes sont protegees par authentification JWT et controle de roles.
 */
@ApiTags('Farms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('farms')
export class FarmController {
  constructor(private readonly farmService: FarmService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Creer une nouvelle ferme',
    description:
      "Cree une nouvelle exploitation agricole pour le tenant courant. " +
      "Seuls les administrateurs peuvent creer des fermes.",
  })
  @ApiResponse({ status: 201, description: 'Ferme creee avec succes.' })
  @ApiResponse({ status: 400, description: 'Donnees invalides.' })
  @ApiResponse({ status: 409, description: 'ICE ou numero d\'enregistrement deja utilise.' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFarmDto,
  ) {
    return this.farmService.create(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister toutes les fermes',
    description:
      "Retourne la liste paginee des fermes du tenant courant. " +
      "Supporte la recherche par nom, nom arabe et province.",
  })
  @ApiResponse({ status: 200, description: 'Liste des fermes retournee avec succes.' })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: PaginationDto,
  ) {
    return this.farmService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir les details d\'une ferme',
    description:
      "Retourne les details complets d'une ferme incluant ses parcelles, " +
      "le nombre d'employes et les cycles de culture actifs.",
  })
  @ApiParam({ name: 'id', description: 'Identifiant unique de la ferme' })
  @ApiResponse({ status: 200, description: 'Details de la ferme retournes avec succes.' })
  @ApiResponse({ status: 404, description: 'Ferme introuvable.' })
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.farmService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Mettre a jour une ferme',
    description:
      "Met a jour les informations d'une exploitation agricole existante. " +
      "Seuls les administrateurs peuvent modifier les fermes.",
  })
  @ApiParam({ name: 'id', description: 'Identifiant unique de la ferme' })
  @ApiResponse({ status: 200, description: 'Ferme mise a jour avec succes.' })
  @ApiResponse({ status: 404, description: 'Ferme introuvable.' })
  @ApiResponse({ status: 409, description: 'Conflit de donnees uniques.' })
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFarmDto,
  ) {
    return this.farmService.update(tenantId, id, userId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer une ferme',
    description:
      "Supprime une exploitation agricole et toutes ses donnees associees. " +
      "Echoue si la ferme a des cycles actifs, des employes actifs ou " +
      "des factures non soldees. Seul le super administrateur peut supprimer.",
  })
  @ApiParam({ name: 'id', description: 'Identifiant unique de la ferme' })
  @ApiResponse({ status: 200, description: 'Ferme supprimee avec succes.' })
  @ApiResponse({ status: 400, description: 'Suppression impossible - donnees actives.' })
  @ApiResponse({ status: 404, description: 'Ferme introuvable.' })
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.farmService.remove(tenantId, id);
  }
}
