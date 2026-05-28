'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import BranchForm from './BranchForm';

export default function BranchesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editBranch, setEditBranch] = useState<any>(null);
  const [viewBranch, setViewBranch] = useState<any>(null);
  const qc = useQueryClient();

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['branch-stats'],
    queryFn: () => api.get('/branches/stats').then(r => r.data),
  });

  const { data: branchDetail } = useQuery({
    queryKey: ['branch-detail', viewBranch?.id],
    queryFn: () => api.get(`/branches/${viewBranch.id}`).then(r => r.data),
    enabled: !!viewBranch,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/branches/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
      qc.invalidateQueries({ queryKey: ['branch-stats'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Cannot delete branch');
    },
  });

  const list = Array.isArray(branches) ? branches : [];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['branches'] });
    qc.invalidateQueries({ queryKey: ['branch-stats'] });
  };

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* Form modal */}
      {(showForm || editBranch) && (
        <BranchForm
          branch={editBranch}
          onClose={() => { setShowForm(false); setEditBranch(null); }}
          onSuccess={() => { setShowForm(false); setEditBranch(null); refresh(); }}
        />
      )}

      {/* Branch detail modal */}
      {viewBranch && branchDetail && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgb(0 0 0 / 0.45)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 50, padding: '1rem',
        }}>
          <div style={{
            background: 'white', borderRadius: '20px',
            width: '100%', maxWidth: '520px', maxHeight: '85vh',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e8e6e3',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: branchDetail.isMain ? '#dcfce7' : '#f2f1ef',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem',
                }}>🏪</div>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#1c1917', margin: 0 }}>
                    {branchDetail.name}
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: '#78716c', margin: 0 }}>
                    {branchDetail.isMain ? '⭐ Main Branch' : 'Branch'}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewBranch(null)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontSize: '1rem' }}>
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
              {/* Info grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
                marginBottom: '1.5rem',
              }}>
                {[
                  { label: 'Phone', value: branchDetail.phone, icon: '📞' },
                  { label: 'Address', value: branchDetail.address, icon: '📍' },
                  { label: 'Total Sales', value: branchDetail._count?.sales || 0, icon: '🛒' },
                  { label: 'Added', value: formatDate(branchDetail.createdAt), icon: '📅' },
                ].map(item => (
                  <div key={item.label} style={{
                    background: '#f9f8f6', borderRadius: '12px',
                    padding: '0.875rem', border: '1px solid #f2f1ef',
                  }}>
                    <p style={{ fontSize: '0.75rem', color: '#a8a29e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                      {item.icon} {item.label}
                    </p>
                    <p style={{ fontWeight: 600, color: '#1c1917', fontSize: '0.9375rem' }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Staff */}
              {branchDetail.users?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                    Staff ({branchDetail.users.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {branchDetail.users.map((u: any) => (
                      <div key={u.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.75rem 1rem', background: '#f9f8f6',
                        borderRadius: '10px', border: '1px solid #f2f1ef',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: '#dcfce7', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#15803d',
                          }}>
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1c1917' }}>
                              {u.firstName} {u.lastName}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#a8a29e' }}>{u.email}</p>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.625rem',
                          borderRadius: '999px', background: '#f2f1ef', color: '#57534e',
                          letterSpacing: '0.04em',
                        }}>
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {branchDetail.users?.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#a8a29e' }}>
                  <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</p>
                  <p style={{ fontSize: '0.875rem' }}>No staff assigned to this branch yet</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem', borderTop: '1px solid #f2f1ef',
              background: '#f9f8f6', display: 'flex', gap: '0.75rem',
            }}>
              <button onClick={() => setViewBranch(null)}
                style={{ flex: 1, padding: '0.625rem', borderRadius: '10px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
                Close
              </button>
              <button onClick={() => { setViewBranch(null); setEditBranch(branchDetail); }}
                style={{ flex: 1, padding: '0.625rem', borderRadius: '10px', border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                Edit Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.02em', margin: 0 }}>
            Branches
          </h1>
          <p style={{ color: '#78716c', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage your pharmacy's physical locations
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#16a34a', color: 'white', border: 'none',
            padding: '0.625rem 1.125rem', borderRadius: '10px',
            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            boxShadow: '0 1px 3px rgb(0 0 0 / 0.12)',
          }}>
          + Add Branch
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: '🏪', label: 'Total Branches', value: stats?.total ?? '—', bg: '#dbeafe', },
          { icon: '👥', label: 'Total Staff',    value: stats?.totalStaff ?? '—', bg: '#dcfce7', },
          { icon: '🛒', label: 'Total Sales',    value: stats?.totalSales ?? '—', bg: '#fef9c3', },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: '14px',
            border: '1px solid #e8e6e3', padding: '1.125rem',
            boxShadow: '0 1px 3px rgb(0 0 0 / 0.04)',
          }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              {s.icon}
            </div>
            <p style={{ fontSize: '1.625rem', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: '0.875rem', color: '#78716c', marginTop: '0.375rem', fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Branch cards */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#a8a29e' }}>
          <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid #e8e6e3', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {list.map((b: any) => (
          <div key={b.id} style={{
            background: 'white', borderRadius: '16px',
            border: `1.5px solid ${b.isMain ? '#86efac' : '#e8e6e3'}`,
            padding: '1.25rem',
            boxShadow: b.isMain ? '0 4px 12px rgb(22 163 74 / 0.1)' : '0 1px 3px rgb(0 0 0 / 0.04)',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            position: 'relative',
          }}>
            {/* Main branch badge */}
            {b.isMain && (
              <div style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: '#dcfce7', color: '#15803d',
                fontSize: '0.6875rem', fontWeight: 700,
                padding: '0.2rem 0.625rem', borderRadius: '999px',
                letterSpacing: '0.04em',
              }}>
                ⭐ MAIN
              </div>
            )}

            {/* Icon + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: b.isMain ? '#dcfce7' : '#f2f1ef',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.375rem', flexShrink: 0,
              }}>🏪</div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1c1917', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {b.name}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#a8a29e', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  📍 {b.address}
                </p>
              </div>
            </div>

            {/* Info pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#57534e', background: '#f9f8f6', border: '1px solid #f2f1ef', borderRadius: '8px', padding: '0.25rem 0.625rem' }}>
                📞 {b.phone}
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#57534e', background: '#f9f8f6', border: '1px solid #f2f1ef', borderRadius: '8px', padding: '0.25rem 0.625rem' }}>
                👥 {b._count?.users ?? 0} staff
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#57534e', background: '#f9f8f6', border: '1px solid #f2f1ef', borderRadius: '8px', padding: '0.25rem 0.625rem' }}>
                🛒 {b._count?.sales ?? 0} sales
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f2f1ef', paddingTop: '0.875rem' }}>
              <button onClick={() => setViewBranch(b)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, color: '#44403c' }}>
                👁 View
              </button>
              <button onClick={() => setEditBranch(b)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, color: '#44403c' }}>
                ✏️ Edit
              </button>
              {!b.isMain && (
                <button
                  onClick={() => { if (confirm(`Delete "${b.name}"?`)) deleteMutation.mutate(b.id); }}
                  style={{ padding: '0.5rem 0.625rem', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: '0.875rem' }}>
                  🗑
                </button>
              )}
            </div>
          </div>
        ))}

        {!isLoading && list.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#a8a29e' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏪</p>
            <p style={{ fontWeight: 600, color: '#44403c', fontSize: '1rem' }}>No branches yet</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.375rem' }}>Add your first branch to get started</p>
            <button onClick={() => setShowForm(true)}
              style={{ marginTop: '1.25rem', padding: '0.625rem 1.25rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
              + Add Branch
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
