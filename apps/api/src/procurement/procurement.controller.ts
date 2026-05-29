import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('procurement')
@UseGuards(JwtAuthGuard)
export class ProcurementController {
  constructor(private procurementService: ProcurementService) {}

  @Get('history')
  getPurchaseHistory(
    @Query('search') search: string,
    @CurrentUser() user: any,
  ) {
    return this.procurementService.getPurchaseHistory(user.pharmacyId, search);
  }

  @Get('reorder')
  getReorderList(@CurrentUser() user: any) {
    return this.procurementService.getReorderList(user.pharmacyId);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.procurementService.getStats(user.pharmacyId);
  }
}
