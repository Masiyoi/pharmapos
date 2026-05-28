import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll(pharmacyId: string) {
    return this.prisma.branch.findMany({
      where: { pharmacyId, isActive: true },
      include: {
        _count: {
          select: { users: true, sales: true, purchases: true },
        },
      },
      orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, pharmacyId, isActive: true },
      include: {
        users: {
          where: { deletedAt: null, isActive: true },
          select: {
            id: true, firstName: true, lastName: true,
            email: true, role: true, lastLoginAt: true,
          },
        },
        _count: { select: { sales: true, purchases: true } },
      },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async create(dto: CreateBranchDto, pharmacyId: string) {
    // If marking as main, unset current main branch first
    if (dto.isMain) {
      await this.prisma.branch.updateMany({
        where: { pharmacyId, isMain: true },
        data: { isMain: false },
      });
    }

    return this.prisma.branch.create({
      data: {
        ...dto,
        pharmacyId,
        isMain: dto.isMain ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateBranchDto, pharmacyId: string) {
    await this.findOne(id, pharmacyId);

    // If marking as main, unset other main branches
    if (dto.isMain) {
      await this.prisma.branch.updateMany({
        where: { pharmacyId, isMain: true, NOT: { id } },
        data: { isMain: false },
      });
    }

    return this.prisma.branch.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, pharmacyId: string) {
    const branch = await this.findOne(id, pharmacyId);

    if (branch.isMain) {
      throw new BadRequestException('Cannot delete the main branch');
    }

    // Check if branch has active users
    const activeUsers = await this.prisma.user.count({
      where: { branchId: id, deletedAt: null, isActive: true },
    });
    if (activeUsers > 0) {
      throw new BadRequestException(
        `Cannot delete branch with ${activeUsers} active staff member(s). Reassign them first.`
      );
    }

    return this.prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats(pharmacyId: string) {
    const branches = await this.prisma.branch.findMany({
      where: { pharmacyId, isActive: true },
      include: { _count: { select: { users: true, sales: true } } },
    });

    return {
      total: branches.length,
      totalStaff: branches.reduce((s, b) => s + b._count.users, 0),
      totalSales: branches.reduce((s, b) => s + b._count.sales, 0),
    };
  }
}
