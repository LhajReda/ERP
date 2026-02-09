import { Module } from '@nestjs/common';
import { CultureService } from './culture.service';
import { ActivityService } from './activity.service';
import { HarvestService } from './harvest.service';
import { CultureController, ActivityController, HarvestController } from './culture.controller';

@Module({
  controllers: [CultureController, ActivityController, HarvestController],
  providers: [CultureService, ActivityService, HarvestService],
  exports: [CultureService, ActivityService, HarvestService],
})
export class CultureModule {}
