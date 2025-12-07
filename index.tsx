import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { 
  Camera, 
  Send, 
  Car, 
  WifiOff, 
  Image as ImageIcon,
  CheckCircle,
  Plus,
  Trash2,
  Settings,
  X,
  Check,
  ChevronRight,
  Clock,
  CloudUpload,
  Loader2,
  AlertTriangle,
  Download,
  Palette,
  ShieldCheck,
  Flame,
  Coins,
  Sparkles,
  Edit3,
  Mic,
  Search,
  Maximize2,
  ToggleLeft,
  ToggleRight,
  Wrench,
  Lightbulb,
  MessageSquare,
  Upload,
  FileJson,
  RefreshCw,
  Moon,
  Sun,
  Grid,
  Save
} from 'lucide-react';

// --- 1. TYPES & INTERFACES (Defined first) ---

type ClientStatus = 'ACTIVE' | 'FINISHED';
type SmsType = 'DIAGNOSIS' | 'FINISHED' | 'START';
type TextureType = 'none' | 'carbon' | 'metal';

interface ThemeConfig {
  name: string;
  bg: string;
  text: string;
  border: string;
  light: string;
  hover: string;
  ring: string;
  shadow: string;
}

interface ClientData {
  id: string;
  name: string;
  licensePlate: string;
  phone: string;
  photos: PhotoEvidence[];
  status: ClientStatus;
  createdAt: number;
  isUrgent: boolean;
  gdprAccepted: boolean;
  estimatedCost?: number;
  laborCost?: number; 
  partsCost?: number; 
  useBreakdown?: boolean; 
}

interface PhotoEvidence {
  id: string;
  url: string;
  cloudUrl?: string;
  source: 'CAMERA' | 'GALLERY';
  status: 'PENDING_UPLOAD' | 'UPLOADED' | 'ERROR';
}

interface ShopSettings {
  shopName: string;
  themeColor: string;
  logoUrl?: string;
  darkMode: boolean;
  texture: TextureType;
  clientCountSinceBackup: number; // NEW: Track clients for backup reminder
}

type ViewState = 'ONBOARDING' | 'DASHBOARD' | 'INTAKE' | 'WORKSHOP';

// --- 2. CONFIGURATION & CONSTANTS ---

const CLOUDINARY_CLOUD_NAME = 'dagkl5gci';
const CLOUDINARY_UPLOAD_PRESET = 'Autószervíz';

const THEMES: Record<string, ThemeConfig> = {
  orange: { name: 'GumiAbroncs Narancs', bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-200', light: 'bg-orange-50', hover: 'hover:bg-orange-600', ring: 'focus:ring-orange-500', shadow: 'shadow-orange-200' },
  blue: { name: 'Royal Kék', bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50', hover: 'hover:bg-blue-700', ring: 'focus:ring-blue-600', shadow: 'shadow-blue-200' },
  green: { name: 'Eco Zöld', bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50', hover: 'hover:bg-emerald-700', ring: 'focus:ring-emerald-600', shadow: 'shadow-emerald-200' },
  slate: { name: 'Prémium Szürke', bg: 'bg-slate-800', text: 'text-slate-800', border: 'border-slate-200', light: 'bg-slate-100', hover: 'hover:bg-slate-900', ring: 'focus:ring-slate-800', shadow: 'shadow-slate-200' },
};

// --- 3. HELPER FUNCTIONS ---

const getTextureStyle = (type: TextureType, isDark: boolean) => {
  if (type === 'carbon') {
    return {
      backgroundImage: `radial-gradient(circle, ${isDark ? '#333' : '#e5e7eb'} 20%, transparent 20%), radial-gradient(circle, ${isDark ? '#333' : '#e5e7eb'} 20%, transparent 20%)`,
      backgroundSize: '10px 10px',
      backgroundPosition: '0 0, 5px 5px',
      backgroundColor: isDark ? '#1a1a1a' : '#f8fafc'
    };
  }
  if (type === 'metal') {
    return {
      backgroundImage: `repeating-linear-gradient(45deg, ${isDark ? '#262626' : '#f1f5f9'} 0, ${isDark ? '#262626' : '#f1f5f9'} 1px, transparent 0, transparent 50%)`,
      backgroundSize: '10px 10px',
      backgroundColor: isDark ? '#171717' : '#ffffff'
    };
  }
  return { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }; // Default bg
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const beautifyDiagnosisText = async (rawText: string): Promise<string> => {
  try {
    const prompt = `
      Feladat: Fogalmazd át az alábbi autószerelői diagnózist barátságosabb, bizalomgerjesztő, de szakmai stílusra.
      Szabály: Ne változtass a tényeken, csak a stíluson. Legyen gördülékeny, magyaros mondat.
      Bemenet: "${rawText}"
      Kimenet: Csak az átfogalmazott szöveg.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text?.trim() || rawText;
  } catch (error) {
    console.error("AI Beautify Error:", error);
    return rawText;
  }
};

const improveTemplateText = async (rawText: string): Promise<string> => {
  try {
    const prompt = `
      Feladat: Alakítsd át ezt a rövid szerelői jegyzetet egy profi, rövid "Gyors Diagnózis" gomb felirattá.
      Bemenet: "${rawText}"
      Példa bemenet: "büdös klíma" -> Példa kimenet: "Klímatisztítás és fertőtlenítés szükséges"
      Szabály: Max 4-6 szó legyen. Legyen szakmai.
      Kimenet: Csak a szöveg.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text?.trim() || rawText;
  } catch (error) {
    console.error("AI Template Error:", error);
    return rawText;
  }
};

const generateStaticSms = (
  type: SmsType, 
  diagnosis: string, 
  plate: string, 
  cost: number | undefined, 
  partsCost: number | undefined,
  laborCost: number | undefined,
  useBreakdown: boolean | undefined,
  photoUrls: string[], 
  shopName: string
): string => {
  let costSection = '';
  const costStr = cost ? cost.toLocaleString('hu-HU') : '0';
  
  if (cost) {
    if (useBreakdown && (partsCost || laborCost)) {
      costSection = ` A várható költségek: Alkatrész: ${(partsCost || 0).toLocaleString('hu-HU')} Ft, Munkadíj: ${(laborCost || 0).toLocaleString('hu-HU')} Ft. Összesen: ${costStr} Ft.`;
    } else {
      costSection = ` A javítás várható költsége: ${costStr} Ft.`;
    }
  }

  let sms = '';

  if (type === 'DIAGNOSIS') {
    sms = `Üdvözlöm! Átvizsgáltuk a ${plate} autóját a ${shopName}-nél. A következő beavatkozás szükséges: ${diagnosis}.${costSection} Kérjük, válasz SMS-ben jelezze, hogy elfogadja-e a javítást!`;
  } else if (type === 'FINISHED') {
    const priceText = cost ? ` A fizetendő végösszeg: ${costStr} Ft.` : '';
    sms = `Tisztelt Ügyfelünk! A ${plate} rendszámú autója elkészült, a javítás befejeződött a ${shopName}-nél.${priceText} Várjuk szervizünkben, az autó átvehető. Üdvözlettel!`;
  } else if (type === 'START') {
    sms = `Tisztelt Ügyfelünk! Tájékoztatjuk, hogy a ${plate} rendszámú autóján a javítási munkálatokat megkezdtük a ${shopName}-nél. Amint elkészül, azonnal értesítjük.`;
  }

  if (photoUrls.length > 0 && type === 'DIAGNOSIS') {
    sms += `\n\nFotók a munkáról:\n${photoUrls.join('\n')}`;
  }

  return sms;
};

const uploadImageToCloudinary = async (photo: PhotoEvidence): Promise<string | null> => {
  if (photo.cloudUrl) return photo.cloudUrl;
  if (photo.url.startsWith('http') && !photo.url.startsWith('blob:')) return photo.url;

  try {
    const blobResponse = await fetch(photo.url);
    const blob = await blobResponse.blob();
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

const formatLicensePlate = (value: string) => {
  let clean = value.toUpperCase();
  if (/^[A-Z0-9]{6}$/.test(clean)) {
     return `${clean.slice(0,3)}-${clean.slice(3)}`;
  }
  return clean;
};

const formatPhoneNumber = (value: string) => value.replace(/[^\d+ ]/g, '');

const formatCost = (value: string) => {
  const number = parseInt(value.replace(/\D/g, '')) || 0;
  return number === 0 ? '' : number.toLocaleString('hu-HU');
};

const parseCost = (value: string) => parseInt(value.replace(/\D/g, '')) || 0;

// --- 4. SUB-COMPONENTS (Defined BEFORE App) ---

const BackupReminderModal = ({ onClose, onExport, theme }: { onClose: () => void, onExport: () => void, theme: ThemeConfig }) => {
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

const StartRepairModal = ({ 
  client, shopName, onClose, isDark 
}: { 
  client: ClientData, shopName: string, onClose: () => void, isDark: boolean 
}) => {
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
          Értesítsd az ügyfelet, hogy nekiláttál az autónak!
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

const SettingsModal = ({ 
  onClose, theme, onExport, onImport, quickActions, setQuickActions, isOnline, settings, onUpdateSettings
}: { 
  onClose: () => void, 
  onExport: () => void,
  onImport: (data: ClientData[], merge: boolean) => void,
  quickActions: string[],
  setQuickActions: (a: string[]) => void,
  isOnline: boolean,
  settings: ShopSettings,
  onUpdateSettings: (s: ShopSettings) => void
}) => {
  const [newAction, setNewAction] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const isDark = settings.darkMode;

  const handleImproveAction = async () => {
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
          alert("Adatok visszatöltve!");
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
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className={`p-6 border-b ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-100 bg-gray-50'} rounded-t-3xl flex justify-between items-center`}>
          <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Beállítások</h3>
          <button onClick={onClose} className={isDark ? 'text-gray-400' : 'text-gray-500'}><X size={24}/></button>
        </div>
        <div className="p-6 overflow-y-auto dark-scroll">
          <div className="mb-8">
             <h4 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Palette size={14}/> Arculat & Design
             </h4>
             <div className="flex items-center gap-4 mb-4">
                <div 
                  className={`w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer relative group ${isDark ? 'border-slate-600 bg-slate-700' : 'border-gray-300 bg-gray-50'}`}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} className="w-full h-full object-contain" />
                  ) : (
                    <Upload size={20} className={isDark ? 'text-slate-400' : 'text-gray-400'}/>
                  )}
                </div>
                <div className="flex-1">
                   <p className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Szerviz Logó</p>
                   <button onClick={() => logoInputRef.current?.click()} className={`text-xs font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Kép feltöltése</button>
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
                   {(['none', 'carbon', 'metal'] as TextureType[]).map(t => (
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
                className={`p-3 rounded-xl transition-all ${isOnline && newAction ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : (isDark ? 'bg-slate-700 text-slate-500' : 'bg-gray-100 text-gray-400')}`}
              >
                {isImproving ? <Loader2 size={20} className="animate-spin"/> : <Sparkles size={20} />}
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
                  <button onClick={() => setQuickActions(quickActions.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500 p-1">
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
  onClose, onSave, isOnline, themeColor, isDark
}: { 
  onClose: () => void, onSave: (text: string) => void, isOnline: boolean, themeColor: string, isDark: boolean
}) => {
  const [newAction, setNewAction] = useState('');
  const [isImproving, setIsImproving] = useState(false);

  const handleImproveAction = async () => {
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
            className={`p-3 rounded-xl transition-all ${isOnline && newAction ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : (isDark ? 'bg-slate-700 text-slate-500' : 'bg-gray-100 text-gray-400')}`}
          >
            {isImproving ? <Loader2 size={20} className="animate-spin"/> : <Sparkles size={20} />}
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

const OnboardingScreen = ({ onComplete }: { onComplete: (s: ShopSettings) => void }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#f97316');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
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
               className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer relative group transition-all hover:border-gray-400"
               onClick={() => logoInputRef.current?.click()}
             >
               {logoUrl ? <img src={logoUrl} className="w-full h-full object-contain" /> : <div className="text-center text-gray-400"><Upload size={28} className="mx-auto mb-2"/><span className="text-[10px] font-bold uppercase tracking-wider">Logó</span></div>}
             </div>
             <input type="file" accept="image/*" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} />
             <p className="text-xs text-gray-400 mt-2 font-medium">Opcionális: Töltsd fel a céges logót</p>
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
          onClick={() => name && onComplete({ shopName: name, themeColor: color, logoUrl, darkMode: false, texture: 'none', clientCountSinceBackup: 0 })} 
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

const DashboardScreen = ({ 
  clients, onAdd, onOpen, onDelete, onStart, onOpenSettings, settings 
}: { 
  clients: ClientData[], onAdd: () => void, onOpen: (id: string) => void, onDelete: any, onStart: (client: ClientData, e: React.MouseEvent) => void, onOpenSettings: any, settings: ShopSettings
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
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className={`w-12 h-12 object-contain rounded-lg p-1 shadow-sm border ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-100'}`} />
          ) : (
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}`}>{settings.shopName.substring(0,1)}</div>
          )}
          <div>
            <h1 className={`text-2xl font-bold tracking-tight leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{settings.shopName}</h1>
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

const IntakeScreen = ({ onSave, onCancel, themeColor, isDark }: { onSave: (data: any) => void, onCancel: () => void, themeColor: string, isDark: boolean }) => {
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

const WorkshopScreen = ({ 
  client, isOnline, onBack, onUpdateClient, quickActions, setQuickActions, themeColor, shopName, isDark
}: { 
  client: ClientData, isOnline: boolean, onBack: () => void, onUpdateClient: (c: ClientData) => void, quickActions: string[], setQuickActions: any, themeColor: string, shopName: string, isDark: boolean
}) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [useBreakdown, setUseBreakdown] = useState(client.useBreakdown || false);
  const [estimatedCost, setEstimatedCost] = useState<string>(client.estimatedCost ? formatCost(client.estimatedCost.toString()) : '');
  const [laborCost, setLaborCost] = useState<string>(client.laborCost ? formatCost(client.laborCost.toString()) : '');
  const [partsCost, setPartsCost] = useState<string>(client.partsCost ? formatCost(client.partsCost.toString()) : '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBeautifying, setIsBeautifying] = useState(false);
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [generatedSms, setGeneratedSms] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photos = client.photos;

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) setIsSpeechSupported(true);
  }, []);

  useEffect(() => {
    if (useBreakdown) {
      const l = parseCost(laborCost);
      const p = parseCost(partsCost);
      setEstimatedCost(formatCost((l + p).toString()));
    }
  }, [laborCost, partsCost, useBreakdown]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newPhotos: PhotoEvidence[] = Array.from(event.target.files).map(file => ({
        id: Date.now().toString() + Math.random(),
        url: URL.createObjectURL(file as Blob),
        source: 'GALLERY',
        status: 'PENDING_UPLOAD'
      }));
      const updatedClient = { ...client, photos: [...photos, ...newPhotos] };
      onUpdateClient(updatedClient);
      if (isOnline) processPhotoUploads(updatedClient.photos);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeletePhoto = (photoId: string) => {
    onUpdateClient({ ...client, photos: photos.filter(p => p.id !== photoId) });
  };

  const processPhotoUploads = async (currentPhotos: PhotoEvidence[] = photos): Promise<string[]> => {
    if (!isOnline) return [];
    const pendingPhotos = currentPhotos.filter(p => !p.cloudUrl);
    if (pendingPhotos.length === 0) return currentPhotos.map(p => p.cloudUrl).filter(Boolean) as string[];
    setUploadProgress(`Képek feltöltése...`);
    let updatedPhotos = [...currentPhotos];
    for (const photo of pendingPhotos) {
      const cloudUrl = await uploadImageToCloudinary(photo);
      if (cloudUrl) {
          updatedPhotos = updatedPhotos.map(p => p.id === photo.id ? { ...p, cloudUrl, status: 'UPLOADED' } : p);
          onUpdateClient({ ...client, photos: updatedPhotos }); 
      }
    }
    setUploadProgress('');
    return updatedPhotos.map(p => p.cloudUrl).filter(Boolean) as string[];
  };

  const handleBeautify = async () => {
    if (!diagnosis || !isOnline) return;
    setIsBeautifying(true);
    const improvedText = await beautifyDiagnosisText(diagnosis);
    setDiagnosis(improvedText);
    setIsBeautifying(false);
  };

  const startDictation = () => {
    if (!isSpeechSupported) return;
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'hu-HU';
    recognition.interimResults = false;
    setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDiagnosis(prev => prev ? prev + " " + transcript : transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleGenerateSMS = async (type: SmsType) => {
    if (type === 'DIAGNOSIS' && !diagnosis) return;
    setIsProcessing(true);
    
    const numericCost = parseCost(estimatedCost);
    const numericLabor = parseCost(laborCost);
    const numericParts = parseCost(partsCost);

    onUpdateClient({ 
        ...client, 
        estimatedCost: numericCost,
        laborCost: numericLabor,
        partsCost: numericParts,
        useBreakdown: useBreakdown
    });

    let photoUrls: string[] = [];
    if (isOnline) photoUrls = await processPhotoUploads(client.photos);
    
    const sms = generateStaticSms(
        type, 
        diagnosis, 
        client.licensePlate, 
        numericCost, 
        numericParts,
        numericLabor,
        useBreakdown,
        photoUrls, 
        shopName
    );
    
    if (!isOnline && photos.length > 0) {
      setGeneratedSms(sms + "\n(A fotókat internet hiánya miatt nem tudtuk csatolni.)");
    } else {
      setGeneratedSms(sms);
    }
    setIsProcessing(false);
  };

  const sendSMS = () => {
    const link = `sms:${client.phone}?body=${encodeURIComponent(generatedSms)}`;
    window.location.href = link;
  };

  const handleSaveNewAction = (text: string) => {
    setQuickActions([...quickActions, text]);
    setIsAddingAction(false);
  };

  const inputClass = `w-full border rounded-xl py-3 px-3 font-mono font-bold text-sm focus:outline-none focus:ring-2 ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'}`;

  return (
    <div className={`max-w-xl mx-auto min-h-screen flex flex-col pb-10 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
      <div className={`backdrop-blur-md px-6 py-4 border-b flex justify-between items-center sticky top-0 z-20 ${isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-gray-100'}`}>
        <button onClick={onBack} className={`p-2 -ml-2 rounded-full transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-slate-800' : 'text-gray-600 hover:text-black hover:bg-gray-100'}`}><X size={20} /></button>
        <div className="text-center">
          <h2 className={`text-xl font-bold font-mono tracking-tight leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{client.licensePlate}</h2>
          <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wide">
             {client.status === 'FINISHED' ? <span className="text-emerald-500 flex items-center justify-center gap-1"><CheckCircle size={10}/> Kész</span> : client.isUrgent ? <span className="text-red-500 font-bold">SÜRGŐS!</span> : 'Folyamatban'}
          </p>
        </div>
        <div className="w-8"></div>
      </div>

      <div className="p-6 space-y-8 flex-1">
        <section>
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dokumentáció</h3>
                {uploadProgress && <span className="text-xs text-orange-500 animate-pulse">{uploadProgress}</span>}
            </div>
            
            <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <button onClick={() => fileInputRef.current?.click()} className={`bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform`}>
              <Camera size={16} /> FOTÓ / GALÉRIA
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {photos.map(photo => (
              <div key={photo.id} className={`aspect-square rounded-2xl overflow-hidden relative shadow-sm border group cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`} onClick={() => setPreviewPhotoUrl(photo.url)}>
                <img src={photo.url} className="w-full h-full object-cover" />
                <div className="absolute bottom-1 left-1">
                    {photo.status === 'UPLOADED' && <div className="bg-emerald-500 text-white p-1 rounded-full shadow-sm"><Check size={8}/></div>}
                    {photo.status === 'PENDING_UPLOAD' && <div className="bg-orange-500 text-white p-1 rounded-full animate-spin shadow-sm"><Loader2 size={8}/></div>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }} className="absolute top-1 right-1 bg-white/80 text-red-500 p-1.5 rounded-full shadow-sm hover:bg-white z-10"><X size={12} /></button>
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="text-white drop-shadow-md" size={24} />
                </div>
              </div>
            ))}
            {photos.length === 0 && (
              <div className={`col-span-3 border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${isDark ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'}`} onClick={() => fileInputRef.current?.click()}>
                <Camera size={32} className={`mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-gray-300'}`}/>
                <p className="text-xs text-gray-400 font-medium">Koppints a fotózáshoz</p>
              </div>
            )}
          </div>
        </section>

        <section>
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Diagnózis & Költség</h3>
           
           <div className="flex flex-wrap gap-2 mb-5">
              {quickActions.map((action, idx) => (
                <button key={idx} onClick={() => setDiagnosis(prev => prev ? prev + " " + action : action)} className={`px-4 py-2 border rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700 text-gray-300 hover:text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                  {action}
                </button>
              ))}
              <button onClick={() => setIsAddingAction(true)} className={`px-3 py-2 border-2 border-dashed rounded-full transition-all active:scale-95 ${isDark ? 'bg-slate-800 border-slate-600 text-gray-400' : 'bg-gray-50 border-gray-300 text-gray-400'}`}>
                <Plus size={16} />
              </button>
           </div>

           <div className="space-y-6">
             <div className="relative">
                <textarea 
                  value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                  className={`w-full border-0 rounded-2xl p-5 focus:ring-2 min-h-[140px] resize-none pb-14 text-lg shadow-inner ${isDark ? 'bg-slate-800 text-white focus:ring-blue-500' : 'bg-gray-50 text-gray-900 focus:ring-blue-500'}`}
                  placeholder="Hiba leírása..."
                />
                
                {isSpeechSupported && (
                    <button onClick={startDictation} className={`absolute bottom-3 left-3 p-2.5 rounded-full transition-all shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse' : (isDark ? 'bg-slate-700 text-gray-300' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200')}`} title="Hangalapú bevitel">
                    <Mic size={18} />
                    </button>
                )}

                <button onClick={handleBeautify} disabled={!isOnline || !diagnosis || isBeautifying} className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${isOnline && diagnosis ? 'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 active:scale-95' : (isDark ? 'bg-slate-700 text-gray-500 border-slate-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200')}`}>
                  {isBeautifying ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />}
                  {isOnline ? 'AI Szépítés' : 'Offline'}
                </button>
             </div>

             <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <button onClick={() => setUseBreakdown(!useBreakdown)} className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-4 hover:text-gray-400 transition-colors">
                    {useBreakdown ? <ToggleRight size={24} style={{color: themeColor}}/> : <ToggleLeft size={24}/>}
                    Anyag + Munkadíj külön (Ajánlott)
                </button>

                {useBreakdown && (
                  <div className={`mb-4 text-[11px] p-3 rounded-xl border flex items-start gap-2 leading-relaxed ${isDark ? 'bg-yellow-900/20 border-yellow-900/50 text-yellow-500' : 'bg-yellow-50 text-yellow-800 border-yellow-100'}`}>
                    <Lightbulb size={16} className="shrink-0 mt-0.5" />
                    <span>TIPP: A bontott árajánlatokat (Anyag/Munkadíj) 30%-kal nagyobb arányban fogadják el alku nélkül.</span>
                  </div>
                )}

                {useBreakdown ? (
                    <div className="grid grid-cols-2 gap-3 mb-3 animate-fade-in-up">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Alkatrész</label>
                            <input type="text" value={partsCost} onChange={(e) => setPartsCost(formatCost(e.target.value))} placeholder="0" className={inputClass}/>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Munkadíj</label>
                            <input type="text" value={laborCost} onChange={(e) => setLaborCost(formatCost(e.target.value))} placeholder="0" className={inputClass}/>
                        </div>
                    </div>
                ) : null}

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Coins size={18}/></div>
                    <input type="text" value={estimatedCost} readOnly={useBreakdown} onChange={(e) => !useBreakdown && setEstimatedCost(formatCost(e.target.value))} placeholder="Várható költség (Ft)" className={`w-full border-0 rounded-xl py-4 pl-12 pr-4 font-mono font-bold text-xl focus:ring-2 ${isDark ? 'bg-slate-900 text-white focus:ring-blue-500' : 'bg-white text-gray-900 focus:ring-blue-500'} ${useBreakdown ? (isDark ? 'bg-slate-900/50 text-gray-500' : 'bg-gray-100 text-gray-500 cursor-not-allowed') : ''}`}/>
                    {useBreakdown && <div className="absolute right-4 top-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">ÖSSZESEN</div>}
                </div>
             </div>
           </div>

           {!generatedSms ? (
             <div className="mt-6 space-y-4">
                <button onClick={() => handleGenerateSMS('DIAGNOSIS')} disabled={!diagnosis || isProcessing} style={{backgroundColor: themeColor}} className={`w-full py-4 text-white rounded-xl font-bold shadow-xl transform transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2`}>
                  {isProcessing ? <><Loader2 size={20} className="animate-spin" /> {uploadProgress || 'SMS Tervezése...'}</> : 'SMS TERVEZÉS (Diagnózis)'}
                </button>
                <button onClick={() => { onUpdateClient({ ...client, status: 'FINISHED' }); handleGenerateSMS('FINISHED'); }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-xl shadow-emerald-200/50 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <CheckCircle size={20} /> AUTÓ KÉSZ (Átvétel)
                </button>
             </div>
           ) : (
             <div className="mt-8 animate-fade-in-up">
               <div className={`border-2 rounded-3xl p-6 relative shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                 <p className={`mt-2 text-lg font-medium leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>"{generatedSms}"</p>
                 <div className="mt-6 flex gap-3">
                   <button onClick={() => setGeneratedSms('')} className={`flex-1 py-3 rounded-xl font-bold text-sm ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-50 text-gray-500'}`}>Mégsem</button>
                   <button onClick={sendSMS} style={{backgroundColor: themeColor}} className={`flex-1 py-3 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform`}>
                     <Send size={16} /> KÜLDÉS
                   </button>
                 </div>
               </div>
             </div>
           )}
        </section>
      </div>

      {isAddingAction && <AddActionModal onClose={() => setIsAddingAction(false)} onSave={handleSaveNewAction} isOnline={isOnline} themeColor={themeColor} isDark={isDark} />}
      {previewPhotoUrl && <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-fade-in-up" onClick={() => setPreviewPhotoUrl(null)}><button className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full hover:bg-white/40"><X size={32}/></button><img src={previewPhotoUrl} className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} /></div>}
    </div>
  );
};

// --- 5. APP COMPONENT ---

const App = () => {
  const [settings, setSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem('auto_settings');
    return saved ? JSON.parse(saved) : null;
  });

  const [clients, setClients] = useState<ClientData[]>(() => {
    const saved = localStorage.getItem('auto_clients');
    return saved ? JSON.parse(saved) : [];
  });

  const [quickActions, setQuickActions] = useState<string[]>(() => {
    const saved = localStorage.getItem('auto_actions');
    return saved ? JSON.parse(saved) : ["Olajcsere esedékes", "Fékbetét kopott, csere javasolt", "Műszaki vizsga hamarosan lejár", "Akkumulátor gyenge, cserélni kell"];
  });

  const [currentView, setCurrentView] = useState<ViewState>(settings ? 'DASHBOARD' : 'ONBOARDING');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [clientToStart, setClientToStart] = useState<ClientData | null>(null); 
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBackupReminder, setShowBackupReminder] = useState(false); // NEW

  useEffect(() => {
    if (settings) localStorage.setItem('auto_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('auto_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('auto_actions', JSON.stringify(quickActions));
  }, [quickActions]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const theme = THEMES['orange']; 

  const handleOnboardingComplete = (newSettings: ShopSettings) => {
    setSettings({...newSettings, clientCountSinceBackup: 0});
    setCurrentView('DASHBOARD');
  };

  const handleAddClient = (data: any) => {
    const newClient: ClientData = {
      id: Date.now().toString(),
      ...data,
      photos: [],
      status: 'ACTIVE',
      createdAt: Date.now()
    };
    setClients([newClient, ...clients]);
    setCurrentView('DASHBOARD');
    
    // BACKUP LOGIC: Increment count and check
    if (settings) {
      const newCount = (settings.clientCountSinceBackup || 0) + 1;
      setSettings({...settings, clientCountSinceBackup: newCount});
      if (newCount >= 5) {
        setShowBackupReminder(true);
      }
    }
  };

  const handleDeleteClient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClientToDelete(id);
  };

  const handleQuickStartSMS = (client: ClientData, e: React.MouseEvent) => {
    e.stopPropagation();
    setClientToStart(client);
  };

  const executeDelete = () => {
    if (clientToDelete) {
      setClients(clients.filter(c => c.id !== clientToDelete));
      if (selectedClientId === clientToDelete) {
        setSelectedClientId(null);
        setCurrentView('DASHBOARD');
      }
      setClientToDelete(null);
    }
  };

  const handleUpdateClient = (updatedClient: ClientData) => {
    setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(clients));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `szerviz_mentes_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    // Reset backup counter
    if (settings) {
      setSettings({...settings, clientCountSinceBackup: 0});
      setShowBackupReminder(false);
    }
  };

  const handleImportData = (importedClients: ClientData[], merge: boolean) => {
    if (merge) {
      const existingIds = new Set(clients.map(c => c.id));
      const newClients = importedClients.filter(c => !existingIds.has(c.id));
      setClients([...clients, ...newClients]);
    } else {
      setClients(importedClients);
    }
  };

  const activeClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className={`min-h-screen font-sans selection:bg-orange-100 ${settings?.darkMode ? 'bg-slate-900 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
      {!isOnline && (
        <div className="bg-amber-100 text-amber-800 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 border-b border-amber-200 sticky top-0 z-50">
          <WifiOff size={14} /> OFFLINE MÓD - A képek nem kerülnek feltöltésre (AI inaktív)!
        </div>
      )}

      {currentView === 'ONBOARDING' && <OnboardingScreen onComplete={handleOnboardingComplete} />}

      {currentView === 'DASHBOARD' && settings && (
        <DashboardScreen 
          settings={settings}
          theme={theme}
          clients={clients} 
          onAdd={() => setCurrentView('INTAKE')}
          onOpen={(id) => { setSelectedClientId(id); setCurrentView('WORKSHOP'); }}
          onDelete={handleDeleteClient}
          onStart={handleQuickStartSMS}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
      )}

      {currentView === 'INTAKE' && settings && <IntakeScreen themeColor={settings.themeColor} isDark={settings.darkMode} theme={theme} onSave={handleAddClient} onCancel={() => setCurrentView('DASHBOARD')} />}

      {currentView === 'WORKSHOP' && activeClient && theme && settings && (
        <WorkshopScreen client={activeClient} themeColor={settings.themeColor} isDark={settings.darkMode} theme={theme} isOnline={isOnline} onUpdateClient={handleUpdateClient} onBack={() => { setSelectedClientId(null); setCurrentView('DASHBOARD'); }} quickActions={quickActions} setQuickActions={setQuickActions} shopName={settings.shopName} />
      )}

      {clientToStart && settings && <StartRepairModal client={clientToStart} shopName={settings.shopName} onClose={() => setClientToStart(null)} isDark={settings.darkMode} />}

      {clientToDelete && theme && settings && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div className={`${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-3xl p-6 max-w-sm w-full shadow-2xl border`}>
            <h3 className={`text-xl font-bold mb-2 text-center ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>Munkalap törlése</h3>
            <p className={`mb-8 text-center text-sm ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Biztosan törlöd? Nem visszavonható.</p>
            <div className="flex gap-3">
              <button onClick={() => setClientToDelete(null)} className={`flex-1 py-4 rounded-xl font-bold ${settings.darkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Mégsem</button>
              <button onClick={executeDelete} className="flex-1 py-4 bg-red-500 text-white rounded-xl font-bold shadow-lg">Törlés</button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && theme && settings && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} theme={theme} onExport={handleExportData} onImport={handleImportData} quickActions={quickActions} setQuickActions={setQuickActions} isOnline={isOnline} settings={settings} onUpdateSettings={setSettings} />
      )}

      {/* BACKUP REMINDER MODAL */}
      {showBackupReminder && theme && (
        <BackupReminderModal onClose={() => setShowBackupReminder(false)} onExport={handleExportData} theme={theme} />
      )}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);