import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { InvoiceStatus, InvoiceType, TvaRate } from '@prisma/client';

const TVA_MAP: Record<string, number> = { TVA_0: 0, TVA_7: 0.07, TVA_10: 0.1, TVA_14: 0.14, TVA_20: 0.2 };

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInvoiceDto) {
    return this.prisma.$transaction(async (tx) => {
      // Generate invoice number
      const year = new Date(dto.date).getFullYear();
      const count = await tx.invoice.count({ where: { farmId: dto.farmId, date: { gte: new Date(`${year}-01-01`) } } });
      const invoiceNumber = `FLA-${year}-${String(count + 1).padStart(5, '0')}`;

      // Calculate line totals
      const lines = dto.lines.map((line, idx) => {
        const lineTotal = line.quantity * line.unitPrice;
        const lineTvaRate = line.tvaRate || dto.tvaRate || 'TVA_0';
        const lineTva = lineTotal * (TVA_MAP[lineTvaRate] || 0);
        return { ...line, total: lineTotal + lineTva, tvaRate: lineTvaRate as TvaRate, tvaAmount: lineTva, sortOrder: idx };
      });

      const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
      const discountAmount = subtotal * ((dto.discountPercent || 0) / 100);
      const afterDiscount = subtotal - discountAmount;
      const tvaAmount = lines.reduce((sum, l) => sum + l.tvaAmount, 0);
      const total = afterDiscount + tvaAmount;

      return tx.invoice.create({
        data: {
          invoiceNumber,
          type: dto.type,
          farmId: dto.farmId,
          clientId: dto.clientId,
          supplierId: dto.supplierId,
          date: new Date(dto.date),
          dueDate: new Date(dto.dueDate),
          subtotal,
          discountPercent: dto.discountPercent || 0,
          discountAmount,
          tvaRate: dto.tvaRate || 'TVA_0',
          tvaAmount,
          total,
          amountDue: total,
          paymentTerms: dto.paymentTerms,
          notes: dto.notes,
          lines: { create: lines },
        },
        include: { lines: true },
      });
    });
  }

  async findAll(query: PaginationDto, filters?: { farmId?: string; status?: InvoiceStatus; type?: InvoiceType }) {
    const { page = 1, limit = 20, search, sortBy, sortOrder } = query;
    const where: any = {};
    if (filters?.farmId) where.farmId = filters.farmId;
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (search) where.invoiceNumber = { contains: search, mode: 'insensitive' };
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { [sortBy || 'date']: sortOrder || 'desc' },
        include: { client: { select: { name: true } }, supplier: { select: { name: true } } },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { lines: { orderBy: { sortOrder: 'asc' } }, payments: { orderBy: { date: 'desc' } }, client: true, supplier: true },
    });
    if (!invoice) throw new NotFoundException('Facture introuvable');
    return invoice;
  }

  async updateStatus(id: string, status: InvoiceStatus) {
    return this.prisma.invoice.update({ where: { id }, data: { status } });
  }
}
