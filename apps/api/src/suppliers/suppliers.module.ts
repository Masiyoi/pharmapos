import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { SupplierProductsService } from './supplier-products.service';

@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService, SupplierProductsService],
  exports: [SuppliersService, SupplierProductsService],
})
export class SuppliersModule {}