import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlyPnL(farmId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const accounts = await this.prisma.bankAccount.findMany({ where: { farmId }, select: { id: true } });
    const accountIds = accounts.map((a) => a.id);
    const transactions = await this.prisma.transaction.findMany({
      where: { accountId: { in: accountIds }, date: { gte: startDate, lte: endDate } },
    });
    const recettes = transactions.filter((t) => t.type === 'RECETTE').reduce((s, t) => s + t.amount, 0);
    const depenses = transactions.filter((t) => t.type === 'DEPENSE').reduce((s, t) => s + t.amount, 0);
    return { year, month, recettes, depenses, benefice: recettes - depenses };
  }

  async getAnnualSummary(farmId: string, year: number) {
    const months = [];
    for (let m = 1; m <= 12; m++) {
      months.push(await this.getMonthlyPnL(farmId, year, m));
    }
    const totalRecettes = months.reduce((s, m) => s + m.recettes, 0);
    const totalDepenses = months.reduce((s, m) => s + m.depenses, 0);
    return { year, months, totals: { recettes: totalRecettes, depenses: totalDepenses, benefice: totalRecettes - totalDepenses } };
  }

  async getCropProfitability(cycleId: string) {
    const cycle = await this.prisma.cultureCycle.findUniqueOrThrow({
      where: { id: cycleId },
      include: { inputs: true, activities: true, harvests: true, parcel: { select: { name: true, area: true } } },
    });
    const inputCost = cycle.inputs.reduce((s, i) => s + i.totalCost, 0);
    const activityCost = cycle.activities.reduce((s, a) => s + a.cost, 0);
    const totalCost = inputCost + activityCost;
    const roi = totalCost > 0 ? ((cycle.totalRevenue - totalCost) / totalCost) * 100 : 0;
    return {
      cycle: { id: cycle.id, cropType: cycle.cropType, variety: cycle.variety, parcel: cycle.parcel },
      inputCost, activityCost, totalCost,
      totalRevenue: cycle.totalRevenue,
      profit: cycle.totalRevenue - totalCost,
      roi: Math.round(roi * 100) / 100,
      yieldPerHa: cycle.parcel.area > 0 ? (cycle.actualYield || 0) / cycle.parcel.area : 0,
    };
  }
}
