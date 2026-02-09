import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKPIs(farmId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      farm, activeCycles, lowStockCount, totalProducts,
      monthlyRecettes, monthlyDepenses,
      employeeCount, todayPresent,
      activeCerts, expiringCerts,
    ] = await Promise.all([
      this.prisma.farm.findUnique({ where: { id: farmId }, include: { parcels: true } }),
      this.prisma.cultureCycle.count({ where: { parcel: { farmId }, status: 'EN_COURS' } }),
      this.prisma.product.count({ where: { farmId, currentStock: { lte: 0 } } }),
      this.prisma.product.count({ where: { farmId } }),
      this.getMonthlySum(farmId, startOfMonth, 'RECETTE'),
      this.getMonthlySum(farmId, startOfMonth, 'DEPENSE'),
      this.prisma.employee.count({ where: { farmId, isActive: true } }),
      this.prisma.attendance.count({ where: { employee: { farmId }, date: { gte: today, lt: tomorrow }, status: 'PRESENT' } }),
      this.prisma.certification.count({ where: { farmId, status: 'active' } }),
      this.prisma.certification.count({
        where: { farmId, expiryDate: { lte: new Date(Date.now() + 30 * 86400000), gte: now } },
      }),
    ]);

    const cultivatedArea = farm?.parcels.filter((p: any) => p.status === 'CULTIVEE').reduce((s: number, p: any) => s + p.area, 0) || 0;

    return {
      farm: { totalArea: farm?.totalArea || 0, cultivatedArea, parcelsCount: farm?.parcels.length || 0 },
      cultures: { activeCycles },
      stock: { alertsCount: lowStockCount, totalProducts },
      finance: { monthlyRevenue: monthlyRecettes, monthlyExpenses: monthlyDepenses, balance: monthlyRecettes - monthlyDepenses },
      hr: { totalEmployees: employeeCount, presentToday: todayPresent },
      compliance: { activeCertifications: activeCerts, expiringCount: expiringCerts },
    };
  }

  private async getMonthlySum(farmId: string, startOfMonth: Date, type: string): Promise<number> {
    const accounts = await this.prisma.bankAccount.findMany({ where: { farmId }, select: { id: true } });
    if (accounts.length === 0) return 0;
    const result = await this.prisma.transaction.aggregate({
      where: { accountId: { in: accounts.map((a: any) => a.id) }, type: type as any, date: { gte: startOfMonth } },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }
}
