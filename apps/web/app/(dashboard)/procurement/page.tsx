'use client';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { api } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import ReorderReport from '@/components/procurement/ReorderReport';

type Tab = 'history' | 'reorder';

export default function ProcurementPage() {
  const [tab, setTab] = useState<Tab>('history');
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: history, isLoading: histLoading } = useQuery({
    queryKey: ['procurement-history', search],
    queryFn: () => api.get(`/procurement/history?search=${search}`).then(r => r.data),
  });

  const { data: reorder, isLoading: reorderLoading } = useQuery({
    queryKey: ['procurement-reorder'],
    queryFn: () => api.get('/procurement/reorder').then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['procurement-stats'],
    queryFn: () => api.get('/procurement/stats').then(r => r.data),
  });

  const handlePrintReport = useReactToPrint({
    contentRef: reportRef,
    documentTitle: 'Reorder-Report',
    pageStyle: '@page { size: A4; margin: 0; } @media print { body { margin: 0; } }',
  });

  const historyList  = Array.isArray(history) ? history : [];
  const reorderList  = Array.isArray(reorder) ? reorder : [];
  const generatedAt  = new Date().toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const priceChangeLabel = (change: number | null) => {
    if (change === null) return { text: '—', color: '#a8a29e' };
    if (change === 0)    return { text: 'No Change', color: '#78716c' };
    if (change > 0)      return { text: `+${formatKES(change)}`, color: '#dc2626' };
    return { text: formatKES(change), color: '#16a34a' };
  };

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Hidden print sheet */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <ReorderReport
          ref={reportRef}
          items={reorderList}
          pharmacyName={user?.pharmacy?.name || 'PharmaPos Pharmacy'}
          generatedAt={generatedAt}
        />
      </div>

      {/* Page header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.02em', margin: 0 }}>
          Procurement Management
        </h1>
        <p style={{ color: '#78716c', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Track costs and generate reorder lists
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: '💰', label: 'Spent (30 days)',    value: formatKES(stats?.totalSpent30d || 0),      bg: '#dbeafe' },
          { icon: '📦', label: 'Units Received',     value: stats?.unitsReceived30d || 0,              bg: '#dcfce7' },
          { icon: '⚠️', label: 'Low Stock Items',    value: stats?.lowStockCount || 0,                 bg: '#fef9c3' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: '14px',
            border: '1px solid #e8e6e3', padding: '1.125rem',
            boxShadow: '0 1px 2px rgb(0 0 0 / 0.04)',
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              {s.icon}
            </div>
            <p style={{ fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.04em', color: '#1c1917', lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: '0.875rem', color: '#78716c', marginTop: '0.375rem', fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0', background: '#f2f1ef', borderRadius: '10px', padding: '3px' }}>
          {[
            { key: 'history', label: '🔄 Purchase History' },
            { key: 'reorder', label: `⚠️ Reorder List (Low Stock)${reorderList.length > 0 ? ` (${reorderList.length})` : ''}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as Tab)}
              style={{
                padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                background: tab === t.key ? 'white' : 'transparent',
                fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? '#1c1917' : '#78716c',
                fontSize: '0.875rem', cursor: 'pointer',
                boxShadow: tab === t.key ? '0 1px 3px rgb(0 0 0 / 0.1)' : 'none',
                transition: 'all 0.15s',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'reorder' && (
          <button
            onClick={() => handlePrintReport()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem 1.125rem', borderRadius: '10px',
              border: 'none', background: '#dc2626', color: 'white',
              fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
              boxShadow: '0 1px 3px rgb(0 0 0 / 0.15)',
            }}>
            🖨️ Download PDF Report
          </button>
        )}

        {tab === 'history' && (
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by drug or supplier..."
              style={{
                padding: '0.625rem 0.875rem 0.625rem 2.5rem',
                border: '1.5px solid #d4d0cb', borderRadius: '10px',
                fontSize: '0.875rem', color: '#1c1917', background: 'white',
                outline: 'none', width: '260px',
              }}
            />
          </div>
        )}
      </div>

      {/* ── Purchase History Tab ── */}
      {tab === 'history' && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e6e3', overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / 0.04)' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr 1.2fr 90px 100px 100px 110px 110px',
            padding: '0.75rem 1.25rem',
            background: '#f9f8f6', borderBottom: '1px solid #e8e6e3',
            fontSize: '0.6875rem', fontWeight: 700, color: '#a8a29e',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <span>Date</span>
            <span>Supplier</span>
            <span>Item Name</span>
            <span style={{ textAlign: 'right' }}>Qty Added</span>
            <span style={{ textAlign: 'right' }}>Old Cost</span>
            <span style={{ textAlign: 'right' }}>New Cost</span>
            <span style={{ textAlign: 'right' }}>Price Change</span>
            <span style={{ textAlign: 'right' }}>Total Cost</span>
          </div>

          {histLoading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#a8a29e' }}>
              <div style={{ display: 'inline-block', width: '22px', height: '22px', border: '2px solid #e8e6e3', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}

          {historyList.map((row: any, i: number) => {
            const pc = priceChangeLabel(row.priceChange);
            return (
              <div key={row.id} style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 1.2fr 90px 100px 100px 110px 110px',
                padding: '0.875rem 1.25rem',
                borderBottom: i < historyList.length - 1 ? '1px solid #f2f1ef' : 'none',
                alignItems: 'center',
                background: i % 2 === 0 ? 'white' : '#fafaf9',
              }}>
                <span style={{ fontSize: '0.8125rem', color: '#78716c' }}>
                  {new Date(row.date).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span style={{ fontSize: '0.875rem', color: '#44403c', fontWeight: 500 }}>
                  {row.supplier}
                </span>
                <div>
                  <p style={{ fontWeight: 700, color: '#1c1917', fontSize: '0.9rem', margin: 0 }}>{row.itemName}</p>
                  <p style={{ fontSize: '0.75rem', color: '#a8a29e', margin: 0 }}>Batch: {row.batchNo}</p>
                </div>
                <span style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a', fontSize: '0.9rem' }}>
                  {row.quantityAdded}
                </span>
                <span style={{ textAlign: 'right', color: '#78716c', fontSize: '0.875rem' }}>
                  {row.oldCost > 0 ? formatKES(row.oldCost) : '—'}
                </span>
                <span style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' }}>
                  {formatKES(row.newCost)}
                </span>
                <span style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.875rem', color: pc.color }}>
                  {pc.text}
                </span>
                <span style={{ textAlign: 'right', fontWeight: 700, color: '#1c1917', fontSize: '0.9rem' }}>
                  {formatKES(row.totalCost)}
                </span>
              </div>
            );
          })}

          {!histLoading && historyList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</p>
              <p style={{ fontWeight: 600, color: '#44403c' }}>No purchase history yet</p>
              <p style={{ color: '#a8a29e', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Stock received via Inventory will appear here
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Reorder List Tab ── */}
      {tab === 'reorder' && (
        <div>
          {/* Info banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: '#fefce8', border: '1px solid #fde68a',
            borderRadius: '12px', padding: '0.875rem 1.125rem',
            marginBottom: '1rem', fontSize: '0.875rem', color: '#854d0e',
          }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>ℹ️</span>
            <span>
              Showing items with <strong>{reorderList.filter((i: any) => i.isCritical).length} out of stock</strong> and{' '}
              <strong>{reorderList.length} below reorder level</strong>.
              Suggested order quantities are calculated at 2× reorder level.
            </span>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e6e3', overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / 0.04)' }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 90px 1fr 100px 100px',
              padding: '0.75rem 1.25rem',
              background: '#f9f8f6', borderBottom: '1px solid #e8e6e3',
              fontSize: '0.6875rem', fontWeight: 700, color: '#a8a29e',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              <span>Item Name</span>
              <span>Branch</span>
              <span style={{ textAlign: 'right' }}>Stock</span>
              <span>Last Supplier</span>
              <span style={{ textAlign: 'right' }}>Last Cost</span>
              <span style={{ textAlign: 'right' }}>Order Qty</span>
            </div>

            {reorderLoading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#a8a29e' }}>
                <div style={{ display: 'inline-block', width: '22px', height: '22px', border: '2px solid #e8e6e3', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}

            {reorderList.map((item: any, i: number) => (
              <div key={item.id} style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr 90px 1fr 100px 100px',
                padding: '1rem 1.25rem',
                borderBottom: i < reorderList.length - 1 ? '1px solid #f2f1ef' : 'none',
                alignItems: 'center',
                background: item.isCritical ? '#fef2f2' : 'white',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ fontWeight: 700, color: '#1c1917', fontSize: '0.9375rem', margin: 0 }}>{item.itemName}</p>
                    {item.isCritical && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: '#fee2e2', color: '#b91c1c' }}>
                        OUT
                      </span>
                    )}
                  </div>
                  {item.genericName && <p style={{ fontSize: '0.8rem', color: '#a8a29e', margin: 0 }}>{item.genericName} · {item.unit}</p>}
                  {item.category && <p style={{ fontSize: '0.75rem', color: '#d97706', margin: 0 }}>{item.category}</p>}
                </div>

                <span style={{ fontSize: '0.875rem', color: '#57534e' }}>{item.branch}</span>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.125rem', color: item.isCritical ? '#dc2626' : '#d97706' }}>
                    {item.currentStock}
                  </span>
                  <p style={{ fontSize: '0.7rem', color: '#a8a29e', margin: 0 }}>/ {item.reorderLevel} min</p>
                </div>

                <span style={{ fontSize: '0.875rem', color: '#57534e' }}>{item.lastSupplier}</span>

                <span style={{ textAlign: 'right', fontSize: '0.875rem', color: '#44403c', fontWeight: 500 }}>
                  {formatKES(item.lastCost)}
                </span>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.125rem', color: '#16a34a' }}>
                    {item.suggestedOrderQty}
                  </span>
                  <p style={{ fontSize: '0.7rem', color: '#a8a29e', margin: 0 }}>{item.unit}</p>
                </div>
              </div>
            ))}

            {!reorderLoading && reorderList.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <p style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</p>
                <p style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.1rem' }}>All stocked up!</p>
                <p style={{ color: '#78716c', fontSize: '0.875rem', marginTop: '0.375rem' }}>
                  No items are below reorder level. Great job!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
