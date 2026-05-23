'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { X } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Supplier name required'),
  contactName: z.string().optional(),
  phone: z.string().min(10, 'Valid phone required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  kraPin: z.string().optional(),
  paymentTerms: z.coerce.number().min(0).default(30),
});

type FormData = z.infer<typeof schema>;

interface Props {
  supplier?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SupplierForm({ supplier, onClose, onSuccess }: Props) {
  const isEdit = !!supplier;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: supplier ? {
      name: supplier.name,
      contactName: supplier.contactName || '',
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
      kraPin: supplier.kraPin || '',
      paymentTerms: supplier.paymentTerms || 30,
    } : { paymentTerms: 30 },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => isEdit
      ? api.put(`/suppliers/${supplier.id}`, data).then(r => r.data)
      : api.post('/suppliers', data).then(r => r.data),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Company Name *</label>
            <input {...register('name')} placeholder="e.g. Kenyatta Pharmaceuticals Ltd"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Contact Person</label>
              <input {...register('contactName')} placeholder="John Kamau"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Phone *</label>
              <input {...register('phone')} placeholder="0712345678"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
            <input {...register('email')} type="email" placeholder="supplier@example.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Address</label>
            <input {...register('address')} placeholder="Nairobi, Kenya"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">KRA PIN</label>
              <input {...register('kraPin')} placeholder="P051234567X"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Payment Terms (days)</label>
              <input {...register('paymentTerms')} type="number"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>
          </div>

          {mutation.isError && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">
              {(mutation.error as any)?.response?.data?.message || 'Failed to save supplier'}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
