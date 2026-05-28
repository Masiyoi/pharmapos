// Shared UI primitives
import { cn } from './utils';

export function FormField({ label, error, children, hint }: {
  label: string; error?: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label className="label">{label}</label>
      {children}
      {hint && !error && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hint}</p>}
      {error && <p style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>⚠ {error}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon: string; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.5 }}>{icon}</div>
      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>{title}</p>
      {description && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.375rem' }}>{description}</p>}
      {action && <div style={{ marginTop: '1.25rem' }}>{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ icon, label, value, sub, accent }: {
  icon: string; label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <div className="stat-card">
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: accent || 'var(--gray-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem', marginBottom: '0.875rem',
      }}>{icon}</div>
      <p style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '0.375rem' }}>{label}</p>
      {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{sub}</p>}
    </div>
  );
}

export function LoadingRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      <td colSpan={cols} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid var(--border)', borderTopColor: 'var(--brand-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </td>
    </tr>
  );
}
