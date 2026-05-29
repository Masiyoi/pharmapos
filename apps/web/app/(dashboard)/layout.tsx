'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

const NAV = [
  { href: '/pos',       icon: '🛒', label: 'POS Checkout'  },
  { href: '/prescriptions', icon: '📋', label: 'Prescriptions' },
  { href: '/inventory', icon: '📦', label: 'Inventory'     },
  { href: '/reports',   icon: '📊', label: 'Reports'       },
  { href: '/customers', icon: '👥', label: 'Customers'     },
  { href: '/users',     icon: '🛡️', label: 'Staff'         },
  { href: '/branches',  icon: '🏪', label: 'Branches'     },
  { href: '/procurement', icon: '🛒', label: 'Procurement'  },
  { href: '/suppliers', icon: '🚚', label: 'Suppliers'     },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, []);

  if (!user) return null;

  const currentPage = NAV.find(n => pathname.startsWith(n.href));

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--gray-50)', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '240px', flexShrink: 0,
        background: '#111816',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }}
      className="lg-sidebar">

        {/* Logo */}
        <div style={{
          padding: '1.25rem 1.125rem',
          borderBottom: '1px solid rgb(255 255 255 / 0.07)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
            boxShadow: '0 4px 12px rgb(22 163 74 / 0.3)',
          }}>💊</div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>PharmaPos</p>
            <p style={{ color: '#78716c', fontSize: '0.75rem', marginTop: '1px' }}>v1.0</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0.625rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#57534e', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.5rem 0.875rem', marginBottom: '0.25rem' }}>Menu</p>
          {NAV.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`nav-item ${active ? 'active' : ''}`}>
                <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '0.875rem', borderTop: '1px solid rgb(255 255 255 / 0.07)' }}>
          <div style={{
            background: 'rgb(255 255 255 / 0.05)',
            borderRadius: '12px', padding: '0.75rem',
            marginBottom: '0.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8125rem', fontWeight: 700, color: 'white', flexShrink: 0,
              }}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: '#e7e5e4', fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.firstName} {user.lastName}
                </p>
                <p style={{ color: '#78716c', fontSize: '0.75rem' }}>{user.role}</p>
              </div>
            </div>
          </div>
          <button onClick={logout} className="nav-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: '1rem' }}>🚪</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgb(0 0 0 / 0.5)', zIndex: 30, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', marginLeft: 0 }}
        className="main-content">

        {/* Top bar */}
        <header style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0 1.25rem',
          height: '56px',
          display: 'flex', alignItems: 'center', gap: '0.875rem',
          flexShrink: 0,
          boxShadow: 'var(--shadow-xs)',
        }}>
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '4px', cursor: 'pointer', flexShrink: 0,
            }}
          >
            {[0,1,2].map(i => (
              <span key={i} style={{ display: 'block', width: '14px', height: '1.5px', background: 'var(--gray-600)', borderRadius: '2px' }} />
            ))}
          </button>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <span style={{ fontSize: '1rem' }}>{currentPage?.icon}</span>
            <h1 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
              {currentPage?.label || 'Dashboard'}
            </h1>
          </div>

          {/* Right side */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--gray-50)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.375rem 0.75rem',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}>
              {new Date().toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {children}
        </main>
      </div>

      {/* Responsive sidebar — desktop always visible */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar { transform: translateX(0) !important; position: relative !important; }
          .main-content { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
