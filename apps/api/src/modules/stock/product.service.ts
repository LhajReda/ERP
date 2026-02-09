import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProductCategory } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async findAll(query: PaginationDto, filters?: { farmId?: string; category?: ProductCategory }) {
    const { page = 1, limit = 20, search, sortBy, sortOrder } = query;
    const where: any = {};
    if (filters?.farmId) where.farmId = filters.farmId;
    if (filters?.category) where.category = filters.category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        include: { supplier: { select: { id: true, name: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { supplier: true, movements: { take: 20, orderBy: { date: 'desc' } } },
    });
    if (!product) throw new NotFoundException('Produit introuvable');
    return product;
  }

  async update(id: string, data: Partial<CreateProductDto>) {
    return this.prisma.product.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  async getLowStockAlerts(farmId: string) {
    return this.prisma.product.findMany({
      where: {
        farmId,
        currentStock: { lte: this.prisma.product.fields?.minStock as any },
      },
      orderBy: { currentStock: 'asc' },
    });
  }
}
