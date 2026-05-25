import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { pharmacy: true, branch: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { pharmacy: true, branch: true },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: Role;
    pharmacyId: string;
    branchId?: string;
  }) {
    return this.prisma.user.create({ data });
  }

  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  // ─── Staff Management ────────────────────────────────────────────────────

  async findAllStaff(pharmacyId: string) {
    return this.prisma.user.findMany({
      where: { pharmacyId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStaff(dto: CreateUserDto, pharmacyId: string, creatorRole: Role) {
    // Only ADMIN and SUPER_ADMIN can create staff
    if (creatorRole !== Role.ADMIN && creatorRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only admins can create staff accounts');
    }

    // ADMIN cannot create another ADMIN or SUPER_ADMIN
    if (creatorRole === Role.ADMIN && (dto.role === Role.ADMIN || dto.role === Role.SUPER_ADMIN)) {
      throw new ForbiddenException('You cannot create accounts with equal or higher permissions');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        pharmacyId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
        branchId: dto.branchId || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
      },
    });
  }

  async updateStaff(id: string, dto: UpdateUserDto, pharmacyId: string, updaterRole: Role) {
    const user = await this.prisma.user.findFirst({
      where: { id, pharmacyId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    // Cannot modify SUPER_ADMIN unless you are SUPER_ADMIN
    if (user.role === Role.SUPER_ADMIN && updaterRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot modify super admin');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        branch: { select: { id: true, name: true } },
      },
    });
  }

  async toggleActive(id: string, pharmacyId: string, requesterId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, pharmacyId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.id === requesterId) throw new BadRequestException('Cannot deactivate yourself');

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true, firstName: true, lastName: true },
    });
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { message: 'Password changed successfully' };
  }

  async resetPassword(id: string, newPassword: string, pharmacyId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, pharmacyId } });
    if (!user) throw new NotFoundException('User not found');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { message: 'Password reset successfully' };
  }

  async getStaffStats(pharmacyId: string) {
    const all = await this.prisma.user.findMany({
      where: { pharmacyId, deletedAt: null },
      select: { role: true, isActive: true },
    });
    const byRole: Record<string, number> = {};
    let active = 0;
    for (const u of all) {
      byRole[u.role] = (byRole[u.role] || 0) + 1;
      if (u.isActive) active++;
    }
    return { total: all.length, active, byRole };
  }
}
