import {
  Controller, Get, Post, Put, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PHARMACIST)
  create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    return this.productsService.create(dto, user.pharmacyId);
  }

  @Get()
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.productsService.findAll(user.pharmacyId, query);
  }

  @Get('reports/expiry')
  getExpiryReport(@Query('days') days: string, @CurrentUser() user: any) {
    return this.productsService.getExpiryReport(user.pharmacyId, parseInt(days || '90'));
  }

  @Get('reports/low-stock')
  getLowStockReport(@CurrentUser() user: any) {
    return this.productsService.getLowStockReport(user.pharmacyId);
  }

  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string, @CurrentUser() user: any) {
    return this.productsService.findByBarcode(barcode, user.pharmacyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.findOne(id, user.pharmacyId);
  }

  @Post(':id/batches')
  @Roles(Role.ADMIN, Role.PHARMACIST)
  addBatch(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.productsService.addBatch(id, user.pharmacyId, dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.PHARMACIST)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: any) {
    return this.productsService.update(id, dto, user.pharmacyId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.remove(id, user.pharmacyId);
  }
}
