import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto) { return this.prisma.client.create({ data: dto }); }

  async findByFarm(farmId: string, query: PaginationDto) {
    const { page = 1, limit = 20, search } = query;
    const where: any = { farmId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.client.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.client.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id }, include: { invoices: { take: 10, orderBy: { date: 'desc' } } } });
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

  async update(id: string, data: Partial<CreateClientDto>) { return this.prisma.client.update({ where: { id }, data }); }
  async delete(id: string) { return this.prisma.client.delete({ where: { id } }); }
}
