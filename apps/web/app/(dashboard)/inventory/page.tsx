'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import ProductForm from './ProductForm';
import BatchForm from './BatchForm';

type Tab = 'products' | 'expiry' | 'lowstock';

const badge = (type: 'green' | 'yellow' | 'red' | 'orange', text: string) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '0.2rem 0.7rem', borderRadius: '999px',
    fontSize: '0.75rem', fontWeight: 700,
    background: type === 'green' ? '#dcfce7' : type === 'yellow' ? '#fef9c3' : type === 'orange' ? '#ffedd5' : '#fee2e2',
    color:      type === 'green' ? '#15803d' : type === 'yellow' ? '#854d0e' : type === 'orange' ? '#c2410c' : '#b91c1c',
  }}>{text}</span>
);

export default function InventoryPage() {
  const [search, setSearch]             = useState('');
  const [tab, setTab]                   = useState<Tab>('products');
  const [showProductForm, setShow]      = useState(false);
  const [editProduct, setEdit]          = useState<any>(null);
  const [batchProduct, setBatch]        = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api.get(`/products?search=${search}&limit=50`).then(r => r.data),
  });
  const { data: lowStock } = useQuery({ queryKey: ['low-stock'], queryFn: () => api.get('/products/reports/low-stock').then(r => r.data) });
  const { data: expiry }   = useQuery({ queryKey: ['expiry'],    queryFn: () => api.get('/products/reports/expiry?days=90').then(r => r.data) });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const products = data?.data || [];
  const refresh  = () => { qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['low-stock'] }); qc.invalidateQueries({ queryKey: ['expiry'] }); };

  return (
    <div>
      {(showProductForm || editProduct) && (
        <ProductForm product={editProduct}
          onClose={() => { setShow(false); setEdit(null); }}
          onSuccess={() => { setShow(false); setEdit(null); refresh(); }} />
      )}
      {batchProduct && (
        <BatchForm product={batchProduct}
          onClose={() => setBatch(null)}
          onSuccess={() => { setBatch(null); refresh(); }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.02em', margin: 0 }}>Inventory</h1>
          <p style={{ color: '#78716c', fontSize: '0.875rem', marginTop: '0.25rem' }}>Manage products, stock levels and expiry dates</p>
        </div>
        <button onClick={() => setShow(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#16a34a', color: 'white', border: 'none', padding: '0.625rem 1.125rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 1px 3px rgb(0 0 0 / 0.12)' }}>
          + Add Product
        </button>
      </div>

      {/* Stat tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'products', icon: '📦', label: 'All Products', count: products.length, accent: '#dbeafe'  },
          { key: 'lowstock', icon: '⚠️', label: 'Low Stock',    count: lowStock?.length || 0, accent: '#fef9c3'  },
          { key: 'expiry',   icon: '🕐', label: 'Expiring',     count: expiry?.length   || 0, accent: '#ffedd5'  },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as Tab)}
            style={{
              textAlign: 'left', cursor: 'pointer', background: 'white',
              borderRadius: '14px', padding: '1.125rem',
              border: `1.5px solid ${tab === t.key ? '#16a34a' : '#e8e6e3'}`,
              boxShadow: tab === t.key ? '0 4px 12px rgb(22 163 74 / 0.12)' : '0 1px 2px rgb(0 0 0 / 0.04)',
              outline: 'none', transition: 'all 0.15s',
            }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              {t.icon}
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.04em', color: tab === t.key ? '#16a34a' : '#1c1917', lineHeight: 1 }}>{t.count}</p>
            <p style={{ fontSize: '0.875rem', color: '#78716c', marginTop: '0.375rem', fontWeight: 500 }}>{t.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      {tab === 'products' && (
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, barcode, or generic name..."
            style={{ width: '100%', padding: '0.625rem 0.875rem 0.625rem 2.75rem', border: '1.5px solid #d4d0cb', borderRadius: '10px', fontSize: '0.9375rem', color: '#1c1917', background: 'white', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      )}

      {/* ── Products Table ── */}
      {tab === 'products' && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e6e3', overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / 0.04)' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 120px 110px 110px 80px 90px 110px',
            padding: '0.75rem 1.25rem',
            background: '#f9f8f6', borderBottom: '1px solid #e8e6e3',
            fontSize: '0.6875rem', fontWeight: 700, color: '#a8a29e',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <span>Product</span>
            <span>Barcode</span>
            <span style={{ textAlign: 'right' }}>Cost Price</span>
            <span style={{ textAlign: 'right' }}>Sell Price</span>
            <span style={{ textAlign: 'right' }}>Stock</span>
            <span style={{ textAlign: 'center' }}>Status</span>
            <span style={{ textAlign: 'center' }}>Actions</span>
          </div>

          {isLoading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#a8a29e' }}>
              <div style={{ display: 'inline-block', width: '22px', height: '22px', border: '2px solid #e8e6e3', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}

          {products.map((p: any, i: number) => {
            const stock   = p.totalStock ?? 0;
            const isOut   = stock === 0;
            const isLow   = !isOut && stock <= p.reorderLevel;
            return (
              <div key={p.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 120px 110px 110px 80px 90px 110px',
                padding: '0.875rem 1.25rem',
                borderBottom: i < products.length - 1 ? '1px solid #f2f1ef' : 'none',
                alignItems: 'center',
                background: i % 2 === 0 ? 'white' : '#fafaf9',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafaf9')}
              >
                {/* Product name */}
                <div>
                  <p style={{ fontWeight: 700, color: '#1c1917', fontSize: '0.9375rem', margin: 0 }}>{p.name}</p>
                  <p style={{ fontSize: '0.8rem', color: '#a8a29e', margin: '1px 0 0' }}>
                    {[p.genericName, p.unit, p.requiresPrescription ? '🔒 Rx' : null].filter(Boolean).join(' · ')}
                  </p>
                </div>

                {/* Barcode */}
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#78716c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.barcode || '—'}
                </span>

                {/* Cost */}
                <span style={{ textAlign: 'right', fontSize: '0.875rem', color: '#57534e', fontWeight: 500 }}>
                  {formatKES(p.costPrice)}
                </span>

                {/* Price */}
                <span style={{ textAlign: 'right', fontSize: '0.9375rem', fontWeight: 700, color: '#16a34a' }}>
                  {formatKES(p.sellingPrice)}
                </span>

                {/* Stock count */}
                <span style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.0625rem', color: isOut ? '#dc2626' : isLow ? '#d97706' : '#1c1917' }}>
                  {stock}
                </span>

                {/* Status */}
                <div style={{ textAlign: 'center' }}>
                  {isOut  ? badge('red',    'Out')      :
                   isLow  ? badge('yellow', 'Low')      :
                             badge('green',  'In Stock')}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                  <button onClick={() => setBatch(p)} title="Receive Stock"
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #dbeafe', background: '#eff6ff', cursor: 'pointer', fontSize: '0.875rem' }}>
                    📥
                  </button>
                  <button onClick={() => setEdit(p)} title="Edit Product"
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e8e6e3', background: '#f9f8f6', cursor: 'pointer', fontSize: '0.875rem' }}>
                    ✏️
                  </button>
                  <button onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(p.id); }} title="Delete"
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: '0.875rem' }}>
                    🗑
                  </button>
                </div>
              </div>
            );
          })}

          {!isLoading && products.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <p style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📦</p>
              <p style={{ fontWeight: 600, color: '#44403c', fontSize: '1rem' }}>No products yet</p>
              <p style={{ color: '#a8a29e', fontSize: '0.875rem', marginTop: '0.25rem' }}>Add your first product to get started</p>
              <button onClick={() => setShow(true)}
                style={{ marginTop: '1.25rem', padding: '0.625rem 1.25rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                + Add Product
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Low Stock Tab ── */}
      {tab === 'lowstock' && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e6e3', overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', background: '#fefce8', borderBottom: '1px solid #fef08a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚠️</span><p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#854d0e', margin: 0 }}>Products at or below reorder level — restock soon</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 90px 90px 110px', padding: '0.75rem 1.25rem', background: '#f9f8f6', borderBottom: '1px solid #e8e6e3', fontSize: '0.6875rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>Product</span><span style={{ textAlign: 'right' }}>Current Stock</span><span style={{ textAlign: 'right' }}>Reorder At</span><span style={{ textAlign: 'center' }}>Action</span>
          </div>
          {(lowStock || []).map((p: any, i: number) => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 90px 90px 110px', padding: '1rem 1.25rem', borderBottom: '1px solid #f2f1ef', alignItems: 'center' }}>
              <div><p style={{ fontWeight: 700, margin: 0 }}>{p.name}</p><p style={{ fontSize: '0.8rem', color: '#a8a29e', margin: 0 }}>{p.genericName}</p></div>
              <span style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: '#dc2626' }}>{p.totalStock}</span>
              <span style={{ textAlign: 'right', color: '#78716c' }}>{p.reorderLevel}</span>
              <div style={{ textAlign: 'center' }}>
                <button onClick={() => setBatch(p)} style={{ padding: '0.375rem 0.875rem', background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>+ Add Stock</button>
              </div>
            </div>
          ))}
          {!lowStock?.length && <div style={{ textAlign: 'center', padding: '3rem' }}><p style={{ fontSize: '2rem' }}>✅</p><p style={{ fontWeight: 600, color: '#16a34a' }}>All stocked up!</p></div>}
        </div>
      )}

      {/* ── Expiry Tab ── */}
      {tab === 'expiry' && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e6e3', overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', background: '#fff7ed', borderBottom: '1px solid #fed7aa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🕐</span><p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#c2410c', margin: 0 }}>Batches expiring within 90 days</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 80px 130px 100px', padding: '0.75rem 1.25rem', background: '#f9f8f6', borderBottom: '1px solid #e8e6e3', fontSize: '0.6875rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>Product</span><span>Batch No.</span><span style={{ textAlign: 'right' }}>Qty</span><span style={{ textAlign: 'right' }}>Expires</span><span style={{ textAlign: 'center' }}>Days Left</span>
          </div>
          {(expiry || []).map((b: any, i: number) => {
            const days = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / 86400000);
            return (
              <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '2fr 120px 80px 130px 100px', padding: '0.875rem 1.25rem', borderBottom: '1px solid #f2f1ef', alignItems: 'center', background: days <= 0 ? '#fef2f2' : 'white' }}>
                <div><p style={{ fontWeight: 700, margin: 0 }}>{b.product?.name}</p></div>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#78716c' }}>{b.batchNo}</span>
                <span style={{ textAlign: 'right', fontWeight: 700 }}>{b.quantity}</span>
                <span style={{ textAlign: 'right', fontSize: '0.875rem', color: '#57534e' }}>
                  {new Date(b.expiryDate).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <div style={{ textAlign: 'center' }}>
                  {days <= 0   ? badge('red',    'EXPIRED') :
                   days <= 30  ? badge('red',    `${days}d`) :
                   days <= 60  ? badge('orange', `${days}d`) :
                                 badge('yellow', `${days}d`)}
                </div>
              </div>
            );
          })}
          {!expiry?.length && <div style={{ textAlign: 'center', padding: '3rem' }}><p style={{ fontSize: '2rem' }}>✅</p><p style={{ fontWeight: 600, color: '#16a34a' }}>No expiring batches</p></div>}
        </div>
      )}
    </div>
  );
}
