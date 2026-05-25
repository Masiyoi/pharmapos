'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, ShoppingCart, Banknote, Percent,
  Package, ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ReportsPage() {
  const [trendDays, setTrendDays] = useState(30);

  const { data: daily } = useQuery({
    queryKey: ['report-daily'],
    queryFn: () => api.get('/reports/daily').then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: trend } = useQuery({
    queryKey: ['report-trend', trendDays],
    queryFn: () => api.get(`/reports/trend?days=${trendDays}`).then(r => r.data),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['report-top-products'],
    queryFn: () => api.get('/reports/top-products?days=30').then(r => r.data),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['report-payments'],
    queryFn: () => api.get('/reports/payment-methods?days=30').then(r => r.data),
  });

  const { data: monthly } = useQuery({
    queryKey: ['report-monthly'],
    queryFn: () => api.get('/reports/monthly?months=6').then(r => r.data),
  });

  const { data: inventory } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: () => api.get('/reports/inventory-valuation').then(r => r.data),
  });

  const kpis = [
    {
      label: "Today's Sales",
      value: daily?.totalSales || 0,
      sub: 'transactions',
      icon: ShoppingCart,
      color: 'blue',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: "Today's Revenue",
      value: formatKES(daily?.totalRevenue || 0),
      sub: 'gross revenue',
      icon: Banknote,
      color: 'emerald',
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'VAT Collected',
      value: formatKES(daily?.totalVat || 0),
      sub: 'today',
      icon: Percent,
      color: 'purple',
      bg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Inventory Value',
      value: formatKES(inventory?.totalRetailValue || 0),
      sub: `${inventory?.totalUnits || 0} units`,
      icon: Package,
      color: 'amber',
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Analytics & Reports</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar size={14} />
          <span>{new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
              <kpi.icon size={18} className={kpi.iconColor} />
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-tight">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
            <p className="text-xs text-gray-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Sales Trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Sales Trend</h2>
          <div className="flex gap-1">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setTrendDays(d)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  trendDays === d ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trend || []} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => {
              const d = new Date(v);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v: any) => [formatKES(v), 'Revenue']}
              labelFormatter={v => new Date(v).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2}
              fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Revenue + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly || []} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: any, name: string) => [formatKES(v), name === 'revenue' ? 'Revenue' : 'VAT']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="vat" fill="#d1fae5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment methods pie */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Payment Methods (30 days)</h2>
          {paymentMethods && paymentMethods.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={paymentMethods} dataKey="amount" nameKey="method"
                    cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {paymentMethods.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => formatKES(v)}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {paymentMethods.map((p: any, i: number) => (
                  <div key={p.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-gray-600">{p.method}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-900">{formatKES(p.amount)}</p>
                      <p className="text-xs text-gray-400">{p.count} sales</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
              No sales data yet
            </div>
          )}
        </div>
      </div>

      {/* Top Products + Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Top Selling Products (30 days)</h2>
          {topProducts && topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p: any, i: number) => {
                const maxRevenue = topProducts[0].revenue;
                const pct = (p.revenue / maxRevenue) * 100;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{p.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-900">{formatKES(p.revenue)}</p>
                        <p className="text-xs text-gray-400">{p.qty} {p.unit}</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-300 text-sm">
              No sales data yet
            </div>
          )}
        </div>

        {/* Inventory valuation */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Inventory Valuation</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-blue-600 mb-1">Cost Value</p>
              <p className="text-lg font-bold text-blue-800">{formatKES(inventory?.totalCostValue || 0)}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-xs text-emerald-600 mb-1">Retail Value</p>
              <p className="text-lg font-bold text-emerald-800">{formatKES(inventory?.totalRetailValue || 0)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-xs text-purple-600 mb-1">Potential Profit</p>
              <p className="text-lg font-bold text-purple-800">{formatKES(inventory?.totalPotentialProfit || 0)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs text-amber-600 mb-1">Total Units</p>
              <p className="text-lg font-bold text-amber-800">{inventory?.totalUnits || 0}</p>
            </div>
          </div>

          {/* Top value products */}
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Top by Value</h3>
          <div className="space-y-1.5">
            {(inventory?.breakdown || []).slice(0, 5).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate max-w-[180px]">{p.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs">{p.stock} units</span>
                  <span className="font-semibold text-gray-900">{formatKES(p.retailValue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's payment breakdown */}
      {daily?.byPaymentMethod && Object.keys(daily.byPaymentMethod).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Today's Sales by Payment Method</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(daily.byPaymentMethod).map(([method, amount]: any, i) => (
              <div key={method} className="rounded-xl p-3 text-center"
                style={{ background: `${COLORS[i]}15`, border: `1px solid ${COLORS[i]}30` }}>
                <p className="text-xs font-medium mb-1" style={{ color: COLORS[i] }}>{method}</p>
                <p className="text-lg font-bold text-gray-900">{formatKES(amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
