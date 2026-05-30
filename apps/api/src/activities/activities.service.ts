import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  private getDateFilter(period: string) {
    const now = new Date();
    switch (period) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        const week = new Date();
        week.setDate(week.getDate() - 7);
        return week;
      case 'month':
        const month = new Date();
        month.setDate(month.getDate() - 30);
        return month;
      case '3months':
        const threeMonths = new Date();
        threeMonths.setMonth(threeMonths.getMonth() - 3);
        return threeMonths;
      case 'year':
        const year = new Date();
        year.setFullYear(year.getFullYear() - 1);
        return year;
      default:
        return null; // all time
    }
  }

  async getSalesHistory(
    pharmacyId: string,
    branchId?: string,
    userId?: string,
    period?: string,
  ) {
    const dateFilter = period ? this.getDateFilter(period) : null;

    const where: any = {
      branch: { pharmacyId },
      status: 'COMPLETED',
    };

    if (branchId && branchId !== 'all') where.branchId = branchId;
    if (userId  && userId  !== 'all') where.userId   = userId;
    if (dateFilter) where.createdAt = { gte: dateFilter };

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        items: true,
        user:   { select: { firstName: true, lastName: true, role: true } },
        branch: { select: { name: true } },
        customer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const totalRevenue     = sales.reduce((s, x) => s + Number(x.totalAmount), 0);
    const totalTransactions = sales.length;

    return {
      sales: sales.map(s => ({
        id:           s.id,
        dateTime:     s.createdAt,
        branch:       s.branch.name,
        cashier:      `${s.user.firstName} ${s.user.lastName}`,
        cashierRole:  s.user.role,
        receiptNo:    s.receiptNo,
        itemsSold:    s.items.reduce((sum, i) => sum + i.quantity, 0),
        amount:       Number(s.totalAmount),
        paymentMethod:s.paymentMethod,
        customer:     s.customer
          ? `${s.customer.firstName} ${s.customer.lastName || ''}`
          : null,
      })),
      stats: { totalRevenue, totalTransactions },
    };
  }

  async getPrescriptionLogs(
    pharmacyId: string,
    branchId?: string,
    userId?: string,
    period?: string,
  ) {
    const dateFilter = period ? this.getDateFilter(period) : null;

    const where: any = { pharmacyId };
    if (dateFilter) where.createdAt = { gte: dateFilter };

    const prescriptions = await this.prisma.rxPrescription.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const uniquePatients = new Set(prescriptions.map(p => p.patientName)).size;

    return {
      prescriptions: prescriptions.map(p => ({
        id:           p.id,
        dateCreated:  p.createdAt,
        branch:       'Main Branch',
        prescribedBy: p.doctorName || 'Unknown',
        rxCode:       p.rxCode,
        patientName:  p.patientName,
        patientAge:   p.patientAge,
        patientGender:p.patientGender,
        doctor:       p.doctorName,
        specialty:    p.doctorSpecialty,
        status:       p.status,
        itemsCount:   p.items.length,
      })),
      stats: {
        totalPrescriptions: prescriptions.length,
        uniquePatients,
      },
    };
  }

  async getBranches(pharmacyId: string) {
    return this.prisma.branch.findMany({
      where: { pharmacyId, isActive: true },
      select: { id: true, name: true },
      orderBy: { isMain: 'desc' },
    });
  }

  async getStaff(pharmacyId: string) {
    return this.prisma.user.findMany({
      where: { pharmacyId, deletedAt: null, isActive: true },
      select: { id: true, firstName: true, lastName: true, role: true },
      orderBy: { firstName: 'asc' },
    });
  }
}
