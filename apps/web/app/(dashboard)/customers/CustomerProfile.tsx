'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatKES, formatDate } from '@/lib/utils';
import { X, Phone, Mail, ShoppingBag, AlertTriangle, FileText, Calendar } from 'lucide-react';

export default function CustomerProfile({ customerId, onClose, onEdit }: {
  customerId: string;
  onClose: () => void;
  onEdit: (c: any) => void;
}) {
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => api.get(`/customers/${customerId}`).then(r => r.data),
  });

  if (isLoading) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 text-gray-400">Loading...</div>
    </div>
  );

  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">Customer Profile</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(customer)}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium">
              Edit
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Profile header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold">
              {customer.firstName[0]}{customer.lastName?.[0] || ''}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {customer.firstName} {customer.lastName || ''}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Phone size={13} />{customer.phone}
                </div>
                {customer.email && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Mail size={13} />{customer.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Allergy warning */}
          {customer.allergies && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-red-700">Known Allergies</p>
                <p className="text-sm text-red-600">{customer.allergies}</p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{customer._count?.sales || 0}</p>
              <p className="text-xs text-gray-500">Visits</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-emerald-700">{formatKES(customer.totalSpent || 0)}</p>
              <p className="text-xs text-gray-500">Total Spent</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-blue-700">{customer.loyaltyPts || 0}</p>
              <p className="text-xs text-gray-500">Loyalty Pts</p>
            </div>
          </div>

          {/* Personal info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h4>
            {customer.idNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ID / Passport</span>
                <span className="font-medium">{customer.idNumber}</span>
              </div>
            )}
            {customer.dateOfBirth && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date of Birth</span>
                <span className="font-medium">{formatDate(customer.dateOfBirth)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Customer Since</span>
              <span className="font-medium">{formatDate(customer.createdAt)}</span>
            </div>
            {customer.notes && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Recent purchases */}
          {customer.sales?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ShoppingBag size={14} /> Recent Purchases
              </h4>
              <div className="space-y-2">
                {customer.sales.slice(0, 5).map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                    <div>
                      <p className="text-xs font-mono text-gray-500">{sale.receiptNo}</p>
                      <p className="text-xs text-gray-400">{formatDate(sale.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatKES(sale.totalAmount)}</p>
                      <p className="text-xs text-gray-400">{sale.paymentMethod}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prescriptions */}
          {customer.prescriptions?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText size={14} /> Prescriptions
              </h4>
              <div className="space-y-2">
                {customer.prescriptions.map((rx: any) => (
                  <div key={rx.id} className="bg-blue-50 rounded-xl px-3 py-2.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-blue-800">
                          {rx.doctorName || 'Unknown Doctor'}
                        </p>
                        <p className="text-xs text-blue-600">{rx.facilityName}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        rx.status === 'DISPENSED' ? 'bg-green-100 text-green-700' :
                        rx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'}`}>
                        {rx.status}
                      </span>
                    </div>
                    <p className="text-xs text-blue-500 mt-1">{formatDate(rx.issuedDate)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
