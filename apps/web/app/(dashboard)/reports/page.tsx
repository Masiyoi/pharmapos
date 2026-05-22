'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { TrendingUp, ShoppingCart, Banknote, Percent } from 'lucide-react';

export default function ReportsPage() {
  const { data: summary } = useQuery({
    queryKey: ['daily-summary'],
    queryFn: () => api.get('/sales/summary/daily').then(r => r.data),
  });

  const stats = [
    { label: 'Total Sales', value: summary?.totalSales || 0, icon: ShoppingCart, color: 'blue' },
    { label: 'Revenue', value: formatKES(summary?.totalRevenue || 0), icon: Banknote, color: 'emerald' },
    { label: 'VAT Collected', value: formatKES(summary?.totalVat || 0), icon: Percent, color: 'purple' },
    { label: 'Avg Sale', value: formatKES(summary?.totalSales ? (summary.totalRevenue / summary.totalSales) : 0), icon: TrendingUp, color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Today's Summary</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <stat.icon size={20} className="text-gray-400 mb-3" />
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Payment breakdown */}
      {summary?.byPaymentMethod && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Sales by Payment Method</h3>
          <div className="space-y-3">
            {Object.entries(summary.byPaymentMethod).map(([method, amount]: any) => (
              <div key={method} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{method}</span>
                <span className="font-semibold text-gray-900">{formatKES(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
