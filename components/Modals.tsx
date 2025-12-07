import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Download, Palette, Sparkles, Car, Crown, AlertTriangle, Send, Wrench, MessageSquare, Upload, RefreshCw, Moon, Sun, Edit3, Trash2, Lock
} from 'lucide-react';
import { ThemeConfig, ClientData, ShopSettings } from '../types';
import { improveTemplateText, generateStaticSms } from '../aiService';
import { PRO_LICENSE_KEY } from '../config';
import { Loader2 } from 'lucide-react';

export const FeatureGateModal = ({ 
  feature, onClose, onActivate 
}: { 
  feature: 'LOGO' | 'AI' | 'LIMIT', onClose: () => void, onActivate: () => void 
}) => {
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const content = {
    LOGO: {
      title: "Tedd profibbá a megjelenésed!",
      text: "Töltsd fel a logódat, hogy az app a Te céged arculatát tükrözze a mindennapi munka során. Az egyedi arculat bizalmat épít.",
      icon: <Palette size={48} className="text-purple-500" />
    },
    AI: {
      title: "Írj úgy, mint egy profi!",
      text: "Spórolj időt! Az AI segít a nyers jegyzeteidet (pl. 'rossz a fék') udvarias, bizalomgerjesztő kommunikációvá alakítani egy gombnyomással.",
      icon: <Sparkles size={48} className="text-indigo-500" />
    },
    LIMIT: {
      title: "Kinőtted az ingyenes keretet?",
      text: "Ez jó hír, pörög az üzlet! Az ingyenes verzióban 5 autót kezelhetsz. Válts PRO-ra a korlátlan munkalapokhoz!",
      icon: <Car size={48} className="text-emerald-500" />
    }
  }[feature];

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 animate-fade-in-up backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-2 border-white/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500"></div>
        
        <div className="flex justify-center mb-6">
          <div className="bg-gray-50 p-4 rounded-full shadow-inner">
            {content.icon}
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center leading-tight">{content.title}</h3>
        <p className="text-sm text-gray-500 mb-8 text-center leading-relaxed font-medium">
          {content.text}
        </p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={onActivate} 
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-indigo-200 transform transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Crown size={20} fill="currentColor" /> Váltás PRO-ra
          </button>
          <button 
            onClick={onClose} 
            className="w-full py-3 text-gray-400 font-bold text-sm hover:text-gray-600"
          >
            Köszönöm, maradok az alap verziónál
          </button>
        </div>
      </div>
    </div>
  );
};

export const BackupReminderModal = ({ onClose, onExport, theme }: { onClose: () => void, onExport: () => void, theme: ThemeConfig }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-6 animate-fade-in-up">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-yellow-400">
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
            <AlertTriangle size={32} />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Biztonsági Mentés</h3>
        <p className="text-sm text-gray-600 mb-6 text-center leading-relaxed">
          Már <b>5 új autót</b> rögzítettél mentés nélkül! Ha elveszik a telefonod, ezek az adatok örökre eltűnnek.
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={onExport} 
            className={`w-full py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg ${theme.bg}`}
          >
            <Download size={18} /> Mentés letöltése most
          </button>
          <button 
            onClick={onClose} 
            className="w-full py-3 text-gray-400 font-bold text-sm hover:text-gray-600"
          >
            Majd később
          </button>
        </div>
      </div>
    </div>
  );
};

export const StartRepairModal = ({ 
  client, shopName, onClose, isDark 
}: { 
  client: ClientData, shopName: string, onClose: () => void, isDark: boolean 
}) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const smsText = generateStaticSms('START', '', client.licensePlate, undefined, undefined, undefined, false, [], shopName);

  const handleSend = () => {
    const link = `sms:${client.phone}?body=${encodeURIComponent(smsText)}`;
    window.location.href = link;
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-3xl w-full max-w-sm shadow-2xl p-6 border`}>
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <Wrench size={32} />
          </div>
        </div>
        <h3 className={`text-xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>Javítás Megkezdése</h3>
        <p className={`text-sm mb-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Az alábbi SMS-t küldjük az ügyfélnek:
        </p>
        
        <div className={`${isDark ? 'bg-slate-900 border-slate-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-800'} p-4 rounded-xl border mb-6 relative`}>
          <p className="text-sm font-medium italic">"{smsText}"</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Mégse</button>
          <button onClick={handleSend} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
            <Send size={16} /> Küldés
          </button>
        </div>
      </div>
    </div>
  );
};

export const SettingsModal = ({ 
  onClose, theme, onExport, onImport, quickActions, setQuickActions, isOnline, settings, onUpdateSettings, onShowSales
}: { 
  onClose: () => void, 
  theme: ThemeConfig,
  onExport: () => void,
  onImport: (data: ClientData[], merge: boolean) => void,
  quickActions: string[],
  setQuickActions: (a: string[]) => void,
  isOnline: boolean,
  settings: ShopSettings,
  onUpdateSettings: (s: ShopSettings) => void,
  onShowSales: (feat: 'LOGO' | 'AI' | 'LIMIT') => void
}) => {
  const [newAction, setNewAction] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const isDark = settings.darkMode;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleDeleteAction = (index: number) => {
    setQuickActions(quickActions.filter((_, i) => i !== index));
  };

  const handleImproveAction = async () => {
    if (!settings.isPro) {
        onShowSales('AI');
        return;
    }
    if (!newAction.trim() || !isOnline) return;
    setIsImproving(true);
    const improved = await improveTemplateText(newAction);
    setNewAction(improved);
    setIsImproving(false);
  };

  const handleAddAction = () => {
    if (newAction.trim()) {
      setQuickActions([...quickActions, newAction.trim()]);
      setNewAction('');
    }
  };

  const handleActivatePro = () => {
    if (licenseKey.trim() === PRO_LICENSE_KEY) {
      onUpdateSettings({...settings, isPro: true});
      alert("Sikeres aktiválás! Üdv a PRO klubban! 🚀");
      setLicenseKey('');
    } else {
      alert("Érvénytelen licenckulcs. Kérjük ellenőrizd!");
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          if (confirm("Sikeres beolvasás! Hogyan szeretnéd visszatölteni?\n\nOK = MEGLÉVŐKHOZ ADÁS\nMÉGSEM = TELJES CSERE")) {
            onImport(json, true);
          } else {
            onImport(json, false);
          }
          alert("Sikeres visszatöltés! A Dashboard frissült.");
        } else {
          alert("Hibás fájlformátum!");
        }
      } catch (error) {
        alert("Hiba a fájl feldolgozásakor.");
      }
    };
    reader.readAsText(file);
    if(importInputRef.current) importInputRef.current.value = '';
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings.isPro) {
      onShowSales('LOGO');
      return;
    }
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerLogoUpload = () => {
    if (!settings.isPro) {
        onShowSales('LOGO');
        return;
    }
    logoInputRef.current?.click();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className={`p-6 border-b ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-100 bg-gray-50'} rounded-t-3xl flex justify-between items-center`}>
          <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Beállítások</h3>
          <button onClick={onClose} className={isDark ? 'text-gray-400' : 'text-gray-500'}><X size={24}/></button>
        </div>
        
        <div className="p-6 overflow-y-auto dark-scroll">
          
          {/* Shop Name Edit */}
           <div className="mb-6">
            <label className={`text-xs font-bold uppercase tracking-widest mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Szerviz Neve</label>
            <input type="text" value={settings.shopName} onChange={(e) => onUpdateSettings({...settings, shopName: e.target.value})} className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
          </div>

          {/* PRO SECTION */}
          <div className={`mb-8 p-4 rounded-2xl border-2 ${settings.isPro ? (isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-100 bg-emerald-50') : (isDark ? 'border-indigo-500/30 bg-indigo-500/10' : 'border-indigo-100 bg-indigo-50')}`}>
             <div className="flex items-center gap-3 mb-2">
               {settings.isPro ? <Crown size={24} className="text-emerald-500" /> : <Lock size={24} className="text-indigo-500" />}
               <h4 className={`text-lg font-bold ${settings.isPro ? 'text-emerald-600' : 'text-indigo-600'}`}>
                 {settings.isPro ? 'PRO Csomag Aktív' : 'Válts PRO-ra!'}
               </h4>
             </div>
             
             {!settings.isPro ? (
               <div>
                 <p className={`text-xs mb-3 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                   Korlátlan autó, saját logó és AI funkciók. Csak havi 4.990 Ft.
                 </p>
                 <div className="flex gap-2">
                   <input 
                     type="text" 
                     placeholder="Licenckulcs..."
                     value={licenseKey}
                     onChange={(e) => setLicenseKey(e.target.value)}
                     className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                   />
                   <button 
                     onClick={handleActivatePro}
                     className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md active:scale-95"
                   >
                     Aktiválás
                   </button>
                 </div>
               </div>
             ) : (
                <p className="text-xs text-emerald-600 font-medium">Köszönjük, hogy profi vagy!</p>
             )}
          </div>

          <div className="mb-8">
             <h4 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Palette size={14}/> Arculat & Design
             </h4>
             
             <div className="flex items-center gap-4 mb-4">
                <div 
                  className={`w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer relative group ${isDark ? 'border-slate-600 bg-slate-700' : 'border-gray-300 bg-gray-50'} ${!settings.isPro ? 'opacity-50' : ''}`}
                  onClick={triggerLogoUpload}
                >
                  {(settings.logoUrl && settings.isPro) ? (
                    <img src={settings.logoUrl} className="w-full h-full object-contain" />
                  ) : (
                    <Upload size={20} className={isDark ? 'text-slate-400' : 'text-gray-400'}/>
                  )}
                  {!settings.isPro && (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <Lock size={16} className="text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-2">
                     <p className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Szerviz Logó</p>
                     {!settings.isPro && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold">PRO</span>}
                   </div>
                   <button onClick={triggerLogoUpload} className={`text-xs font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Kép feltöltése</button>
                   <input type="file" accept="image/*" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} />
                </div>
             </div>

             <div className="flex items-center gap-4 mb-4">
                <input 
                  type="color" 
                  value={settings.themeColor} 
                  onChange={(e) => onUpdateSettings({...settings, themeColor: e.target.value})}
                  className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                />
                <div className="flex-1">
                   <p className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Fő Szín</p>
                   <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Válaszd ki a márkaszíned</p>
                </div>
             </div>

             <div className={`flex items-center justify-between p-3 rounded-xl border mb-4 ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2">
                   {settings.darkMode ? <Moon size={18} className="text-blue-400"/> : <Sun size={18} className="text-orange-500"/>}
                   <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-700'}`}>Sötét Mód</span>
                </div>
                <button 
                  onClick={() => onUpdateSettings({...settings, darkMode: !settings.darkMode})}
                  className={`w-12 h-6 rounded-full relative transition-colors ${settings.darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                   <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.darkMode ? 'left-7' : 'left-1'}`}></div>
                </button>
             </div>

             <div>
                <p className={`text-xs font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Háttér Textúra</p>
                <div className="flex gap-2">
                   {(['none', 'carbon', 'metal'] as import('../types').TextureType[]).map(t => (
                     <button
                       key={t}
                       onClick={() => onUpdateSettings({...settings, texture: t})}
                       className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all
                         ${settings.texture === t 
                           ? (isDark ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-blue-600 bg-blue-50 text-blue-700') 
                           : (isDark ? 'border-slate-600 bg-slate-700 text-gray-400' : 'border-gray-200 bg-white text-gray-600')}
                       `}
                     >
                       {t === 'none' ? 'Sima' : t === 'carbon' ? 'Karbon' : 'Fém'}
                     </button>
                   ))}
                </div>
             </div>
          </div>

          <div className={`border-t my-6 ${isDark ? 'border-slate-700' : 'border-gray-100'}`}></div>

          <div className="mb-8">
            <h4 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <Edit3 size={14}/> Gyors Sablonok
            </h4>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Új sablon..."
                className={`flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ${isDark ? 'bg-slate-900 border-slate-600 text-white focus:ring-blue-500' : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'}`}
                value={newAction}
                onChange={e => setNewAction(e.target.value)}
              />
              <button 
                onClick={handleImproveAction}
                disabled={!isOnline || !newAction || isImproving}
                className={`p-3 rounded-xl transition-all ${isOnline && newAction && settings.isPro ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : (isDark ? 'bg-slate-700 text-slate-500' : 'bg-gray-100 text-gray-400')}`}
              >
                {!settings.isPro ? <Lock size={20} /> : (isImproving ? <Loader2 size={20} className="animate-spin"/> : <Sparkles size={20} />)}
              </button>
              <button 
                onClick={handleAddAction}
                disabled={!newAction}
                style={{ backgroundColor: settings.themeColor }}
                className={`p-3 text-white rounded-xl disabled:opacity-50 shadow-md`}
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {quickActions.map((action, idx) => (
                <div key={idx} className={`flex justify-between items-center p-3 rounded-xl border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-100'}`}>
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{action}</span>
                  <button onClick={() => handleDeleteAction(idx)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={`border-t my-6 ${isDark ? 'border-slate-700' : 'border-gray-100'}`}></div>

          <div>
              <h4 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <ShieldCheck size={14}/> Adatok Kezelése
              </h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button 
                onClick={onExport}
                className={`w-full py-3 ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-900 text-white hover:bg-black'} rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform`}
                >
                  <Download size={16} /> Mentés
                </button>
                <button 
                onClick={() => importInputRef.current?.click()}
                className={`w-full py-3 border rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform ${isDark ? 'bg-slate-800 border-slate-600 text-gray-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  <RefreshCw size={16} /> Visszatöltés
                </button>
                <input type="file" accept=".json" className="hidden" ref={importInputRef} onChange={handleImportFile} />
              </div>
              <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                A "Mentés" letölt egy fájlt. A "Visszatöltés"-sel visszaállíthatod a régi adatokat.
              </p>
          </div>

          <div className={`border-t my-6 ${isDark ? 'border-slate-700' : 'border-gray-100'}`}></div>

          <button 
            onClick={() => {
              if(confirm("Minden adat törlődik! Biztos?")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="w-full py-3 border border-red-500/30 text-red-500 rounded-xl font-bold text-sm hover:bg-red-500/10 transition-colors"
          >
            App Visszaállítása (Reset)
          </button>
        </div>
      </div>
    </div>
  );
};

const AddActionModal = ({ 
  onClose, onSave, isOnline, themeColor, isDark, isPro, onShowSales
}: { 
  onClose: () => void, onSave: (text: string) => void, isOnline: boolean, themeColor: string, isDark: boolean, isPro: boolean, onShowSales: (f: 'AI') => void
}) => {
  const [newAction, setNewAction] = useState('');
  const [isImproving, setIsImproving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleImproveAction = async () => {
    if (!isPro) {
      onShowSales('AI');
      return;
    }
    if (!newAction.trim() || !isOnline) return;
    setIsImproving(true);
    const improved = await improveTemplateText(newAction);
    setNewAction(improved);
    setIsImproving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-3xl w-full max-w-sm shadow-2xl p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Új Sablon Hozzáadása</h3>
          <button onClick={onClose} className={isDark ? 'text-gray-400' : 'text-gray-500'}><X size={24}/></button>
        </div>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Írd be a rövid diagnózist.</p>
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Pl. kormánymű kopog..."
            className={`flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ${isDark ? 'bg-slate-900 border-slate-600 text-white focus:ring-blue-500' : 'border-gray-200 focus:ring-blue-500'}`}
            value={newAction}
            onChange={e => setNewAction(e.target.value)}
            autoFocus
          />
          <button 
            onClick={handleImproveAction}
            disabled={!isOnline || !newAction || isImproving}
            className={`p-3 rounded-xl transition-all ${isOnline && newAction && isPro ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : (isDark ? 'bg-slate-700 text-slate-500' : 'bg-gray-100 text-gray-400')}`}
          >
            {!isPro ? <Lock size={20}/> : (isImproving ? <Loader2 size={20} className="animate-spin"/> : <Sparkles size={20} />)}
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Mégse</button>
          <button onClick={() => { if (newAction.trim()) onSave(newAction.trim()); }} disabled={!newAction} style={{backgroundColor: themeColor}} className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg disabled:opacity-50`}>Mentés</button>
        </div>
      </div>
    </div>
  );
};