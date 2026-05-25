import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('daily')
  getDailySummary(@Query('date') date: string, @CurrentUser() user: any) {
    return this.reportsService.getDailySummary(user.pharmacyId, date);
  }

  @Get('trend')
  getSalesTrend(@Query('days') days: string, @CurrentUser() user: any) {
    return this.reportsService.getSalesTrend(user.pharmacyId, parseInt(days || '30'));
  }

  @Get('inventory-valuation')
  getInventoryValuation(@CurrentUser() user: any) {
    return this.reportsService.getInventoryValuation(user.pharmacyId);
  }

  @Get('top-products')
  getTopProducts(@Query('days') days: string, @CurrentUser() user: any) {
    return this.reportsService.getTopProducts(user.pharmacyId, parseInt(days || '30'));
  }

  @Get('payment-methods')
  getPaymentMethods(@Query('days') days: string, @CurrentUser() user: any) {
    return this.reportsService.getPaymentMethodBreakdown(user.pharmacyId, parseInt(days || '30'));
  }

  @Get('monthly')
  getMonthlySummary(@Query('months') months: string, @CurrentUser() user: any) {
    return this.reportsService.getMonthlySummary(user.pharmacyId, parseInt(months || '6'));
  }
}
