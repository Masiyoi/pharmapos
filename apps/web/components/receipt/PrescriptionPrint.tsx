'use client';
import { forwardRef } from 'react';

interface Drug {
  productName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instruction?: string;
  quantity: number;
}

interface Props {
  prescription: {
    rxCode: string;
    issuedDate: string;
    patientName: string;
    patientPhone?: string;
    patientAge?: string;
    patientGender?: string;
    doctorName?: string;
    doctorSpecialty?: string;
    facilityName?: string;
    labRecommendations?: string;
    allergies?: string;
    notes?: string;
    items: Drug[];
  };
  pharmacy?: {
    name: string;
    address: string;
    phone: string;
    licenseNo?: string;
  };
}

const PrescriptionPrint = forwardRef<HTMLDivElement, Props>(
  ({ prescription: rx, pharmacy }, ref) => {
    const ph = pharmacy || {
      name: 'PharmaPos Pharmacy',
      address: '123 Health Street, Nairobi, Kenya',
      phone: '0712 345 678',
      licenseNo: 'PPB/2024/001',
    };

    const date = new Date(rx.issuedDate).toLocaleDateString('en-KE', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

    return (
      <div
        ref={ref}
        className="rx-print-sheet"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm 18mm',
          background: 'white',
          color: '#111',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '11pt',
          lineHeight: '1.5',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Pharmacy Header ── */}
        <div style={{ textAlign: 'center', borderBottom: '2.5px solid #16a34a', paddingBottom: '12px', marginBottom: '18px' }}>
          <h1 style={{
            fontSize: '22pt', fontWeight: 700, color: '#16a34a',
            textTransform: 'uppercase', letterSpacing: '2px',
            margin: '0 0 4px 0', fontFamily: 'Georgia, serif',
          }}>
            {ph.name}
          </h1>
          <p style={{ margin: 0, fontSize: '10pt', color: '#555' }}>
            {ph.address} &nbsp;|&nbsp; {ph.phone}
          </p>
          {ph.licenseNo && (
            <p style={{ margin: '2px 0 0', fontSize: '9pt', color: '#888' }}>
              Pharmacy License: {ph.licenseNo}
            </p>
          )}
        </div>

        {/* ── Patient + Date grid ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '10.5pt' }}>
          <tbody>
            <tr>
              <td style={{ paddingBottom: '4px', width: '50%' }}>
                <span style={{ color: '#555' }}>Patient: </span>
                <strong>{rx.patientName}</strong>
              </td>
              <td style={{ paddingBottom: '4px', textAlign: 'right' }}>
                <span style={{ color: '#555' }}>ID: </span>
                <strong style={{ fontFamily: 'monospace', color: '#16a34a' }}>{rx.rxCode}</strong>
              </td>
            </tr>
            <tr>
              <td style={{ paddingBottom: '4px' }}>
                {rx.patientAge && <><span style={{ color: '#555' }}>Age: </span><strong>{rx.patientAge}</strong></>}
                {rx.patientAge && rx.patientGender && <span style={{ color: '#bbb', margin: '0 6px' }}>|</span>}
                {rx.patientGender && <><span style={{ color: '#555' }}>Gender: </span><strong>{rx.patientGender}</strong></>}
              </td>
              <td style={{ paddingBottom: '4px', textAlign: 'right' }}>
                <span style={{ color: '#555' }}>Date: </span>
                <strong>{date}</strong>
              </td>
            </tr>
            <tr>
              <td>
                {rx.patientPhone && (
                  <><span style={{ color: '#555' }}>Contact: </span><strong>{rx.patientPhone}</strong></>
                )}
              </td>
              <td style={{ textAlign: 'right' }}>
                {rx.doctorName && (
                  <>
                    <span style={{ color: '#555' }}>Dr. </span>
                    <strong>{rx.doctorName}</strong>
                    {rx.doctorSpecialty && (
                      <span style={{ color: '#555' }}> ({rx.doctorSpecialty})</span>
                    )}
                  </>
                )}
              </td>
            </tr>
            {rx.facilityName && (
              <tr>
                <td colSpan={2} style={{ paddingTop: '2px' }}>
                  <span style={{ color: '#555' }}>Facility: </span>
                  <strong>{rx.facilityName}</strong>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ── Rx Symbol ── */}
        <div style={{ margin: '20px 0 10px' }}>
          <span style={{
            fontSize: '28pt', fontStyle: 'italic',
            fontWeight: 700, color: '#111',
            fontFamily: 'Georgia, serif',
          }}>Rx</span>
          <div style={{ height: '1px', background: '#ccc', marginTop: '6px' }} />
        </div>

        {/* ── Drugs table ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '10.5pt' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid #222' }}>
              {['Drug', 'Dosage', 'Freq', 'Duration', 'Instruction', 'Qty'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '6px 8px',
                  fontWeight: 700, fontSize: '9.5pt',
                  textTransform: 'uppercase', letterSpacing: '0.05em', color: '#333',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rx.items.map((drug, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid #eee',
                background: i % 2 === 0 ? 'transparent' : '#fafafa',
              }}>
                <td style={{ padding: '7px 8px', fontWeight: 700 }}>{drug.productName}</td>
                <td style={{ padding: '7px 8px', color: '#333' }}>{drug.dosage || '—'}</td>
                <td style={{ padding: '7px 8px', color: '#333' }}>{drug.frequency || '—'}</td>
                <td style={{ padding: '7px 8px', color: '#333' }}>{drug.duration || '—'}</td>
                <td style={{ padding: '7px 8px', color: '#333' }}>{drug.instruction || '—'}</td>
                <td style={{ padding: '7px 8px', fontWeight: 700, color: '#16a34a', textAlign: 'center' }}>
                  {drug.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Lab recommendations ── */}
        {rx.labRecommendations && (
          <div style={{ marginBottom: '12px' }}>
            <p style={{ margin: 0, fontSize: '10pt' }}>
              <strong>Lab Recommendations:</strong>{' '}
              <span style={{ color: '#2563eb' }}>{rx.labRecommendations}</span>
            </p>
          </div>
        )}

        {/* ── Notes ── */}
        {rx.notes && (
          <div style={{ marginBottom: '10px' }}>
            <p style={{ margin: 0, fontSize: '10pt' }}>
              <strong>Notes:</strong> {rx.notes}
            </p>
          </div>
        )}

        {/* ── Allergies ── */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ margin: 0, fontSize: '10pt' }}>
            <strong>Allergies:</strong>{' '}
            <span style={{ color: rx.allergies ? '#dc2626' : '#888', fontWeight: rx.allergies ? 700 : 400 }}>
              {rx.allergies || 'N/A'}
            </span>
          </p>
        </div>

        {/* ── Signature line ── */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          marginTop: '32px', paddingTop: '12px',
        }}>
          <div style={{ textAlign: 'center', minWidth: '160px' }}>
            <div style={{ borderTop: '1px solid #333', paddingTop: '6px', fontSize: '9.5pt', color: '#555' }}>
              Dispensed by / Signature
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          position: 'absolute', bottom: '15mm', left: '18mm', right: '18mm',
          borderTop: '1px solid #ddd', paddingTop: '8px',
          textAlign: 'center', fontSize: '8.5pt', color: '#aaa',
        }}>
          This prescription is valid for 30 days from the date of issue &nbsp;·&nbsp; {ph.name} &nbsp;·&nbsp; {ph.phone}
        </div>
      </div>
    );
  }
);

PrescriptionPrint.displayName = 'PrescriptionPrint';
export default PrescriptionPrint;
