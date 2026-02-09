import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Constantes reglementaires marocaines 2026
const CNSS_EMPLOYEE_RATE = 0.0448;
const CNSS_EMPLOYER_RATE = 0.0898;
const AMO_EMPLOYEE_RATE = 0.0226;
const AMO_EMPLOYER_RATE = 0.0411;
const CNSS_CEILING = 6000;

const IR_BRACKETS = [
  { min: 0, max: 30000, rate: 0, deduction: 0 },
  { min: 30001, max: 50000, rate: 0.1, deduction: 3000 },
  { min: 50001, max: 60000, rate: 0.2, deduction: 8000 },
  { min: 60001, max: 80000, rate: 0.3, deduction: 14000 },
  { min: 80001, max: 180000, rate: 0.34, deduction: 17200 },
  { min: 180001, max: Infinity, rate: 0.38, deduction: 24400 },
];

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateIR(annualTaxableIncome: number): number {
    for (const bracket of IR_BRACKETS) {
      if (annualTaxableIncome >= bracket.min && annualTaxableIncome <= bracket.max) {
        return annualTaxableIncome * bracket.rate - bracket.deduction;
      }
    }
    return 0;
  }

  async calculatePayslip(employeeId: string, month: number, year: number) {
    const employee = await this.prisma.employee.findUniqueOrThrow({ where: { id: employeeId } });

    // Get attendance for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const attendances = await this.prisma.attendance.findMany({
      where: { employeeId, date: { gte: startDate, lte: endDate }, status: { in: ['PRESENT', 'DEMI_JOURNEE'] } },
    });

    const daysWorked = attendances.length;
    const overtimeHours = attendances.reduce((s, a) => s + a.overtime, 0);
    const hourlyRate = employee.dailyRate / 8;

    const baseSalary = daysWorked * employee.dailyRate;
    const overtimePay = overtimeHours * hourlyRate * 1.25;
    const grossSalary = baseSalary + overtimePay;

    // CNSS (plafonné à 6000 MAD)
    const cnssBase = Math.min(grossSalary, CNSS_CEILING);
    const cnssEmployee = Math.round(cnssBase * CNSS_EMPLOYEE_RATE * 100) / 100;
    const cnssEmployer = Math.round(cnssBase * CNSS_EMPLOYER_RATE * 100) / 100;

    // AMO (pas de plafond)
    const amoEmployee = Math.round(grossSalary * AMO_EMPLOYEE_RATE * 100) / 100;
    const amoEmployer = Math.round(grossSalary * AMO_EMPLOYER_RATE * 100) / 100;

    // IR (calcul annualise puis mensualise)
    const annualGross = grossSalary * 12;
    const annualCnss = cnssEmployee * 12;
    const annualAmo = amoEmployee * 12;
    const annualFraisPro = Math.min(annualGross * 0.2, 30000); // Deduction 20% plafonnée
    const annualTaxable = annualGross - annualCnss - annualAmo - annualFraisPro;
    const annualIR = Math.max(0, this.calculateIR(annualTaxable));
    const irAmount = Math.round((annualIR / 12) * 100) / 100;

    const netSalary = Math.round((grossSalary - cnssEmployee - amoEmployee - irAmount) * 100) / 100;

    return this.prisma.payslip.upsert({
      where: { employeeId_month_year: { employeeId, month, year } },
      update: { daysWorked, overtimeHours, baseSalary, overtimePay, cnssEmployee, cnssEmployer, amoEmployee, amoEmployer, irAmount, netSalary },
      create: { employeeId, month, year, daysWorked, overtimeHours, baseSalary, overtimePay, cnssEmployee, cnssEmployer, amoEmployee, amoEmployer, irAmount, netSalary },
    });
  }

  async generateMonthlyPayroll(farmId: string, month: number, year: number) {
    const employees = await this.prisma.employee.findMany({ where: { farmId, isActive: true } });
    const payslips = await Promise.all(employees.map((e) => this.calculatePayslip(e.id, month, year)));
    const totalNet = payslips.reduce((s, p) => s + p.netSalary, 0);
    const totalCnssEmployer = payslips.reduce((s, p) => s + p.cnssEmployer, 0);
    const totalAmoEmployer = payslips.reduce((s, p) => s + p.amoEmployer, 0);
    return { payslips, summary: { totalNet, totalCnssEmployer, totalAmoEmployer, totalCost: totalNet + totalCnssEmployer + totalAmoEmployer, employeesCount: payslips.length } };
  }

  async getPayslips(employeeId?: string, month?: number, year?: number) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (month) where.month = month;
    if (year) where.year = year;
    return this.prisma.payslip.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, cin: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }
}
