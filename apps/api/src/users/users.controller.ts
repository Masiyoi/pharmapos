import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAll(@CurrentUser() user: any) {
    return this.usersService.findAllStaff(user.pharmacyId);
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getStats(@CurrentUser() user: any) {
    return this.usersService.getStaffStats(user.pharmacyId);
  }

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createStaff(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.usersService.createStaff(dto, user.pharmacyId, user.role);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  updateStaff(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.updateStaff(id, dto, user.pharmacyId, user.role);
  }

  @Patch(':id/toggle-active')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  toggleActive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.toggleActive(id, user.pharmacyId, user.id);
  }

  @Patch('me/change-password')
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: any) {
    return this.usersService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  @Patch(':id/reset-password')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  resetPassword(
    @Param('id') id: string,
    @Body('newPassword') newPassword: string,
    @CurrentUser() user: any,
  ) {
    return this.usersService.resetPassword(id, newPassword, user.pharmacyId);
  }
}
