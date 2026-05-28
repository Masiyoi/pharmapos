'use client';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: '#fef9c3', color: '#854d0e' },
  DISPENSED: { bg: '#dcfce7', color: '#15803d' },
  PARTIAL:   { bg: '#dbeafe', color: '#1d4ed8' },
  CANCELLED: { bg: '#fee2e2', color: '#b91c1c' },
};

export default function PrescriptionDetail({ prescription: rx, onClose, onDispense, onEdit, dispensing }: {
  prescription: any;
  onClose: () => void;
  onDispense: () => void;
  onEdit: () => void;
  dispensing?: boolean;
}) {
  const statusCfg = STATUS_STYLE[rx.status] || STATUS_STYLE.PENDING;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgb(0 0 0 / 0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '1rem',
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', width: '100%',
        maxWidth: '620px', maxHeight: '88vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid #e8e6e3',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem' }}>📋</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#1c1917', margin: 0, fontFamily: 'monospace' }}>
                  {rx.rxCode}
                </h2>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: '999px', background: statusCfg.bg, color: statusCfg.color }}>
                  {rx.status}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#78716c', margin: 0, marginTop: '2px' }}>
                Issued: {new Date(rx.issuedDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontSize: '1rem' }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>

          {/* Patient + Doctor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#f9f8f6', borderRadius: '12px', padding: '1rem', border: '1px solid #f2f1ef' }}>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>👤 Patient</p>
              <p style={{ fontWeight: 700, color: '#1c1917', fontSize: '0.9375rem' }}>{rx.patientName}</p>
              {rx.patientPhone && <p style={{ fontSize: '0.8125rem', color: '#78716c', marginTop: '2px' }}>📞 {rx.patientPhone}</p>}
              {rx.patientAge && <p style={{ fontSize: '0.8125rem', color: '#78716c' }}>Age: {rx.patientAge} · {rx.patientGender}</p>}
              {rx.allergies && (
                <div style={{ marginTop: '0.625rem', padding: '0.5rem 0.75rem', background: '#fef9c3', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <p style={{ fontSize: '0.75rem', color: '#854d0e', fontWeight: 600 }}>⚠️ Allergies: {rx.allergies}</p>
                </div>
              )}
            </div>

            <div style={{ background: '#f9f8f6', borderRadius: '12px', padding: '1rem', border: '1px solid #f2f1ef' }}>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>🩺 Doctor</p>
              <p style={{ fontWeight: 700, color: '#1c1917', fontSize: '0.9375rem' }}>{rx.doctorName || 'Not specified'}</p>
              {rx.doctorSpecialty && <p style={{ fontSize: '0.8125rem', color: '#78716c', marginTop: '2px' }}>{rx.doctorSpecialty}</p>}
              {rx.facilityName && <p style={{ fontSize: '0.8125rem', color: '#78716c' }}>🏥 {rx.facilityName}</p>}
              {rx.labRecommendations && <p style={{ fontSize: '0.8125rem', color: '#2563eb', marginTop: '4px' }}>🔬 {rx.labRecommendations}</p>}
            </div>
          </div>

          {/* Drugs table */}
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>💊 Prescribed Drugs ({rx.items?.length})</p>

            <div style={{ border: '1px solid #e8e6e3', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1fr 0.8fr 1fr 60px',
                background: '#f9f8f6', padding: '0.625rem 1rem',
                fontSize: '0.6875rem', fontWeight: 700, color: '#a8a29e',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                borderBottom: '1px solid #e8e6e3',
              }}>
                <span>Drug</span><span>Dosage</span><span>Frequency</span><span>Duration</span><span>Instruction</span><span>Qty</span>
              </div>
              {rx.items?.map((item: any, i: number) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1fr 0.8fr 1fr 60px',
                  padding: '0.875rem 1rem', alignItems: 'center',
                  borderBottom: i < rx.items.length - 1 ? '1px solid #f2f1ef' : 'none',
                }}>
                  <p style={{ fontWeight: 700, color: '#1c1917', fontSize: '0.9rem', margin: 0 }}>{item.productName}</p>
                  <p style={{ color: '#57534e', fontSize: '0.85rem', margin: 0 }}>{item.dosage || '—'}</p>
                  <p style={{ color: '#57534e', fontSize: '0.85rem', margin: 0 }}>{item.frequency || '—'}</p>
                  <p style={{ color: '#57534e', fontSize: '0.85rem', margin: 0 }}>{item.duration || '—'}</p>
                  <p style={{ color: '#57534e', fontSize: '0.85rem', margin: 0 }}>{item.instruction || '—'}</p>
                  <p style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.9rem', margin: 0, textAlign: 'center' }}>{item.quantity}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {rx.notes && (
            <div style={{ background: '#f9f8f6', borderRadius: '10px', padding: '0.875rem', border: '1px solid #f2f1ef' }}>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>📝 Doctor's Notes</p>
              <p style={{ color: '#44403c', fontSize: '0.875rem' }}>{rx.notes}</p>
            </div>
          )}

          {/* Dispensed info */}
          {rx.status === 'DISPENSED' && rx.dispensedAt && (
            <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '0.875rem', border: '1px solid #bbf7d0', marginTop: '0.75rem' }}>
              <p style={{ color: '#15803d', fontSize: '0.875rem', fontWeight: 600 }}>
                ✅ Dispensed on {new Date(rx.dispensedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem', borderTop: '1px solid #f2f1ef',
          background: '#f9f8f6', display: 'flex', gap: '0.75rem',
          borderRadius: '0 0 20px 20px',
        }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '0.625rem', borderRadius: '10px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
            Close
          </button>
          <button onClick={onEdit}
            style={{ flex: 1, padding: '0.625rem', borderRadius: '10px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
            ✏️ Edit
          </button>
          {rx.status === 'PENDING' && (
            <button onClick={onDispense} disabled={dispensing}
              style={{ flex: 2, padding: '0.625rem', borderRadius: '10px', border: 'none', background: dispensing ? '#86efac' : '#16a34a', color: 'white', cursor: dispensing ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>
              {dispensing ? 'Dispensing...' : '✅ Mark as Dispensed'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
