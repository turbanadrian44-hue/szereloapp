import React, { useState, useRef } from 'react';
import { Upload, Lock } from 'lucide-react';
import { ShopSettings, THEMES } from '../types';

export const OnboardingScreen = ({ onComplete, onShowSales }: { onComplete: (s: ShopSettings) => void, onShowSales: (f: 'LOGO') => void }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#f97316');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoClick = () => {
      // New users are not Pro yet, so we show the sales modal immediately
      onShowSales('LOGO');
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
     // This won't be reached if triggerLogoUpload works correctly, but safe to keep
  };

  return (
    <div className="min-h-screen bg-white p-8 flex flex-col justify-center max-w-md mx-auto animate-fade-in-up">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Üdvözöllek! 👋</h1>
        <p className="text-gray-500 font-medium">Állítsuk be a szervized arculatát.</p>
      </div>
      <div className="space-y-8">
        <div className="flex flex-col items-center">
             <div 
               className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer relative group transition-all hover:border-gray-400 opacity-60"
               onClick={handleLogoClick}
             >
               <div className="text-center text-gray-400">
                   <Lock size={28} className="mx-auto mb-2"/>
                   <span className="text-[10px] font-bold uppercase tracking-wider">Logó (PRO)</span>
               </div>
             </div>
             <input type="file" accept="image/*" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} />
             <p className="text-xs text-gray-400 mt-2 font-medium">Logó feltöltése: Csak PRO csomagban</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">Szerviz Neve</label>
          <input type="text" placeholder="Pl. GumiAbroncs KFT." className="block w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-gray-200" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">Márkaszín Választása</label>
          <div className="flex justify-center">
             <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-16 h-16 rounded-xl cursor-pointer border-none bg-transparent"/>
                <div className="text-left">
                   <p className="text-sm font-bold text-gray-900">Válassz színt</p>
                   <p className="text-xs text-gray-500">Koppints a négyzetre</p>
                </div>
             </div>
          </div>
        </div>
        <button 
          onClick={() => name && onComplete({ shopName: name, themeColor: color, logoUrl, darkMode: false, texture: 'none', clientCountSinceBackup: 0, isPro: false })} 
          disabled={!name} 
          style={{ backgroundColor: name ? color : '#d1d5db' }}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-xl mt-4 transition-all`}
        >
          Kész, Indulás!
        </button>
      </div>
    </div>
  );
};