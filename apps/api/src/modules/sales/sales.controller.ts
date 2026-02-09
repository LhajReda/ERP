import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  @ApiOperation({ summary: 'Creer un client' })
  create(@Body() dto: CreateClientDto) { return this.clientService.create(dto); }

  @Get('farm/:farmId')
  @ApiOperation({ summary: 'Clients d\'une exploitation' })
  findByFarm(@Param('farmId') farmId: string, @Query() query: PaginationDto) { return this.clientService.findByFarm(farmId, query); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.clientService.findOne(id); }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  update(@Param('id') id: string, @Body() dto: Partial<CreateClientDto>) { return this.clientService.update(id, dto); }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) { return this.clientService.delete(id); }
}
