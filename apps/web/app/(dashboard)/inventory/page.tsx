'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { Plus, Search, Package, AlertTriangle, Clock, Edit, Trash2, Layers } from 'lucide-react';
import ProductForm from './ProductForm';
import BatchForm from './BatchForm';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [tab, setTab] = useState<'products' | 'expiry' | 'lowstock'>('products');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api.get(`/products?search=${search}&limit=50`).then(r => r.data),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/products/reports/low-stock').then(r => r.data),
  });

  const { data: expiry } = useQuery({
    queryKey: ['expiry'],
    queryFn: () => api.get('/products/reports/expiry?days=90').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const products = data?.data || [];

  const tabs = [
    { key: 'products', label: 'All Products', count: products.length, icon: Package },
    { key: 'lowstock', label: 'Low Stock', count: lowStock?.length || 0, icon: AlertTriangle },
    { key: 'expiry', label: 'Expiring Soon', count: expiry?.length || 0, icon: Clock },
  ];

  return (
    <div className="space-y-5">
      {/* Modals */}
      {(showProductForm || editProduct) && (
        <ProductForm
          product={editProduct}
          onClose={() => { setShowProductForm(false); setEditProduct(null); }}
          onSuccess={() => { setShowProductForm(false); setEditProduct(null); qc.invalidateQueries({ queryKey: ['products'] }); }}
        />
      )}
      {showBatchForm && selectedProduct && (
        <BatchForm
          product={selectedProduct}
          onClose={() => { setShowBatchForm(false); setSelectedProduct(null); }}
          onSuccess={() => { setShowBatchForm(false); setSelectedProduct(null); qc.invalidateQueries({ queryKey: ['products'] }); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
        <button
          onClick={() => setShowProductForm(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Stat tabs */}
      <div className="grid grid-cols-3 gap-3">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`bg-white rounded-xl border p-4 text-left transition-colors ${tab === t.key ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <t.icon size={20} className={tab === t.key ? 'text-emerald-600' : 'text-gray-400'} />
            <p className={`text-2xl font-bold mt-2 ${tab === t.key ? 'text-emerald-700' : 'text-gray-900'}`}>{t.count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t.label}</p>
          </button>
        ))}
      </div>

      {/* Search (only for products tab) */}
      {tab === 'products' && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm" />
        </div>
      )}

      {/* Products table */}
      {tab === 'products' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Product</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Barcode</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Cost</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Price</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Stock</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>}
                {products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.genericName || p.unit}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden md:table-cell">{p.barcode || '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatKES(p.costPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatKES(p.sellingPrice)}</td>
                    <td className="px-4 py-3 text-right font-bold">{p.totalStock ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (p.totalStock ?? 0) === 0 ? 'bg-red-100 text-red-700' :
                        (p.totalStock ?? 0) <= p.reorderLevel ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'}`}>
                        {(p.totalStock ?? 0) === 0 ? 'Out of Stock' : (p.totalStock ?? 0) <= p.reorderLevel ? 'Low' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setSelectedProduct(p); setShowBatchForm(true); }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Add Stock">
                          <Layers size={14} />
                        </button>
                        <button onClick={() => setEditProduct(p)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Edit">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => { if(confirm('Delete this product?')) deleteMutation.mutate(p.id); }}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && products.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No products yet. Add your first product.</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low stock */}
      {tab === 'lowstock' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-yellow-50">
            <p className="text-sm font-semibold text-yellow-800">⚠️ Products at or below reorder level</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Product</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Stock</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Reorder At</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(lowStock || []).map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.genericName}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{p.totalStock}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{p.reorderLevel}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => { setSelectedProduct(p); setShowBatchForm(true); }}
                      className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium">
                      + Add Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expiry */}
      {tab === 'expiry' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-orange-50">
            <p className="text-sm font-semibold text-orange-800">🕐 Batches expiring within 90 days</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Product</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Batch</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Qty</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Expires</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Days Left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(expiry || []).map((b: any) => {
                const days = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / 86400000);
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{b.product?.name}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.batchNo}</td>
                    <td className="px-4 py-3 text-right font-semibold">{b.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {new Date(b.expiryDate).toLocaleDateString('en-KE', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        days <= 0 ? 'bg-red-100 text-red-700' :
                        days <= 30 ? 'bg-red-100 text-red-700' :
                        days <= 60 ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'}`}>
                        {days <= 0 ? 'EXPIRED' : `${days}d`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
