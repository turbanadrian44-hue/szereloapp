import React, { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { formatLicensePlate, formatPhoneNumber } from '../utils';
import { ThemeConfig } from '../types';

export const IntakeScreen = ({ onSave, onCancel, themeColor, isDark }: { onSave: (data: any) => void, onCancel: () => void, themeColor: string, isDark: boolean }) => {
  const [formData, setFormData] = useState({ name: '', licensePlate: '', phone: '+36 ', isUrgent: false, gdprAccepted: false });
  const isValid = formData.name && formData.licensePlate.length >= 3 && formData.phone.length > 7 && formData.gdprAccepted;
  const inputClass = `block w-full px-4 py-4 border rounded-xl text-xl font-mono uppercase text-center tracking-widest focus:outline-none focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'}`;
  const labelClass = `block text-xs font-bold uppercase tracking-wider mb-2 ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className={`max-w-md mx-auto p-6 min-h-screen flex flex-col justify-center animate-fade-in-up ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <button onClick={onCancel} className={`absolute top-6 left-6 p-2 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}><X size={24} /></button>
      <div className="mb-8 text-center">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Új Ügyfél</h2>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Adatok rögzítése</p>
      </div>
      <div className={`space-y-6 p-8 rounded-3xl shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
        <div>
          <label className={labelClass}>Rendszám</label>
          <input type="text" placeholder="AA-AA-123" className={inputClass} value={formData.licensePlate} onChange={e => setFormData({...formData, licensePlate: formatLicensePlate(e.target.value)})} />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelClass}>Ügyfél Neve</label>
            <input type="text" placeholder="Név" className={`block w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'}`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className={labelClass}>Telefonszám</label>
            <input type="tel" placeholder="+36 30..." className={`block w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'}`} value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhoneNumber(e.target.value)})} />
          </div>
        </div>
        <div className="space-y-3 pt-2">
           <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${isDark ? 'bg-red-900/20 border-red-900/50' : 'bg-red-50 border-red-100'}`}>
              <input type="checkbox" className="w-5 h-5 accent-red-500" checked={formData.isUrgent} onChange={e => setFormData({...formData, isUrgent: e.target.checked})} />
              <span className="text-sm font-bold text-red-600">Sürgős munka!</span>
           </label>
           <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
              <input type="checkbox" className={`w-5 h-5 mt-0.5`} checked={formData.gdprAccepted} onChange={e => setFormData({...formData, gdprAccepted: e.target.checked})} />
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Kijelentem, hogy az ügyfél hozzájárult az adatai és a fotók kezeléséhez a javítás idejére. (GDPR)</span>
           </label>
        </div>
        <button 
          onClick={() => isValid && onSave(formData)} 
          disabled={!isValid} 
          style={{backgroundColor: isValid ? themeColor : undefined}}
          className={`w-full mt-6 py-4 text-white rounded-xl font-bold shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center gap-2`}
        >
          MENTÉS ÉS TOVÁBB <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};