'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import {
  Shield,
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Truck,
  LogOut,
  Menu,
  X,
  Pill,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/pos',       icon: ShoppingCart, label: 'POS Checkout' },
  { href: '/inventory', icon: Package,      label: 'Inventory'    },
  { href: '/reports',   icon: BarChart3,    label: 'Reports'      },
  { href: '/customers', icon: Users,        label: 'Customers'    },
  { href: '/users', icon: Shield, label: 'Staff' },
  { href: '/suppliers', icon: Truck,        label: 'Suppliers'    },
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-200 ease-in-out',
        'lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Pill size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">PharmaPos</p>
            <p className="text-gray-400 text-xs truncate max-w-[120px]">{user.firstName} {user.lastName}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-700">
          <div className="px-3 py-2 mb-1">
            <p className="text-gray-400 text-xs">Role</p>
            <p className="text-white text-sm font-medium">{user.role}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white text-sm transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-gray-800 capitalize">
            {pathname.replace('/', '') || 'Dashboard'}
          </h1>
          <div className="ml-auto text-sm text-gray-500">
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
