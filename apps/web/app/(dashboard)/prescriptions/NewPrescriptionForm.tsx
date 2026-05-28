'use client';
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

const itemSchema = z.object({
  productName: z.string().min(1, 'Drug name required'),
  dosage:      z.string().optional(),
  frequency:   z.string().optional(),
  duration:    z.string().optional(),
  instruction: z.string().optional(),
  quantity:    z.coerce.number().int().min(1).default(1),
});

const schema = z.object({
  patientName:       z.string().min(1, 'Patient name required'),
  patientPhone:      z.string().optional(),
  patientAge:        z.string().optional(),
  patientGender:     z.string().optional(),
  doctorName:        z.string().optional(),
  doctorSpecialty:   z.string().optional(),
  facilityName:      z.string().optional(),
  labRecommendations:z.string().optional(),
  issuedDate:        z.string().min(1, 'Date required'),
  expiryDate:        z.string().optional(),
  allergies:         z.string().optional(),
  notes:             z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one drug'),
});

type FormData = z.infer<typeof schema>;

const inputStyle = {
  width: '100%', padding: '0.5rem 0.75rem',
  border: '1.5px solid #d4d0cb', borderRadius: '8px',
  fontSize: '0.9rem', color: '#1c1917', background: 'white',
  outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block' as const, fontSize: '0.75rem',
  fontWeight: 700 as const, color: '#57534e',
  marginBottom: '0.3rem', textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
};

export default function NewPrescriptionForm({ prescription, onClose, onSuccess }: {
  prescription?: any; onClose: () => void; onSuccess: () => void;
}) {
  const isEdit = !!prescription;

  const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: prescription ? {
      patientName:        prescription.patientName,
      patientPhone:       prescription.patientPhone || '',
      patientAge:         prescription.patientAge || '',
      patientGender:      prescription.patientGender || '',
      doctorName:         prescription.doctorName || '',
      doctorSpecialty:    prescription.doctorSpecialty || '',
      facilityName:       prescription.facilityName || '',
      labRecommendations: prescription.labRecommendations || '',
      issuedDate:         prescription.issuedDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      expiryDate:         prescription.expiryDate?.split('T')[0] || '',
      allergies:          prescription.allergies || '',
      notes:              prescription.notes || '',
      items:              prescription.items?.length ? prescription.items : [{ productName: '', dosage: '', frequency: '2x Daily', duration: '5 Days', instruction: '', quantity: 1 }],
    } : {
      issuedDate: new Date().toISOString().split('T')[0],
      items: [{ productName: '', dosage: '', frequency: '2x Daily', duration: '5 Days', instruction: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const mutation = useMutation({
    mutationFn: (data: FormData) => isEdit
      ? api.put(`/prescriptions/${prescription.id}`, data).then(r => r.data)
      : api.post('/prescriptions', data).then(r => r.data),
    onSuccess,
  });

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgb(0 0 0 / 0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      zIndex: 50, padding: '1rem', overflowY: 'auto',
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', width: '100%',
        maxWidth: '780px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.3)',
        margin: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid #e8e6e3',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: 'white', borderRadius: '20px 20px 0 0', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📋</div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#1c1917', margin: 0 }}>
                {isEdit ? 'Edit Prescription' : 'New Prescription Details'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#78716c', margin: 0 }}>
                {isEdit ? 'Update prescription information' : 'Fill in patient and prescription details'}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e8e6e3', background: 'white', cursor: 'pointer', fontSize: '1rem' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Patient info */}
            <section>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1c1917', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f2f1ef', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                👤 Patient Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Patient Name *</label>
                  <input {...register('patientName')} placeholder="Full name" style={inputStyle} />
                  {errors.patientName && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>⚠ {errors.patientName.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Patient Contact</label>
                  <input {...register('patientPhone')} placeholder="Phone number" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Age</label>
                  <input {...register('patientAge')} placeholder="e.g. 32" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Gender</label>
                  <select {...register('patientGender')} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date Issued *</label>
                  <input {...register('issuedDate')} type="date" style={inputStyle} />
                </div>
              </div>
            </section>

            {/* Doctor info */}
            <section>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1c1917', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f2f1ef', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🩺 Doctor & Facility
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Doctor Name</label>
                  <input {...register('doctorName')} placeholder="Dr. Jane Wanjiru" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Doctor Specialty</label>
                  <input {...register('doctorSpecialty')} placeholder="e.g. GP, Cardiologist" style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Facility / Hospital</label>
                  <input {...register('facilityName')} placeholder="e.g. Kenyatta National Hospital" style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Lab Recommendations (Optional)</label>
                  <input {...register('labRecommendations')} placeholder="e.g. Malaria Test, Full Blood Count" style={inputStyle} />
                </div>
              </div>
            </section>

            {/* Prescribed drugs */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f2f1ef' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1c1917', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  💊 Prescribed Drugs
                </h3>
                <button type="button"
                  onClick={() => append({ productName: '', dosage: '', frequency: '', duration: '', instruction: '', quantity: 1 })}
                  style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.375rem 0.75rem', cursor: 'pointer' }}>
                  + Add Drug
                </button>
              </div>

              {/* Drug table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 0.8fr 0.9fr 0.8fr 1fr 60px 36px',
                gap: '0.5rem', padding: '0.5rem 0.75rem',
                background: '#f9f8f6', borderRadius: '8px',
                fontSize: '0.6875rem', fontWeight: 700,
                color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}>
                <span>Drug Name</span>
                <span>Dosage</span>
                <span>Frequency</span>
                <span>Duration</span>
                <span>Instruction</span>
                <span>Qty</span>
                <span></span>
              </div>

              {fields.map((field, i) => (
                <div key={field.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 0.8fr 0.9fr 0.8fr 1fr 60px 36px',
                  gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'start',
                }}>
                  <div>
                    <input {...register(`items.${i}.productName`)} placeholder="Drug Name" style={inputStyle} />
                    {errors.items?.[i]?.productName && <p style={{ color: '#dc2626', fontSize: '0.7rem' }}>Required</p>}
                  </div>
                  <input {...register(`items.${i}.dosage`)} placeholder="500mg" style={inputStyle} />
                  <input {...register(`items.${i}.frequency`)} placeholder="2x Daily" style={inputStyle} />
                  <input {...register(`items.${i}.duration`)} placeholder="5 Days" style={inputStyle} />
                  <input {...register(`items.${i}.instruction`)} placeholder="After food" style={inputStyle} />
                  <input {...register(`items.${i}.quantity`)} type="number" min="1" style={{ ...inputStyle, textAlign: 'center' }} />
                  <button type="button" onClick={() => fields.length > 1 && remove(i)}
                    disabled={fields.length === 1}
                    style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      border: '1px solid #fecaca', background: '#fef2f2',
                      cursor: fields.length === 1 ? 'not-allowed' : 'pointer',
                      opacity: fields.length === 1 ? 0.4 : 1,
                      fontSize: '0.875rem',
                    }}>
                    ✕
                  </button>
                </div>
              ))}

              {errors.items && typeof errors.items === 'object' && 'message' in errors.items && (
                <p style={{ color: '#dc2626', fontSize: '0.75rem' }}>⚠ {errors.items.message as string}</p>
              )}
            </section>

            {/* Notes & Allergies */}
            <section>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1c1917', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f2f1ef', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📝 Additional Notes
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ ...labelStyle, color: '#b45309' }}>⚠️ Known Allergies</label>
                  <textarea {...register('allergies')} placeholder="e.g. Penicillin, Sulfa drugs" rows={2}
                    style={{ ...inputStyle, resize: 'none', borderColor: '#fde68a', background: '#fffbeb' }} />
                </div>
                <div>
                  <label style={labelStyle}>Doctor's Notes</label>
                  <textarea {...register('notes')} placeholder="Additional instructions..." rows={2}
                    style={{ ...inputStyle, resize: 'none' }} />
                </div>
              </div>
            </section>

            {mutation.isError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.875rem 1rem', color: '#b91c1c', fontSize: '0.875rem' }}>
                ⚠️ {(mutation.error as any)?.response?.data?.message || 'Failed to save prescription'}
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
              {mutation.isPending ? 'Saving...' : isEdit ? '✓ Update Prescription' : '✓ Save Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
