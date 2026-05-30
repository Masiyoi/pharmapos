'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { X, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const createSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Min 8 characters'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'PHARMACIST', 'CASHIER', 'DISPENSER', 'VIEWER']),
  branchId: z.string().optional(),
});

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'PHARMACIST', 'CASHIER', 'DISPENSER', 'VIEWER']).optional(),
  branchId: z.string().optional(),
  isActive: z.boolean().optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

export default function StaffForm({ user, onClose, onSuccess }: {
  user?: any; onClose: () => void; onSuccess: () => void;
}) {
  const isEdit = !!user;
  const [showPass, setShowPass] = useState(false);

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(r => r.data).catch(() => []),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema),
    defaultValues: user ? {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role,
      branchId: user.branch?.id || '',
      isActive: user.isActive,
    } : { role: 'CASHIER' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.put(`/users/${user.id}`, data).then(r => r.data)
      : api.post('/users', data).then(r => r.data),
    onSuccess,
  });

  const roles = [
    { value: 'ADMIN', label: 'Admin', desc: 'Full pharmacy management' },
    { value: 'PHARMACIST', label: 'Pharmacist', desc: 'Inventory + dispensing' },
    { value: 'CASHIER', label: 'Cashier', desc: 'POS sales only' },
    { value: 'DISPENSER', label: 'Dispenser', desc: 'Prescription dispensing' },
    { value: 'VIEWER', label: 'Viewer', desc: 'Read-only access' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Edit Staff Member' : 'Add Staff Member'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">First Name *</label>
              <input {...register('firstName')} placeholder="Jane"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{String(errors.firstName.message)}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Last Name *</label>
              <input {...register('lastName')} placeholder="Wanjiru"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email *</label>
              <input {...register('email')} type="email" placeholder="jane@pharmacy.co.ke"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{String(errors.email.message)}</p>}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
            <input {...register('phone')} placeholder="0712345678"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
          </div>

          {/* Branch selector - add after Phone field */}
<div>
  <label className="text-sm font-medium text-gray-700 block mb-1">Branch</label>
  <select {...register('branchId')}
    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white">
    <option value="">All Branches / No specific branch</option>
    {(Array.isArray(branches) ? branches : branches?.data || []).map((b: any) => (
      <option key={b.id} value={b.id}>{b.name}</option>
    ))}
  </select>
  <p className="text-xs text-gray-400 mt-1">
    Leave blank for admin staff who manage all branches
  </p>
</div>

          {!isEdit && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Password *</label>
              <div className="relative">
                <input {...register('password')} type={showPass ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{String(errors.password.message)}</p>}
            </div>
          )}

          {/* Role selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Role *</label>
            <div className="grid grid-cols-1 gap-2">
              {roles.map(r => (
                <label key={r.value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                  <input {...register('role')} type="radio" value={r.value} className="accent-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.label}</p>
                    <p className="text-xs text-gray-400">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-700">Account Status</p>
                <p className="text-xs text-gray-400">Enable or disable login access</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input {...register('isActive')} type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          )}

          {mutation.isError && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">
              {(mutation.error as any)?.response?.data?.message || 'Failed to save'}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update Staff' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
