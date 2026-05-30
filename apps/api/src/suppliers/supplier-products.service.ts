import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupplierProductsService {
  constructor(private prisma: PrismaService) {}

  async getBySupplier(supplierId: string, pharmacyId: string) {
    // Verify supplier belongs to pharmacy
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, pharmacyId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    return (this.prisma as any).supplierProduct.findMany({
      where: { supplierId, isActive: true },
      include: {
        product: {
          select: { id: true, name: true, genericName: true, unit: true, costPrice: true, sellingPrice: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsert(supplierId: string, pharmacyId: string, dto: {
    productId: string; quotedPrice: number; notes?: string;
  }) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, pharmacyId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    return (this.prisma as any).supplierProduct.upsert({
      where: { supplierId_productId: { supplierId, productId: dto.productId } },
      create: {
        supplierId,
        productId: dto.productId,
        quotedPrice: dto.quotedPrice,
        notes: dto.notes,
      },
      update: {
        quotedPrice: dto.quotedPrice,
        notes: dto.notes,
        isActive: true,
      },
      include: {
        product: { select: { id: true, name: true, unit: true } },
      },
    });
  }

  async remove(supplierId: string, productId: string, pharmacyId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, pharmacyId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    return (this.prisma as any).supplierProduct.updateMany({
      where: { supplierId, productId },
      data: { isActive: false },
    });
  }
}