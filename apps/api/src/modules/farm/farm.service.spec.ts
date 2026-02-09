import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { FarmService } from './farm.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('FarmService', () => {
  let service: FarmService;
  let prisma: any;

  const mockFarm = {
    id: 'farm-1',
    name: 'Domaine Al Baraka',
    region: 'SOUSS_MASSA',
    province: 'Taroudant',
    commune: 'Oulad Teima',
    totalArea: 85,
    farmType: 'IRRIGUE',
    waterSource: 'FORAGE',
    tenantId: 'tenant-1',
    _count: { parcels: 4, employees: 7 },
  };

  beforeEach(async () => {
    prisma = {
      farm: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(mockFarm),
        findMany: jest.fn().mockResolvedValue([mockFarm]),
        create: jest.fn().mockResolvedValue(mockFarm),
        update: jest.fn().mockResolvedValue(mockFarm),
        delete: jest.fn().mockResolvedValue(mockFarm),
        count: jest.fn().mockResolvedValue(1),
      },
      cultureCycle: { count: jest.fn().mockResolvedValue(0) },
      employee: { count: jest.fn().mockResolvedValue(0) },
      invoice: { count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn().mockImplementation((queries) => Promise.all(queries)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FarmService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FarmService>(FarmService);
  });

  describe('create', () => {
    it('should create a farm successfully', async () => {
      const dto = {
        name: 'Domaine Al Baraka',
        region: 'SOUSS_MASSA' as any,
        province: 'Taroudant',
        commune: 'Oulad Teima',
        totalArea: 85,
        farmType: 'IRRIGUE' as any,
        waterSource: 'FORAGE' as any,
      };
      const result = await service.create('tenant-1', 'user-1', dto);
      expect(result).toBeDefined();
      expect(prisma.farm.create).toHaveBeenCalled();
    });

    it('should reject duplicate ICE', async () => {
      prisma.farm.findUnique.mockResolvedValue(mockFarm);
      const dto = {
        name: 'Test', ice: '001234567890123',
        region: 'SOUSS_MASSA' as any, province: 'Test', commune: 'Test',
        totalArea: 10, farmType: 'IRRIGUE' as any, waterSource: 'PUITS' as any,
      };
      await expect(service.create('tenant-1', 'user-1', dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      prisma.$transaction.mockResolvedValue([[mockFarm], 1]);
      const query = { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' as const, get skip() { return 0; }, get take() { return 20; } };
      const result = await service.findAll('tenant-1', query);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a farm with details', async () => {
      const result = await service.findOne('tenant-1', 'farm-1');
      expect(result.name).toBe('Domaine Al Baraka');
    });

    it('should throw NotFoundException when farm not found', async () => {
      prisma.farm.findFirst.mockResolvedValue(null);
      await expect(service.findOne('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a farm with no active dependencies', async () => {
      const result = await service.remove('tenant-1', 'farm-1');
      expect(result.message).toContain('supprimee');
    });

    it('should reject deletion if active cycles exist', async () => {
      prisma.cultureCycle.count.mockResolvedValue(3);
      await expect(service.remove('tenant-1', 'farm-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject deletion if active employees exist', async () => {
      prisma.employee.count.mockResolvedValue(5);
      await expect(service.remove('tenant-1', 'farm-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject deletion if unpaid invoices exist', async () => {
      prisma.invoice.count.mockResolvedValue(2);
      await expect(service.remove('tenant-1', 'farm-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if farm does not exist', async () => {
      prisma.farm.findFirst.mockResolvedValue(null);
      await expect(service.remove('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
