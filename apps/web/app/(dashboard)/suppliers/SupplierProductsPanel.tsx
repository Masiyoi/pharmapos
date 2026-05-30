'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { Plus, Trash2, Search, X, Check } from 'lucide-react';

export default function SupplierProductsPanel({ supplierId }: { supplierId: string }) {
  const [showAdd, setShowAdd] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quotedPrice, setQuotedPrice] = useState('');
  const [notes, setNotes] = useState('');
  const qc = useQueryClient();

  // Fetch supplier's product catalog
  const { data: catalog, isLoading } = useQuery({
    queryKey: ['supplier-products', supplierId],
    queryFn: () => api.get(`/suppliers/${supplierId}/products`).then(r => r.data),
  });

  // Search pharmacy products to add
  const { data: searchResults } = useQuery({
    queryKey: ['products-search', productSearch],
    queryFn: () => api.get(`/products?search=${productSearch}&limit=10`).then(r => r.data),
    enabled: productSearch.length > 1,
  });

  const addMutation = useMutation({
    mutationFn: () => api.post(`/suppliers/${supplierId}/products`, {
      productId: selectedProduct.id,
      quotedPrice: parseFloat(quotedPrice),
      notes,
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier-products', supplierId] });
      setShowAdd(false);
      setSelectedProduct(null);
      setQuotedPrice('');
      setNotes('');
      setProductSearch('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) =>
      api.delete(`/suppliers/${supplierId}/products/${productId}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplier-products', supplierId] }),
  });

  const catalogList = Array.isArray(catalog) ? catalog : [];
  const searchList = Array.isArray(searchResults)
    ? searchResults
    : (searchResults?.data || []);

  // Filter out already-added products
  const addedIds = new Set(catalogList.map((c: any) => c.productId));
  const filteredSearch = searchList.filter((p: any) => !addedIds.has(p.id));

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {catalogList.length} product{catalogList.length !== 1 ? 's' : ''} in catalog
        </p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors">
          <Plus size={13} />
          Add Product
        </button>
      </div>

      {/* Add product form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-emerald-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Add Product to Catalog</p>
            <button onClick={() => { setShowAdd(false); setSelectedProduct(null); setProductSearch(''); }}
              className="text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          </div>

          {/* Product search */}
          {!selectedProduct ? (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Search products by name..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              {filteredSearch.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredSearch.map((p: any) => (
                    <button key={p.id}
                      onClick={() => {
                        setSelectedProduct(p);
                        setQuotedPrice(String(p.costPrice || ''));
                        setProductSearch('');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0">
                      <p className="text-sm font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {p.genericName && `${p.genericName} · `}Current cost: {formatKES(p.costPrice)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {productSearch.length > 1 && filteredSearch.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-3 text-center text-sm text-gray-400">
                  No products found
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200">
              <div>
                <p className="text-sm font-semibold text-emerald-800">{selectedProduct.name}</p>
                <p className="text-xs text-emerald-600">{selectedProduct.unit}</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-emerald-400 hover:text-emerald-600">
                <X size={14} />
              </button>
            </div>
          )}

          {selectedProduct && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Quoted Price (KES) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quotedPrice}
                    onChange={e => setQuotedPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Notes (optional)
                  </label>
                  <input
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. MOQ 100 units"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                onClick={() => addMutation.mutate()}
                disabled={!quotedPrice || addMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 transition-colors">
                <Check size={14} />
                {addMutation.isPending ? 'Adding...' : 'Add to Catalog'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Product catalog list */}
      {isLoading ? (
        <div className="text-center py-4 text-gray-300 text-sm">Loading catalog...</div>
      ) : catalogList.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Quoted Price</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Current Cost</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Diff</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {catalogList.map((item: any) => {
                const diff = Number(item.quotedPrice) - Number(item.product.costPrice);
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-800">{item.product.name}</p>
                      {item.product.genericName && (
                        <p className="text-xs text-gray-400">{item.product.genericName}</p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-amber-600 mt-0.5">📝 {item.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">
                      {formatKES(item.quotedPrice)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">
                      {formatKES(item.product.costPrice)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`text-xs font-semibold ${
                        diff > 0 ? 'text-red-500' :
                        diff < 0 ? 'text-emerald-600' :
                        'text-gray-400'
                      }`}>
                        {diff === 0 ? '—' : diff > 0 ? `+${formatKES(diff)}` : formatKES(diff)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => removeMutation.mutate(item.productId)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-300">
          <p className="text-sm">No products in catalog yet</p>
          <p className="text-xs mt-1">Click "Add Product" to build this supplier's catalog</p>
        </div>
      )}
    </div>
  );
}