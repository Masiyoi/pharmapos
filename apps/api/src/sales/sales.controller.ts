import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Post()
  createSale(@Body() dto: CreateSaleDto, @CurrentUser() user: any) {
    return this.salesService.createSale(dto, user.id, user.pharmacyId);
  }

  @Get()
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.salesService.findAll(user.branchId, query, user.id, user.role);
  }

  @Get('summary/daily')
  getDailySummary(@Query('date') date: string, @CurrentUser() user: any) {
    return this.salesService.getDailySummary(user.branchId, date, user.id, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }
}
