import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { MovementService } from './movement.service';
import { SupplierService } from './supplier.service';
import { ProductController, MovementController, SupplierController } from './stock.controller';

@Module({
  controllers: [ProductController, MovementController, SupplierController],
  providers: [ProductService, MovementService, SupplierService],
  exports: [ProductService, MovementService, SupplierService],
})
export class StockModule {}
