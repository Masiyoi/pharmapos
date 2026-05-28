import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
export class PrescriptionsController {
  constructor(private prescriptionsService: PrescriptionsService) {}

  @Get()
  findAll(
    @Query('search') search: string,
    @Query('status') status: string,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.findAll(user.pharmacyId, search, status);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.prescriptionsService.getStats(user.pharmacyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.prescriptionsService.findOne(id, user.pharmacyId);
  }

  @Post()
  create(@Body() dto: CreatePrescriptionDto, @CurrentUser() user: any) {
    return this.prescriptionsService.create(dto, user.pharmacyId, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePrescriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.update(id, dto, user.pharmacyId);
  }

  @Patch(':id/dispense')
  dispense(@Param('id') id: string, @CurrentUser() user: any) {
    return this.prescriptionsService.dispense(id, user.pharmacyId, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.prescriptionsService.remove(id, user.pharmacyId);
  }
}
