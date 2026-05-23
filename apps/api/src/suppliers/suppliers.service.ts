import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupplierDto, pharmacyId: string) {
    return this.prisma.supplier.create({
      data: { ...dto, pharmacyId },
    });
  }

  async findAll(pharmacyId: string, search?: string) {
    return this.prisma.supplier.findMany({
      where: {
        pharmacyId,
        deletedAt: null,
        isActive: true,
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ]
        } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, pharmacyId, deletedAt: null },
      include: {
        purchases: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto, pharmacyId: string) {
    await this.findOne(id, pharmacyId);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async remove(id: string, pharmacyId: string) {
    await this.findOne(id, pharmacyId);
    return this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
