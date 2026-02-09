import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './sales.controller';

@Module({
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class SalesModule {}
