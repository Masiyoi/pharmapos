'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import {
  Plus, Search, Truck, Phone, Mail, Edit,
  Trash2, MessageCircle, Package, ChevronDown, ChevronUp,
  X, ShoppingCart,
} from 'lucide-react';
import SupplierForm from './SupplierForm';
import SupplierProductsPanel from './SupplierProductsPanel';

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  function openWhatsApp(phone: string) {
    // Normalize Kenyan number to international format
    let num = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    if (num.startsWith('0')) num = '254' + num.slice(1);
    if (num.startsWith('+')) num = num.slice(1);
    window.open(`https://wa.me/${num}`, '_blank');
  }

  return (
    <div className="space-y-5">
      {(showForm || editSupplier) && (
        <SupplierForm
          supplier={editSupplier}
          onClose={() => { setShowForm(false); setEditSupplier(null); }}
          onSuccess={() => {
            setShowForm(false);
            setEditSupplier(null);
            qc.invalidateQueries({ queryKey: ['suppliers'] });
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage suppliers and their product catalogs</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search suppliers..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm" />
      </div>

      {/* Supplier cards */}
      <div className="space-y-3">
        {isLoading && <p className="text-gray-400 text-center py-8">Loading...</p>}

        {list.map((s: any) => (
          <div key={s.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-emerald-200 transition-all">
            {/* Card header */}
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Truck size={20} className="text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    {s.contactName && <p className="text-xs text-gray-400">{s.contactName}</p>}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                  {/* WhatsApp */}
                  <button
                    onClick={() => openWhatsApp(s.phone)}
                    className="p-2 hover:bg-green-50 rounded-xl text-green-500 hover:text-green-600 transition-colors"
                    title={`WhatsApp ${s.phone}`}>
                    <MessageCircle size={16} />
                  </button>
                  <button onClick={() => setEditSupplier(s)}
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete supplier?')) deleteMutation.mutate(s.id); }}
                    className="p-2 hover:bg-red-50 rounded-xl text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Contact info */}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Phone size={12} /><span>{s.phone}</span>
                </div>
                {s.email && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Mail size={12} /><span>{s.email}</span>
                  </div>
                )}
                {s.kraPin && (
                  <span className="text-xs text-gray-400">KRA: {s.kraPin}</span>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  Payment: {s.paymentTerms || 30} days
                </span>
              </div>

              {/* Expand catalog button */}
              <button
                onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 text-gray-500 text-xs font-medium transition-colors border border-gray-100 hover:border-emerald-200">
                <div className="flex items-center gap-2">
                  <Package size={13} />
                  <span>Product Catalog & Prices</span>
                </div>
                {expandedId === s.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Expanded product catalog panel */}
            {expandedId === s.id && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                <SupplierProductsPanel supplierId={s.id} />
              </div>
            )}
          </div>
        ))}

        {!isLoading && list.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Truck size={40} className="mx-auto mb-3 opacity-30" />
            <p>No suppliers yet. Add your first supplier.</p>
          </div>
        )}
      </div>
    </div>
  );
}