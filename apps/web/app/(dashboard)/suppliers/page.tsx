'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Search, Truck, Phone, Mail, Edit, Trash2 } from 'lucide-react';
import SupplierForm from './SupplierForm';

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const qc = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => api.get(`/suppliers?search=${search}`).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/suppliers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });

  const list = Array.isArray(suppliers) ? suppliers : [];

  return (
    <div className="space-y-5">
      {(showForm || editSupplier) && (
        <SupplierForm
          supplier={editSupplier}
          onClose={() => { setShowForm(false); setEditSupplier(null); }}
          onSuccess={() => { setShowForm(false); setEditSupplier(null); qc.invalidateQueries({ queryKey: ['suppliers'] }); }}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Suppliers</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search suppliers..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading && <p className="text-gray-400 col-span-3 text-center py-8">Loading...</p>}
        {list.map((s: any) => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Truck size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  {s.contactName && <p className="text-xs text-gray-400">{s.contactName}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditSupplier(s)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                  <Edit size={14} />
                </button>
                <button onClick={() => { if(confirm('Delete supplier?')) deleteMutation.mutate(s.id); }}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone size={13} /><span>{s.phone}</span>
              </div>
              {s.email && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail size={13} /><span>{s.email}</span>
                </div>
              )}
              {s.kraPin && <p className="text-xs text-gray-400">KRA PIN: {s.kraPin}</p>}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                <span className="text-xs text-gray-400">Payment Terms</span>
                <span className="text-xs font-semibold text-gray-700">{s.paymentTerms || 30} days</span>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && list.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <Truck size={40} className="mx-auto mb-3 opacity-30" />
            <p>No suppliers yet. Add your first supplier.</p>
          </div>
        )}
      </div>
    </div>
  );
}
