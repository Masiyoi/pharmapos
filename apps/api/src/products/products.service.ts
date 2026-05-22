import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto, pharmacyId: string) {
    return this.prisma.product.create({
      data: {
        ...dto,
        pharmacyId,
        costPrice: dto.costPrice,
        sellingPrice: dto.sellingPrice,
        vatRate: dto.vatRate ?? 16,
        reorderLevel: dto.reorderLevel ?? 10,
      },
      include: { category: true },
    });
  }

  async findAll(pharmacyId: string, query: {
    search?: string;
    categoryId?: string;
    lowStock?: string;
    page?: string;
    limit?: string;
  }) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const where: any = { pharmacyId, deletedAt: null, isActive: true };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { genericName: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.categoryId) where.categoryId = query.categoryId;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          batches: {
            where: { quantity: { gt: 0 } },
            orderBy: { expiryDate: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    const productsWithStock = products.map((p) => ({
      ...p,
      totalStock: p.batches.reduce((sum, b) => sum + b.quantity, 0),
      isLowStock: p.batches.reduce((sum, b) => sum + b.quantity, 0) <= p.reorderLevel,
    }));

    const filtered = query.lowStock === 'true'
      ? productsWithStock.filter((p) => p.isLowStock)
      : productsWithStock;

    return {
      data: filtered,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, pharmacyId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, pharmacyId, deletedAt: null },
      include: {
        category: true,
        batches: { orderBy: { expiryDate: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return {
      ...product,
      totalStock: product.batches.reduce((sum, b) => sum + b.quantity, 0),
    };
  }

  async findByBarcode(barcode: string, pharmacyId: string) {
    const product = await this.prisma.product.findFirst({
      where: { barcode, pharmacyId, deletedAt: null, isActive: true },
      include: {
        batches: {
          where: { quantity: { gt: 0 } },
          orderBy: { expiryDate: 'asc' },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return {
      ...product,
      totalStock: product.batches.reduce((sum, b) => sum + b.quantity, 0),
    };
  }

  async update(id: string, dto: UpdateProductDto, pharmacyId: string) {
    await this.findOne(id, pharmacyId);
    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async remove(id: string, pharmacyId: string) {
    await this.findOne(id, pharmacyId);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async addBatch(productId: string, pharmacyId: string, dto: any) {
    await this.findOne(productId, pharmacyId);
    return this.prisma.productBatch.create({
      data: {
        productId,
        batchNo: dto.batchNo,
        expiryDate: new Date(dto.expiryDate),
        quantity: dto.quantity,
        costPrice: dto.costPrice,
        sellingPrice: dto.sellingPrice,
        supplierId: dto.supplierId || null,
      },
    });
  }

  async getExpiryReport(pharmacyId: string, daysAhead = 90) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    return this.prisma.productBatch.findMany({
      where: {
        expiryDate: { lte: futureDate },
        quantity: { gt: 0 },
        product: { pharmacyId, deletedAt: null },
      },
      include: { product: true, supplier: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async getLowStockReport(pharmacyId: string) {
    const products = await this.prisma.product.findMany({
      where: { pharmacyId, deletedAt: null, isActive: true },
      include: { batches: { where: { quantity: { gt: 0 } } } },
    });
    return products
      .map((p) => ({
        ...p,
        totalStock: p.batches.reduce((sum, b) => sum + b.quantity, 0),
      }))
      .filter((p) => p.totalStock <= p.reorderLevel);
  }
}
