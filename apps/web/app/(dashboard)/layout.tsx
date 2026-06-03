'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

// ─── Nav definition with role access ─────────────────────────────────────────
const ALL_NAV = [
  { href: '/pos',          icon: '🛒', label: 'POS Checkout',  roles: ['SUPER_ADMIN','ADMIN','PHARMACIST','CASHIER','DISPENSER','VIEWER'] },
  { href: '/inventory',    icon: '📦', label: 'Inventory',     roles: ['SUPER_ADMIN','ADMIN','PHARMACIST','CASHIER','DISPENSER'] },
  { href: '/analytics',    icon: '📈', label: 'Analytics',     roles: ['SUPER_ADMIN','ADMIN','PHARMACIST'] },
  { href: '/reports',      icon: '🖨️', label: 'Reports',       roles: ['SUPER_ADMIN','ADMIN','PHARMACIST','CASHIER'] },
  { href: '/activities',   icon: '🕐', label: 'Activities',    roles: ['SUPER_ADMIN','ADMIN','PHARMACIST'] },
  { href: '/prescriptions',icon: '📋', label: 'Prescriptions', roles: ['SUPER_ADMIN','ADMIN','PHARMACIST','DISPENSER'] },
  { href: '/customers',    icon: '👥', label: 'Customers',     roles: ['SUPER_ADMIN','ADMIN','PHARMACIST','CASHIER','DISPENSER'] },
  { href: '/users',        icon: '🛡️', label: 'Staff',         roles: ['SUPER_ADMIN','ADMIN'] },
  { href: '/branches',     icon: '🏪', label: 'Branches',      roles: ['SUPER_ADMIN','ADMIN'] },
  { href: '/procurement',  icon: '🛒', label: 'Procurement',   roles: ['SUPER_ADMIN','ADMIN','PHARMACIST'] },
  { href: '/suppliers',    icon: '🚚', label: 'Suppliers',     roles: ['SUPER_ADMIN','ADMIN','PHARMACIST'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, []);

  if (!user) return null;

  // Filter nav by role
  const navItems = ALL_NAV.filter(item => item.roles.includes(user.role));
  const currentPage = navItems.find(n => pathname.startsWith(n.href));

  // Role display label
  const roleLabel = user.role === 'SUPER_ADMIN' ? 'Super Admin'
    : user.role === 'ADMIN' ? 'Admin'
    : user.role === 'PHARMACIST' ? 'Pharmacist'
    : user.role === 'CASHIER' ? 'Cashier'
    : user.role === 'DISPENSER' ? 'Dispenser'
    : 'Viewer';

  // Role badge color
  const roleBadgeStyle = {
    SUPER_ADMIN: { bg: '#fecdd3', color: '#be123c' },
    ADMIN:       { bg: '#e9d5ff', color: '#7e22ce' },
    PHARMACIST:  { bg: '#bfdbfe', color: '#1e40af' },
    CASHIER:     { bg: '#d1fae5', color: '#065f46' },
    DISPENSER:   { bg: '#ccfbf1', color: '#0f766e' },
    VIEWER:      { bg: '#f3f4f6', color: '#374151' },
  }[user.role] || { bg: '#f3f4f6', color: '#374151' };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--gray-50)', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '220px', flexShrink: 0,
        background: '#111816',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }} className="lg-sidebar">

        {/* Logo */}
        <div style={{
          padding: '1.125rem 1rem',
          borderBottom: '1px solid rgb(255 255 255 / 0.07)',
          display: 'flex', alignItems: 'center', gap: '0.625rem',
        }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '17px', boxShadow: '0 4px 12px rgb(22 163 74 / 0.3)',
          }}>💊</div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>PharmaPos</p>
            <p style={{ color: '#57534e', fontSize: '0.6875rem', marginTop: '1px' }}>v1.0</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.625rem 0.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#57534e', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.5rem 0.75rem', marginBottom: '2px' }}>Menu</p>
          {navItems.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.5rem 0.75rem', borderRadius: '8px',
                  fontSize: '0.875rem', fontWeight: active ? 600 : 500,
                  color: active ? 'white' : '#a8a29e',
                  background: active ? '#16a34a' : 'transparent',
                  boxShadow: active ? '0 2px 8px rgb(22 163 74 / 0.3)' : 'none',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgb(255 255 255 / 0.07)'; e.currentTarget.style.color = active ? 'white' : '#e7e5e4'; }}
                onMouseLeave={e => { e.currentTarget.style.background = active ? '#16a34a' : 'transparent'; e.currentTarget.style.color = active ? 'white' : '#a8a29e'; }}
              >
                <span style={{ fontSize: '0.9375rem', width: '18px', textAlign: 'center' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div style={{ padding: '0.75rem 0.625rem', borderTop: '1px solid rgb(255 255 255 / 0.07)' }}>
          <div style={{ background: 'rgb(255 255 255 / 0.05)', borderRadius: '10px', padding: '0.625rem 0.75rem', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                background: roleBadgeStyle.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: roleBadgeStyle.color,
              }}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: '#e7e5e4', fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                  {user.firstName} {user.lastName}
                </p>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '1px 6px', borderRadius: '999px', background: roleBadgeStyle.bg, color: roleBadgeStyle.color }}>
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
            padding: '0.5rem 0.75rem', borderRadius: '8px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: '0.875rem', color: '#78716c', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgb(255 255 255 / 0.07)'; e.currentTarget.style.color = '#e7e5e4'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#78716c'; }}
          >
            <span>🚪</span><span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgb(0 0 0 / 0.5)', zIndex: 30, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }} className="main-content">

        {/* Top bar */}
        <header style={{
          background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          padding: '0 1.25rem', height: '52px',
          display: 'flex', alignItems: 'center', gap: '0.875rem',
          flexShrink: 0, boxShadow: 'var(--shadow-xs)',
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', cursor: 'pointer', flexShrink: 0 }}>
            {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: '13px', height: '1.5px', background: 'var(--gray-600)', borderRadius: '2px' }} />)}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <span style={{ fontSize: '0.9375rem' }}>{currentPage?.icon}</span>
            <h1 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
              {currentPage?.label || 'Dashboard'}
            </h1>
          </div>
          <div style={{ marginLeft: 'auto', background: 'var(--gray-50)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar { transform: translateX(0) !important; position: relative !important; }
        }
      `}</style>
    </div>
  );
}
