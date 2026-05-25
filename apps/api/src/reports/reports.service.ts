import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ─── Daily Sales Summary ──────────────────────────────────────────────────
  async getDailySummary(pharmacyId: string, date?: string) {
    const target = date ? new Date(date) : new Date();
    const start = new Date(target.setHours(0, 0, 0, 0));
    const end = new Date(target.setHours(23, 59, 59, 999));

    const sales = await this.prisma.sale.findMany({
      where: {
        branch: { pharmacyId },
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      include: { items: { include: { product: true } } },
    });

    const byMethod: Record<string, number> = {};
    const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};

    for (const sale of sales) {
      byMethod[sale.paymentMethod] = (byMethod[sale.paymentMethod] || 0) + Number(sale.totalAmount);
      for (const item of sale.items) {
        if (!productMap[item.productId]) {
          productMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
        }
        productMap[item.productId].qty += item.quantity;
        productMap[item.productId].revenue += Number(item.total);
      }
    }

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalSales: sales.length,
      totalRevenue: sales.reduce((s, x) => s + Number(x.totalAmount), 0),
      totalVat: sales.reduce((s, x) => s + Number(x.vatAmount), 0),
      totalDiscount: sales.reduce((s, x) => s + Number(x.discount), 0),
      byPaymentMethod: byMethod,
      topProducts,
    };
  }

  // ─── Sales Over Time (last N days) ───────────────────────────────────────
  async getSalesTrend(pharmacyId: string, days = 30) {
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);

    const sales = await this.prisma.sale.findMany({
      where: {
        branch: { pharmacyId },
        status: 'COMPLETED',
        createdAt: { gte: start },
      },
      select: { createdAt: true, totalAmount: true, paymentMethod: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const byDate: Record<string, { date: string; revenue: number; count: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split('T')[0];
      byDate[key] = { date: key, revenue: 0, count: 0 };
    }

    for (const sale of sales) {
      const key = sale.createdAt.toISOString().split('T')[0];
      if (byDate[key]) {
        byDate[key].revenue += Number(sale.totalAmount);
        byDate[key].count += 1;
      }
    }

    return Object.values(byDate);
  }

  // ─── Inventory Valuation ─────────────────────────────────────────────────
  async getInventoryValuation(pharmacyId: string) {
    const products = await this.prisma.product.findMany({
      where: { pharmacyId, deletedAt: null, isActive: true },
      include: { batches: { where: { quantity: { gt: 0 } } } },
    });

    let totalCostValue = 0;
    let totalRetailValue = 0;
    let totalUnits = 0;

    const breakdown = products.map(p => {
      const stock = p.batches.reduce((s, b) => s + b.quantity, 0);
      const costVal = p.batches.reduce((s, b) => s + (b.quantity * Number(b.costPrice)), 0);
      const retailVal = stock * Number(p.sellingPrice);
      totalCostValue += costVal;
      totalRetailValue += retailVal;
      totalUnits += stock;
      return {
        id: p.id,
        name: p.name,
        stock,
        costValue: costVal,
        retailValue: retailVal,
        potentialProfit: retailVal - costVal,
      };
    }).filter(p => p.stock > 0).sort((a, b) => b.retailValue - a.retailValue);

    return {
      totalCostValue,
      totalRetailValue,
      totalPotentialProfit: totalRetailValue - totalCostValue,
      totalUnits,
      breakdown: breakdown.slice(0, 10),
    };
  }

  // ─── Top Selling Products ────────────────────────────────────────────────
  async getTopProducts(pharmacyId: string, days = 30, limit = 10) {
    const start = new Date();
    start.setDate(start.getDate() - days);

    const items = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          branch: { pharmacyId },
          status: 'COMPLETED',
          createdAt: { gte: start },
        },
      },
      include: { product: { select: { name: true, unit: true } } },
    });

    const map: Record<string, { name: string; unit: string; qty: number; revenue: number }> = {};
    for (const item of items) {
      if (!map[item.productId]) {
        map[item.productId] = {
          name: item.product.name,
          unit: item.product.unit,
          qty: 0,
          revenue: 0,
        };
      }
      map[item.productId].qty += item.quantity;
      map[item.productId].revenue += Number(item.total);
    }

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  // ─── Revenue by Payment Method ───────────────────────────────────────────
  async getPaymentMethodBreakdown(pharmacyId: string, days = 30) {
    const start = new Date();
    start.setDate(start.getDate() - days);

    const sales = await this.prisma.sale.findMany({
      where: {
        branch: { pharmacyId },
        status: 'COMPLETED',
        createdAt: { gte: start },
      },
      select: { paymentMethod: true, totalAmount: true },
    });

    const map: Record<string, { method: string; amount: number; count: number }> = {};
    for (const sale of sales) {
      if (!map[sale.paymentMethod]) {
        map[sale.paymentMethod] = { method: sale.paymentMethod, amount: 0, count: 0 };
      }
      map[sale.paymentMethod].amount += Number(sale.totalAmount);
      map[sale.paymentMethod].count += 1;
    }

    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }

  // ─── Monthly Summary ─────────────────────────────────────────────────────
  async getMonthlySummary(pharmacyId: string, months = 6) {
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const sales = await this.prisma.sale.aggregate({
        where: {
          branch: { pharmacyId },
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end },
        },
        _sum: { totalAmount: true, vatAmount: true },
        _count: true,
      });

      result.push({
        month: start.toLocaleDateString('en-KE', { month: 'short', year: 'numeric' }),
        revenue: Number(sales._sum.totalAmount || 0),
        vat: Number(sales._sum.vatAmount || 0),
        transactions: sales._count,
      });
    }
    return result;
  }
}
