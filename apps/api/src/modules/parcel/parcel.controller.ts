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
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ParcelService } from './parcel.service';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';

/**
 * Controleur REST pour la gestion des parcelles agricoles.
 * Toutes les routes sont protegees par authentification JWT et controle de roles.
 */
@ApiTags('Parcels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parcels')
export class ParcelController {
  constructor(private readonly parcelService: ParcelService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CHEF_EQUIPE)
  @ApiOperation({
    summary: 'Creer une nouvelle parcelle',
    description:
      "Cree une nouvelle parcelle rattachee a une ferme du tenant courant. " +
      "Verifie que la superficie totale des parcelles ne depasse pas " +
      "celle de la ferme.",
  })
  @ApiResponse({ status: 201, description: 'Parcelle creee avec succes.' })
  @ApiResponse({ status: 400, description: 'Donnees invalides ou superficie depassee.' })
  @ApiResponse({ status: 404, description: 'Ferme introuvable.' })
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateParcelDto,
  ) {
    return this.parcelService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister toutes les parcelles',
    description:
      "Retourne la liste paginee des parcelles du tenant courant. " +
      "Peut etre filtree par ferme. Supporte la recherche par nom, " +
      "code et culture actuelle.",
  })
  @ApiQuery({
    name: 'farmId',
    required: false,
    description: 'Filtrer par identifiant de ferme',
  })
  @ApiResponse({ status: 200, description: 'Liste des parcelles retournee avec succes.' })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: PaginationDto,
    @Query('farmId') farmId?: string,
  ) {
    return this.parcelService.findAll(tenantId, { ...query, farmId } as any);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir les details d\'une parcelle',
    description:
      "Retourne les details complets d'une parcelle incluant ses " +
      "cycles de culture recents et ses analyses de sol.",
  })
  @ApiParam({ name: 'id', description: 'Identifiant unique de la parcelle' })
  @ApiResponse({ status: 200, description: 'Details de la parcelle retournes avec succes.' })
  @ApiResponse({ status: 404, description: 'Parcelle introuvable.' })
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.parcelService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CHEF_EQUIPE)
  @ApiOperation({
    summary: 'Mettre a jour une parcelle',
    description:
      "Met a jour les informations d'une parcelle existante. " +
      "La ferme d'appartenance ne peut pas etre modifiee.",
  })
  @ApiParam({ name: 'id', description: 'Identifiant unique de la parcelle' })
  @ApiResponse({ status: 200, description: 'Parcelle mise a jour avec succes.' })
  @ApiResponse({ status: 400, description: 'Donnees invalides ou superficie depassee.' })
  @ApiResponse({ status: 404, description: 'Parcelle introuvable.' })
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateParcelDto,
  ) {
    return this.parcelService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer une parcelle',
    description:
      "Supprime une parcelle et ses donnees associees. " +
      "Echoue si la parcelle a des cycles de culture actifs ou planifies.",
  })
  @ApiParam({ name: 'id', description: 'Identifiant unique de la parcelle' })
  @ApiResponse({ status: 200, description: 'Parcelle supprimee avec succes.' })
  @ApiResponse({ status: 400, description: 'Suppression impossible - cycles actifs.' })
  @ApiResponse({ status: 404, description: 'Parcelle introuvable.' })
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.parcelService.remove(tenantId, id);
  }
}
