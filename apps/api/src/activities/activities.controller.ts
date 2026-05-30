import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.PHARMACIST)
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get('sales')
  getSales(
    @Query('branchId') branchId: string,
    @Query('userId')   userId: string,
    @Query('period')   period: string,
    @CurrentUser()     user: any,
  ) {
    return this.activitiesService.getSalesHistory(
      user.pharmacyId, branchId, userId, period
    );
  }

  @Get('prescriptions')
  getPrescriptions(
    @Query('branchId') branchId: string,
    @Query('userId')   userId: string,
    @Query('period')   period: string,
    @CurrentUser()     user: any,
  ) {
    return this.activitiesService.getPrescriptionLogs(
      user.pharmacyId, branchId, userId, period
    );
  }

  @Get('branches')
  getBranches(@CurrentUser() user: any) {
    return this.activitiesService.getBranches(user.pharmacyId);
  }

  @Get('staff')
  getStaff(@CurrentUser() user: any) {
    return this.activitiesService.getStaff(user.pharmacyId);
  }
}
