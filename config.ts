
import { ThemeConfig } from './types';

export const CLOUDINARY_CLOUD_NAME = 'dagkl5gci';
export const CLOUDINARY_UPLOAD_PRESET = 'Autószervíz';
export const PRO_LICENSE_KEY = 'AUTO-PRO-2024'; 

export const THEMES: Record<string, ThemeConfig> = {
  orange: { name: 'GumiAbroncs Narancs', bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-200', light: 'bg-orange-50', hover: 'hover:bg-orange-600', ring: 'focus:ring-orange-500', shadow: 'shadow-orange-200' },
  blue: { name: 'Royal Kék', bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50', hover: 'hover:bg-blue-700', ring: 'focus:ring-blue-600', shadow: 'shadow-blue-200' },
  green: { name: 'Eco Zöld', bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50', hover: 'hover:bg-emerald-700', ring: 'focus:ring-emerald-600', shadow: 'shadow-emerald-200' },
  slate: { name: 'Prémium Szürke', bg: 'bg-slate-800', text: 'text-slate-800', border: 'border-slate-200', light: 'bg-slate-100', hover: 'hover:bg-slate-900', ring: 'focus:ring-slate-800', shadow: 'shadow-slate-200' },
};
