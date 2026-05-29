'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const schema = z.object({
  name:                z.string().min(1, 'Product name is required'),
  genericName:         z.string().optional(),
  barcode:             z.string().optional(),
  unit:                z.string().default('tabs'),
  categoryId:          z.string().optional(),
  costPrice:           z.coerce.number().positive('Enter a valid cost price'),
  sellingPrice:        z.coerce.number().positive('Enter a valid selling price'),
  vatRate:             z.coerce.number().min(0).default(0),
  reorderLevel:        z.coerce.number().min(0).default(10),
  requiresPrescription:z.boolean().default(false),
  description:         z.string().optional(),
  // Initial stock fields (only used on create)
  initialStock:        z.coerce.number().min(0).default(0),
  batchNo:             z.string().optional(),
  expiryDate:          z.string().optional(),
  supplierId:          z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const UNITS = ['tabs','caps','ml','mg','g','pcs','bottle','sachet','tube','vial','strip','ampoule'];

const field = {
  label: (text: string, required = false) => (
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#57534e', marginBottom: '0.375rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
      {text}{required && <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>}
    </label>
  ),
  input: (props: any) => (
    <input {...props} style={{
      width: '100%', padding: '0.625rem 0.875rem',
      border: '1.5px solid #d4d0cb', borderRadius: '8px',
      fontSize: '0.9375rem', color: '#1c1917', background: 'white',
      outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit',
      ...props.style,
    }}
    onFocus={e => e.target.style.borderColor = '#16a34a'}
    onBlur={e => e.target.style.borderColor = '#d4d0cb'}
    />
  ),
  select: (props: any) => (
    <select {...props} style={{
      width: '100%', padding: '0.625rem 0.875rem',
      border: '1.5px solid #d4d0cb', borderRadius: '8px',
      fontSize: '0.9375rem', color: '#1c1917', background: 'white',
      outline: 'none', boxSizing: 'border-box' as const,
      cursor: 'pointer', appearance: 'auto' as const,
      ...props.style,
    }}
    onFocus={e => e.target.style.borderColor = '#16a34a'}
    onBlur={e => e.target.style.borderColor = '#d4d0cb'}
    />
  ),
};

interface Props { product?: any; onClose: () => void; onSuccess: () => void; }

export default function ProductForm({ product, onClose, onSuccess }: Props) {
  const isEdit = !!product;

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then(r => r.data),
  });
  const supplierList = Array.isArray(suppliers) ? suppliers : [];

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: product ? {
      name:                product.name,
      genericName:         product.genericName || '',
      barcode:             product.barcode || '',
      unit:                product.unit || 'tabs',
      costPrice:           Number(product.costPrice),
      sellingPrice:        Number(product.sellingPrice),
      vatRate:             Number(product.vatRate),
      reorderLevel:        product.reorderLevel,
      requiresPrescription:product.requiresPrescription,
      description:         product.description || '',
      initialStock:        0,
    } : {
      unit: 'tabs', vatRate: 0, reorderLevel: 10,
      requiresPrescription: false, initialStock: 0,
    },
  });

  const initialStock = watch('initialStock');
  const costPrice    = watch('costPrice');
  const sellingPrice = watch('sellingPrice');

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEdit) {
        return api.put(`/products/${product.id}`, data).then(r => r.data);
      }
      // Create product
      const created = await api.post('/products', data).then(r => r.data);
      // If initial stock > 0, create a batch
      if (data.initialStock > 0) {
        await api.post(`/products/${created.id}/batches`, {
          batchNo:     data.batchNo || `OPENING-${Date.now()}`,
          expiryDate:  data.expiryDate || '2030-12-31',
          quantity:    data.initialStock,
          costPrice:   data.costPrice,
          sellingPrice:data.sellingPrice,
          supplierId:  data.supplierId || undefined,
        });
      }
      return created;
    },
    onSuccess,
  });

  const margin = costPrice && sellingPrice && costPrice > 0
    ? (((sellingPrice - costPrice) / costPrice) * 100).toFixed(1)
    : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgb(0 0 0 / 0.45)',
      backdropFilter: 'blur(4px)', display: 'flex',
      alignItems: 'flex-start', justifyContent: 'center',
      zIndex: 50, padding: '1rem', overflowY: 'auto',
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', width: '100%',
        maxWidth: '640px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.3)',
        margin: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid #e8e6e3',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: 'white',
          borderRadius: '20px 20px 0 0', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💊</div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#1c1917', margin: 0 }}>
                {isEdit ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#78716c', margin: 0 }}>
                {isEdit ? 'Update product details' : 'Fill in product information'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Basic Info ── */}
            <section>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>📋 Basic Information</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  {field.label('Product Name', true)}
                  {field.input({ ...register('name'), placeholder: 'e.g. Amoxicillin 500mg' })}
                  {errors.name && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>⚠ {errors.name.message}</p>}
                </div>
                <div>
                  {field.label('Generic Name')}
                  {field.input({ ...register('genericName'), placeholder: 'e.g. Amoxicillin' })}
                </div>
                <div>
                  {field.label('Unit of Measure')}
                  {field.select({ ...register('unit'), children: UNITS.map(u => <option key={u} value={u}>{u}</option>) })}
                </div>
                <div>
                  {field.label('Barcode')}
                  {field.input({ ...register('barcode'), placeholder: 'Scan or type barcode' })}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {field.label('SKU')}
                    <span title="Your internal product code e.g. PARA-500. Optional." style={{ fontSize: '0.7rem', background: '#f2f1ef', color: '#78716c', borderRadius: '4px', padding: '1px 5px', cursor: 'help', marginBottom: '0.375rem' }}>?</span>
                  </div>
                  {field.input({ ...register('sku'), placeholder: 'e.g. PARA-500 (optional)' } as any)}
                </div>
              </div>
            </section>

            {/* ── Pricing ── */}
            <section>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>💰 Pricing</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem' }}>
                <div>
                  {field.label('Cost Price (KES)', true)}
                  {field.input({ ...register('costPrice'), type: 'number', step: '0.01', placeholder: '0.00' })}
                  {errors.costPrice && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>⚠ {errors.costPrice.message}</p>}
                </div>
                <div>
                  {field.label('Selling Price (KES)', true)}
                  {field.input({ ...register('sellingPrice'), type: 'number', step: '0.01', placeholder: '0.00' })}
                  {errors.sellingPrice && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>⚠ {errors.sellingPrice.message}</p>}
                </div>
                <div>
                  {field.label('VAT Rate (%)')}
                  {field.input({ ...register('vatRate'), type: 'number', step: '0.1', placeholder: '0' })}
                </div>
              </div>
              {/* Margin preview */}
              {margin && (
                <div style={{ marginTop: '0.625rem', padding: '0.625rem 0.875rem', background: Number(margin) > 0 ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${Number(margin) > 0 ? '#bbf7d0' : '#fecaca'}` }}>
                  <p style={{ fontSize: '0.8125rem', color: Number(margin) > 0 ? '#15803d' : '#b91c1c', fontWeight: 600, margin: 0 }}>
                    {Number(margin) > 0 ? '📈' : '📉'} Profit margin: <strong>{margin}%</strong>
                    {Number(margin) < 10 && Number(margin) > 0 && <span style={{ color: '#d97706' }}> — Low margin, consider adjusting</span>}
                  </p>
                </div>
              )}
            </section>

            {/* ── Stock Settings ── */}
            <section>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>📦 Stock Settings</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  {field.label('Reorder Level')}
                  {field.input({ ...register('reorderLevel'), type: 'number', placeholder: '10' })}
                  <p style={{ fontSize: '0.7rem', color: '#a8a29e', marginTop: '0.25rem' }}>Alert when stock drops below this</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
                    <input {...register('requiresPrescription')} type="checkbox"
                      style={{ width: '18px', height: '18px', accentColor: '#16a34a' }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1c1917', margin: 0 }}>Requires Prescription</p>
                      <p style={{ fontSize: '0.7rem', color: '#a8a29e', margin: 0 }}>RX drug — needs doctor's note</p>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            {/* ── Opening Stock (create only) ── */}
            {!isEdit && (
              <section>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>🏪 Opening Stock <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '0.7rem' }}>(optional — you can add stock later)</span></p>
                <div style={{ background: '#f9f8f6', borderRadius: '12px', padding: '1rem', border: '1px solid #f2f1ef' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }}>
                    <div>
                      {field.label('Initial Quantity')}
                      {field.input({ ...register('initialStock'), type: 'number', min: '0', placeholder: '0' })}
                    </div>
                    <div>
                      {field.label('Batch Number')}
                      {field.input({ ...register('batchNo'), placeholder: 'e.g. BT2024001 (auto if blank)' })}
                    </div>
                    <div>
                      {field.label('Expiry Date')}
                      {field.input({ ...register('expiryDate'), type: 'date', style: { colorScheme: 'light' } })}
                    </div>
                    <div>
                      {field.label('Supplier')}
                      <select {...register('supplierId')} style={{
                        width: '100%', padding: '0.625rem 0.875rem',
                        border: '1.5px solid #d4d0cb', borderRadius: '8px',
                        fontSize: '0.9375rem', color: supplierList.length ? '#1c1917' : '#a8a29e',
                        background: 'white', outline: 'none', cursor: 'pointer',
                      }}>
                        <option value="">— Select supplier —</option>
                        {supplierList.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {supplierList.length === 0 && (
                        <p style={{ fontSize: '0.7rem', color: '#d97706', marginTop: '0.25rem' }}>
                          ⚠ No suppliers yet — <a href="/suppliers" style={{ color: '#16a34a' }}>add one first</a>
                        </p>
                      )}
                    </div>
                  </div>
                  {Number(initialStock) > 0 && (
                    <div style={{ padding: '0.625rem 0.875rem', background: '#dcfce7', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                      <p style={{ fontSize: '0.8125rem', color: '#15803d', fontWeight: 600, margin: 0 }}>
                        ✅ Will add <strong>{initialStock} {watch('unit')}</strong> to stock on save
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── Description ── */}
            <div>
              {field.label('Description / Notes')}
              <textarea {...register('description')} placeholder="Optional product notes, storage instructions, etc..."
                rows={2} style={{
                  width: '100%', padding: '0.625rem 0.875rem',
                  border: '1.5px solid #d4d0cb', borderRadius: '8px',
                  fontSize: '0.9375rem', color: '#1c1917', background: 'white',
                  outline: 'none', resize: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }} />
            </div>

            {mutation.isError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.875rem', color: '#b91c1c', fontSize: '0.875rem' }}>
                ⚠️ {(mutation.error as any)?.response?.data?.message || 'Failed to save product'}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '1rem 1.5rem', borderTop: '1px solid #f2f1ef',
            background: '#f9f8f6', display: 'flex', gap: '0.75rem',
            borderRadius: '0 0 20px 20px',
          }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', color: '#44403c' }}>
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              style={{ flex: 2, padding: '0.75rem', borderRadius: '10px', border: 'none', background: mutation.isPending ? '#86efac' : '#16a34a', color: 'white', cursor: mutation.isPending ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9375rem' }}>
              {mutation.isPending ? 'Saving...' : isEdit ? '✓ Update Product' : '✓ Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
