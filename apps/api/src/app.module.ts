import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { FarmModule } from './modules/farm/farm.module';
import { ParcelModule } from './modules/parcel/parcel.module';
import { CultureModule } from './modules/culture/culture.module';
import { StockModule } from './modules/stock/stock.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HRModule } from './modules/hr/hr.module';
import { SalesModule } from './modules/sales/sales.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AgentModule } from './modules/agents/agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    TenantModule,
    FarmModule,
    ParcelModule,
    CultureModule,
    StockModule,
    FinanceModule,
    HRModule,
    SalesModule,
    ComplianceModule,
    DashboardModule,
    NotificationModule,
    AgentModule,
  ],
})
export class AppModule {}
