'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatKES, formatDate } from '@/lib/utils';
import { Package, AlertTriangle, Clock } from 'lucide-react';

export default function InventoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products?limit=50').then(r => r.data),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/products/reports/low-stock').then(r => r.data),
  });

  const { data: expiry } = useQuery({
    queryKey: ['expiry'],
    queryFn: () => api.get('/products/reports/expiry?days=90').then(r => r.data),
  });

  const products = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Package size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            <p className="text-sm text-gray-500">Total Products</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle size={22} className="text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{lowStock?.length || 0}</p>
            <p className="text-sm text-gray-500">Low Stock Items</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <Clock size={22} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{expiry?.length || 0}</p>
            <p className="text-sm text-gray-500">Expiring (90 days)</p>
          </div>
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Product</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Barcode</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">Cost</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">Price</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">Stock</th>
                <th className="text-center px-6 py-3 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
              )}
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.genericName}</p>
                  </td>
                  <td className="px-6 py-3 text-gray-500 font-mono text-xs">{p.barcode || '—'}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{formatKES(p.costPrice)}</td>
                  <td className="px-6 py-3 text-right font-semibold text-emerald-600">{formatKES(p.sellingPrice)}</td>
                  <td className="px-6 py-3 text-right font-bold">{p.totalStock ?? 0}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (p.totalStock ?? 0) === 0 ? 'bg-red-100 text-red-700' :
                      (p.totalStock ?? 0) <= p.reorderLevel ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {(p.totalStock ?? 0) === 0 ? 'Out of Stock' :
                       (p.totalStock ?? 0) <= p.reorderLevel ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
