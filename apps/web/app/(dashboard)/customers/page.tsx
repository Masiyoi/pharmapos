'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatKES, formatDate } from '@/lib/utils';
import { Plus, Search, Users, TrendingUp, ShoppingBag, Edit, Trash2, Eye, Phone, Mail } from 'lucide-react';
import CustomerForm from './CustomerForm';
import CustomerProfile from './CustomerProfile';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [viewCustomer, setViewCustomer] = useState<any>(null);
  const qc = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get(`/customers?search=${search}`).then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: () => api.get('/customers/stats').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });

  const list = Array.isArray(customers) ? customers : [];

  return (
    <div className="space-y-5">
      {(showForm || editCustomer) && (
        <CustomerForm
          customer={editCustomer}
          onClose={() => { setShowForm(false); setEditCustomer(null); }}
          onSuccess={() => {
            setShowForm(false);
            setEditCustomer(null);
            qc.invalidateQueries({ queryKey: ['customers'] });
            qc.invalidateQueries({ queryKey: ['customer-stats'] });
          }}
        />
      )}

      {viewCustomer && (
        <CustomerProfile
          customerId={viewCustomer.id}
          onClose={() => setViewCustomer(null)}
          onEdit={(c) => { setViewCustomer(null); setEditCustomer(c); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Customers</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
            <p className="text-xs text-gray-500">Total Customers</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats?.thisMonth || 0}</p>
            <p className="text-xs text-gray-500">New This Month</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone or ID number..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
        />
      </div>

      {/* Customer list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Customer</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Contact</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Visits</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Joined</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>
            )}
            {list.map((c: any) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                      {c.firstName[0]}{c.lastName?.[0] || ''}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {c.firstName} {c.lastName || ''}
                      </p>
                      {c.allergies && (
                        <p className="text-xs text-red-500">⚠️ {c.allergies}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                      <Phone size={11} />{c.phone}
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <Mail size={11} />{c.email}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    <ShoppingBag size={13} className="text-gray-400" />
                    <span className="font-semibold text-gray-700">{c._count?.sales || 0}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                  {formatDate(c.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => setViewCustomer(c)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="View Profile"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => setEditCustomer(c)}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => { if(confirm('Delete customer?')) deleteMutation.mutate(c.id); }}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && list.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No customers yet. Add your first customer.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
