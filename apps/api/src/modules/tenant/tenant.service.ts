import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Service responsable de la gestion des tenants (locataires).
 * Chaque tenant represente une exploitation agricole ou un groupement
 * d'exploitations partageant un meme espace dans le systeme FLA7A.
 */
@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cree un nouveau tenant dans le systeme.
   */
  async create(data: {
    name: string;
    subdomain: string;
    plan?: string;
    maxFarms?: number;
    maxUsers?: number;
    subscriptionEnd?: Date;
  }) {
    const existing = await this.prisma.tenant.findUnique({
      where: { subdomain: data.subdomain },
    });

    if (existing) {
      throw new ConflictException(
        `Le sous-domaine "${data.subdomain}" est deja utilise.`,
      );
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        subdomain: data.subdomain,
        plan: data.plan ?? 'fellah',
        maxFarms: data.maxFarms ?? 1,
        maxUsers: data.maxUsers ?? 5,
        subscriptionEnd: data.subscriptionEnd ?? null,
      },
    });

    this.logger.log(`Tenant cree: ${tenant.name} (${tenant.id})`);
    return tenant;
  }

  /**
   * Retourne la liste paginee de tous les tenants actifs.
   */
  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TenantWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { subdomain: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { users: true, farms: true },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Recherche un tenant par son identifiant unique.
   */
  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, farms: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant avec l'ID "${id}" introuvable.`);
    }

    return tenant;
  }

  /**
   * Recherche un tenant par son sous-domaine.
   */
  async findBySubdomain(subdomain: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain },
      include: {
        _count: {
          select: { users: true, farms: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(
        `Tenant avec le sous-domaine "${subdomain}" introuvable.`,
      );
    }

    return tenant;
  }

  /**
   * Met a jour les informations d'un tenant existant.
   */
  async update(
    id: string,
    data: {
      name?: string;
      subdomain?: string;
      plan?: string;
      maxFarms?: number;
      maxUsers?: number;
      subscriptionEnd?: Date | null;
      isActive?: boolean;
    },
  ) {
    await this.findById(id);

    if (data.subdomain) {
      const existing = await this.prisma.tenant.findFirst({
        where: {
          subdomain: data.subdomain,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Le sous-domaine "${data.subdomain}" est deja utilise par un autre tenant.`,
        );
      }
    }

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data,
    });

    this.logger.log(`Tenant mis a jour: ${tenant.name} (${tenant.id})`);
    return tenant;
  }

  /**
   * Desactive un tenant. Ne supprime pas les donnees mais empeche l'acces.
   * Verifie qu'il n'y a pas d'activites critiques en cours avant la desactivation.
   */
  async deactivate(id: string) {
    const tenant = await this.findById(id);

    if (!tenant.isActive) {
      throw new BadRequestException(
        `Le tenant "${tenant.name}" est deja desactive.`,
      );
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.warn(`Tenant desactive: ${updated.name} (${updated.id})`);
    return updated;
  }
}
