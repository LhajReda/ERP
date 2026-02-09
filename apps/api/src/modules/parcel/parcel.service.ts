import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';
import { Prisma } from '@prisma/client';

/**
 * Service responsable de la gestion des parcelles agricoles.
 * Chaque parcelle est rattachee a une ferme, elle-meme rattachee a un tenant.
 * Toutes les operations verifient la chaine tenant -> farm -> parcel.
 */
@Injectable()
export class ParcelService {
  private readonly logger = new Logger(ParcelService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cree une nouvelle parcelle rattachee a une ferme du tenant courant.
   * Verifie que la ferme existe et appartient au tenant.
   */
  async create(tenantId: string, dto: CreateParcelDto) {
    // Verifier que la ferme existe et appartient au tenant
    const farm = await this.prisma.farm.findFirst({
      where: {
        id: dto.farmId,
        tenantId,
      },
    });

    if (!farm) {
      throw new NotFoundException(
        `Ferme avec l'ID "${dto.farmId}" introuvable pour ce tenant.`,
      );
    }

    // Verifier que la superficie totale des parcelles ne depasse pas celle de la ferme
    const existingParcelsArea = await this.prisma.parcel.aggregate({
      where: { farmId: dto.farmId },
      _sum: { area: true },
    });

    const currentTotalArea = existingParcelsArea._sum.area ?? 0;
    if (currentTotalArea + dto.area > farm.totalArea) {
      throw new BadRequestException(
        `La superficie totale des parcelles (${currentTotalArea + dto.area} ha) ` +
          `depasserait la superficie totale de la ferme (${farm.totalArea} ha). ` +
          `Superficie disponible: ${(farm.totalArea - currentTotalArea).toFixed(2)} ha.`,
      );
    }

    const parcel = await this.prisma.parcel.create({
      data: {
        name: dto.name,
        nameAr: dto.nameAr,
        code: dto.code,
        area: dto.area,
        soilType: dto.soilType,
        irrigationType: dto.irrigationType,
        waterQuota: dto.waterQuota,
        geoPolygon: dto.geoPolygon ?? undefined,
        gpsCenter: dto.gpsCenter ?? undefined,
        altitude: dto.altitude,
        currentCrop: dto.currentCrop,
        status: dto.status ?? 'PREPARATION',
        notes: dto.notes,
        farmId: dto.farmId,
      },
      include: {
        farm: {
          select: { id: true, name: true, tenantId: true },
        },
      },
    });

    this.logger.log(
      `Parcelle creee: ${parcel.name} (${parcel.id}) dans la ferme ${farm.name}`,
    );
    return parcel;
  }

  /**
   * Retourne la liste paginee des parcelles pour un tenant.
   * Peut etre filtree par farmId. Supporte la recherche par nom, nom arabe et code.
   */
  async findAll(
    tenantId: string,
    query: PaginationDto & { farmId?: string },
  ) {
    const where: Prisma.ParcelWhereInput = {
      farm: { tenantId },
    };

    // Filtrer par ferme si specifie
    if (query.farmId) {
      where.farmId = query.farmId;
    }

    if (query.search) {
      where.AND = [
        {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { nameAr: { contains: query.search, mode: 'insensitive' } },
            { code: { contains: query.search, mode: 'insensitive' } },
            { currentCrop: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const orderBy: Prisma.ParcelOrderByWithRelationInput = {
      [query.sortBy]: query.sortOrder,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.parcel.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy,
        include: {
          farm: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              cultureCycles: true,
              soilAnalyses: true,
            },
          },
        },
      }),
      this.prisma.parcel.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * Retourne les details complets d'une parcelle avec ses cycles de culture
   * et analyses de sol.
   */
  async findOne(tenantId: string, parcelId: string) {
    const parcel = await this.prisma.parcel.findFirst({
      where: {
        id: parcelId,
        farm: { tenantId },
      },
      include: {
        farm: {
          select: { id: true, name: true, region: true, province: true },
        },
        cultureCycles: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            cropType: true,
            variety: true,
            season: true,
            campaignYear: true,
            sowingDate: true,
            expectedHarvest: true,
            actualHarvest: true,
            estimatedYield: true,
            actualYield: true,
            status: true,
            createdAt: true,
          },
        },
        soilAnalyses: {
          orderBy: { date: 'desc' },
          take: 5,
          select: {
            id: true,
            date: true,
            ph: true,
            nitrogen: true,
            phosphorus: true,
            potassium: true,
            organicMatter: true,
            salinity: true,
            labName: true,
          },
        },
        _count: {
          select: {
            cultureCycles: true,
            soilAnalyses: true,
          },
        },
      },
    });

    if (!parcel) {
      throw new NotFoundException(
        `Parcelle avec l'ID "${parcelId}" introuvable pour ce tenant.`,
      );
    }

    return parcel;
  }

  /**
   * Met a jour une parcelle existante.
   * Le farmId ne peut pas etre modifie (la parcelle reste dans la meme ferme).
   */
  async update(tenantId: string, parcelId: string, dto: UpdateParcelDto) {
    const existing = await this.prisma.parcel.findFirst({
      where: {
        id: parcelId,
        farm: { tenantId },
      },
      include: {
        farm: { select: { id: true, totalArea: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Parcelle avec l'ID "${parcelId}" introuvable pour ce tenant.`,
      );
    }

    // Si la superficie est modifiee, verifier que le total ne depasse pas la ferme
    if (dto.area !== undefined && dto.area !== existing.area) {
      const otherParcelsArea = await this.prisma.parcel.aggregate({
        where: {
          farmId: existing.farmId,
          NOT: { id: parcelId },
        },
        _sum: { area: true },
      });

      const otherTotal = otherParcelsArea._sum.area ?? 0;
      if (otherTotal + dto.area > existing.farm.totalArea) {
        throw new BadRequestException(
          `La superficie totale des parcelles (${(otherTotal + dto.area).toFixed(2)} ha) ` +
            `depasserait la superficie totale de la ferme (${existing.farm.totalArea} ha). ` +
            `Superficie disponible: ${(existing.farm.totalArea - otherTotal).toFixed(2)} ha.`,
        );
      }
    }

    const parcel = await this.prisma.parcel.update({
      where: { id: parcelId },
      data: {
        ...dto,
        // Ensure geoPolygon/gpsCenter are handled correctly for JSON fields
        geoPolygon: dto.geoPolygon !== undefined ? dto.geoPolygon : undefined,
        gpsCenter: dto.gpsCenter !== undefined ? dto.gpsCenter : undefined,
      },
      include: {
        farm: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(`Parcelle mise a jour: ${parcel.name} (${parcel.id})`);
    return parcel;
  }

  /**
   * Supprime une parcelle.
   * Echoue si la parcelle a des cycles de culture actifs.
   */
  async remove(tenantId: string, parcelId: string) {
    const parcel = await this.prisma.parcel.findFirst({
      where: {
        id: parcelId,
        farm: { tenantId },
      },
    });

    if (!parcel) {
      throw new NotFoundException(
        `Parcelle avec l'ID "${parcelId}" introuvable pour ce tenant.`,
      );
    }

    // Verifier les cycles de culture actifs
    const activeCycles = await this.prisma.cultureCycle.count({
      where: {
        parcelId,
        status: { in: ['EN_COURS', 'PLANIFIE'] },
      },
    });

    if (activeCycles > 0) {
      throw new BadRequestException(
        `Impossible de supprimer la parcelle "${parcel.name}". ` +
          `${activeCycles} cycle(s) de culture actif(s) ou planifie(s). ` +
          `Veuillez terminer ou abandonner les cycles avant la suppression.`,
      );
    }

    // Cascade delete is configured in Prisma schema for cultureCycles
    await this.prisma.parcel.delete({
      where: { id: parcelId },
    });

    this.logger.warn(`Parcelle supprimee: ${parcel.name} (${parcel.id})`);
    return { message: `Parcelle "${parcel.name}" supprimee avec succes.` };
  }
}
