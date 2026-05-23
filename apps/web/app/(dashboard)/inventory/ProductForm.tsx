'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { X } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Product name required'),
  genericName: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().default('tabs'),
  categoryId: z.string().optional(),
  costPrice: z.coerce.number().positive('Must be positive'),
  sellingPrice: z.coerce.number().positive('Must be positive'),
  vatRate: z.coerce.number().min(0).default(0),
  reorderLevel: z.coerce.number().min(0).default(10),
  requiresPrescription: z.boolean().default(false),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  product?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductForm({ product, onClose, onSuccess }: Props) {
  const isEdit = !!product;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: product ? {
      name: product.name,
      genericName: product.genericName || '',
      barcode: product.barcode || '',
      sku: product.sku || '',
      unit: product.unit || 'tabs',
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
      vatRate: Number(product.vatRate),
      reorderLevel: product.reorderLevel,
      requiresPrescription: product.requiresPrescription,
      description: product.description || '',
    } : { unit: 'tabs', vatRate: 0, reorderLevel: 10, requiresPrescription: false },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => isEdit
      ? api.put(`/products/${product.id}`, data).then(r => r.data)
      : api.post('/products', data).then(r => r.data),
    onSuccess,
  });

  const units = ['tabs', 'caps', 'ml', 'mg', 'g', 'pcs', 'bottle', 'sachet', 'tube', 'vial'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">Product Name *</label>
              <input {...register('name')} placeholder="e.g. Amoxicillin 500mg"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Generic Name</label>
              <input {...register('genericName')} placeholder="e.g. Amoxicillin"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Unit</label>
              <select {...register('unit')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white">
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Barcode & SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Barcode</label>
              <input {...register('barcode')} placeholder="Scan or type barcode"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">SKU</label>
              <input {...register('sku')} placeholder="Stock keeping unit"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Cost Price (KES) *</label>
              <input {...register('costPrice')} type="number" step="0.01" placeholder="0.00"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
              {errors.costPrice && <p className="text-red-500 text-xs mt-1">{errors.costPrice.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Selling Price (KES) *</label>
              <input {...register('sellingPrice')} type="number" step="0.01" placeholder="0.00"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
              {errors.sellingPrice && <p className="text-red-500 text-xs mt-1">{errors.sellingPrice.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">VAT Rate (%)</label>
              <input {...register('vatRate')} type="number" step="0.1" placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>
          </div>

          {/* Reorder & Prescription */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Reorder Level</label>
              <input {...register('reorderLevel')} type="number" placeholder="10"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input {...register('requiresPrescription')} type="checkbox"
                  className="w-4 h-4 rounded accent-emerald-600" />
                <span className="text-sm font-medium text-gray-700">Requires Prescription</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
            <textarea {...register('description')} placeholder="Optional product notes..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none" />
          </div>

          {mutation.isError && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">
              {(mutation.error as any)?.response?.data?.message || 'Failed to save product'}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
