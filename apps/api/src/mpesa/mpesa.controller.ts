import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { MpesaService } from './mpesa.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('mpesa')
export class MpesaController {
  constructor(private mpesaService: MpesaService) {}

  @Post('stk-push')
  @UseGuards(JwtAuthGuard)
  stkPush(@Body() body: { phone: string; amount: number; saleId: string; receiptNo: string }) {
    return this.mpesaService.stkPush(body.phone, body.amount, body.saleId, body.receiptNo);
  }

  @Post('callback')
  callback(@Body() body: any) {
    return this.mpesaService.handleCallback(body);
  }

  @Get('status/:id')
  @UseGuards(JwtAuthGuard)
  queryStatus(@Param('id') id: string) {
    return this.mpesaService.queryStatus(id);
  }
}
