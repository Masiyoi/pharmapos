'use client';
import { forwardRef } from 'react';
import { formatKES } from '@/lib/utils';

interface Props {
  sales: any[];
  stats: any;
  filters: { branch: string; period: string };
  pharmacyName?: string;
}

const SalesReport = forwardRef<HTMLDivElement, Props>(
  ({ sales, stats, filters, pharmacyName = 'PharmaPos Pharmacy' }, ref) => (
    <div ref={ref} style={{ width: '210mm', minHeight: '297mm', padding: '15mm 18mm', background: 'white', fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#111', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #16a34a', paddingBottom: '10px', marginBottom: '14px' }}>
        <h1 style={{ fontSize: '17pt', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{pharmacyName}</h1>
        <p style={{ margin: '3px 0 0', fontWeight: 600, fontSize: '11pt' }}>Sales History Report</p>
        <p style={{ margin: '2px 0 0', fontSize: '9pt', color: '#666' }}>
          Branch: {filters.branch} &nbsp;|&nbsp; Period: {filters.period} &nbsp;|&nbsp; Generated: {new Date().toLocaleString('en-KE')}
        </p>
      </div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
        {[
          { label: 'Total Revenue', value: formatKES(stats?.totalRevenue || 0), color: '#16a34a' },
          { label: 'Transactions',  value: stats?.totalTransactions || 0,       color: '#2563eb' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, border: `2px solid ${s.color}`, borderRadius: '8px', padding: '10px 14px' }}>
            <p style={{ fontSize: '8.5pt', fontWeight: 700, color: '#777', textTransform: 'uppercase', margin: '0 0 3px', letterSpacing: '0.05em' }}>{s.label}</p>
            <p style={{ fontSize: '16pt', fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>
      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#16a34a' }}>
            {['Date & Time','Branch','Cashier','Receipt #','Items','Amount','Method'].map(h => (
              <th key={h} style={{ padding: '7px 9px', textAlign: 'left', color: 'white', fontWeight: 700, fontSize: '8.5pt', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sales.length === 0 ? (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No records found</td></tr>
          ) : sales.map((s, i) => (
            <tr key={s.id} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
              <td style={{ padding: '7px 9px', borderBottom: '1px solid #e5e7eb', fontSize: '9pt' }}>
                {new Date(s.dateTime).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}<br/>
                <span style={{ color: '#888', fontSize: '8pt' }}>{new Date(s.dateTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
              </td>
              <td style={{ padding: '7px 9px', borderBottom: '1px solid #e5e7eb' }}>{s.branch}</td>
              <td style={{ padding: '7px 9px', borderBottom: '1px solid #e5e7eb' }}>{s.cashier}</td>
              <td style={{ padding: '7px 9px', borderBottom: '1px solid #e5e7eb', fontFamily: 'monospace', color: '#16a34a', fontWeight: 700 }}>{s.receiptNo}</td>
              <td style={{ padding: '7px 9px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 700 }}>{s.itemsSold}</td>
              <td style={{ padding: '7px 9px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: '#16a34a' }}>{formatKES(s.amount)}</td>
              <td style={{ padding: '7px 9px', borderBottom: '1px solid #e5e7eb' }}>{s.paymentMethod}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '12mm', left: '18mm', right: '18mm', textAlign: 'center', fontSize: '8pt', color: '#aaa', borderTop: '1px solid #e5e7eb', paddingTop: '6px' }}>
        {pharmacyName} · Sales History Report · {new Date().toLocaleString('en-KE')}
      </div>
    </div>
  )
);
SalesReport.displayName = 'SalesReport';
export default SalesReport;
