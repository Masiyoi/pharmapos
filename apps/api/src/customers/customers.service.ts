import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  private toDateTime(dateStr?: string) {
    if (!dateStr) return undefined;
    return new Date(dateStr + 'T00:00:00.000Z');
  }

  async create(dto: CreateCustomerDto, pharmacyId: string) {
    const { dateOfBirth, ...rest } = dto;
    return this.prisma.customer.create({
      data: {
        ...rest,
        pharmacyId,
        dateOfBirth: this.toDateTime(dateOfBirth),
      },
    });
  }

  async findAll(pharmacyId: string, search?: string) {
    const where: any = { pharmacyId, deletedAt: null };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { idNumber: { contains: search } },
      ];
    }
    return this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { sales: true, prescriptions: true } },
      },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, pharmacyId, deletedAt: null },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: true },
        },
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { items: true },
        },
        _count: { select: { sales: true } },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    const totalSpent = customer.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    return { ...customer, totalSpent };
  }

  async update(id: string, dto: UpdateCustomerDto, pharmacyId: string) {
    await this.findOne(id, pharmacyId);
    const { dateOfBirth, ...rest } = dto;
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...rest,
        ...(dateOfBirth !== undefined && { dateOfBirth: this.toDateTime(dateOfBirth) }),
      },
    });
  }

  async remove(id: string, pharmacyId: string) {
    await this.findOne(id, pharmacyId);
    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getStats(pharmacyId: string) {
    const total = await this.prisma.customer.count({
      where: { pharmacyId, deletedAt: null },
    });
    const thisMonth = await this.prisma.customer.count({
      where: {
        pharmacyId,
        deletedAt: null,
        createdAt: { gte: new Date(new Date().setDate(1)) },
      },
    });
    return { total, thisMonth };
  }
}
