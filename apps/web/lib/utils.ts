import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKES(amount: number | string) {
  return `KES ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-KE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
