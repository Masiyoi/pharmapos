import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PaymentMethod, TxType } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  private generateReceiptNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `RCP-${dateStr}-${random}`;
  }

  async createSale(dto: CreateSaleDto, userId: string, pharmacyId: string) {
    // Resolve branchId from user if not provided
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const branchId = dto.branchId || user?.branchId;
    if (!branchId) throw new BadRequestException('Branch not found for this user');

    // Validate all products and batches exist and have enough stock
    for (const item of dto.items) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, pharmacyId, deletedAt: null },
      });
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

      if (item.batchId) {
        const batch = await this.prisma.productBatch.findFirst({
          where: { id: item.batchId, productId: item.productId },
        });
        if (!batch) throw new NotFoundException(`Batch ${item.batchId} not found`);
        if (batch.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}. Available: ${batch.quantity}, Requested: ${item.quantity}`
          );
        }
      } else {
        // Check total stock across all batches (FIFO)
        const batches = await this.prisma.productBatch.findMany({
          where: { productId: item.productId, quantity: { gt: 0 } },
          orderBy: { expiryDate: 'asc' },
        });
        const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
        if (totalStock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}. Available: ${totalStock}, Requested: ${item.quantity}`
          );
        }
      }
    }

    // Create sale in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Calculate totals
      let subtotal = 0;
      let vatAmount = 0;
      const saleItems: any[] = [];

      for (const item of dto.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        const itemDiscount = item.discount || 0;
        const itemSubtotal = item.unitPrice * item.quantity - itemDiscount;
        const itemVat = itemSubtotal * (Number(product!.vatRate) / 100);

        subtotal += itemSubtotal;
        vatAmount += itemVat;

        // Find best batch (FIFO - earliest expiry first)
        let batchId = item.batchId;
        if (!batchId) {
          const batch = await tx.productBatch.findFirst({
            where: { productId: item.productId, quantity: { gt: 0 } },
            orderBy: { expiryDate: 'asc' },
          });
          batchId = batch?.id;
        }

        saleItems.push({
          productId: item.productId,
          batchId,
          productName: product!.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: Number(product!.vatRate),
          vatAmount: itemVat,
          discount: itemDiscount,
          total: itemSubtotal + itemVat,
        });
      }

      const totalAmount = subtotal + vatAmount;
      const change = dto.amountPaid - totalAmount;

      if (change < 0) {
        throw new BadRequestException(
          `Insufficient payment. Total: ${totalAmount.toFixed(2)}, Paid: ${dto.amountPaid}`
        );
      }

      // Create the sale
      const sale = await tx.sale.create({
        data: {
          branchId,
          userId,
          customerId: dto.customerId,
          prescriptionId: dto.prescriptionId,
          receiptNo: this.generateReceiptNo(),
          subtotal,
          vatAmount,
          discount: 0,
          totalAmount,
          amountPaid: dto.amountPaid,
          change,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes,
          items: { create: saleItems },
          payments: {
            create: {
              method: dto.paymentMethod,
              amount: dto.amountPaid,
              status: 'SUCCESS',
            },
          },
        },
        include: {
          items: { include: { product: true } },
          payments: true,
          customer: true,
          user: { select: { firstName: true, lastName: true } },
          branch: { select: { name: true } },
        },
      });

      // Deduct inventory (FIFO per batch)
      for (const item of dto.items) {
        let remaining = item.quantity;

        if (item.batchId) {
          await tx.productBatch.update({
            where: { id: item.batchId },
            data: { quantity: { decrement: item.quantity } },
          });
          remaining = 0;
        } else {
          // FIFO deduction across batches
          const batches = await tx.productBatch.findMany({
            where: { productId: item.productId, quantity: { gt: 0 } },
            orderBy: { expiryDate: 'asc' },
          });

          for (const batch of batches) {
            if (remaining <= 0) break;
            const deduct = Math.min(batch.quantity, remaining);
            await tx.productBatch.update({
              where: { id: batch.id },
              data: { quantity: { decrement: deduct } },
            });
            remaining -= deduct;
          }
        }

        // Record inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            branchId,
            productId: item.productId,
            type: TxType.SALE_OUT,
            quantity: -item.quantity,
            reference: sale.id,
            notes: `Sale ${sale.receiptNo}`,
          },
        });
      }

      return sale;
    });
  }

  async findAll(branchId: string, query: { page?: string; limit?: string; from?: string; to?: string }) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const where: any = { branchId };
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: true,
          customer: true,
          user: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return { data: sales, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, batch: true } },
        payments: { include: { mpesaTx: true } },
        customer: true,
        user: { select: { firstName: true, lastName: true, email: true } },
        branch: { select: { name: true, address: true, phone: true } },
        prescription: true,
      },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async getDailySummary(branchId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const sales = await this.prisma.sale.findMany({
      where: {
        branchId,
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: 'COMPLETED',
      },
      include: { items: { include: { product: true } } },
    });

    const summary = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, s) => sum + Number(s.totalAmount), 0),
      totalVat: sales.reduce((sum, s) => sum + Number(s.vatAmount), 0),
      byPaymentMethod: {} as Record<string, number>,
      topProducts: {} as Record<string, { name: string; qty: number; revenue: number }>,
    };

    for (const sale of sales) {
      // By payment method
      const method = sale.paymentMethod;
      summary.byPaymentMethod[method] = (summary.byPaymentMethod[method] || 0) + Number(sale.totalAmount);

      // Top products
      for (const item of sale.items) {
        const pid = item.productId;
        if (!summary.topProducts[pid]) {
          summary.topProducts[pid] = { name: item.productName, qty: 0, revenue: 0 };
        }
        summary.topProducts[pid].qty += item.quantity;
        summary.topProducts[pid].revenue += Number(item.total);
      }
    }

    return summary;
  }
}
