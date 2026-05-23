'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { X, Package } from 'lucide-react';
import { formatKES } from '@/lib/utils';

const schema = z.object({
  batchNo: z.string().min(1, 'Batch number required'),
  expiryDate: z.string().min(1, 'Expiry date required'),
  quantity: z.coerce.number().int().positive('Must be positive'),
  costPrice: z.coerce.number().positive('Must be positive'),
  sellingPrice: z.coerce.number().positive('Must be positive'),
  supplierId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  product: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BatchForm({ product, onClose, onSuccess }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post(`/products/${product.id}/batches`, data).then(r => r.data),
    onSuccess,
  });

  const qty = watch('quantity') || 0;
  const cost = watch('costPrice') || 0;
  const totalCost = qty * cost;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Receive Stock</h2>
            <p className="text-sm text-gray-500 mt-0.5">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          {/* Current stock badge */}
          <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3">
            <Package size={18} className="text-blue-500" />
            <div>
              <p className="text-xs text-blue-600">Current Stock</p>
              <p className="font-bold text-blue-800">{product.totalStock ?? 0} {product.unit}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Batch Number *</label>
              <input {...register('batchNo')} placeholder="e.g. BT2024001"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
              {errors.batchNo && <p className="text-red-500 text-xs mt-1">{errors.batchNo.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Expiry Date *</label>
              <input {...register('expiryDate')} type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
              {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Quantity *</label>
            <input {...register('quantity')} type="number" placeholder="0"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Cost Price (KES) *</label>
              <input {...register('costPrice')} type="number" step="0.01"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Selling Price (KES) *</label>
              <input {...register('sellingPrice')} type="number" step="0.01"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Supplier</label>
            <select {...register('supplierId')}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white">
              <option value="">— Select supplier —</option>
              {(suppliers?.data || []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Total cost preview */}
          {qty > 0 && cost > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 flex justify-between text-sm">
              <span className="text-gray-500">Total Cost Value</span>
              <span className="font-bold text-gray-900">{formatKES(totalCost)}</span>
            </div>
          )}

          {mutation.isError && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">
              {(mutation.error as any)?.response?.data?.message || 'Failed to add stock'}
            </p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
              {mutation.isPending ? 'Adding...' : 'Receive Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
