'use client';
import { forwardRef } from 'react';
import { formatKES, formatDate } from '@/lib/utils';

interface ReceiptProps {
  sale: {
    receiptNo: string;
    createdAt: string;
    paymentMethod: string;
    totalAmount: string | number;
    subtotal: string | number;
    vatAmount: string | number;
    discount: string | number;
    amountPaid: string | number;
    change: string | number;
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: string | number;
      vatRate: string | number;
      total: string | number;
    }>;
    user?: { firstName: string; lastName: string };
    customer?: { firstName: string; lastName?: string; phone?: string } | null;
    branch?: { name: string; address?: string; phone?: string };
  };
  pharmacy?: {
    name: string;
    address: string;
    phone: string;
    licenseNo?: string;
  };
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ sale, pharmacy }, ref) => {
  const defaultPharmacy = {
    name: 'PharmaPos Pharmacy',
    address: 'Nairobi, Kenya',
    phone: '0712345678',
    licenseNo: 'PPB/2024/001',
  };
  const ph = pharmacy || defaultPharmacy;

  return (
    <div
      ref={ref}
      className="receipt-paper font-mono text-black bg-white"
      style={{
        width: '80mm',
        minHeight: '100mm',
        padding: '4mm',
        fontSize: '11px',
        lineHeight: '1.4',
        fontFamily: '"Courier New", Courier, monospace',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '4mm' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '1px' }}>
          {ph.name.toUpperCase()}
        </div>
        <div style={{ fontSize: '10px', marginTop: '1mm' }}>{ph.address}</div>
        <div style={{ fontSize: '10px' }}>Tel: {ph.phone}</div>
        {ph.licenseNo && (
          <div style={{ fontSize: '10px' }}>Lic: {ph.licenseNo}</div>
        )}
      </div>

      <Divider />

      {/* Receipt info */}
      <Row label="Receipt" value={sale.receiptNo} />
      <Row label="Date" value={new Date(sale.createdAt).toLocaleDateString('en-KE', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })} />
      <Row label="Cashier" value={sale.user ? `${sale.user.firstName} ${sale.user.lastName}` : 'Staff'} />
      {sale.branch && <Row label="Branch" value={sale.branch.name} />}
      {sale.customer && (
        <Row label="Customer" value={`${sale.customer.firstName} ${sale.customer.lastName || ''}`} />
      )}

      <Divider />

      {/* Items header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px', marginBottom: '1mm' }}>
        <span style={{ flex: 2 }}>ITEM</span>
        <span style={{ flex: 1, textAlign: 'center' }}>QTY</span>
        <span style={{ flex: 1, textAlign: 'right' }}>PRICE</span>
        <span style={{ flex: 1, textAlign: 'right' }}>TOTAL</span>
      </div>

      <Divider char="-" />

      {/* Items */}
      {sale.items.map((item, i) => (
        <div key={i} style={{ marginBottom: '2mm' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{item.productName}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <span style={{ flex: 2, color: '#666' }}>
              {formatKES(item.unitPrice)} x {item.quantity}
              {Number(item.vatRate) > 0 && ` (VAT ${item.vatRate}%)`}
            </span>
            <span style={{ flex: 1, textAlign: 'center' }}>{item.quantity}</span>
            <span style={{ flex: 1, textAlign: 'right' }}>{formatKES(item.unitPrice)}</span>
            <span style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>{formatKES(item.total)}</span>
          </div>
        </div>
      ))}

      <Divider char="-" />

      {/* Totals */}
      <div style={{ marginTop: '2mm' }}>
        <Row label="Subtotal" value={formatKES(sale.subtotal)} />
        {Number(sale.vatAmount) > 0 && (
          <Row label="VAT (16%)" value={formatKES(sale.vatAmount)} />
        )}
        {Number(sale.discount) > 0 && (
          <Row label="Discount" value={`-${formatKES(sale.discount)}`} />
        )}
        <Divider char="-" />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', margin: '2mm 0' }}>
          <span>TOTAL</span>
          <span>{formatKES(sale.totalAmount)}</span>
        </div>
        <Row label={`Paid (${sale.paymentMethod})`} value={formatKES(sale.amountPaid)} />
        {Number(sale.change) > 0 && (
          <Row label="Change" value={formatKES(sale.change)} bold />
        )}
      </div>

      <Divider />

      {/* Payment method badge */}
      <div style={{ textAlign: 'center', margin: '2mm 0', fontSize: '11px' }}>
        {sale.paymentMethod === 'MPESA' ? '📱 Paid via M-Pesa' :
         sale.paymentMethod === 'CASH' ? '💵 Cash Payment' : '💳 Card Payment'}
      </div>

      <Divider />

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '3mm', lineHeight: '1.6' }}>
        <div>Thank you for your purchase!</div>
        <div>Please retain this receipt</div>
        <div style={{ marginTop: '2mm', fontSize: '9px', color: '#666' }}>
          Goods once sold are not returnable
        </div>
        <div style={{ fontSize: '9px', color: '#666' }}>
          unless defective. Valid 7 days.
        </div>
        <div style={{ marginTop: '3mm', fontSize: '9px' }}>
          *** {ph.name} ***
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
export default Receipt;

// Helper components
function Divider({ char = '=' }: { char?: string }) {
  return (
    <div style={{ borderTop: char === '=' ? '1px solid #000' : '1px dashed #999', margin: '2mm 0' }} />
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '11px',
      fontWeight: bold ? 'bold' : 'normal',
      marginBottom: '0.5mm',
    }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
