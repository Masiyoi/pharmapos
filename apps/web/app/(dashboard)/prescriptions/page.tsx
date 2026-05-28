'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import NewPrescriptionForm from './NewPrescriptionForm';
import PrescriptionDetail from './PrescriptionDetail';

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: '#fef9c3', color: '#854d0e', label: 'Pending'   },
  DISPENSED: { bg: '#dcfce7', color: '#15803d', label: 'Dispensed' },
  PARTIAL:   { bg: '#dbeafe', color: '#1d4ed8', label: 'Partial'   },
  CANCELLED: { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' },
};

export default function PrescriptionsPage() {
  const [showForm, setShowForm]   = useState(false);
  const [viewRx,   setViewRx]    = useState<any>(null);
  const [editRx,   setEditRx]    = useState<any>(null);
  const [search,   setSearch]    = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const qc = useQueryClient();

  const { data: rxList, isLoading } = useQuery({
    queryKey: ['prescriptions', search, statusFilter],
    queryFn: () =>
      api.get(`/prescriptions?search=${search}&status=${statusFilter}`)
         .then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['rx-stats'],
    queryFn: () => api.get('/prescriptions/stats').then(r => r.data),
  });

  const dispenseMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/prescriptions/${id}/dispense`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prescriptions'] });
      qc.invalidateQueries({ queryKey: ['rx-stats'] });
      setViewRx(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/prescriptions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prescriptions'] });
      qc.invalidateQueries({ queryKey: ['rx-stats'] });
    },
  });

  const list = Array.isArray(rxList) ? rxList : [];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['prescriptions'] });
    qc.invalidateQueries({ queryKey: ['rx-stats'] });
  };

  return (
    <div style={{ maxWidth: '1100px' }}>
      {showForm && (
        <NewPrescriptionForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); refresh(); }}
        />
      )}
      {editRx && (
        <NewPrescriptionForm
          prescription={editRx}
          onClose={() => setEditRx(null)}
          onSuccess={() => { setEditRx(null); refresh(); }}
        />
      )}
      {viewRx && (
        <PrescriptionDetail
          prescription={viewRx}
          onClose={() => setViewRx(null)}
          onDispense={() => dispenseMutation.mutate(viewRx.id)}
          onEdit={() => { setViewRx(null); setEditRx(viewRx); }}
          dispensing={dispenseMutation.isPending}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.02em', margin: 0 }}>
            Prescription Manager
          </h1>
          <p style={{ color: '#78716c', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Create, track and dispense patient prescriptions
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#16a34a', color: 'white', border: 'none',
            padding: '0.625rem 1.125rem', borderRadius: '10px',
            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            boxShadow: '0 1px 3px rgb(0 0 0 / 0.15)',
          }}>
          + New Prescription
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total',     value: stats?.total     ?? 0, bg: '#f2f1ef', icon: '📋' },
          { label: 'Pending',   value: stats?.pending   ?? 0, bg: '#fef9c3', icon: '⏳' },
          { label: 'Dispensed', value: stats?.dispensed ?? 0, bg: '#dcfce7', icon: '✅' },
          { label: 'Cancelled', value: stats?.expired   ?? 0, bg: '#fee2e2', icon: '❌' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: '14px',
            border: '1px solid #e8e6e3', padding: '1.125rem',
            boxShadow: '0 1px 2px rgb(0 0 0 / 0.04)',
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              {s.icon}
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.04em', color: '#1c1917', lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: '0.875rem', color: '#78716c', marginTop: '0.375rem', fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient, RX code or doctor..."
            style={{
              width: '100%', padding: '0.625rem 0.875rem 0.625rem 2.5rem',
              border: '1.5px solid #d4d0cb', borderRadius: '10px',
              fontSize: '0.9375rem', color: '#1c1917', background: 'white',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '0.625rem 0.875rem', border: '1.5px solid #d4d0cb',
            borderRadius: '10px', fontSize: '0.875rem', color: '#1c1917',
            background: 'white', outline: 'none', cursor: 'pointer',
          }}>
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="DISPENSED">Dispensed</option>
          <option value="PARTIAL">Partial</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e6e3', overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / 0.04)' }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr 1fr 140px 120px 140px',
          gap: '0',
          padding: '0.75rem 1.25rem',
          background: '#f9f8f6',
          borderBottom: '1px solid #e8e6e3',
          fontSize: '0.75rem', fontWeight: 700,
          color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          <span>RX Code</span>
          <span>Patient</span>
          <span>Doctor</span>
          <span>Date</span>
          <span>Status</span>
          <span style={{ textAlign: 'center' }}>Actions</span>
        </div>

        {/* Rows */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#a8a29e' }}>
            <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid #e8e6e3', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {list.map((rx: any) => {
          const statusCfg = STATUS_STYLE[rx.status] || STATUS_STYLE.PENDING;
          return (
            <div key={rx.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr 1fr 140px 120px 140px',
                padding: '1rem 1.25rem',
                borderBottom: '1px solid #f2f1ef',
                alignItems: 'center',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f9f8f6')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* RX Code */}
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8125rem', color: '#16a34a' }}>
                {rx.rxCode}
              </span>

              {/* Patient */}
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#1c1917', margin: 0 }}>{rx.patientName}</p>
                {rx.patientPhone && <p style={{ fontSize: '0.8rem', color: '#a8a29e', margin: 0 }}>{rx.patientPhone}</p>}
              </div>

              {/* Doctor */}
              <div>
                <p style={{ fontWeight: 500, fontSize: '0.9rem', color: '#44403c', margin: 0 }}>{rx.doctorName || '—'}</p>
                {rx.doctorSpecialty && <p style={{ fontSize: '0.8rem', color: '#a8a29e', margin: 0 }}>{rx.doctorSpecialty}</p>}
              </div>

              {/* Date */}
              <span style={{ fontSize: '0.875rem', color: '#78716c' }}>
                {new Date(rx.issuedDate).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>

              {/* Status */}
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0.25rem 0.75rem', borderRadius: '999px',
                fontSize: '0.75rem', fontWeight: 700,
                background: statusCfg.bg, color: statusCfg.color,
                width: 'fit-content',
              }}>
                {statusCfg.label}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button onClick={() => setViewRx(rx)}
                  style={{ padding: '0.375rem 0.75rem', borderRadius: '8px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, color: '#44403c' }}>
                  View
                </button>
                {rx.status === 'PENDING' && (
                  <button onClick={() => { if (confirm('Mark as dispensed?')) dispenseMutation.mutate(rx.id); }}
                    style={{ padding: '0.375rem 0.75rem', borderRadius: '8px', border: 'none', background: '#dcfce7', color: '#15803d', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>
                    Dispense
                  </button>
                )}
                <button onClick={() => { if (confirm('Delete this prescription?')) deleteMutation.mutate(rx.id); }}
                  style={{ padding: '0.375rem 0.5rem', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: '0.8125rem' }}>
                  🗑
                </button>
              </div>
            </div>
          );
        })}

        {!isLoading && list.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <p style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</p>
            <p style={{ fontWeight: 600, color: '#44403c', fontSize: '1rem' }}>No prescriptions found</p>
            <p style={{ color: '#a8a29e', fontSize: '0.875rem', marginTop: '0.25rem' }}>Create your first prescription to get started</p>
            <button onClick={() => setShowForm(true)}
              style={{ marginTop: '1.25rem', padding: '0.625rem 1.25rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
              + New Prescription
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
