'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Calendar, Printer, TrendingUp, ShoppingCart, Banknote, Percent } from 'lucide-react';

const COLORS = ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6'];

// ─── Cashier simple report ─────────────────────────────────────────────────
function CashierReport() {
  const { user } = useAuthStore();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: summary } = useQuery({
    queryKey: ['cashier-summary', date],
    queryFn: () => api.get(`/sales/summary/daily?date=${date}`).then(r => r.data),
  });

  const { data: salesData } = useQuery({
    queryKey: ['cashier-sales', date],
    queryFn: () => api.get(`/sales?from=${date}&to=${date}`).then(r => r.data),
  });

  function printMyReport() {
    const sales = salesData?.data || [];
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>My Sales Report</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial;padding:32px;font-size:12px}
    h1{font-size:18px;color:#15803d;text-align:center}h2{text-align:center;margin:4px 0;font-size:13px}
    p.sub{text-align:center;color:#666;font-size:11px;margin-top:2px}hr{border:none;border-top:1px solid #d1fae5;margin:16px 0}
    .stats{display:flex;gap:16px;margin:16px 0}.stat{flex:1;background:#f0fdf4;border-radius:8px;padding:12px}
    .stat-label{font-size:10px;color:#6b7280;text-transform:uppercase}.stat-value{font-size:16px;font-weight:700;color:#15803d;margin-top:2px}
    table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#f0fdf4;color:#166534;font-size:11px;font-weight:700;text-transform:uppercase;padding:8px 10px;text-align:left;border-bottom:2px solid #bbf7d0}
    td{padding:7px 10px;border-bottom:1px solid #f3f4f6;font-size:11px}tr:nth-child(even)td{background:#fafafa}
    .right{text-align:right}.footer{margin-top:24px;font-size:10px;color:#9ca3af;display:flex;justify-content:space-between}
    </style></head><body>
    <h1>PharmaPos Pharmacy</h1>
    <h2>My Sales Report — ${new Date(date).toLocaleDateString('en-KE',{day:'numeric',month:'long',year:'numeric'})}</h2>
    <p class="sub">Cashier: ${user?.firstName} ${user?.lastName}</p><hr/>
    <div class="stats">
      <div class="stat"><div class="stat-label">My Transactions</div><div class="stat-value">${summary?.totalSales||0}</div></div>
      <div class="stat"><div class="stat-label">My Revenue</div><div class="stat-value">${formatKES(summary?.totalRevenue||0)}</div></div>
      <div class="stat"><div class="stat-label">VAT Collected</div><div class="stat-value">${formatKES(summary?.totalVat||0)}</div></div>
    </div>
    <table><thead><tr><th>Receipt</th><th>Time</th><th>Payment</th><th class="right">Amount</th></tr></thead>
    <tbody>${sales.map((s:any)=>`<tr><td>${s.receiptNo}</td><td>${new Date(s.createdAt).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'})}</td><td>${s.paymentMethod}</td><td class="right"><b>${formatKES(s.totalAmount)}</b></td></tr>`).join('')}</tbody></table>
    <div class="footer"><span>Printed: ${new Date().toLocaleString('en-KE')}</span><span>Cashier: ${user?.firstName} ${user?.lastName}</span></div>
    <script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`);
    win.document.close();
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.02em', margin: 0 }}>My Sales Report</h1>
          <p style={{ color: '#78716c', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Your personal sales — {user?.firstName} {user?.lastName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', border: '1.5px solid #d4d0cb', borderRadius: '8px', fontSize: '0.875rem', color: '#1c1917', outline: 'none' }} />
          <button onClick={printMyReport}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
            🖨️ Print My Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: '🛒', label: 'My Transactions', value: summary?.totalSales ?? 0, bg: '#dbeafe' },
          { icon: '💰', label: 'My Revenue',      value: formatKES(summary?.totalRevenue ?? 0), bg: '#dcfce7' },
          { icon: '%', label: 'VAT Collected',    value: formatKES(summary?.totalVat ?? 0), bg: '#ede9fe' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e6e3', padding: '1.125rem', boxShadow: '0 1px 2px rgb(0 0 0 / 0.04)' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', marginBottom: '0.75rem' }}>
              {s.icon}
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.04em', color: '#1c1917', lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: '0.875rem', color: '#78716c', marginTop: '0.375rem', fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Payment breakdown */}
      {summary?.byPaymentMethod && Object.keys(summary.byPaymentMethod).length > 0 && (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e6e3', padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 600, color: '#1c1917', marginBottom: '1rem', fontSize: '0.9375rem' }}>Sales by Payment Method</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(summary.byPaymentMethod).map(([method, amount]: any) => (
              <div key={method} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f9f8f6', borderRadius: '10px' }}>
                <span style={{ fontWeight: 500, color: '#44403c', fontSize: '0.9rem' }}>
                  {method === 'MPESA' ? '📱' : method === 'CASH' ? '💵' : '💳'} {method}
                </span>
                <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '1rem' }}>{formatKES(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My sales list */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e6e3', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e8e6e3', fontWeight: 600, color: '#1c1917', fontSize: '0.9375rem' }}>
          My Transactions — {new Date(date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 100px 100px', padding: '0.625rem 1.25rem', background: '#f9f8f6', borderBottom: '1px solid #e8e6e3', fontSize: '0.6875rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <span>Receipt</span><span>Customer</span><span style={{ textAlign: 'center' }}>Method</span><span style={{ textAlign: 'right' }}>Amount</span>
        </div>
        {(salesData?.data || []).map((s: any, i: number) => (
          <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 100px 100px', padding: '0.875rem 1.25rem', borderBottom: '1px solid #f2f1ef', alignItems: 'center', background: i % 2 === 0 ? 'white' : '#fafaf9' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#16a34a', fontWeight: 700 }}>{s.receiptNo}</span>
            <span style={{ fontSize: '0.875rem', color: '#44403c' }}>
              {s.customer ? `${s.customer.firstName} ${s.customer.lastName || ''}` : 'Walk-in'}
            </span>
            <span style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px', background: s.paymentMethod === 'MPESA' ? '#dcfce7' : '#f2f1ef', color: s.paymentMethod === 'MPESA' ? '#15803d' : '#44403c' }}>
              {s.paymentMethod}
            </span>
            <span style={{ textAlign: 'right', fontWeight: 700, color: '#1c1917' }}>{formatKES(s.totalAmount)}</span>
          </div>
        ))}
        {!salesData?.data?.length && (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#a8a29e' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛒</p>
            <p style={{ fontWeight: 500 }}>No sales on this date</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Full admin reports page (existing) ───────────────────────────────────
function AdminReports() {
  const [trendDays, setTrendDays] = useState(30);

  const { data: daily }    = useQuery({ queryKey: ['report-daily'],   queryFn: () => api.get('/reports/daily').then(r => r.data),                          refetchInterval: 60000 });
  const { data: trend }    = useQuery({ queryKey: ['report-trend', trendDays], queryFn: () => api.get(`/reports/trend?days=${trendDays}`).then(r => r.data) });
  const { data: topProds } = useQuery({ queryKey: ['report-top'],     queryFn: () => api.get('/reports/top-products?days=30').then(r => r.data)             });
  const { data: payments } = useQuery({ queryKey: ['report-pay'],     queryFn: () => api.get('/reports/payment-methods?days=30').then(r => r.data)         });
  const { data: monthly }  = useQuery({ queryKey: ['report-monthly'], queryFn: () => api.get('/reports/monthly?months=6').then(r => r.data)                 });
  const { data: inventory }= useQuery({ queryKey: ['report-inv'],     queryFn: () => api.get('/reports/inventory-valuation').then(r => r.data)              });

  const kpis = [
    { label: "Today's Sales",    value: daily?.totalSales || 0,              sub: 'transactions', bg: '#dbeafe', icon: '🛒' },
    { label: "Today's Revenue",  value: formatKES(daily?.totalRevenue || 0), sub: 'gross',        bg: '#dcfce7', icon: '💰' },
    { label: 'VAT Collected',    value: formatKES(daily?.totalVat || 0),     sub: 'today',        bg: '#ede9fe', icon: '📊' },
    { label: 'Inventory Value',  value: formatKES(inventory?.totalRetailValue || 0), sub: `${inventory?.totalUnits||0} units`, bg: '#fef9c3', icon: '📦' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.02em', margin: 0 }}>Analytics & Reports</h1>
          <p style={{ color: '#78716c', fontSize: '0.875rem', marginTop: '0.25rem' }}>Pharmacy performance overview</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #e8e6e3', borderRadius: '8px', padding: '0.375rem 0.875rem', fontSize: '0.8125rem', color: '#57534e', fontWeight: 500 }}>
          <Calendar size={13} />
          {new Date().toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e6e3', padding: '1.125rem', boxShadow: '0 1px 2px rgb(0 0 0 / 0.04)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '0.75rem' }}>{k.icon}</div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.04em', color: '#1c1917', lineHeight: 1 }}>{k.value}</p>
            <p style={{ fontSize: '0.875rem', color: '#78716c', marginTop: '0.375rem', fontWeight: 500 }}>{k.label}</p>
            <p style={{ fontSize: '0.75rem', color: '#a8a29e' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e6e3', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 600, color: '#1c1917', margin: 0 }}>Sales Trend</h2>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[7,14,30].map(d => (
              <button key={d} onClick={() => setTrendDays(d)}
                style={{ padding: '0.375rem 0.75rem', borderRadius: '8px', border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', background: trendDays === d ? '#16a34a' : '#f2f1ef', color: trendDays === d ? 'white' : '#78716c' }}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trend||[]} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => [formatKES(v),'Revenue']} contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#g1)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly + Payment methods */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e6e3', padding: '1.25rem' }}>
          <h2 style={{ fontWeight: 600, color: '#1c1917', marginBottom: '1rem', margin: '0 0 1rem' }}>Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly||[]} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => formatKES(v)} contentStyle={{ borderRadius: '10px', fontSize: '12px' }} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e6e3', padding: '1.25rem' }}>
          <h2 style={{ fontWeight: 600, color: '#1c1917', marginBottom: '1rem', margin: '0 0 1rem' }}>Payment Methods (30d)</h2>
          {payments?.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={payments} dataKey="amount" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                    {payments.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatKES(v)} contentStyle={{ borderRadius: '10px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {payments.map((p: any, i: number) => (
                  <div key={p.method} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                      <span style={{ fontSize: '0.8125rem', color: '#57534e' }}>{p.method}</span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1c1917' }}>{formatKES(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: '0.875rem' }}>No sales data yet</div>}
        </div>
      </div>

      {/* Top products + Inventory */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e6e3', padding: '1.25rem' }}>
          <h2 style={{ fontWeight: 600, color: '#1c1917', marginBottom: '1rem', margin: '0 0 1rem' }}>Top Products (30d)</h2>
          {topProds?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topProds.map((p: any, i: number) => {
                const pct = (p.revenue / topProds[0].revenue) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#f2f1ef', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#57534e' }}>{i+1}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1c1917' }}>{p.name}</span>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#16a34a' }}>{formatKES(p.revenue)}</span>
                    </div>
                    <div style={{ height: '5px', background: '#f2f1ef', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#10b981', borderRadius: '999px', width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: '0.875rem' }}>No data yet</div>}
        </div>

        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e6e3', padding: '1.25rem' }}>
          <h2 style={{ fontWeight: 600, color: '#1c1917', marginBottom: '1rem', margin: '0 0 1rem' }}>Inventory Valuation</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
            {[
              { label: 'Cost Value',      value: formatKES(inventory?.totalCostValue||0),      bg: '#dbeafe',  color: '#1d4ed8' },
              { label: 'Retail Value',    value: formatKES(inventory?.totalRetailValue||0),    bg: '#dcfce7',  color: '#15803d' },
              { label: 'Potential Profit',value: formatKES(inventory?.totalPotentialProfit||0),bg: '#ede9fe',  color: '#7c3aed' },
              { label: 'Total Units',     value: inventory?.totalUnits||0,                     bg: '#fef9c3',  color: '#92400e' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: '10px', padding: '0.75rem' }}>
                <p style={{ fontSize: '0.6875rem', color: s.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.375rem' }}>{s.label}</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main export — role-aware ──────────────────────────────────────────────
export default function ReportsPage() {
  const { user } = useAuthStore();
  const isLimitedRole = user?.role === 'CASHIER' || user?.role === 'DISPENSER';
  return isLimitedRole ? <CashierReport /> : <AdminReports />;
}
