import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  licenseNo?: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  pharmacyId: string;
  branchId?: string;
  pharmacy?: Pharmacy;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          localStorage.setItem('accessToken', data.accessToken);
          set({
            user: {
              ...data.user,
              pharmacy: data.user.pharmacy || null,
            },
            accessToken: data.accessToken,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null });
        window.location.href = '/login';
      },

      isAuthenticated: () => !!get().accessToken && !!get().user,
    }),
    {
      name: 'pharmapos-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
);
