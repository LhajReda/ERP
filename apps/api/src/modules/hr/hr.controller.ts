import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { EmployeeService } from './employee.service';
import { AttendanceService } from './attendance.service';
import { PayrollService } from './payroll.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UserRole, EmployeeType } from '@prisma/client';

@ApiTags('HR')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Creer un employe' })
  create(@Body() dto: CreateEmployeeDto) { return this.employeeService.create(dto); }

  @Get('farm/:farmId')
  @ApiOperation({ summary: 'Employes d\'une exploitation' })
  findByFarm(@Param('farmId') farmId: string, @Query() query: PaginationDto, @Query('type') type?: EmployeeType, @Query('active') active?: string) {
    return this.employeeService.findByFarm(farmId, query, { type, isActive: active !== 'false' });
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.employeeService.findOne(id); }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: Partial<CreateEmployeeDto>) { return this.employeeService.update(id, dto); }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Desactiver un employe' })
  deactivate(@Param('id') id: string) { return this.employeeService.deactivate(id); }
}

@ApiTags('HR')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CHEF_EQUIPE)
  @ApiOperation({ summary: 'Enregistrer le pointage' })
  create(@Body() dto: CreateAttendanceDto) { return this.attendanceService.create(dto); }

  @Get('today/:farmId')
  @ApiOperation({ summary: 'Pointage du jour' })
  getToday(@Param('farmId') farmId: string) { return this.attendanceService.getTodayAttendance(farmId); }

  @Get('report/:employeeId')
  @ApiOperation({ summary: 'Rapport mensuel de pointage' })
  getMonthly(@Param('employeeId') employeeId: string, @Query('month') month: number, @Query('year') year: number) {
    return this.attendanceService.getMonthlyReport(employeeId, month, year);
  }
}

@ApiTags('HR')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('calculate/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE)
  @ApiOperation({ summary: 'Calculer un bulletin de paie' })
  calculate(@Param('employeeId') employeeId: string, @Body('month') month: number, @Body('year') year: number) {
    return this.payrollService.calculatePayslip(employeeId, month, year);
  }

  @Post('generate-monthly')
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE)
  @ApiOperation({ summary: 'Generer la paie mensuelle pour toute l\'exploitation' })
  generateMonthly(@Body('farmId') farmId: string, @Body('month') month: number, @Body('year') year: number) {
    return this.payrollService.generateMonthlyPayroll(farmId, month, year);
  }

  @Get('payslips')
  @ApiOperation({ summary: 'Consulter les bulletins de paie' })
  getPayslips(@Query('employeeId') employeeId?: string, @Query('month') month?: number, @Query('year') year?: number) {
    return this.payrollService.getPayslips(employeeId, month, year);
  }
}
