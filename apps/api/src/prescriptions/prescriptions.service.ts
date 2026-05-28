import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  private generateRxCode(): string {
    const year = new Date().getFullYear();
    const rand = Math.floor(Math.random() * 90000) + 10000;
    return `RX-${year}-${rand}`;
  }

  async create(dto: CreatePrescriptionDto, pharmacyId: string, dispensedBy?: string) {
    const { items, ...rest } = dto;

    return this.prisma.rxPrescription.create({
      data: {
        ...rest,
        pharmacyId,
        rxCode: this.generateRxCode(),
        issuedDate: new Date(dto.issuedDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        items: {
          create: items.map(item => ({
            productName: item.productName,
            dosage:      item.dosage,
            frequency:   item.frequency,
            duration:    item.duration,
            instruction: item.instruction,
            quantity:    item.quantity,
          })),
        },
      },
      include: { items: true },
    });
  }

  async findAll(pharmacyId: string, search?: string, status?: string) {
    const where: any = { pharmacyId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { rxCode:      { contains: search, mode: 'insensitive' } },
        { patientName: { contains: search, mode: 'insensitive' } },
        { doctorName:  { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.rxPrescription.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const rx = await this.prisma.rxPrescription.findFirst({
      where: { id, pharmacyId },
      include: { items: true },
    });
    if (!rx) throw new NotFoundException('Prescription not found');
    return rx;
  }

  async update(id: string, dto: UpdatePrescriptionDto, pharmacyId: string) {
    await this.findOne(id, pharmacyId);
    const { items, ...rest } = dto;

    return this.prisma.rxPrescription.update({
      where: { id },
      data: {
        ...rest,
        ...(dto.issuedDate && { issuedDate: new Date(dto.issuedDate) }),
        ...(dto.expiryDate && { expiryDate: new Date(dto.expiryDate) }),
        ...(items && {
          items: {
            deleteMany: {},
            create: items.map(item => ({
              productName: item.productName,
              dosage:      item.dosage,
              frequency:   item.frequency,
              duration:    item.duration,
              instruction: item.instruction,
              quantity:    item.quantity,
            })),
          },
        }),
      },
      include: { items: true },
    });
  }

  async dispense(id: string, pharmacyId: string, userId: string) {
    await this.findOne(id, pharmacyId);
    return this.prisma.rxPrescription.update({
      where: { id },
      data: {
        status: 'DISPENSED',
        dispensedBy: userId,
        dispensedAt: new Date(),
      },
      include: { items: true },
    });
  }

  async remove(id: string, pharmacyId: string) {
    await this.findOne(id, pharmacyId);
    return this.prisma.rxPrescription.delete({ where: { id } });
  }

  async getStats(pharmacyId: string) {
    const [total, pending, dispensed, expired] = await Promise.all([
      this.prisma.rxPrescription.count({ where: { pharmacyId } }),
      this.prisma.rxPrescription.count({ where: { pharmacyId, status: 'PENDING' } }),
      this.prisma.rxPrescription.count({ where: { pharmacyId, status: 'DISPENSED' } }),
      this.prisma.rxPrescription.count({ where: { pharmacyId, status: 'CANCELLED' } }),
    ]);
    return { total, pending, dispensed, expired };
  }
}
