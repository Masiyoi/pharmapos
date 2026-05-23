'use client';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Receipt from './Receipt';
import { X, Printer, Download } from 'lucide-react';
import { formatKES } from '@/lib/utils';

interface Props {
  sale: any;
  onClose: () => void;
}

export default function ReceiptModal({ sale, onClose }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${sale.receiptNo}`,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body { margin: 0; }
        .receipt-paper { 
          width: 80mm !important;
          padding: 4mm !important;
        }
      }
    `,
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Receipt</h2>
            <p className="text-xs text-gray-400">{sale.receiptNo}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X size={18} />
          </button>
        </div>

        {/* Receipt preview */}
        <div className="p-4 bg-gray-50 flex justify-center overflow-auto max-h-[60vh]">
          <div className="shadow-lg">
            <Receipt ref={receiptRef} sale={sale} />
          </div>
        </div>

        {/* Summary */}
        <div className="px-5 py-3 bg-emerald-50 border-t border-emerald-100">
          <div className="flex justify-between text-sm">
            <span className="text-emerald-700">Total Paid</span>
            <span className="font-bold text-emerald-800">{formatKES(sale.totalAmount)}</span>
          </div>
          {Number(sale.change) > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-emerald-700">Change</span>
              <span className="font-bold text-emerald-800">{formatKES(sale.change)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => handlePrint()}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
          >
            <Printer size={16} />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
