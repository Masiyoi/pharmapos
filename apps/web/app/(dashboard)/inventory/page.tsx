'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { PageHeader, StatCard, EmptyState, LoadingRow } from '@/lib/ui';
import ProductForm from './ProductForm';
import BatchForm from './BatchForm';

type Tab = 'products' | 'expiry' | 'lowstock';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('products');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [batchProduct, setBatchProduct] = useState<any>(null);
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
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['products'] });
    qc.invalidateQueries({ queryKey: ['low-stock'] });
    qc.invalidateQueries({ queryKey: ['expiry'] });
  };

  const tabs: { key: Tab; label: string; count: number; accent: string }[] = [
    { key: 'products', label: 'All Products', count: products.length, accent: '#dbeafe' },
    { key: 'lowstock', label: 'Low Stock',    count: lowStock?.length || 0, accent: '#fef9c3' },
    { key: 'expiry',   label: 'Expiring',     count: expiry?.length || 0,   accent: '#ffedd5' },
  ];

  return (
    <div>
      {(showProductForm || editProduct) && (
        <ProductForm product={editProduct}
          onClose={() => { setShowProductForm(false); setEditProduct(null); }}
          onSuccess={() => { setShowProductForm(false); setEditProduct(null); refresh(); }} />
      )}
      {batchProduct && (
        <BatchForm product={batchProduct}
          onClose={() => setBatchProduct(null)}
          onSuccess={() => { setBatchProduct(null); refresh(); }} />
      )}

      <PageHeader title="Inventory"
        subtitle="Manage products, stock levels and expiry dates"
        action={
          <button className="btn btn-primary" onClick={() => setShowProductForm(true)}>
            + Add Product
          </button>
        }
      />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="stat-card"
            style={{
              textAlign: 'left', cursor: 'pointer', border: '1px solid',
              borderColor: tab === t.key ? 'var(--brand-500)' : 'var(--border)',
              outline: 'none',
              background: tab === t.key ? '#f0fdf4' : 'white',
            }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              {t.key === 'products' ? '📦' : t.key === 'lowstock' ? '⚠️' : '🕐'}
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>{t.count}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.375rem', fontWeight: 500 }}>{t.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      {tab === 'products' && (
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔍</span>
          <input className="input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, barcode, or generic name..."
            style={{ paddingLeft: '2.5rem' }} />
        </div>
      )}

      {/* Products table */}
      {tab === 'products' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ display: 'none' }} className="md-show">Barcode</th>
                <th style={{ textAlign: 'right' }}>Cost</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Stock</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <LoadingRow cols={7} />}
              {products.map((p: any) => {
                const stock = p.totalStock ?? 0;
                const status = stock === 0 ? 'out' : stock <= p.reorderLevel ? 'low' : 'ok';
                return (
                  <tr key={p.id}>
                    <td>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</p>
                      {p.genericName && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '1px' }}>{p.genericName} · {p.unit}</p>}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {p.barcode || '—'}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{formatKES(p.costPrice)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand-700)' }}>{formatKES(p.sellingPrice)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>{stock}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${status === 'ok' ? 'badge-green' : status === 'low' ? 'badge-yellow' : 'badge-red'}`}>
                        {status === 'ok' ? 'In Stock' : status === 'low' ? 'Low' : 'Out'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setBatchProduct(p)} title="Add Stock" style={{ padding: '0.35rem 0.5rem' }}>📥</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditProduct(p)} title="Edit" style={{ padding: '0.35rem 0.5rem' }}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => { if(confirm('Delete?')) deleteMutation.mutate(p.id); }} title="Delete" style={{ padding: '0.35rem 0.5rem' }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && products.length === 0 && (
                <tr><td colSpan={7}>
                  <EmptyState icon="📦" title="No products yet" description="Add your first product to get started" />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Low stock */}
      {tab === 'lowstock' && (
        <div className="table-wrapper">
          <div style={{ padding: '0.875rem 1.25rem', background: '#fefce8', borderBottom: '1px solid #fef08a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚠️</span>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#854d0e' }}>Products at or below reorder level — restock soon</p>
          </div>
          <table className="table">
            <thead><tr><th>Product</th><th style={{ textAlign: 'right' }}>Current Stock</th><th style={{ textAlign: 'right' }}>Reorder At</th><th style={{ textAlign: 'center' }}>Action</th></tr></thead>
            <tbody>
              {(lowStock || []).map((p: any) => (
                <tr key={p.id}>
                  <td><p style={{ fontWeight: 600 }}>{p.name}</p><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.genericName}</p></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)', fontSize: '1.1rem' }}>{p.totalStock}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{p.reorderLevel}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-sm" onClick={() => setBatchProduct(p)} style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>+ Add Stock</button>
                  </td>
                </tr>
              ))}
              {!lowStock?.length && <tr><td colSpan={4}><EmptyState icon="✅" title="All stocked up!" description="No products below reorder level" /></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Expiry */}
      {tab === 'expiry' && (
        <div className="table-wrapper">
          <div style={{ padding: '0.875rem 1.25rem', background: '#fff7ed', borderBottom: '1px solid #fed7aa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🕐</span>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#c2410c' }}>Batches expiring within 90 days</p>
          </div>
          <table className="table">
            <thead><tr><th>Product</th><th>Batch No.</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Expires</th><th style={{ textAlign: 'center' }}>Days Left</th></tr></thead>
            <tbody>
              {(expiry || []).map((b: any) => {
                const days = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / 86400000);
                return (
                  <tr key={b.id}>
                    <td><p style={{ fontWeight: 600 }}>{b.product?.name}</p></td>
                    <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{b.batchNo}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{b.quantity}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {new Date(b.expiryDate).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${days <= 0 ? 'badge-red' : days <= 30 ? 'badge-red' : days <= 60 ? 'badge-orange' : 'badge-yellow'}`}>
                        {days <= 0 ? 'EXPIRED' : `${days}d`}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!expiry?.length && <tr><td colSpan={5}><EmptyState icon="✅" title="No expiring batches" description="All batches expire beyond 90 days" /></td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
