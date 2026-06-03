'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName:  z.string().min(1, 'Required'),
  email:     z.string().email('Valid email required'),
  password:  z.string().min(8, 'Min 8 characters').optional().or(z.literal('')),
  phone:     z.string().optional(),
  role:      z.enum(['ADMIN','PHARMACIST','CASHIER']),
  branchId:  z.string().optional(),
  isActive:  z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

// Simplified to 3 roles only
const ROLES = [
  {
    value: 'ADMIN',
    label: 'Admin',
    icon: '🛡️',
    desc: 'Full pharmacy management — inventory, staff, reports, settings',
    bg: '#ede9fe', color: '#6d28d9',
  },
  {
    value: 'PHARMACIST',
    label: 'Pharmacist',
    icon: '🧑‍⚕️',
    desc: 'Inventory, prescriptions, procurement — no staff management',
    bg: '#dbeafe', color: '#1d4ed8',
  },
  {
    value: 'CASHIER',
    label: 'Cashier / Dispenser',
    icon: '🏷️',
    desc: 'POS sales, own customers, own sales reports only',
    bg: '#dcfce7', color: '#15803d',
  },
];

export default function StaffForm({ user, onClose, onSuccess }: {
  user?: any; onClose: () => void; onSuccess: () => void;
}) {
  const isEdit = !!user;
  const [showPass, setShowPass] = useState(false);

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(r => r.data).catch(() => []),
  });
  const branchList = Array.isArray(branches) ? branches : [];

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: user ? {
      firstName: user.firstName,
      lastName:  user.lastName,
      phone:     user.phone || '',
      role:      ['ADMIN','PHARMACIST','CASHIER'].includes(user.role) ? user.role : 'CASHIER',
      branchId:  user.branch?.id || '',
      isActive:  user.isActive,
    } : { role: 'CASHIER' },
  });

  const selectedRole = watch('role');

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: any = { ...data };
      if (!payload.password) delete payload.password;
      return isEdit
        ? api.put(`/users/${user.id}`, payload).then(r => r.data)
        : api.post('/users', payload).then(r => r.data);
    },
    onSuccess,
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.625rem 0.875rem',
    border: '1.5px solid #d4d0cb', borderRadius: '8px',
    fontSize: '0.9375rem', color: '#1c1917', background: 'white',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgb(0 0 0 / 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem', overflowY: 'auto' }}>
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.3)', margin: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e8e6e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#1c1917', margin: 0 }}>
              {isEdit ? 'Edit Staff Member' : 'Add Staff Member'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#78716c', margin: '2px 0 0' }}>
              {isEdit ? 'Update details' : 'Create a new pharmacy staff account'}
            </p>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#57534e', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>First Name *</label>
                <input {...register('firstName')} placeholder="Jane" style={inputStyle} />
                {errors.firstName && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>⚠ {errors.firstName.message}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#57534e', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last Name *</label>
                <input {...register('lastName')} placeholder="Wanjiru" style={inputStyle} />
              </div>
            </div>

            {/* Email — only on create */}
            {!isEdit && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#57534e', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email *</label>
                <input {...register('email')} type="email" placeholder="jane@pharmacy.co.ke" style={inputStyle} />
                {errors.email && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>⚠ {errors.email.message}</p>}
              </div>
            )}

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#57534e', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone</label>
              <input {...register('phone')} placeholder="0712 345 678" style={inputStyle} />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#57534e', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {isEdit ? 'New Password (leave blank to keep)' : 'Password *'}
              </label>
              <div style={{ position: 'relative' }}>
                <input {...register('password')} type={showPass ? 'text' : 'password'}
                  placeholder={isEdit ? 'Leave blank to keep current' : 'Min 8 characters'}
                  style={{ ...inputStyle, paddingRight: '3rem' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', fontSize: '1rem' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>⚠ {errors.password.message}</p>}
            </div>

            {/* Role selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#57534e', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Role *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ROLES.map(r => (
                  <label key={r.value} style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.875rem 1rem',
                    border: `1.5px solid ${selectedRole === r.value ? r.color : '#e8e6e3'}`,
                    background: selectedRole === r.value ? r.bg : 'white',
                    borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <input {...register('role')} type="radio" value={r.value}
                      style={{ accentColor: r.color, width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '1.25rem' }}>{r.icon}</span>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1c1917', margin: 0 }}>{r.label}</p>
                      <p style={{ fontSize: '0.75rem', color: '#78716c', margin: 0 }}>{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Branch */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#57534e', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Assigned Branch
                {selectedRole === 'CASHIER' && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
              </label>
              <select {...register('branchId')} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">— All Branches (Admin/Pharmacist) —</option>
                {branchList.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {selectedRole === 'CASHIER' && (
                <p style={{ fontSize: '0.7rem', color: '#d97706', marginTop: '0.25rem' }}>
                  ⚠ Cashiers should be assigned a specific branch
                </p>
              )}
            </div>

            {/* Active toggle (edit only) */}
            {isEdit && (
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: '#f9f8f6', borderRadius: '10px', border: '1px solid #f2f1ef', cursor: 'pointer' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1c1917', margin: 0 }}>Account Active</p>
                  <p style={{ fontSize: '0.75rem', color: '#78716c', margin: 0 }}>Disable to block login access</p>
                </div>
                <input {...register('isActive')} type="checkbox" style={{ width: '18px', height: '18px', accentColor: '#16a34a', cursor: 'pointer' }} />
              </label>
            )}

            {mutation.isError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', color: '#b91c1c', fontSize: '0.875rem' }}>
                ⚠️ {(mutation.error as any)?.response?.data?.message || 'Failed to save'}
              </div>
            )}
          </div>

          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f2f1ef', background: '#f9f8f6', display: 'flex', gap: '0.75rem', borderRadius: '0 0 20px 20px' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', color: '#44403c' }}>
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              style={{ flex: 2, padding: '0.75rem', borderRadius: '10px', border: 'none', background: mutation.isPending ? '#86efac' : '#16a34a', color: 'white', cursor: mutation.isPending ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9375rem' }}>
              {mutation.isPending ? 'Saving...' : isEdit ? '✓ Update Staff' : '✓ Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
