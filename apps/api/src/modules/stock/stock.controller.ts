import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProductService } from './product.service';
import { MovementService } from './movement.service';
import { SupplierService } from './supplier.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UserRole, ProductCategory } from '@prisma/client';

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE)
  @ApiOperation({ summary: 'Creer un produit/intrant' })
  create(@Body() dto: CreateProductDto) { return this.productService.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Lister les produits' })
  findAll(@Query() query: PaginationDto, @Query('farmId') farmId?: string, @Query('category') category?: ProductCategory) {
    return this.productService.findAll(query, { farmId, category });
  }

  @Get('low-stock-alerts/:farmId')
  @ApiOperation({ summary: 'Alertes stock bas' })
  getLowStock(@Param('farmId') farmId: string) { return this.productService.getLowStockAlerts(farmId); }

  @Get(':id')
  @ApiOperation({ summary: 'Detail d\'un produit' })
  findOne(@Param('id') id: string) { return this.productService.findOne(id); }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE)
  update(@Param('id') id: string, @Body() dto: Partial<CreateProductDto>) { return this.productService.update(id, dto); }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) { return this.productService.delete(id); }
}

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock-movements')
export class MovementController {
  constructor(private readonly movementService: MovementService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.CHEF_EQUIPE)
  @ApiOperation({ summary: 'Enregistrer un mouvement de stock' })
  create(@Body() dto: CreateMovementDto, @CurrentUser('id') userId: string) {
    return this.movementService.create(dto, userId);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Mouvements d\'un produit' })
  findByProduct(@Param('productId') productId: string) {
    return this.movementService.findByProduct(productId);
  }
}

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE)
  @ApiOperation({ summary: 'Creer un fournisseur' })
  create(@Body() dto: CreateSupplierDto) { return this.supplierService.create(dto); }

  @Get('farm/:farmId')
  @ApiOperation({ summary: 'Fournisseurs d\'une exploitation' })
  findByFarm(@Param('farmId') farmId: string, @Query() query: PaginationDto) {
    return this.supplierService.findByFarm(farmId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.supplierService.findOne(id); }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE)
  update(@Param('id') id: string, @Body() dto: Partial<CreateSupplierDto>) { return this.supplierService.update(id, dto); }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) { return this.supplierService.delete(id); }
}
