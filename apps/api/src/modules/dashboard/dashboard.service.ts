import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { httpMetricsStore } from '../../common/observability/http-metrics.store';

type FarmMetric = {
  farmId: string;
  farmName: string;
  region: string;
  totalArea: number;
  cultivatedArea: number;
  activeCycles: number;
  harvestReady: number;
  employeeCount: number;
  presentToday: number;
  payrollEstimate: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  stockCriticalCount: number;
  expiringCertifications: number;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  getReliabilityOverview() {
    return httpMetricsStore.snapshot();
  }

  async getKPIs(tenantId: string, farmId?: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const { today, tomorrow } = this.getDayBounds(now);

    const farm = await this.resolveFarm(tenantId, farmId);
    if (!farm) {
      return this.buildEmptyKpis();
    }

    const [
      activeCycles,
      harvestReady,
      stockRows,
      totalProducts,
      thisMonthRevenue,
      thisMonthExpenses,
      previousMonthRevenue,
      employeeCount,
      todayPresent,
      activeCerts,
      expiringCerts,
      thisMonthCycleCreations,
      previousMonthCycleCreations,
      monthlySeries,
      cropSplit,
      recentActivities,
    ] = await Promise.all([
      this.prisma.cultureCycle.count({
        where: { parcel: { farmId: farm.id }, status: 'EN_COURS' },
      }),
      this.prisma.cultureCycle.count({
        where: { parcel: { farmId: farm.id }, status: 'RECOLTE' },
      }),
      this.prisma.product.findMany({
        where: { farmId: farm.id },
        select: { currentStock: true, minStock: true },
      }),
      this.prisma.product.count({ where: { farmId: farm.id } }),
      this.getMonthlySum(farm.id, startOfMonth, 'RECETTE'),
      this.getMonthlySum(farm.id, startOfMonth, 'DEPENSE'),
      this.getMonthlySum(
        farm.id,
        startOfPreviousMonth,
        'RECETTE',
        endOfPreviousMonth,
      ),
      this.prisma.employee.count({ where: { farmId: farm.id, isActive: true } }),
      this.prisma.attendance.count({
        where: {
          employee: { farmId: farm.id },
          date: { gte: today, lt: tomorrow },
          status: 'PRESENT',
        },
      }),
      this.prisma.certification.count({ where: { farmId: farm.id, status: 'active' } }),
      this.prisma.certification.count({
        where: {
          farmId: farm.id,
          expiryDate: { lte: new Date(Date.now() + 30 * 86400000), gte: now },
        },
      }),
      this.prisma.cultureCycle.count({
        where: {
          parcel: { farmId: farm.id },
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.cultureCycle.count({
        where: {
          parcel: { farmId: farm.id },
          createdAt: { gte: startOfPreviousMonth, lte: endOfPreviousMonth },
        },
      }),
      this.getMonthlySeriesForFarms([farm.id], 6),
      this.getCropSplit(farm.id),
      this.getRecentActivities(farm.id),
    ]);

    const cultivatedArea =
      farm.parcels
        .filter((parcel: any) => parcel.status === 'CULTIVEE')
        .reduce((sum: number, parcel: any) => sum + (parcel.area || 0), 0) || 0;
    const lowStockCount = stockRows.filter((row) => {
      const minimum = row.minStock ?? 0;
      return row.currentStock <= minimum;
    }).length;
    const cycleTrend = this.calculateTrend(
      thisMonthCycleCreations,
      previousMonthCycleCreations,
    );
    const revenueTrend = this.calculateTrend(thisMonthRevenue, previousMonthRevenue);

    return {
      farm: {
        totalArea: farm.totalArea || 0,
        cultivatedArea,
        parcelsCount: farm.parcels.length || 0,
      },
      cultures: { activeCycles },
      stock: { alertsCount: lowStockCount, totalProducts },
      finance: {
        monthlyRevenue: thisMonthRevenue,
        monthlyExpenses: thisMonthExpenses,
        balance: thisMonthRevenue - thisMonthExpenses,
      },
      hr: { totalEmployees: employeeCount, presentToday: todayPresent },
      compliance: { activeCertifications: activeCerts, expiringCount: expiringCerts },
      // Flattened fields consumed by the web dashboard.
      totalArea: farm.totalArea || 0,
      cultivatedArea,
      activeCycles,
      harvestReady,
      employees: employeeCount,
      presentEmployees: todayPresent,
      monthlyRevenue: thisMonthRevenue,
      monthlyExpenses: thisMonthExpenses,
      periodLabel: this.getCurrentPeriodLabel(now),
      cycleTrend,
      revenueTrend,
      monthlySeries,
      cropSplit,
      recentActivities,
    };
  }

  async getPortfolio(tenantId: string, months = 6) {
    const now = new Date();
    const safeMonths = this.clamp(Math.floor(months || 6), 3, 18);
    const { today, tomorrow } = this.getDayBounds(now);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfSeries = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1), 1);

    const farms = await this.prisma.farm.findMany({
      where: { tenantId },
      include: {
        parcels: {
          select: { area: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (farms.length === 0) {
      return {
        period: {
          months: safeMonths,
          startDate: startOfSeries.toISOString(),
          endDate: now.toISOString(),
        },
        summary: {
          farmsCount: 0,
          totalArea: 0,
          cultivatedArea: 0,
          activeCycles: 0,
          harvestReady: 0,
          employees: 0,
          presentEmployees: 0,
          payrollMonthlyEstimate: 0,
          monthlyRevenue: 0,
          monthlyExpenses: 0,
          monthlyBalance: 0,
          stockCriticalCount: 0,
          expiringCertifications30d: 0,
        },
        monthlySeries: [],
        regionalBreakdown: [],
        topPerformers: [],
        riskFarms: [],
        operationalAlerts: [],
      };
    }

    const farmIds = farms.map((farm) => farm.id);
    const monthBuckets = this.createMonthBuckets(safeMonths, now);
    const monthBucketMap = new Map(
      monthBuckets.map((bucket) => [bucket.key, { ...bucket }]),
    );

    const [
      cycles,
      products,
      certifications,
      employees,
      attendanceToday,
      accounts,
    ] = await Promise.all([
      this.prisma.cultureCycle.findMany({
        where: {
          parcel: { farmId: { in: farmIds } },
          status: { in: ['EN_COURS', 'RECOLTE'] },
        },
        select: {
          status: true,
          parcel: { select: { farmId: true } },
        },
      }),
      this.prisma.product.findMany({
        where: { farmId: { in: farmIds } },
        select: { farmId: true, currentStock: true, minStock: true },
      }),
      this.prisma.certification.findMany({
        where: {
          farmId: { in: farmIds },
          expiryDate: { gte: now, lte: new Date(now.getTime() + 30 * 86400000) },
        },
        select: { farmId: true, type: true, expiryDate: true },
      }),
      this.prisma.employee.findMany({
        where: { farmId: { in: farmIds }, isActive: true },
        select: { farmId: true, monthlyRate: true, dailyRate: true },
      }),
      this.prisma.attendance.findMany({
        where: {
          date: { gte: today, lt: tomorrow },
          status: 'PRESENT',
          employee: { farmId: { in: farmIds } },
        },
        select: { employee: { select: { farmId: true } } },
      }),
      this.prisma.bankAccount.findMany({
        where: { farmId: { in: farmIds } },
        select: { id: true, farmId: true },
      }),
    ]);

    const accountFarmMap = new Map(accounts.map((account) => [account.id, account.farmId]));
    const accountIds = accounts.map((account) => account.id);

    const transactions =
      accountIds.length === 0
        ? []
        : await this.prisma.transaction.findMany({
            where: {
              accountId: { in: accountIds },
              date: { gte: startOfSeries },
            },
            select: {
              accountId: true,
              type: true,
              amount: true,
              date: true,
            },
          });

    const farmMetrics = new Map<string, FarmMetric>();
    for (const farm of farms) {
      const cultivatedArea = farm.parcels
        .filter((parcel) => parcel.status === 'CULTIVEE')
        .reduce((sum, parcel) => sum + (parcel.area || 0), 0);

      farmMetrics.set(farm.id, {
        farmId: farm.id,
        farmName: farm.name,
        region: this.formatRegionLabel(farm.region),
        totalArea: farm.totalArea || 0,
        cultivatedArea,
        activeCycles: 0,
        harvestReady: 0,
        employeeCount: 0,
        presentToday: 0,
        payrollEstimate: 0,
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        stockCriticalCount: 0,
        expiringCertifications: 0,
      });
    }

    for (const cycle of cycles) {
      const farmId = cycle.parcel.farmId;
      const metric = farmMetrics.get(farmId);
      if (!metric) continue;
      if (cycle.status === 'EN_COURS') metric.activeCycles += 1;
      if (cycle.status === 'RECOLTE') metric.harvestReady += 1;
    }

    for (const product of products) {
      const metric = farmMetrics.get(product.farmId);
      if (!metric) continue;
      const minimum = product.minStock ?? 0;
      if (product.currentStock <= minimum) {
        metric.stockCriticalCount += 1;
      }
    }

    for (const certification of certifications) {
      const metric = farmMetrics.get(certification.farmId);
      if (!metric) continue;
      metric.expiringCertifications += 1;
    }

    for (const employee of employees) {
      const metric = farmMetrics.get(employee.farmId);
      if (!metric) continue;
      metric.employeeCount += 1;
      metric.payrollEstimate += employee.monthlyRate || (employee.dailyRate || 0) * 26;
    }

    for (const attendance of attendanceToday) {
      const farmId = attendance.employee.farmId;
      const metric = farmMetrics.get(farmId);
      if (!metric) continue;
      metric.presentToday += 1;
    }

    for (const tx of transactions) {
      const farmId = accountFarmMap.get(tx.accountId);
      if (!farmId) continue;
      const metric = farmMetrics.get(farmId);
      if (!metric) continue;

      const monthKey = this.toMonthKey(tx.date);
      const monthBucket = monthBucketMap.get(monthKey);
      if (monthBucket) {
        if (tx.type === 'RECETTE') monthBucket.revenue += tx.amount;
        if (tx.type === 'DEPENSE') monthBucket.expenses += tx.amount;
      }

      if (tx.date >= startOfMonth) {
        if (tx.type === 'RECETTE') metric.monthlyRevenue += tx.amount;
        if (tx.type === 'DEPENSE') metric.monthlyExpenses += tx.amount;
      }
    }

    const metrics = Array.from(farmMetrics.values());
    const regionalMap = new Map<
      string,
      { region: string; farms: number; totalArea: number; cultivatedArea: number; activeCycles: number; monthlyRevenue: number }
    >();

    for (const metric of metrics) {
      const existing = regionalMap.get(metric.region) || {
        region: metric.region,
        farms: 0,
        totalArea: 0,
        cultivatedArea: 0,
        activeCycles: 0,
        monthlyRevenue: 0,
      };
      existing.farms += 1;
      existing.totalArea += metric.totalArea;
      existing.cultivatedArea += metric.cultivatedArea;
      existing.activeCycles += metric.activeCycles;
      existing.monthlyRevenue += metric.monthlyRevenue;
      regionalMap.set(metric.region, existing);
    }

    const topPerformers = metrics
      .map((metric) => {
        const balance = metric.monthlyRevenue - metric.monthlyExpenses;
        const utilization = metric.totalArea > 0 ? metric.cultivatedArea / metric.totalArea : 0;
        const presentRate =
          metric.employeeCount > 0 ? metric.presentToday / metric.employeeCount : 1;
        const performanceScore = Math.round(
          balance / 1000 +
            metric.activeCycles * 3 +
            utilization * 20 +
            presentRate * 10 -
            metric.stockCriticalCount * 2 -
            metric.expiringCertifications * 3,
        );

        return {
          farmId: metric.farmId,
          farmName: metric.farmName,
          region: metric.region,
          totalArea: this.round(metric.totalArea),
          cultivatedArea: this.round(metric.cultivatedArea),
          activeCycles: metric.activeCycles,
          monthlyRevenue: this.round(metric.monthlyRevenue),
          monthlyExpenses: this.round(metric.monthlyExpenses),
          monthlyBalance: this.round(balance),
          stockCriticalCount: metric.stockCriticalCount,
          expiringCertifications: metric.expiringCertifications,
          performanceScore,
        };
      })
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 6);

    const riskFarms = metrics
      .map((metric) => {
        const reasons: string[] = [];
        const balance = metric.monthlyRevenue - metric.monthlyExpenses;
        const presentRate =
          metric.employeeCount > 0 ? metric.presentToday / metric.employeeCount : 1;

        let riskScore = 0;
        if (balance < 0) {
          riskScore += 35;
          reasons.push('Cash-flow negatif sur le mois');
        }
        if (metric.stockCriticalCount >= 3) {
          riskScore += 25;
          reasons.push('Pression stock (3+ articles critiques)');
        }
        if (metric.expiringCertifications > 0) {
          riskScore += 20;
          reasons.push('Certifications proches expiration');
        }
        if (metric.employeeCount >= 10 && presentRate < 0.75) {
          riskScore += 15;
          reasons.push('Presence equipe faible');
        }
        if (metric.activeCycles === 0) {
          riskScore += 10;
          reasons.push('Aucun cycle actif');
        }

        return {
          farmId: metric.farmId,
          farmName: metric.farmName,
          region: metric.region,
          riskScore,
          reasons,
          monthlyBalance: this.round(balance),
          stockCriticalCount: metric.stockCriticalCount,
          expiringCertifications: metric.expiringCertifications,
          presentRate: this.round(presentRate * 100),
        };
      })
      .filter((farm) => farm.riskScore > 0)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 6);

    const operationalAlerts = riskFarms
      .flatMap((farm) =>
        farm.reasons.map((reason) => ({
          farmId: farm.farmId,
          farmName: farm.farmName,
          severity: farm.riskScore >= 60 ? 'high' : 'medium',
          type: 'operational-risk',
          message: `${farm.farmName}: ${reason}`,
        })),
      )
      .slice(0, 10);

    const summary = metrics.reduce(
      (acc, metric) => {
        acc.farmsCount += 1;
        acc.totalArea += metric.totalArea;
        acc.cultivatedArea += metric.cultivatedArea;
        acc.activeCycles += metric.activeCycles;
        acc.harvestReady += metric.harvestReady;
        acc.employees += metric.employeeCount;
        acc.presentEmployees += metric.presentToday;
        acc.payrollMonthlyEstimate += metric.payrollEstimate;
        acc.monthlyRevenue += metric.monthlyRevenue;
        acc.monthlyExpenses += metric.monthlyExpenses;
        acc.stockCriticalCount += metric.stockCriticalCount;
        acc.expiringCertifications30d += metric.expiringCertifications;
        return acc;
      },
      {
        farmsCount: 0,
        totalArea: 0,
        cultivatedArea: 0,
        activeCycles: 0,
        harvestReady: 0,
        employees: 0,
        presentEmployees: 0,
        payrollMonthlyEstimate: 0,
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        stockCriticalCount: 0,
        expiringCertifications30d: 0,
      },
    );

    const monthlySeries = Array.from(monthBucketMap.values()).map((bucket) => ({
      month: bucket.label,
      revenue: this.round(bucket.revenue),
      expenses: this.round(bucket.expenses),
      balance: this.round(bucket.revenue - bucket.expenses),
    }));

    return {
      period: {
        months: safeMonths,
        startDate: startOfSeries.toISOString(),
        endDate: now.toISOString(),
      },
      summary: {
        ...summary,
        monthlyBalance: this.round(summary.monthlyRevenue - summary.monthlyExpenses),
      },
      monthlySeries,
      regionalBreakdown: Array.from(regionalMap.values()).map((region) => ({
        ...region,
        totalArea: this.round(region.totalArea),
        cultivatedArea: this.round(region.cultivatedArea),
        monthlyRevenue: this.round(region.monthlyRevenue),
      })),
      topPerformers,
      riskFarms,
      operationalAlerts,
    };
  }

  private async getMonthlySum(
    farmId: string,
    startDate: Date,
    type: TransactionType,
    endDate?: Date,
  ): Promise<number> {
    const accounts = await this.prisma.bankAccount.findMany({
      where: { farmId },
      select: { id: true },
    });
    if (accounts.length === 0) return 0;

    const dateFilter = endDate ? { gte: startDate, lte: endDate } : { gte: startDate };
    const result = await this.prisma.transaction.aggregate({
      where: {
        accountId: { in: accounts.map((account) => account.id) },
        type,
        date: dateFilter,
      },
      _sum: { amount: true },
    });

    return result._sum.amount || 0;
  }

  private async getMonthlySeriesForFarms(farmIds: string[], months: number) {
    const now = new Date();
    const startOfSeries = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const buckets = this.createMonthBuckets(months, now);
    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, { ...bucket }]));

    const accounts = await this.prisma.bankAccount.findMany({
      where: { farmId: { in: farmIds } },
      select: { id: true },
    });
    if (accounts.length === 0) {
      return buckets.map((bucket) => ({
        month: bucket.label,
        revenue: 0,
        expenses: 0,
      }));
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        accountId: { in: accounts.map((account) => account.id) },
        date: { gte: startOfSeries },
      },
      select: { type: true, amount: true, date: true },
    });

    for (const tx of transactions) {
      const key = this.toMonthKey(tx.date);
      const bucket = bucketMap.get(key);
      if (!bucket) continue;
      if (tx.type === 'RECETTE') bucket.revenue += tx.amount;
      if (tx.type === 'DEPENSE') bucket.expenses += tx.amount;
    }

    return Array.from(bucketMap.values()).map((bucket) => ({
      month: bucket.label,
      revenue: this.round(bucket.revenue),
      expenses: this.round(bucket.expenses),
    }));
  }

  private async getCropSplit(farmId: string) {
    const cycles = await this.prisma.cultureCycle.findMany({
      where: { parcel: { farmId } },
      select: { cropType: true },
    });
    if (cycles.length === 0) return [];

    const groups = new Map<string, number>();
    for (const cycle of cycles) {
      const group = this.mapCropToGroup(cycle.cropType);
      groups.set(group, (groups.get(group) || 0) + 1);
    }

    const colors: Record<string, string> = {
      Agrumes: '#FF6F00',
      Oliviers: '#1B7340',
      Maraichage: '#0288D1',
      Cereales: '#6D4C41',
      Legumineuses: '#7B1FA2',
      Autres: '#546E7A',
    };

    return Array.from(groups.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        value: this.round((count / cycles.length) * 100),
        color: colors[name] || '#1B7340',
      }));
  }

  private async getRecentActivities(farmId: string) {
    const activities = await this.prisma.farmActivity.findMany({
      where: { cycle: { parcel: { farmId } } },
      orderBy: { date: 'desc' },
      take: 5,
      select: {
        description: true,
        date: true,
        type: true,
        cycle: { select: { parcel: { select: { name: true } } } },
      },
    });

    return activities.map((activity) => ({
      text: `${activity.type} - ${activity.cycle.parcel.name}`,
      description: activity.description,
      timestamp: activity.date.toISOString(),
      time: this.relativeTime(activity.date),
      color: this.activityColor(activity.type),
    }));
  }

  private buildEmptyKpis() {
    return {
      farm: { totalArea: 0, cultivatedArea: 0, parcelsCount: 0 },
      cultures: { activeCycles: 0 },
      stock: { alertsCount: 0, totalProducts: 0 },
      finance: { monthlyRevenue: 0, monthlyExpenses: 0, balance: 0 },
      hr: { totalEmployees: 0, presentToday: 0 },
      compliance: { activeCertifications: 0, expiringCount: 0 },
      totalArea: 0,
      cultivatedArea: 0,
      activeCycles: 0,
      harvestReady: 0,
      employees: 0,
      presentEmployees: 0,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      periodLabel: this.getCurrentPeriodLabel(new Date()),
      cycleTrend: 0,
      revenueTrend: 0,
      monthlySeries: [],
      cropSplit: [],
      recentActivities: [],
    };
  }

  private async resolveFarm(tenantId: string, farmId?: string) {
    if (farmId) {
      const farm = await this.prisma.farm.findFirst({
        where: { id: farmId, tenantId },
        include: { parcels: true },
      });
      if (!farm) {
        throw new NotFoundException(
          'Ferme introuvable pour ce tenant. Verifiez la selection active.',
        );
      }
      return farm;
    }

    return this.prisma.farm.findFirst({
      where: { tenantId },
      include: { parcels: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  private getDayBounds(now: Date) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return { today, tomorrow };
  }

  private calculateTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return this.round(((current - previous) / Math.abs(previous)) * 100);
  }

  private round(value: number) {
    return Math.round(value * 100) / 100;
  }

  private toMonthKey(date: Date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  }

  private createMonthBuckets(months: number, now: Date) {
    const labels = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
    const buckets: Array<{ key: string; label: string; revenue: number; expenses: number }> = [];
    for (let i = months - 1; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: this.toMonthKey(date),
        label: labels[date.getMonth()],
        revenue: 0,
        expenses: 0,
      });
    }
    return buckets;
  }

  private getCurrentPeriodLabel(now: Date) {
    const labels = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
    return `${labels[now.getMonth()]} ${now.getFullYear()}`;
  }

  private mapCropToGroup(cropType: string) {
    if (cropType.startsWith('AGRUMES')) return 'Agrumes';
    if (cropType === 'OLIVIER') return 'Oliviers';
    if (['TOMATE', 'POMME_DE_TERRE', 'OIGNON', 'POIVRON', 'COURGETTE', 'HARICOT_VERT', 'CAROTTE', 'NAVET', 'PASTEQUE', 'MELON', 'FRAISE', 'CONCOMBRE', 'AUBERGINE'].includes(cropType)) {
      return 'Maraichage';
    }
    if (['BLE_TENDRE', 'BLE_DUR', 'ORGE', 'MAIS', 'RIZ'].includes(cropType)) {
      return 'Cereales';
    }
    if (['LENTILLES', 'POIS_CHICHES', 'FEVES', 'PETIT_POIS'].includes(cropType)) {
      return 'Legumineuses';
    }
    return 'Autres';
  }

  private relativeTime(date: Date) {
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'Hier' : `Il y a ${days} jours`;
  }

  private activityColor(type: string) {
    const colorMap: Record<string, string> = {
      RECOLTE: 'text-emerald-500',
      TRAITEMENT_PHYTO: 'text-sky-500',
      IRRIGATION: 'text-primary',
      FERTILISATION: 'text-amber-500',
    };
    return colorMap[type] || 'text-muted-foreground';
  }

  private formatRegionLabel(region: string) {
    return region
      .split('_')
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ');
  }

  private clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }
}
