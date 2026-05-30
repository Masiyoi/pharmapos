'use client';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { api } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import SalesReport from './SalesReport';
import PrescriptionReport from './PrescriptionReport';

type Tab = 'sales' | 'prescriptions';

const PERIODS = [
  { value: '',        label: 'All Time'   },
  { value: 'today',  label: 'Today'      },
  { value: 'week',   label: 'Last 7 Days'},
  { value: 'month',  label: 'Last 30 Days'},
  { value: '3months',label: 'Last 3 Months'},
  { value: 'year',   label: 'This Year'  },
];

const selectStyle: React.CSSProperties = {
  padding: '0.5rem 0.875rem',
  border: '1.5px solid #d4d0cb', borderRadius: '8px',
  fontSize: '0.875rem', color: '#1c1917',
  background: 'white', outline: 'none', cursor: 'pointer',
};

export default function ActivitiesPage() {
  const [tab,      setTab]      = useState<Tab>('sales');
  const [branchId, setBranch]   = useState('');
  const [userId,   setUser]     = useState('');
  const [period,   setPeriod]   = useState('');
  const salesPrintRef = useRef<HTMLDivElement>(null);
  const rxPrintRef    = useRef<HTMLDivElement>(null);

  const { data: branches } = useQuery({
    queryKey: ['activity-branches'],
    queryFn: () => api.get('/activities/branches').then(r => r.data),
  });

  const { data: staff } = useQuery({
    queryKey: ['activity-staff'],
    queryFn: () => api.get('/activities/staff').then(r => r.data),
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['activity-sales', branchId, userId, period],
    queryFn: () =>
      api.get(`/activities/sales?branchId=${branchId}&userId=${userId}&period=${period}`)
         .then(r => r.data),
    enabled: tab === 'sales',
  });

  const { data: rxData, isLoading: rxLoading } = useQuery({
    queryKey: ['activity-rx', branchId, userId, period],
    queryFn: () =>
      api.get(`/activities/prescriptions?branchId=${branchId}&userId=${userId}&period=${period}`)
         .then(r => r.data),
    enabled: tab === 'prescriptions',
  });

  const handlePrintSales = useReactToPrint({
    contentRef: salesPrintRef,
    documentTitle: 'Sales-History-Report',
    pageStyle: '@page{size:A4;margin:0}@media print{body{margin:0}}',
  });

  const handlePrintRx = useReactToPrint({
    contentRef: rxPrintRef,
    documentTitle: 'Prescription-Logs-Report',
    pageStyle: '@page{size:A4;margin:0}@media print{body{margin:0}}',
  });

  const branchList = Array.isArray(branches) ? branches : [];
  const staffList  = Array.isArray(staff)    ? staff    : [];
  const sales      = salesData?.sales        || [];
  const rxList     = rxData?.prescriptions   || [];

  const periodLabel = PERIODS.find(p => p.value === period)?.label || 'All Time';
  const branchLabel = branchList.find((b: any) => b.id === branchId)?.name || 'All Branches';

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Hidden print sheets */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <SalesReport
          ref={salesPrintRef}
          sales={sales}
          stats={salesData?.stats}
          filters={{ branch: branchLabel, period: periodLabel }}
        />
        <PrescriptionReport
          ref={rxPrintRef}
          prescriptions={rxList}
          stats={rxData?.stats}
          filters={{ branch: branchLabel, period: periodLabel }}
        />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.02em', margin: 0 }}>
            Activity Logs
          </h1>
          <p style={{ color: '#78716c', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Transaction History & Prescription Records
          </p>
        </div>
        <button
          onClick={() => tab === 'sales' ? handlePrintSales() : handlePrintRx()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.125rem', borderRadius: '10px', border: 'none', background: '#1c1917', color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 1px 3px rgb(0 0 0 / 0.2)' }}>
          🖨️ Print Report
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', background: '#f2f1ef', borderRadius: '10px', padding: '3px', width: 'fit-content', marginBottom: '1.25rem' }}>
        {[
          { key: 'sales',         label: '🛒 Sales History'      },
          { key: 'prescriptions', label: '📋 Prescription Logs'  },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as Tab)}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none',
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

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e6e3', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.875rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Branch</label>
          <select value={branchId} onChange={e => setBranch(e.target.value)} style={selectStyle}>
            <option value="">All Branches</option>
            {branchList.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>User / Staff</label>
          <select value={userId} onChange={e => setUser(e.target.value)} style={selectStyle}>
            <option value="">All Staff</option>
            {staffList.map((s: any) => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.role})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Time Period</label>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={selectStyle}>
            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <button
          onClick={() => { setBranch(''); setUser(''); setPeriod(''); }}
          style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontSize: '0.8125rem', color: '#78716c', fontWeight: 500 }}>
          ✕ Reset
        </button>
      </div>

      {/* ── Sales Tab ── */}
      {tab === 'sales' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e6e3', padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>
                Total Revenue ({periodLabel})
              </p>
              <p style={{ fontSize: '1.875rem', fontWeight: 800, color: '#16a34a', letterSpacing: '-0.04em', margin: 0 }}>
                {formatKES(salesData?.stats?.totalRevenue || 0)}
              </p>
            </div>
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e6e3', padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>
                Transactions ({periodLabel})
              </p>
              <p style={{ fontSize: '1.875rem', fontWeight: 800, color: '#3b82f6', letterSpacing: '-0.04em', margin: 0 }}>
                {salesData?.stats?.totalTransactions || 0}
              </p>
            </div>
          </div>

          {/* Sales table */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e6e3', overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / 0.04)' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '150px 1fr 1fr 140px 80px 100px 80px',
              padding: '0.75rem 1.25rem', background: '#f9f8f6',
              borderBottom: '1px solid #e8e6e3',
              fontSize: '0.6875rem', fontWeight: 700, color: '#a8a29e',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              <span>Date & Time</span>
              <span>Branch</span>
              <span>Cashier</span>
              <span>Receipt #</span>
              <span style={{ textAlign: 'right' }}>Items</span>
              <span style={{ textAlign: 'right' }}>Amount</span>
              <span style={{ textAlign: 'center' }}>Method</span>
            </div>

            {salesLoading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#a8a29e' }}>
                <div style={{ display: 'inline-block', width: '22px', height: '22px', border: '2px solid #e8e6e3', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}

            {sales.map((s: any, i: number) => (
              <div key={s.id} style={{
                display: 'grid', gridTemplateColumns: '150px 1fr 1fr 140px 80px 100px 80px',
                padding: '0.875rem 1.25rem', alignItems: 'center',
                borderBottom: i < sales.length - 1 ? '1px solid #f2f1ef' : 'none',
                background: i % 2 === 0 ? 'white' : '#fafaf9',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafaf9')}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1c1917', margin: 0 }}>
                    {new Date(s.dateTime).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#a8a29e', margin: 0 }}>
                    {new Date(s.dateTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span style={{ fontSize: '0.875rem', color: '#44403c' }}>{s.branch}</span>
                <div>
                  <p style={{ fontWeight: 500, fontSize: '0.875rem', color: '#1c1917', margin: 0 }}>{s.cashier}</p>
                  <p style={{ fontSize: '0.75rem', color: '#a8a29e', margin: 0 }}>{s.cashierRole}</p>
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#16a34a', fontWeight: 700 }}>
                  {s.receiptNo}
                </span>
                <span style={{ textAlign: 'right', fontWeight: 700, color: '#1c1917' }}>{s.itemsSold}</span>
                <span style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{formatKES(s.amount)}</span>
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px',
                    background: s.paymentMethod === 'MPESA' ? '#dcfce7' : s.paymentMethod === 'CASH' ? '#f2f1ef' : '#dbeafe',
                    color:      s.paymentMethod === 'MPESA' ? '#15803d' : s.paymentMethod === 'CASH' ? '#44403c' : '#1d4ed8',
                  }}>
                    {s.paymentMethod === 'MPESA' ? '📱' : s.paymentMethod === 'CASH' ? '💵' : '💳'} {s.paymentMethod}
                  </span>
                </div>
              </div>
            ))}

            {!salesLoading && sales.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛒</p>
                <p style={{ fontWeight: 600, color: '#44403c', fontSize: '1rem' }}>No sales records found</p>
                <p style={{ color: '#a8a29e', fontSize: '0.875rem', marginTop: '0.25rem' }}>Try adjusting your filters</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Prescriptions Tab ── */}
      {tab === 'prescriptions' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e6e3', padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>
                Total Prescriptions ({periodLabel})
              </p>
              <p style={{ fontSize: '1.875rem', fontWeight: 800, color: '#16a34a', letterSpacing: '-0.04em', margin: 0 }}>
                {rxData?.stats?.totalPrescriptions || 0}
              </p>
            </div>
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e6e3', padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>
                Unique Patients ({periodLabel})
              </p>
              <p style={{ fontSize: '1.875rem', fontWeight: 800, color: '#8b5cf6', letterSpacing: '-0.04em', margin: 0 }}>
                {rxData?.stats?.uniquePatients || 0}
              </p>
            </div>
          </div>

          {/* Prescriptions table */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e6e3', overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / 0.04)' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '150px 1fr 1fr 140px 1fr 130px 80px',
              padding: '0.75rem 1.25rem', background: '#f9f8f6',
              borderBottom: '1px solid #e8e6e3',
              fontSize: '0.6875rem', fontWeight: 700, color: '#a8a29e',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              <span>Date Created</span>
              <span>Branch</span>
              <span>Prescribed By</span>
              <span>RX Code</span>
              <span>Patient Name</span>
              <span>Details</span>
              <span style={{ textAlign: 'center' }}>Status</span>
            </div>

            {rxLoading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#a8a29e' }}>
                <div style={{ display: 'inline-block', width: '22px', height: '22px', border: '2px solid #e8e6e3', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}

            {rxList.map((rx: any, i: number) => (
              <div key={rx.id} style={{
                display: 'grid', gridTemplateColumns: '150px 1fr 1fr 140px 1fr 130px 80px',
                padding: '0.875rem 1.25rem', alignItems: 'center',
                borderBottom: i < rxList.length - 1 ? '1px solid #f2f1ef' : 'none',
                background: i % 2 === 0 ? 'white' : '#fafaf9',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafaf9')}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1c1917', margin: 0 }}>
                    {new Date(rx.dateCreated).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#a8a29e', margin: 0 }}>
                    {new Date(rx.dateCreated).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span style={{ fontSize: '0.875rem', color: '#44403c' }}>{rx.branch}</span>
                <span style={{ fontSize: '0.875rem', color: '#44403c', fontWeight: 500 }}>
                  {rx.prescribedBy !== 'Unknown' ? `Dr. ${rx.prescribedBy}` : '—'}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#16a34a', fontWeight: 700 }}>
                  {rx.rxCode}
                </span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1c1917', margin: 0 }}>{rx.patientName}</p>
                  <p style={{ fontSize: '0.75rem', color: '#a8a29e', margin: 0 }}>
                    {[rx.patientAge ? `${rx.patientAge}yo` : null, rx.patientGender].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: '#57534e', margin: 0 }}>
                    {rx.specialty || rx.doctor || '—'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#a8a29e', margin: 0 }}>
                    {rx.itemsCount} drug{rx.itemsCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px',
                    background: rx.status === 'DISPENSED' ? '#dcfce7' : rx.status === 'PENDING' ? '#fef9c3' : '#fee2e2',
                    color:      rx.status === 'DISPENSED' ? '#15803d' : rx.status === 'PENDING' ? '#854d0e' : '#b91c1c',
                  }}>
                    {rx.status}
                  </span>
                </div>
              </div>
            ))}

            {!rxLoading && rxList.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</p>
                <p style={{ fontWeight: 600, color: '#44403c', fontSize: '1rem' }}>No prescription records found</p>
                <p style={{ color: '#a8a29e', fontSize: '0.875rem', marginTop: '0.25rem' }}>Try adjusting your filters</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
