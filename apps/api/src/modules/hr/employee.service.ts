import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { EmployeeType } from '@prisma/client';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: { ...dto, cin: dto.cin.toUpperCase(), hireDate: new Date(dto.hireDate), birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined },
    });
  }

  async findByFarm(farmId: string, query: PaginationDto, filters?: { type?: EmployeeType; isActive?: boolean }) {
    const { page = 1, limit = 20, search } = query;
    const where: any = { farmId };
    if (filters?.type) where.type = filters.type;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { cin: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { lastName: 'asc' } }),
      this.prisma.employee.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const emp = await this.prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new NotFoundException('Employe introuvable');
    return emp;
  }

  async update(id: string, data: Partial<CreateEmployeeDto>) {
    return this.prisma.employee.update({ where: { id }, data: data as any });
  }

  async deactivate(id: string) {
    return this.prisma.employee.update({ where: { id }, data: { isActive: false, endDate: new Date() } });
  }
}
