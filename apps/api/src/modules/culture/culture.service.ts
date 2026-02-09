import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CycleStatus, CropType } from '@prisma/client';

@Injectable()
export class CultureService {
  constructor(private readonly prisma: PrismaService) {}

  async createCycle(dto: CreateCycleDto) {
    return this.prisma.cultureCycle.create({
      data: {
        ...dto,
        sowingDate: new Date(dto.sowingDate),
        expectedHarvest: new Date(dto.expectedHarvest),
      },
    });
  }

  async findAllCycles(
    query: PaginationDto,
    filters?: { parcelId?: string; farmId?: string; status?: CycleStatus; cropType?: CropType },
  ) {
    const { page = 1, limit = 20, search, sortBy, sortOrder } = query;
    const where: any = {};
    if (filters?.parcelId) where.parcelId = filters.parcelId;
    if (filters?.farmId) where.parcel = { farmId: filters.farmId };
    if (filters?.status) where.status = filters.status;
    if (filters?.cropType) where.cropType = filters.cropType;
    if (search) {
      where.OR = [
        { variety: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.cultureCycle.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        include: { parcel: { select: { id: true, name: true, farmId: true } } },
      }),
      this.prisma.cultureCycle.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneCycle(id: string) {
    const cycle = await this.prisma.cultureCycle.findUnique({
      where: { id },
      include: {
        parcel: true,
        activities: { orderBy: { date: 'desc' } },
        inputs: { include: { product: true } },
        harvests: { orderBy: { date: 'desc' } },
      },
    });
    if (!cycle) throw new NotFoundException('Cycle de culture introuvable');
    return cycle;
  }

  async updateCycle(id: string, data: Partial<CreateCycleDto> & { status?: CycleStatus }) {
    return this.prisma.cultureCycle.update({ where: { id }, data: data as any });
  }

  async deleteCycle(id: string) {
    return this.prisma.cultureCycle.delete({ where: { id } });
  }
}
