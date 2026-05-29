import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProcurementService {
  constructor(private prisma: PrismaService) {}

  // ─── Purchase History ─────────────────────────────────────────────────────
  async getPurchaseHistory(pharmacyId: string, search?: string) {
    const batches = await this.prisma.productBatch.findMany({
      where: {
        product: { pharmacyId, deletedAt: null },
        ...(search ? {
          OR: [
            { product: { name: { contains: search, mode: 'insensitive' } } },
            { supplier: { name: { contains: search, mode: 'insensitive' } } },
            { batchNo: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Calculate price change vs previous batch for same product
    const allBatches = await this.prisma.productBatch.findMany({
      where: { product: { pharmacyId } },
      orderBy: { createdAt: 'asc' },
      select: { productId: true, costPrice: true, createdAt: true },
    });

    const prevCostMap: Record<string, number> = {};
    for (const b of allBatches) {
      prevCostMap[b.productId] = Number(b.costPrice);
    }

    return batches.map((b, i) => {
      // Find previous batch for this product
      const prevBatches = allBatches.filter(
        x => x.productId === b.productId &&
             x.createdAt < b.createdAt
      );
      const oldCost = prevBatches.length > 0
        ? Number(prevBatches[prevBatches.length - 1].costPrice)
        : 0;
      const newCost = Number(b.costPrice);
      const priceChange = oldCost === 0 ? null : newCost - oldCost;
      const totalCost = b.quantity * newCost;

      return {
        id: b.id,
        date: b.createdAt,
        batchNo: b.batchNo,
        expiryDate: b.expiryDate,
        supplier: b.supplier?.name || 'Unknown',
        supplierId: b.supplierId,
        itemName: b.product.name,
        productId: b.product.id,
        unit: b.product.unit,
        quantityAdded: b.quantity,
        oldCost,
        newCost,
        priceChange,
        totalCost,
        sellingPrice: Number(b.sellingPrice),
      };
    });
  }

  // ─── Reorder List ─────────────────────────────────────────────────────────
  async getReorderList(pharmacyId: string) {
    const products = await this.prisma.product.findMany({
      where: { pharmacyId, deletedAt: null, isActive: true },
      include: {
        batches: {
          where: { quantity: { gt: 0 } },
          include: { supplier: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        category: { select: { name: true } },
      },
    });

    const branches = await this.prisma.branch.findMany({
      where: { pharmacyId, isActive: true },
      select: { id: true, name: true },
    });
    const mainBranch = branches.find(b => b.name) || branches[0];

    const reorderItems = products
      .map(p => {
        const totalStock = p.batches.reduce((s, b) => s + b.quantity, 0);
        const isLow = totalStock <= p.reorderLevel;
        const latestBatch = p.batches[0];
        const lastSupplier = latestBatch?.supplier?.name || 'Not recorded';
        const lastCost = latestBatch ? Number(latestBatch.costPrice) : Number(p.costPrice);
        // Suggested order qty = 2x reorder level - current stock
        const suggestedOrderQty = Math.max(
          (p.reorderLevel * 2) - totalStock, p.reorderLevel
        );

        return {
          id: p.id,
          itemName: p.name,
          genericName: p.genericName,
          unit: p.unit,
          category: p.category?.name,
          branch: mainBranch?.name || 'Main Branch',
          currentStock: totalStock,
          reorderLevel: p.reorderLevel,
          lastSupplier,
          lastSupplierId: latestBatch?.supplier?.id,
          lastCost,
          sellingPrice: Number(p.sellingPrice),
          suggestedOrderQty,
          isLow,
          isCritical: totalStock === 0,
        };
      })
      .filter(p => p.isLow)
      .sort((a, b) => a.currentStock - b.currentStock);

    return reorderItems;
  }

  // ─── Procurement Stats ────────────────────────────────────────────────────
  async getStats(pharmacyId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentBatches, lowStockCount, outOfStockCount] = await Promise.all([
      this.prisma.productBatch.findMany({
        where: {
          product: { pharmacyId },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { quantity: true, costPrice: true },
      }),
      this.prisma.product.count({
        where: {
          pharmacyId, deletedAt: null, isActive: true,
          batches: { none: { quantity: { gt: 0 } } },
        },
      }),
      this.prisma.product.count({
        where: { pharmacyId, deletedAt: null, isActive: true },
      }),
    ]);

    const totalSpent30d = recentBatches.reduce(
      (s, b) => s + b.quantity * Number(b.costPrice), 0
    );
    const unitsReceived30d = recentBatches.reduce((s, b) => s + b.quantity, 0);

    return {
      totalSpent30d,
      unitsReceived30d,
      purchaseCount30d: recentBatches.length,
      lowStockCount,
      outOfStockCount,
    };
  }
}
