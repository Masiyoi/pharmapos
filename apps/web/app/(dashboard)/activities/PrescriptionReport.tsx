'use client';
import { forwardRef } from 'react';

interface Props {
  prescriptions: any[];
  stats: any;
  filters: { branch: string; period: string };
  pharmacyName?: string;
}

const PrescriptionReport = forwardRef<HTMLDivElement, Props>(
  ({ prescriptions, stats, filters, pharmacyName = 'PharmaPos Pharmacy' }, ref) => (
    <div ref={ref} style={{ width: '210mm', minHeight: '297mm', padding: '15mm 18mm', background: 'white', fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#111', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #16a34a', paddingBottom: '10px', marginBottom: '14px' }}>
        <h1 style={{ fontSize: '17pt', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{pharmacyName}</h1>
        <p style={{ margin: '3px 0 0', fontWeight: 600, fontSize: '11pt' }}>Prescription Logs Report</p>
        <p style={{ margin: '2px 0 0', fontSize: '9pt', color: '#666' }}>
          Branch: {filters.branch} &nbsp;|&nbsp; Period: {filters.period} &nbsp;|&nbsp; Generated: {new Date().toLocaleString('en-KE')}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
        {[
          { label: 'Total Prescriptions', value: stats?.totalPrescriptions || 0, color: '#16a34a' },
          { label: 'Unique Patients',     value: stats?.uniquePatients     || 0, color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, border: `2px solid ${s.color}`, borderRadius: '8px', padding: '10px 14px' }}>
            <p style={{ fontSize: '8.5pt', fontWeight: 700, color: '#777', textTransform: 'uppercase', margin: '0 0 3px', letterSpacing: '0.05em' }}>{s.label}</p>
            <p style={{ fontSize: '16pt', fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#16a34a' }}>
            {['Date','Branch','Doctor','RX Code','Patient','Age/Gender','Status'].map(h => (
              <th key={h} style={{ padding: '7px 9px', textAlign: 'left', color: 'white', fontWeight: 700, fontSize: '8.5pt', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {prescriptions.length === 0 ? (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No records found</td></tr>
          ) : prescriptions.map((rx, i) => (
            <tr key={rx.id} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
              <td style={{ padding: '7px 9px', borderBottom: '1px solid #e5e7eb', fontSize: '9pt' }}>
                {new Date(rx.dateCreated).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
              <td style={{ padding: '7px 9px', borderBottom: '1px solid #e5e7eb' }}>{rx.branch}</td>
              <td style={{ padding: '7px 9px', borderBottom: '1px solid #e5e7eb' }}>{rx.prescribedBy !== 'Unknown' ? `Dr. ${rx.prescribedBy}` : '—'}</td>
              <td style={{ padding: '7px 9px', borderBottom: '1px solid #e5e7eb', fontFamily: 'monospace', color: '#16a34a', fontWeight: 700 }}>{rx.rxCode}</td>
              <td style={{ padding: '7px 9px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>{rx.patientName}</td>
              <td style={{ padding: '7px 9px', borderBottom: '1px solid #e5e7eb', color: '#555' }}>{rx.patientAge ? `${rx.patientAge}yo` : '—'} {rx.patientGender || ''}</td>
              <td style={{ padding: '7px 9px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: rx.status === 'DISPENSED' ? '#16a34a' : '#d97706' }}>{rx.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ position: 'absolute', bottom: '12mm', left: '18mm', right: '18mm', textAlign: 'center', fontSize: '8pt', color: '#aaa', borderTop: '1px solid #e5e7eb', paddingTop: '6px' }}>
        {pharmacyName} · Prescription Logs Report · {new Date().toLocaleString('en-KE')}
      </div>
    </div>
  )
);
PrescriptionReport.displayName = 'PrescriptionReport';
export default PrescriptionReport;
