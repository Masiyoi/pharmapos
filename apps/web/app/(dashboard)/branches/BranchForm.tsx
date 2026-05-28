'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

const schema = z.object({
  name:    z.string().min(1, 'Branch name is required'),
  address: z.string().min(1, 'Address is required'),
  phone:   z.string().min(10, 'Valid phone number required'),
  isMain:  z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  branch?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BranchForm({ branch, onClose, onSuccess }: Props) {
  const isEdit = !!branch;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: branch ? {
      name:    branch.name,
      address: branch.address,
      phone:   branch.phone,
      isMain:  branch.isMain ?? false,
    } : { isMain: false },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => isEdit
      ? api.put(`/branches/${branch.id}`, data).then(r => r.data)
      : api.post('/branches', data).then(r => r.data),
    onSuccess,
  });

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgb(0 0 0 / 0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '1rem',
    }}>
      <div style={{
        background: 'white', borderRadius: '20px',
        width: '100%', maxWidth: '460px',
        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e8e6e3',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#1c1917', margin: 0 }}>
              {isEdit ? 'Edit Branch' : 'Add New Branch'}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#78716c', marginTop: '2px' }}>
              {isEdit ? 'Update branch details' : 'Create a new pharmacy location'}
            </p>
          </div>
          <button onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontSize: '1rem' }}>
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#57534e', marginBottom: '0.375rem' }}>
                Branch Name *
              </label>
              <input {...register('name')}
                placeholder="e.g. Westlands Branch"
                style={{
                  width: '100%', padding: '0.625rem 0.875rem',
                  border: `1.5px solid ${errors.name ? '#fca5a5' : '#d4d0cb'}`,
                  borderRadius: '10px', fontSize: '0.9375rem', color: '#1c1917',
                  outline: 'none', background: 'white', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = errors.name ? '#fca5a5' : '#d4d0cb'}
              />
              {errors.name && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>⚠ {errors.name.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#57534e', marginBottom: '0.375rem' }}>
                Phone Number *
              </label>
              <input {...register('phone')}
                placeholder="0712 345 678"
                style={{
                  width: '100%', padding: '0.625rem 0.875rem',
                  border: `1.5px solid ${errors.phone ? '#fca5a5' : '#d4d0cb'}`,
                  borderRadius: '10px', fontSize: '0.9375rem', color: '#1c1917',
                  outline: 'none', background: 'white', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = errors.phone ? '#fca5a5' : '#d4d0cb'}
              />
              {errors.phone && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>⚠ {errors.phone.message}</p>}
            </div>

            {/* Address */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#57534e', marginBottom: '0.375rem' }}>
                Address *
              </label>
              <textarea {...register('address')}
                placeholder="e.g. Westlands Road, Nairobi"
                rows={2}
                style={{
                  width: '100%', padding: '0.625rem 0.875rem',
                  border: `1.5px solid ${errors.address ? '#fca5a5' : '#d4d0cb'}`,
                  borderRadius: '10px', fontSize: '0.9375rem', color: '#1c1917',
                  outline: 'none', background: 'white', resize: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = errors.address ? '#fca5a5' : '#d4d0cb'}
              />
              {errors.address && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>⚠ {errors.address.message}</p>}
            </div>

            {/* Main branch toggle */}
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.875rem 1rem',
              background: '#f9f8f6', borderRadius: '10px',
              border: '1px solid #f2f1ef', cursor: 'pointer',
            }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1c1917', margin: 0 }}>
                  ⭐ Main Branch
                </p>
                <p style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '2px' }}>
                  Marks this as the primary location
                </p>
              </div>
              <input {...register('isMain')} type="checkbox"
                style={{ width: '18px', height: '18px', accentColor: '#16a34a', cursor: 'pointer' }} />
            </label>

            {/* Error */}
            {mutation.isError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', color: '#b91c1c', fontSize: '0.875rem' }}>
                ⚠️ {(mutation.error as any)?.response?.data?.message || 'Failed to save branch'}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '1rem 1.5rem', borderTop: '1px solid #f2f1ef',
            background: '#f9f8f6', display: 'flex', gap: '0.75rem',
          }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '0.625rem', borderRadius: '10px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', color: '#44403c' }}>
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              style={{ flex: 2, padding: '0.625rem', borderRadius: '10px', border: 'none', background: mutation.isPending ? '#86efac' : '#16a34a', color: 'white', cursor: mutation.isPending ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'background 0.15s' }}>
              {mutation.isPending ? 'Saving...' : isEdit ? '✓ Update Branch' : '+ Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
