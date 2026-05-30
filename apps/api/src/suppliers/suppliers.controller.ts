import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SupplierProductsService } from './supplier-products.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(
    private suppliersService: SuppliersService,
    private supplierProductsService: SupplierProductsService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.PHARMACIST)
  create(@Body() dto: CreateSupplierDto, @CurrentUser() user: any) {
    return this.suppliersService.create(dto, user.pharmacyId);
  }

  @Get()
  findAll(@Query('search') search: string, @CurrentUser() user: any) {
    return this.suppliersService.findAll(user.pharmacyId, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.suppliersService.findOne(id, user.pharmacyId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.PHARMACIST)
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto, @CurrentUser() user: any) {
    return this.suppliersService.update(id, dto, user.pharmacyId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.suppliersService.remove(id, user.pharmacyId);
  }
  @Get(':id/products')
getSupplierProducts(@Param('id') id: string, @CurrentUser() user: any) {
  return this.supplierProductsService.getBySupplier(id, user.pharmacyId);
}

@Post(':id/products')
addSupplierProduct(
  @Param('id') id: string,
  @Body() body: { productId: string; quotedPrice: number; notes?: string },
  @CurrentUser() user: any,
) {
  return this.supplierProductsService.upsert(id, user.pharmacyId, body);
}

@Delete(':id/products/:productId')
removeSupplierProduct(
  @Param('id') id: string,
  @Param('productId') productId: string,
  @CurrentUser() user: any,
) {
  return this.supplierProductsService.remove(id, productId, user.pharmacyId);
}
}
