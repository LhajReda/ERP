import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAttendanceDto) {
    const date = new Date(dto.date);
    return this.prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: dto.employeeId, date } },
      update: { ...dto, date, checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined, checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined },
      create: { ...dto, date, checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined, checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined },
    });
  }

  async getTodayAttendance(farmId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.prisma.attendance.findMany({
      where: { employee: { farmId }, date: { gte: today, lt: tomorrow } },
      include: { employee: { select: { firstName: true, lastName: true, role: true } } },
    });
  }

  async getMonthlyReport(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const attendances = await this.prisma.attendance.findMany({
      where: { employeeId, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    });
    const daysWorked = attendances.filter((a) => a.status === 'PRESENT' || a.status === 'DEMI_JOURNEE').length;
    const totalHours = attendances.reduce((s, a) => s + a.hoursWorked, 0);
    const totalOvertime = attendances.reduce((s, a) => s + a.overtime, 0);
    return { employeeId, month, year, daysWorked, totalHours, totalOvertime, attendances };
  }
}
