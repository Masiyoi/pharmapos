'use client';
import { forwardRef } from 'react';
import { formatKES } from '@/lib/utils';

interface Props {
  items: any[];
  pharmacyName: string;
  generatedAt: string;
}

const ReorderReport = forwardRef<HTMLDivElement, Props>(
  ({ items, pharmacyName, generatedAt }, ref) => (
    <div ref={ref} style={{
      width: '210mm', minHeight: '297mm', padding: '15mm 18mm',
      background: 'white', fontFamily: 'Arial, sans-serif',
      fontSize: '10pt', color: '#111', boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '2px solid #16a34a', paddingBottom: '10px' }}>
        <h1 style={{ fontSize: '18pt', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', margin: 0, letterSpacing: '1px' }}>
          {pharmacyName}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '11pt', fontWeight: 600, color: '#333' }}>
          Official Reorder Request List
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '9pt', color: '#777' }}>
          Generated on: {generatedAt}
        </p>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
        <thead>
          <tr style={{ background: '#16a34a' }}>
            {['Item Name', 'Branch', 'Stock', 'Last Supplier', 'Last Cost', 'Order Qty'].map(h => (
              <th key={h} style={{
                padding: '8px 10px', textAlign: 'left',
                color: 'white', fontWeight: 700, fontSize: '9pt',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#888', fontSize: '10pt' }}>
                No low stock items found. Great job!
              </td>
            </tr>
          ) : (
            items.map((item, i) => (
              <tr key={item.id} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                <td style={{ padding: '8px 10px', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>
                  {item.itemName}
                  {item.genericName && <span style={{ display: 'block', fontSize: '8.5pt', color: '#888', fontWeight: 400 }}>{item.genericName}</span>}
                </td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', color: '#555' }}>{item.branch}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: item.isCritical ? '#dc2626' : '#d97706' }}>
                  {item.currentStock} {item.unit}
                </td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', color: '#555' }}>{item.lastSupplier}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb' }}>{formatKES(item.lastCost)}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: '#16a34a' }}>
                  {item.suggestedOrderQty}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Signature */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', paddingTop: '8px' }}>
        <div>
          <div style={{ width: '200px', borderTop: '1px solid #333', paddingTop: '6px', fontSize: '9pt', color: '#555' }}>
            Authorized Signature
          </div>
        </div>
        <div>
          <div style={{ width: '160px', borderTop: '1px solid #333', paddingTop: '6px', fontSize: '9pt', color: '#555' }}>
            Date
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '12mm', left: '18mm', right: '18mm', textAlign: 'center', fontSize: '8pt', color: '#aaa', borderTop: '1px solid #e5e7eb', paddingTop: '6px' }}>
        {pharmacyName} · Official Reorder Report · {generatedAt}
      </div>
    </div>
  )
);
ReorderReport.displayName = 'ReorderReport';
export default ReorderReport;
