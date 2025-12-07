import React, { useState } from 'react';
import { 
  CheckCircle, Plus, Search, Car, Flame, Check, Trash2, Wrench, Settings, Lightbulb
} from 'lucide-react';
import { ClientData, ShopSettings, ThemeConfig } from '../types';
import { getTextureStyle } from '../utils';

export const DashboardScreen = ({ 
  clients, onAdd, onOpen, onDelete, onStart, onOpenSettings, settings, theme 
}: { 
  clients: ClientData[], onAdd: () => void, onOpen: (id: string) => void, onDelete: any, onStart: (client: ClientData, e: React.MouseEvent) => void, onOpenSettings: any, settings: ShopSettings, theme: ThemeConfig
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isDark = settings.darkMode;
  const themeColor = settings.themeColor;
  const bgStyle = getTextureStyle(settings.texture, isDark);
  
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyFinished = clients.filter(c => c.status === 'FINISHED' && c.createdAt > oneWeekAgo).length;

  const filteredClients = clients.filter(c => 
    c.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (a.status === b.status) return b.createdAt - a.createdAt;
    return a.status === 'ACTIVE' ? -1 : 1;
  });

  return (
    <div className="max-w-xl mx-auto min-h-screen p-6 animate-fade-in-up pb-20 transition-colors duration-300" style={bgStyle}>
      <div className="flex justify-between items-center mb-8 pt-2">
        <div className="flex items-center gap-3">
          {(settings.logoUrl && settings.isPro) ? (
            <img src={settings.logoUrl} alt="Logo" className={`w-12 h-12 object-contain rounded-lg p-1 shadow-sm border ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-100'}`} />
          ) : (
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}`}>{settings.shopName.substring(0,1)}</div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl font-bold tracking-tight leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{settings.shopName}</h1>
              {settings.isPro && <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">PRO</span>}
            </div>
            <div className={`flex items-center gap-2 text-sm mt-1.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <CheckCircle size={14} className="text-emerald-500"/> 
              <span>Heti kész: <b>{weeklyFinished} db</b></span>
            </div>
          </div>
        </div>
        <button onClick={onOpenSettings} className={`p-3 border rounded-xl shadow-sm transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-gray-300 hover:text-white' : 'bg-white border-gray-100 text-gray-400 hover:text-gray-600'}`}>
          <Settings size={22} />
        </button>
      </div>

      <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 shadow-sm border ${isDark ? 'bg-blue-900/30 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
        <Lightbulb size={20} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed font-semibold">
          <span className="font-bold">TIPP:</span> A munka megkezdésének jelzése bizonyítottan 50%-kal csökkenti a türelmetlen telefonhívásokat, és növeli a szerviz szakmai megítélését.
        </p>
      </div>

      <button 
        onClick={onAdd} 
        style={{ backgroundColor: themeColor }}
        className={`w-full mb-6 text-white py-4 rounded-2xl font-bold shadow-lg shadow-black/20 transform transition active:scale-95 flex items-center justify-center gap-2 tracking-wide`}
      >
        <Plus size={20} /> ÚJ AUTÓ FELVÉTELE
      </button>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Keresés rendszám vagy név alapján..." 
          className={`w-full pl-12 pr-4 py-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500 focus:ring-blue-500' : 'bg-white border-gray-200 text-gray-900 focus:ring-gray-200'}`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {sortedClients.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Car size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">{searchTerm ? 'Nincs találat.' : 'Nincs rögzített autó.'}</p>
          </div>
        ) : (
          sortedClients.map(client => (
            <div key={client.id} className={`relative rounded-2xl border transition-all hover:shadow-lg overflow-hidden ${client.status === 'FINISHED' ? 'opacity-70' : 'shadow-md'} ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              {client.isUrgent && client.status === 'ACTIVE' && (
                <div className="bg-red-500/10 text-red-500 text-[10px] font-bold px-4 py-1.5 flex items-center gap-1 border-b border-red-500/20 tracking-wider">
                  <Flame size={12} fill="currentColor" /> SÜRGŐS
                </div>
              )}
              <div onClick={() => onOpen(client.id)} className="p-5 flex items-start gap-4 cursor-pointer">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${isDark ? 'bg-slate-700 text-gray-200' : 'bg-gray-100 text-gray-700'} ${client.status === 'FINISHED' ? 'bg-emerald-100 text-emerald-600' : ''}`}>
                  {client.status === 'FINISHED' ? <Check size={24} /> : client.licensePlate.substring(0, 2)}
                </div>
                <div className="flex-1 pr-24">
                  <h3 className={`font-bold text-lg tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{client.licensePlate}</h3>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{client.name}</p>
                </div>
              </div>
              
              {/* Quick Actions for Active Clients */}
              {client.status === 'ACTIVE' && (
                <button 
                  onClick={(e) => onStart(client, e)}
                  className={`absolute top-4 right-14 p-2 rounded-lg transition-colors z-20 active:scale-95 flex items-center gap-1 shadow-sm border ${isDark ? 'bg-slate-700 border-slate-600 text-blue-400 hover:bg-slate-600' : 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100'}`}
                  title="Javítás indítása SMS"
                >
                  <Wrench size={16} /> <span className="text-[10px] font-bold">MEGKEZDÉS</span>
                </button>
              )}

              <button onClick={(e) => onDelete(client.id, e)} className={`absolute top-4 right-2 p-2 rounded-lg transition-colors z-20 active:scale-95 ${isDark ? 'text-gray-500 hover:text-red-400 hover:bg-slate-700' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}>
                <Trash2 size={18} className="pointer-events-none" />
              </button>

              {client.status === 'FINISHED' && (
                <div className="absolute bottom-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-tl-xl pointer-events-none flex items-center gap-1">
                  <CheckCircle size={10} /> KÉSZ
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};