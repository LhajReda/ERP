import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';

/**
 * Service responsable de la gestion des exploitations agricoles (fermes).
 * Toutes les operations sont scopees par tenantId pour garantir l'isolation
 * des donnees en mode multi-tenant.
 */
@Injectable()
export class FarmService {
  private readonly logger = new Logger(FarmService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cree une nouvelle ferme pour le tenant specifie.
   * Verifie l'unicite du numero ICE et du numero d'enregistrement.
   */
  async create(tenantId: string, userId: string, dto: CreateFarmDto) {
    // Verifier l'unicite de l'ICE si fourni
    if (dto.ice) {
      const existingIce = await this.prisma.farm.findUnique({
        where: { ice: dto.ice },
      });
      if (existingIce) {
        throw new ConflictException(
          `Une ferme avec l'ICE "${dto.ice}" existe deja.`,
        );
      }
    }

    // Verifier l'unicite du numero d'enregistrement si fourni
    if (dto.registrationNumber) {
      const existingReg = await this.prisma.farm.findUnique({
        where: { registrationNumber: dto.registrationNumber },
      });
      if (existingReg) {
        throw new ConflictException(
          `Une ferme avec le numero d'enregistrement "${dto.registrationNumber}" existe deja.`,
        );
      }
    }

    const farm = await this.prisma.farm.create({
      data: {
        ...dto,
        tenantId,
      },
      include: {
        _count: {
          select: { parcels: true, employees: true },
        },
      },
    });

    this.logger.log(
      `Ferme creee: ${farm.name} (${farm.id}) par l'utilisateur ${userId}`,
    );
    return farm;
  }

  /**
   * Retourne la liste paginee des fermes d'un tenant.
   * Supporte la recherche par nom, nom arabe et province.
   * Inclut le comptage des parcelles associees.
   */
  async findAll(tenantId: string, query: PaginationDto) {
    const where: any = {
      tenantId,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { nameAr: { contains: query.search, mode: 'insensitive' } },
        { province: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {
      [query.sortBy]: query.sortOrder,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.farm.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy,
        include: {
          _count: {
            select: { parcels: true },
          },
        },
      }),
      this.prisma.farm.count({ where }),
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
   * Retourne les details complets d'une ferme avec ses relations.
   * Inclut le nombre de parcelles, d'employes et de cycles de culture actifs.
   */
  async findOne(tenantId: string, farmId: string) {
    const farm = await this.prisma.farm.findFirst({
      where: {
        id: farmId,
        tenantId,
      },
      include: {
        parcels: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            parcels: true,
            employees: true,
          },
        },
      },
    });

    if (!farm) {
      throw new NotFoundException(
        `Ferme avec l'ID "${farmId}" introuvable pour ce tenant.`,
      );
    }

    // Compter les cycles de culture actifs (EN_COURS) sur toutes les parcelles
    const activeCyclesCount = await this.prisma.cultureCycle.count({
      where: {
        parcel: {
          farmId,
          farm: { tenantId },
        },
        status: 'EN_COURS',
      },
    });

    return {
      ...farm,
      activeCyclesCount,
    };
  }

  /**
   * Met a jour une ferme existante.
   * Verifie l'unicite des champs ICE et registrationNumber si modifies.
   */
  async update(
    tenantId: string,
    farmId: string,
    userId: string,
    dto: UpdateFarmDto,
  ) {
    // Verifier que la ferme existe et appartient au tenant
    const existing = await this.prisma.farm.findFirst({
      where: { id: farmId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(
        `Ferme avec l'ID "${farmId}" introuvable pour ce tenant.`,
      );
    }

    // Verifier l'unicite de l'ICE si modifie
    if (dto.ice && dto.ice !== existing.ice) {
      const existingIce = await this.prisma.farm.findFirst({
        where: {
          ice: dto.ice,
          NOT: { id: farmId },
        },
      });
      if (existingIce) {
        throw new ConflictException(
          `Une ferme avec l'ICE "${dto.ice}" existe deja.`,
        );
      }
    }

    // Verifier l'unicite du numero d'enregistrement si modifie
    if (
      dto.registrationNumber &&
      dto.registrationNumber !== existing.registrationNumber
    ) {
      const existingReg = await this.prisma.farm.findFirst({
        where: {
          registrationNumber: dto.registrationNumber,
          NOT: { id: farmId },
        },
      });
      if (existingReg) {
        throw new ConflictException(
          `Une ferme avec le numero d'enregistrement "${dto.registrationNumber}" existe deja.`,
        );
      }
    }

    const farm = await this.prisma.farm.update({
      where: { id: farmId },
      data: dto,
      include: {
        _count: {
          select: { parcels: true, employees: true },
        },
      },
    });

    this.logger.log(
      `Ferme mise a jour: ${farm.name} (${farm.id}) par l'utilisateur ${userId}`,
    );
    return farm;
  }

  /**
   * Suppression logique d'une ferme.
   * Echoue si la ferme a des cycles de culture actifs,
   * des employes actifs ou des factures non soldees.
   */
  async remove(tenantId: string, farmId: string) {
    const farm = await this.prisma.farm.findFirst({
      where: { id: farmId, tenantId },
      include: {
        _count: {
          select: {
            parcels: true,
            employees: true,
          },
        },
      },
    });

    if (!farm) {
      throw new NotFoundException(
        `Ferme avec l'ID "${farmId}" introuvable pour ce tenant.`,
      );
    }

    // Verifier les cycles de culture actifs
    const activeCycles = await this.prisma.cultureCycle.count({
      where: {
        parcel: { farmId },
        status: { in: ['EN_COURS', 'PLANIFIE'] },
      },
    });

    if (activeCycles > 0) {
      throw new BadRequestException(
        `Impossible de supprimer la ferme "${farm.name}". ` +
          `${activeCycles} cycle(s) de culture actif(s) ou planifie(s) en cours. ` +
          `Veuillez terminer ou abandonner les cycles avant la suppression.`,
      );
    }

    // Verifier les employes actifs
    const activeEmployees = await this.prisma.employee.count({
      where: { farmId, isActive: true },
    });

    if (activeEmployees > 0) {
      throw new BadRequestException(
        `Impossible de supprimer la ferme "${farm.name}". ` +
          `${activeEmployees} employe(s) actif(s) associe(s). ` +
          `Veuillez desactiver les employes avant la suppression.`,
      );
    }

    // Verifier les factures non soldees
    const unpaidInvoices = await this.prisma.invoice.count({
      where: {
        farmId,
        status: {
          in: ['VALIDEE', 'ENVOYEE', 'PARTIELLEMENT_PAYEE', 'EN_LITIGE'],
        },
      },
    });

    if (unpaidInvoices > 0) {
      throw new BadRequestException(
        `Impossible de supprimer la ferme "${farm.name}". ` +
          `${unpaidInvoices} facture(s) non soldee(s). ` +
          `Veuillez solder ou annuler les factures avant la suppression.`,
      );
    }

    // Suppression en cascade (les parcelles seront supprimees automatiquement par Prisma)
    await this.prisma.farm.delete({
      where: { id: farmId },
    });

    this.logger.warn(`Ferme supprimee: ${farm.name} (${farm.id})`);
    return { message: `Ferme "${farm.name}" supprimee avec succes.` };
  }
}
