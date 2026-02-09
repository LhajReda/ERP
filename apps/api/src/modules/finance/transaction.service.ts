import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTransactionDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: { ...dto, date: new Date(dto.date), createdBy: userId },
      });
      const balanceChange = dto.type === 'RECETTE' ? dto.amount : -dto.amount;
      await tx.bankAccount.update({
        where: { id: dto.accountId },
        data: { balance: { increment: balanceChange } },
      });
      return transaction;
    });
  }

  async findByAccount(accountId: string, query: PaginationDto) {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { accountId }, skip: (page - 1) * limit, take: limit, orderBy: { date: 'desc' },
      }),
      this.prisma.transaction.count({ where: { accountId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getMonthlySummary(farmId: string, year: number) {
    const accounts = await this.prisma.bankAccount.findMany({ where: { farmId }, select: { id: true } });
    const accountIds = accounts.map((a) => a.id);
    const transactions = await this.prisma.transaction.findMany({
      where: { accountId: { in: accountIds }, date: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } },
    });
    const monthly: Record<number, { recettes: number; depenses: number }> = {};
    for (let m = 1; m <= 12; m++) monthly[m] = { recettes: 0, depenses: 0 };
    for (const t of transactions) {
      const month = t.date.getMonth() + 1;
      if (t.type === 'RECETTE') monthly[month].recettes += t.amount;
      else if (t.type === 'DEPENSE') monthly[month].depenses += t.amount;
    }
    return monthly;
  }
}
