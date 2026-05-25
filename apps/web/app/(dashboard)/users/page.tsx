'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, Users, Shield, UserCheck, UserX, Key, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import StaffForm from './StaffForm';
import ResetPasswordModal from './ResetPasswordModal';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'text-red-700', bg: 'bg-red-100', desc: 'Full system access' },
  ADMIN:       { label: 'Admin',       color: 'text-purple-700', bg: 'bg-purple-100', desc: 'Manage pharmacy' },
  PHARMACIST:  { label: 'Pharmacist',  color: 'text-blue-700',   bg: 'bg-blue-100',   desc: 'Dispense & inventory' },
  CASHIER:     { label: 'Cashier',     color: 'text-emerald-700',bg: 'bg-emerald-100',desc: 'POS sales only' },
  DISPENSER:   { label: 'Dispenser',   color: 'text-teal-700',   bg: 'bg-teal-100',   desc: 'Dispense prescriptions' },
  VIEWER:      { label: 'Viewer',      color: 'text-gray-700',   bg: 'bg-gray-100',   desc: 'Read-only access' },
};

export default function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [resetUser, setResetUser] = useState<any>(null);
  const qc = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => api.get('/users/stats').then(r => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/toggle-active`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const list = Array.isArray(users) ? users : [];

  return (
    <div className="space-y-5">
      {(showForm || editUser) && (
        <StaffForm
          user={editUser}
          onClose={() => { setShowForm(false); setEditUser(null); }}
          onSuccess={() => {
            setShowForm(false);
            setEditUser(null);
            qc.invalidateQueries({ queryKey: ['users'] });
            qc.invalidateQueries({ queryKey: ['user-stats'] });
          }}
        />
      )}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Staff Management</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Users size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats?.total || 0}</p>
            <p className="text-xs text-gray-500">Total Staff</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <UserCheck size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats?.active || 0}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
        </div>
        {Object.entries(stats?.byRole || {}).slice(0, 2).map(([role, count]: any) => (
          <div key={role} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ROLE_CONFIG[role]?.bg || 'bg-gray-100'}`}>
              <Shield size={18} className={ROLE_CONFIG[role]?.color || 'text-gray-600'} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500">{ROLE_CONFIG[role]?.label || role}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Role permissions guide */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Role Permissions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
            <div key={role} className={`rounded-xl px-3 py-2 ${cfg.bg}`}>
              <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{cfg.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Staff table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Staff Member</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Contact</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">Role</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Branch</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Last Login</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
            )}
            {list.map((u: any) => {
              const roleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.VIEWER;
              return (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${roleCfg.bg} flex items-center justify-center text-sm font-bold ${roleCfg.color}`}>
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm text-gray-600">{u.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleCfg.bg} ${roleCfg.color}`}>
                      {roleCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-sm text-gray-500">{u.branch?.name || 'All Branches'}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-xs text-gray-400">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setEditUser(u)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" title="Edit">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => setResetUser(u)}
                        className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg" title="Reset Password">
                        <Key size={14} />
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate(u.id)}
                        className={`p-1.5 rounded-lg ${u.isActive ? 'text-orange-400 hover:bg-orange-50' : 'text-emerald-400 hover:bg-emerald-50'}`}
                        title={u.isActive ? 'Deactivate' : 'Activate'}>
                        {u.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
