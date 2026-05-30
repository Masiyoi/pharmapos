'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import {
  FileText, Calendar, Users, GitBranch,
  Package, TrendingUp, Printer, ChevronDown,
  ShoppingCart, Banknote, BarChart2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ReportPeriod = 'daily' | 'weekly' | 'monthly';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDateRange(period: ReportPeriod, offset = 0) {
  const now = new Date();
  if (period === 'daily') {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    const str = d.toISOString().split('T')[0];
    return { from: str, to: str, label: offset === 0 ? 'Today' : d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) };
  }
  if (period === 'weekly') {
    const end = new Date(now);
    end.setDate(end.getDate() - offset * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return {
      from: start.toISOString().split('T')[0],
      to: end.toISOString().split('T')[0],
      label: offset === 0 ? 'This Week' : `Week of ${start.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`,
    };
  }
  // monthly
  const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    from: d.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0],
    label: d.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }),
  };
}

// ─── Print helper ─────────────────────────────────────────────────────────────
function printReport(title: string, html: string, pharmacyName = 'PharmaPos') {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 32px; }
      h1 { font-size: 18px; font-weight: 700; color: #15803d; text-align: center; }
      h2 { font-size: 13px; font-weight: 600; text-align: center; margin-top: 4px; color: #374151; }
      p.sub { text-align: center; color: #6b7280; font-size: 11px; margin-top: 2px; }
      hr { border: none; border-top: 1px solid #d1fae5; margin: 16px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #f0fdf4; color: #166534; font-size: 11px; font-weight: 700;
           text-transform: uppercase; padding: 8px 10px; text-align: left; border-bottom: 2px solid #bbf7d0; }
      td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
      tr:nth-child(even) td { background: #fafafa; }
      .right { text-align: right; }
      .bold { font-weight: 700; }
      .green { color: #16a34a; }
      .summary { display: flex; gap: 24px; margin: 16px 0; }
      .stat { flex: 1; background: #f0fdf4; border-radius: 8px; padding: 12px; }
      .stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
      .stat-value { font-size: 16px; font-weight: 700; color: #15803d; margin-top: 2px; }
      .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between; }
      @media print { body { padding: 16px; } }
    </style>
    </head><body>
    <h1>${pharmacyName}</h1>
    <h2>${title}</h2>
    ${html}
    <div class="footer">
      <span>Printed on: ${new Date().toLocaleString('en-KE')}</span>
      <span>Page 1 of 1</span>
    </div>
    <script>window.onload = () => { window.print(); window.close(); }<\/script>
    </body></html>
  `);
  win.document.close();
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function ReportCard({ icon: Icon, title, description, color, children }: {
  icon: any; title: string; description: string; color: string; children: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
            <Icon size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-400">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  // Sales report state
  const [salesPeriod, setSalesPeriod] = useState<ReportPeriod>('daily');
  const [salesOffset, setSalesOffset] = useState(0);
  const salesRange = getDateRange(salesPeriod, salesOffset);

  // Staff report state
  const [staffPeriod, setStaffPeriod] = useState<ReportPeriod>('daily');

  // Branch report state
  const [branchPeriod, setBranchPeriod] = useState<ReportPeriod>('daily');

  // Inventory report state
  const [invReport, setInvReport] = useState<'valuation' | 'low-stock' | 'expiry'>('valuation');

  // ── Queries ──
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['rpt-sales', salesPeriod, salesOffset],
    queryFn: () => api.get(`/reports/sales-detail?from=${salesRange.from}&to=${salesRange.to}`).then(r => r.data),
  });

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['rpt-staff', staffPeriod],
    queryFn: () => {
      const r = getDateRange(staffPeriod);
      return api.get(`/reports/staff-sales?from=${r.from}&to=${r.to}`).then(r => r.data);
    },
  });

  const { data: branchData, isLoading: branchLoading } = useQuery({
    queryKey: ['rpt-branch', branchPeriod],
    queryFn: () => {
      const r = getDateRange(branchPeriod);
      return api.get(`/reports/branch-sales?from=${r.from}&to=${r.to}`).then(r => r.data);
    },
  });

  const { data: invData, isLoading: invLoading } = useQuery({
    queryKey: ['rpt-inv', invReport],
    queryFn: () => {
      if (invReport === 'valuation') return api.get('/reports/inventory-valuation').then(r => r.data);
      if (invReport === 'low-stock') return api.get('/products/reports/low-stock').then(r => r.data);
      return api.get('/products/reports/expiry').then(r => r.data);
    },
  });

  // ── Print handlers ──
  function printSalesReport() {
    if (!salesData) return;
    const summaryHtml = `
      <div class="summary">
        <div class="stat"><div class="stat-label">Total Transactions</div><div class="stat-value">${salesData.totalSales}</div></div>
        <div class="stat"><div class="stat-label">Total Revenue</div><div class="stat-value">${formatKES(salesData.totalRevenue)}</div></div>
        <div class="stat"><div class="stat-label">VAT Collected</div><div class="stat-value">${formatKES(salesData.totalVat)}</div></div>
        <div class="stat"><div class="stat-label">Discounts</div><div class="stat-value">${formatKES(salesData.totalDiscount || 0)}</div></div>
      </div>
      <p class="sub">Period: ${salesRange.label} (${salesRange.from} to ${salesRange.to})</p><hr/>
      <table>
        <thead><tr>
          <th>Receipt No</th><th>Time</th><th>Customer</th>
          <th>Payment</th><th class="right">Amount</th>
        </tr></thead>
        <tbody>
          ${(salesData.sales || []).map((s: any) => `
            <tr>
              <td>${s.receiptNo}</td>
              <td>${new Date(s.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</td>
              <td>${s.customer ? `${s.customer.firstName} ${s.customer.lastName || ''}` : 'Walk-in'}</td>
              <td>${s.paymentMethod}</td>
              <td class="right bold">${formatKES(s.totalAmount)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot><tr>
          <td colspan="4" class="bold">TOTAL</td>
          <td class="right bold green">${formatKES(salesData.totalRevenue)}</td>
        </tr></tfoot>
      </table>
    `;
    printReport(`Sales Report — ${salesRange.label}`, summaryHtml);
  }

  function printStaffReport() {
    if (!staffData) return;
    const r = getDateRange(staffPeriod);
    const html = `
      <p class="sub">Period: ${r.label}</p><hr/>
      <table>
        <thead><tr>
          <th>Staff Name</th><th>Role</th>
          <th class="right">Total Sales (Tx)</th><th class="right">Revenue</th>
        </tr></thead>
        <tbody>
          ${(staffData || []).map((s: any) => `
            <tr>
              <td class="bold">${s.firstName} ${s.lastName}</td>
              <td>${s.role}</td>
              <td class="right">${s.totalSales}</td>
              <td class="right bold">${formatKES(s.totalRevenue)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printReport(`Staff Sales Report — ${r.label}`, html);
  }

  function printBranchReport() {
    if (!branchData) return;
    const r = getDateRange(branchPeriod);
    const html = `
      <p class="sub">Period: ${r.label}</p><hr/>
      <table>
        <thead><tr>
          <th>Branch</th><th class="right">Transactions</th>
          <th class="right">Revenue</th><th class="right">VAT</th>
        </tr></thead>
        <tbody>
          ${(branchData || []).map((b: any) => `
            <tr>
              <td class="bold">${b.name}</td>
              <td class="right">${b.totalSales}</td>
              <td class="right bold">${formatKES(b.totalRevenue)}</td>
              <td class="right">${formatKES(b.totalVat)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printReport(`Branch Sales Report — ${r.label}`, html);
  }

  function printInventoryReport() {
    if (!invData) return;
    let html = '';
    if (invReport === 'valuation') {
      html = `
        <div class="summary">
          <div class="stat"><div class="stat-label">Cost Value</div><div class="stat-value">${formatKES(invData.totalCostValue)}</div></div>
          <div class="stat"><div class="stat-label">Retail Value</div><div class="stat-value">${formatKES(invData.totalRetailValue)}</div></div>
          <div class="stat"><div class="stat-label">Potential Profit</div><div class="stat-value">${formatKES(invData.totalPotentialProfit)}</div></div>
          <div class="stat"><div class="stat-label">Total Units</div><div class="stat-value">${invData.totalUnits}</div></div>
        </div><hr/>
        <table>
          <thead><tr>
            <th>Product</th><th class="right">Stock</th>
            <th class="right">Cost Value</th><th class="right">Retail Value</th><th class="right">Potential Profit</th>
          </tr></thead>
          <tbody>
            ${(invData.breakdown || []).map((p: any) => `
              <tr>
                <td>${p.name}</td>
                <td class="right">${p.stock}</td>
                <td class="right">${formatKES(p.costValue)}</td>
                <td class="right bold">${formatKES(p.retailValue)}</td>
                <td class="right green">${formatKES(p.potentialProfit)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (invReport === 'low-stock') {
      html = `<hr/><table>
        <thead><tr><th>Product</th><th class="right">Current Stock</th><th class="right">Reorder Level</th></tr></thead>
        <tbody>${(invData || []).map((p: any) => `
          <tr><td>${p.name}</td><td class="right bold" style="color:#ef4444">${p.totalStock}</td><td class="right">${p.reorderLevel}</td></tr>
        `).join('')}</tbody>
      </table>`;
    } else {
      html = `<hr/><table>
        <thead><tr><th>Product</th><th>Batch No</th><th class="right">Qty</th><th class="right">Expiry Date</th></tr></thead>
        <tbody>${(invData || []).map((p: any) => `
          <tr><td>${p.productName}</td><td>${p.batchNo}</td><td class="right">${p.quantity}</td>
          <td class="right" style="color:#ef4444">${new Date(p.expiryDate).toLocaleDateString('en-KE')}</td></tr>
        `).join('')}</tbody>
      </table>`;
    }
    const titles = { valuation: 'Inventory Valuation Report', 'low-stock': 'Low Stock Report', expiry: 'Expiry Report' };
    printReport(titles[invReport], html);
  }

  // ── Period selector component ──
  function PeriodSelector({ value, onChange }: { value: ReportPeriod; onChange: (v: ReportPeriod) => void }) {
    return (
      <div className="flex gap-1">
        {(['daily', 'weekly', 'monthly'] as ReportPeriod[]).map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              value === p ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {p}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Generate and print detailed reports</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Calendar size={14} />
          <span>{new Date().toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* ── 1. SALES SUMMARY REPORTS ────────────────────────────────────── */}
      <ReportCard icon={ShoppingCart} title="Sales Summary" color="emerald"
        description="Daily, weekly, and monthly sales transactions and revenue">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PeriodSelector value={salesPeriod} onChange={p => { setSalesPeriod(p); setSalesOffset(0); }} />
            <div className="flex items-center gap-2">
              <button onClick={() => setSalesOffset(o => o + 1)}
                className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs hover:bg-gray-200">← Prev</button>
              <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">{salesRange.label}</span>
              <button onClick={() => setSalesOffset(o => Math.max(0, o - 1))} disabled={salesOffset === 0}
                className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs hover:bg-gray-200 disabled:opacity-40">Next →</button>
            </div>
          </div>

          {salesLoading ? (
            <div className="h-24 flex items-center justify-center text-gray-300 text-sm">Loading...</div>
          ) : salesData ? (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Transactions', value: salesData.totalSales, icon: ShoppingCart, color: 'blue' },
                  { label: 'Revenue', value: formatKES(salesData.totalRevenue), icon: Banknote, color: 'emerald' },
                  { label: 'VAT', value: formatKES(salesData.totalVat), icon: BarChart2, color: 'purple' },
                  { label: 'Discounts', value: formatKES(salesData.totalDiscount || 0), icon: TrendingUp, color: 'amber' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Sales table preview */}
              {salesData.sales && salesData.sales.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
  <tr className="bg-gray-50 border-b border-gray-100">
    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Receipt</th>
    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Items</th>
    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Time</th>
    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Customer</th>
    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Payment</th>
    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Amount</th>
  </tr>
</thead>
                    <tbody className="divide-y divide-gray-50">
  {salesData.sales.slice(0, 8).map((s: any) => (
    <tr key={s.id} className="hover:bg-gray-50">
      <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{s.receiptNo}</td>
      <td className="px-4 py-2.5 text-gray-500 text-xs">
        {s.items?.reduce((sum: number, i: any) => sum + i.quantity, 0)} items
      </td>
      <td className="px-4 py-2.5 text-gray-500 text-xs">
        {new Date(s.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
      </td>
      <td className="px-4 py-2.5 text-gray-700">
        {s.customer ? `${s.customer.firstName} ${s.customer.lastName || ''}` : 'Walk-in'}
      </td>
      <td className="px-4 py-2.5">
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
          {s.paymentMethod}
        </span>
      </td>
      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{formatKES(s.totalAmount)}</td>
    </tr>
  ))}
</tbody>
                  </table>
                  {salesData.sales.length > 8 && (
                    <p className="text-center text-xs text-gray-400 py-2">
                      Showing 8 of {salesData.sales.length} — print for full report
                    </p>
                  )}
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center text-gray-300 text-sm">No sales for this period</div>
              )}
            </>
          ) : null}

          <button onClick={printSalesReport} disabled={!salesData || salesLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40">
            <Printer size={15} />
            Print {salesPeriod.charAt(0).toUpperCase() + salesPeriod.slice(1)} Sales Report
          </button>
        </div>
      </ReportCard>

      {/* ── 2. STAFF SALES REPORT ────────────────────────────────────────── */}
      <ReportCard icon={Users} title="Staff Sales Report" color="blue"
        description="Detailed sales performance by individual staff members">
        <div className="space-y-4">
          <PeriodSelector value={staffPeriod} onChange={setStaffPeriod} />

          {staffLoading ? (
            <div className="h-24 flex items-center justify-center text-gray-300 text-sm">Loading...</div>
          ) : staffData && staffData.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Staff Name</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Role</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Branch</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Total Sales</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {staffData.map((s: any) => (
                    <tr key={s.userId} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{s.firstName} {s.lastName}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{s.role}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{s.branchName}</td>
                      <td className="px-4 py-2.5 text-right text-gray-700">{s.totalSales} tx</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{formatKES(s.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-20 flex items-center justify-center text-gray-300 text-sm">No data for this period</div>
          )}

          <button onClick={printStaffReport} disabled={!staffData || staffLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40">
            <Printer size={15} />
            Print Staff Sales Report
          </button>
        </div>
      </ReportCard>

      {/* ── 3. BRANCH SALES REPORT ───────────────────────────────────────── */}
      <ReportCard icon={GitBranch} title="Branch Sales Report" color="purple"
        description="Revenue and transaction breakdown by branch">
        <div className="space-y-4">
          <PeriodSelector value={branchPeriod} onChange={setBranchPeriod} />

          {branchLoading ? (
            <div className="h-24 flex items-center justify-center text-gray-300 text-sm">Loading...</div>
          ) : branchData && branchData.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Branch</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Transactions</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Items Sold</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">VAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {branchData.map((b: any) => (
                    <tr key={b.branchId} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{b.name}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{b.totalSales}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{b.itemsSold}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{formatKES(b.totalRevenue)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">{formatKES(b.totalVat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-20 flex items-center justify-center text-gray-300 text-sm">No data for this period</div>
          )}

          <button onClick={printBranchReport} disabled={!branchData || branchLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-40">
            <Printer size={15} />
            Print Branch Sales Report
          </button>
        </div>
      </ReportCard>

      {/* ── 4. INVENTORY & STOCK REPORTS ─────────────────────────────────── */}
      <ReportCard icon={Package} title="Inventory & Stock" color="amber"
        description="Inventory valuation, low stock alerts, and expiry tracking">
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'valuation', label: 'Valuation' },
              { key: 'low-stock', label: 'Low Stock' },
              { key: 'expiry', label: 'Expiry Report' },
            ].map(o => (
              <button key={o.key} onClick={() => setInvReport(o.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  invReport === o.key ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {o.label}
              </button>
            ))}
          </div>

          {invLoading ? (
            <div className="h-24 flex items-center justify-center text-gray-300 text-sm">Loading...</div>
          ) : invReport === 'valuation' && invData ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3"><p className="text-xs text-blue-600">Cost Value</p><p className="text-lg font-bold text-blue-800">{formatKES(invData.totalCostValue)}</p></div>
                <div className="bg-emerald-50 rounded-xl p-3"><p className="text-xs text-emerald-600">Retail Value</p><p className="text-lg font-bold text-emerald-800">{formatKES(invData.totalRetailValue)}</p></div>
                <div className="bg-purple-50 rounded-xl p-3"><p className="text-xs text-purple-600">Potential Profit</p><p className="text-lg font-bold text-purple-800">{formatKES(invData.totalPotentialProfit)}</p></div>
                <div className="bg-amber-50 rounded-xl p-3"><p className="text-xs text-amber-600">Total Units</p><p className="text-lg font-bold text-amber-800">{invData.totalUnits}</p></div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Cost Value</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Retail Value</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {(invData.breakdown || []).map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{p.stock}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{formatKES(p.costValue)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{formatKES(p.retailValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : invReport === 'low-stock' && invData ? (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Current Stock</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Reorder Level</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {(invData || []).map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-red-500">{p.totalStock}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">{p.reorderLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : invReport === 'expiry' && invData ? (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Batch No</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Expiry Date</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {(invData || []).map((p: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{p.productName}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{p.batchNo}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{p.quantity}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-red-500">
                        {new Date(p.expiryDate).toLocaleDateString('en-KE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-20 flex items-center justify-center text-gray-300 text-sm">No data available</div>
          )}

          <button onClick={printInventoryReport} disabled={!invData || invLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-40">
            <Printer size={15} />
            Print {invReport === 'valuation' ? 'Inventory Valuation' : invReport === 'low-stock' ? 'Low Stock' : 'Expiry'} Report
          </button>
        </div>
      </ReportCard>
    </div>
  );
}