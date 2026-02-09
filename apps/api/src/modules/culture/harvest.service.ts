import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHarvestDto } from './dto/create-harvest.dto';

@Injectable()
export class HarvestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHarvestDto) {
    const harvest = await this.prisma.harvest.create({
      data: { ...dto, date: new Date(dto.date) },
    });
    await this.prisma.cultureCycle.update({
      where: { id: dto.cycleId },
      data: { actualYield: { increment: dto.quantity } },
    });
    return harvest;
  }

  async findByCycle(cycleId: string) {
    return this.prisma.harvest.findMany({ where: { cycleId }, orderBy: { date: 'desc' } });
  }

  async getYieldStats(farmId: string) {
    const cycles = await this.prisma.cultureCycle.findMany({
      where: { parcel: { farmId }, status: { in: ['RECOLTE', 'TERMINE'] } },
      select: { cropType: true, actualYield: true, estimatedYield: true, totalCost: true, totalRevenue: true },
    });
    return cycles.reduce(
      (acc: Record<string, { totalYield: number; totalCost: number; totalRevenue: number; count: number }>, c: any) => {
        const key = c.cropType;
        if (!acc[key]) acc[key] = { totalYield: 0, totalCost: 0, totalRevenue: 0, count: 0 };
        acc[key].totalYield += c.actualYield ?? 0;
        acc[key].totalCost += c.totalCost;
        acc[key].totalRevenue += c.totalRevenue;
        acc[key].count++;
        return acc;
      },
      {} as Record<string, { totalYield: number; totalCost: number; totalRevenue: number; count: number }>,
    );
  }
}
