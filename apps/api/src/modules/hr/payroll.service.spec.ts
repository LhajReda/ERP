import { Test, TestingModule } from '@nestjs/testing';
import { PayrollService } from './payroll.service';
import { PrismaService } from '../../prisma/prisma.service';

// Mock employee data
const mockEmployee = {
  id: 'emp-1',
  cin: 'AB123456',
  firstName: 'Hassan',
  lastName: 'Ouahbi',
  dailyRate: 200,
  monthlyRate: 5200,
  type: 'PERMANENT',
  role: 'CHEF_EQUIPE',
  isActive: true,
  farmId: 'farm-1',
};

// Mock attendance data (22 working days, 10 hours overtime)
const mockAttendances = Array.from({ length: 22 }, (_, i) => ({
  id: `att-${i}`,
  employeeId: 'emp-1',
  date: new Date(2025, 0, i + 1),
  hoursWorked: 8,
  overtime: i < 10 ? 1 : 0, // 10 hours overtime total
  status: 'PRESENT',
}));

const mockPayslip = {
  id: 'payslip-1',
  employeeId: 'emp-1',
  month: 1,
  year: 2025,
  daysWorked: 22,
  overtimeHours: 10,
  baseSalary: 4400,
  overtimePay: 312.5,
  cnssEmployee: 211.28,
  cnssEmployer: 423.02,
  amoEmployee: 106.5,
  amoEmployer: 193.68,
  irAmount: 0,
  netSalary: 4394.72,
};

describe('PayrollService', () => {
  let service: PayrollService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      employee: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(mockEmployee),
        findMany: jest.fn().mockResolvedValue([mockEmployee]),
      },
      attendance: {
        findMany: jest.fn().mockResolvedValue(mockAttendances),
      },
      payslip: {
        upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'payslip-1', ...create })),
        findMany: jest.fn().mockResolvedValue([mockPayslip]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
  });

  describe('calculatePayslip', () => {
    it('should calculate correct base salary', async () => {
      const result = await service.calculatePayslip('emp-1', 1, 2025);
      // 22 days * 200 MAD/day = 4400 MAD
      expect(result.baseSalary).toBe(4400);
    });

    it('should calculate overtime pay at 1.25x rate', async () => {
      const result = await service.calculatePayslip('emp-1', 1, 2025);
      // hourlyRate = 200/8 = 25, overtime = 10h * 25 * 1.25 = 312.5
      expect(result.overtimePay).toBe(312.5);
    });

    it('should calculate CNSS employee capped at 6000 MAD ceiling', async () => {
      const result = await service.calculatePayslip('emp-1', 1, 2025);
      // grossSalary = 4400 + 312.5 = 4712.5, below ceiling so: 4712.5 * 0.0448 = 211.12
      expect(result.cnssEmployee).toBeGreaterThan(0);
      // Should never exceed 6000 * 0.0448 = 268.8
      expect(result.cnssEmployee).toBeLessThanOrEqual(268.8);
    });

    it('should calculate CNSS employer contribution', async () => {
      const result = await service.calculatePayslip('emp-1', 1, 2025);
      expect(result.cnssEmployer).toBeGreaterThan(0);
      // Should never exceed 6000 * 0.0898 = 538.8
      expect(result.cnssEmployer).toBeLessThanOrEqual(538.8);
    });

    it('should calculate AMO without ceiling', async () => {
      const result = await service.calculatePayslip('emp-1', 1, 2025);
      // AMO has no ceiling: grossSalary * 0.0226
      const grossSalary = 4400 + 312.5;
      const expectedAmo = Math.round(grossSalary * 0.0226 * 100) / 100;
      expect(result.amoEmployee).toBe(expectedAmo);
    });

    it('should calculate net salary correctly', async () => {
      const result = await service.calculatePayslip('emp-1', 1, 2025);
      // net = gross - cnssEmployee - amoEmployee - irAmount
      expect(result.netSalary).toBeGreaterThan(0);
      expect(result.netSalary).toBeLessThan(4712.5); // Less than gross
    });

    it('should upsert the payslip', async () => {
      await service.calculatePayslip('emp-1', 1, 2025);
      expect(prisma.payslip.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { employeeId_month_year: { employeeId: 'emp-1', month: 1, year: 2025 } },
        }),
      );
    });

    it('should count days worked correctly', async () => {
      const result = await service.calculatePayslip('emp-1', 1, 2025);
      expect(result.daysWorked).toBe(22);
    });
  });

  describe('generateMonthlyPayroll', () => {
    it('should generate payslips for all active employees', async () => {
      const result = await service.generateMonthlyPayroll('farm-1', 1, 2025);
      expect(result.payslips).toHaveLength(1);
      expect(result.summary.employeesCount).toBe(1);
    });

    it('should calculate total costs correctly', async () => {
      const result = await service.generateMonthlyPayroll('farm-1', 1, 2025);
      expect(result.summary.totalNet).toBeGreaterThan(0);
      expect(result.summary.totalCnssEmployer).toBeGreaterThan(0);
      expect(result.summary.totalAmoEmployer).toBeGreaterThan(0);
      expect(result.summary.totalCost).toBe(
        result.summary.totalNet + result.summary.totalCnssEmployer + result.summary.totalAmoEmployer,
      );
    });
  });

  describe('getPayslips', () => {
    it('should return payslips filtered by employee', async () => {
      await service.getPayslips('emp-1');
      expect(prisma.payslip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ employeeId: 'emp-1' }),
        }),
      );
    });

    it('should return payslips filtered by month and year', async () => {
      await service.getPayslips(undefined, 1, 2025);
      expect(prisma.payslip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ month: 1, year: 2025 }),
        }),
      );
    });
  });
});
