import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateActivityDto, userId: string) {
    const activity = await this.prisma.farmActivity.create({
      data: { ...dto, date: new Date(dto.date), cost: dto.cost ?? 0, createdBy: userId },
    });
    if (dto.cost && dto.cost > 0) {
      await this.prisma.cultureCycle.update({
        where: { id: dto.cycleId },
        data: { totalCost: { increment: dto.cost } },
      });
    }
    return activity;
  }

  async findByCycle(cycleId: string) {
    return this.prisma.farmActivity.findMany({
      where: { cycleId },
      orderBy: { date: 'desc' },
    });
  }

  async findByDateRange(farmId: string, startDate: Date, endDate: Date) {
    return this.prisma.farmActivity.findMany({
      where: {
        cycle: { parcel: { farmId } },
        date: { gte: startDate, lte: endDate },
      },
      include: { cycle: { select: { cropType: true, variety: true, parcel: { select: { name: true } } } } },
      orderBy: { date: 'desc' },
    });
  }
}
