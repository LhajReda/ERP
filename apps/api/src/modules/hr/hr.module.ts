import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { AttendanceService } from './attendance.service';
import { PayrollService } from './payroll.service';
import { EmployeeController, AttendanceController, PayrollController } from './hr.controller';

@Module({
  controllers: [EmployeeController, AttendanceController, PayrollController],
  providers: [EmployeeService, AttendanceService, PayrollService],
  exports: [EmployeeService, AttendanceService, PayrollService],
})
export class HRModule {}
