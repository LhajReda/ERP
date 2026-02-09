import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Mes notifications' })
  findAll(@CurrentUser('id') userId: string, @Query('unreadOnly') unreadOnly?: string) {
    return this.notificationService.findByUser(userId, unreadOnly === 'true');
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Nombre de notifications non lues' })
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer comme lue' })
  markAsRead(@Param('id') id: string) { return this.notificationService.markAsRead(id); }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marquer toutes comme lues' })
  markAllAsRead(@CurrentUser('id') userId: string) { return this.notificationService.markAllAsRead(userId); }
}
