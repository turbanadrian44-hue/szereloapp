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
  MessageSquare
} from 'lucide-react';

// --- Configuration ---
const CLOUDINARY_CLOUD_NAME = 'dagkl5gci';
const CLOUDINARY_UPLOAD_PRESET = 'Autószervíz';

// --- Theme System ---
const THEMES: Record<string, ThemeConfig> = {
  orange: { name: 'GumiAbroncs Narancs', bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-200', light: 'bg-orange-50', hover: 'hover:bg-orange-600', ring: 'focus:ring-orange-500', shadow: 'shadow-orange-200' },
  blue: { name: 'Royal Kék', bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50', hover: 'hover:bg-blue-700', ring: 'focus:ring-blue-600', shadow: 'shadow-blue-200' },
  green: { name: 'Eco Zöld', bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50', hover: 'hover:bg-emerald-700', ring: 'focus:ring-emerald-600', shadow: 'shadow-emerald-200' },
  slate: { name: 'Prémium Szürke', bg: 'bg-slate-800', text: 'text-slate-800', border: 'border-slate-200', light: 'bg-slate-100', hover: 'hover:bg-slate-900', ring: 'focus:ring-slate-800', shadow: 'shadow-slate-200' },
};

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

// --- Types ---

type ClientStatus = 'ACTIVE' | 'FINISHED';
type SmsType = 'DIAGNOSIS' | 'FINISHED' | 'START';

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
}

type ViewState = 'ONBOARDING' | 'DASHBOARD' | 'INTAKE' | 'WORKSHOP';

// --- AI Configuration ---
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

// Modified SMS Generator
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
      // Detailed Breakdown
      costSection = ` A várható költségek: Alkatrész: ${(partsCost || 0).toLocaleString('hu-HU')} Ft, Munkadíj: ${(laborCost || 0).toLocaleString('hu-HU')} Ft. Összesen: ${costStr} Ft.`;
    } else {
      // Simple Total
      costSection = ` A javítás várható költsége: ${costStr} Ft.`;
    }
  }

  let sms = '';

  if (type === 'DIAGNOSIS') {
    sms = `Üdvözlöm! Átvizsgáltuk a ${plate} autóját a ${shopName}-nél. A következő beavatkozás szükséges: ${diagnosis}.${costSection} Kérjük, válasz SMS-ben jelezze, hogy elfogadja-e a javítást!`;
  } else if (type === 'FINISHED') {
    // FINISHED Template - Now includes PRICE
    const priceText = cost ? ` A fizetendő végösszeg: ${costStr} Ft.` : '';
    sms = `Tisztelt Ügyfelünk! A ${plate} rendszámú autója elkészült, a javítás befejeződött a ${shopName}-nél.${priceText} Várjuk szervizünkben, az autó átvehető. Üdvözlettel!`;
  } else if (type === 'START') {
    // START Template
    sms = `Tisztelt Ügyfelünk! Tájékoztatjuk, hogy a ${plate} rendszámú autóján a javítási munkálatokat megkezdtük a ${shopName}-nél. Amint elkészül, azonnal értesítjük.`;
  }

  if (photoUrls.length > 0 && type === 'DIAGNOSIS') {
    sms += `\n\nFotók a munkáról:\n${photoUrls.join('\n')}`;
  }

  return sms;
};

const uploadImageToCloudinary = async (photo: PhotoEvidence): Promise<string | null> => {
  if (photo.cloudUrl) return photo.cloudUrl;
  
  if (photo.url.startsWith('http') && !photo.url.startsWith('blob:')) {
    return photo.url;
  }

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

// --- Input Formatters ---

const formatLicensePlate = (value: string) => {
  let clean = value.toUpperCase();
  if (/^[A-Z0-9]{6}$/.test(clean)) {
     return `${clean.slice(0,3)}-${clean.slice(3)}`;
  }
  return clean;
};

const formatPhoneNumber = (value: string) => {
  return value.replace(/[^\d+ ]/g, '');
};

const formatCost = (value: string) => {
  const number = parseInt(value.replace(/\D/g, '')) || 0;
  return number === 0 ? '' : number.toLocaleString('hu-HU');
};

const parseCost = (value: string) => {
  return parseInt(value.replace(/\D/g, '')) || 0;
}

// --- SUB-COMPONENTS (Defined BEFORE App to fix ReferenceError) ---

// --- Component: Start Repair Modal (NEW) ---
const StartRepairModal = ({ 
  client, shopName, onClose 
}: { 
  client: ClientData, shopName: string, onClose: () => void 
}) => {
  const smsText = generateStaticSms('START', '', client.licensePlate, undefined, undefined, undefined, false, [], shopName);

  const handleSend = () => {
    const link = `sms:${client.phone}?body=${encodeURIComponent(smsText)}`;
    window.location.href = link;
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 border border-gray-100">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <MessageSquare size={32} />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Javítás Megkezdése</h3>
        <p className="text-sm text-gray-500 mb-4 text-center">
          Az alábbi SMS-t küldjük az ügyfélnek:
        </p>
        
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 relative">
          <p className="text-gray-800 text-sm font-medium italic">"{smsText}"</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Mégse</button>
          <button onClick={handleSend} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
            <Send size={16} /> Küldés
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Component: Settings Modal ---
const SettingsModal = ({ 
  onClose, theme, onExport, quickActions, setQuickActions, isOnline 
}: { 
  onClose: () => void, 
  theme: ThemeConfig, 
  onExport: () => void,
  quickActions: string[],
  setQuickActions: (a: string[]) => void,
  isOnline: boolean
}) => {
  const [newAction, setNewAction] = useState('');
  const [isImproving, setIsImproving] = useState(false);

  const handleDeleteAction = (index: number) => {
    setQuickActions(quickActions.filter((_, i) => i !== index));
  };

  const handleAddAction = () => {
    if (newAction.trim()) {
      setQuickActions([...quickActions, newAction.trim()]);
      setNewAction('');
    }
  };

  const handleImproveAction = async () => {
    if (!newAction.trim() || !isOnline) return;
    setIsImproving(true);
    const improved = await improveTemplateText(newAction);
    setNewAction(improved);
    setIsImproving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold">Beállítások</h3>
          <button onClick={onClose}><X size={24}/></button>
        </div>
        
        <div className="p-6 overflow-y-auto dark-scroll">
          
          <div className="mb-8">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Edit3 size={14}/> Gyors Sablonok
            </h4>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Új sablon..."
                className={`flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ${theme.ring}`}
                value={newAction}
                onChange={e => setNewAction(e.target.value)}
              />
              <button 
                onClick={handleImproveAction}
                disabled={!isOnline || !newAction || isImproving}
                className={`p-3 rounded-xl transition-all ${isOnline && newAction ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : 'bg-gray-100 text-gray-400'}`}
              >
                {isImproving ? <Loader2 size={20} className="animate-spin"/> : <Sparkles size={20} />}
              </button>
              <button 
                onClick={handleAddAction}
                disabled={!newAction}
                className={`p-3 text-white rounded-xl disabled:opacity-50 ${theme.bg}`}
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {quickActions.map((action, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-sm font-medium text-gray-700">{action}</span>
                  <button onClick={() => handleDeleteAction(idx)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 my-4"></div>

          <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck size={14}/> Adatok Védelme
              </h4>
              <button 
              onClick={onExport}
              className={`w-full py-3 ${theme.bg} text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg mb-3`}
              >
                <Download size={18} /> Biztonsági Mentés
              </button>
              <p className="text-xs text-gray-400 text-center">
                Tipp: Küldd el magadnak emailben a letöltött fájlt!
              </p>
          </div>

          <div className="border-t border-gray-100 my-6"></div>

          <button 
            onClick={() => {
              if(confirm("Minden adat törlődik! Biztos?")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50"
          >
            App Visszaállítása (Minden törlése)
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Component: Add Action Modal ---
const AddActionModal = ({ 
  onClose, onSave, isOnline, theme 
}: { 
  onClose: () => void, onSave: (text: string) => void, isOnline: boolean, theme: ThemeConfig
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
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Új Sablon Hozzáadása</h3>
          <button onClick={onClose}><X size={24}/></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Írd be a rövid diagnózist.</p>
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Pl. kormánymű kopog..."
            className={`flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ${theme.ring}`}
            value={newAction}
            onChange={e => setNewAction(e.target.value)}
            autoFocus
          />
          <button 
            onClick={handleImproveAction}
            disabled={!isOnline || !newAction || isImproving}
            className={`p-3 rounded-xl transition-all ${isOnline && newAction ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : 'bg-gray-100 text-gray-400'}`}
          >
            {isImproving ? <Loader2 size={20} className="animate-spin"/> : <Sparkles size={20} />}
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Mégse</button>
          <button onClick={() => { if (newAction.trim()) onSave(newAction.trim()); }} disabled={!newAction} className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 ${theme.bg}`}>Mentés</button>
        </div>
      </div>
    </div>
  );
};

// --- Screen: Onboarding ---
const OnboardingScreen = ({ onComplete }: { onComplete: (s: ShopSettings) => void }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('orange');

  return (
    <div className="min-h-screen bg-white p-8 flex flex-col justify-center max-w-md mx-auto animate-fade-in-up">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Üdvözöllek! 👋</h1>
        <p className="text-gray-500">Állítsuk be a szervized arculatát.</p>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Szerviz Neve</label>
          <input type="text" placeholder="Pl. GumiAbroncs KFT." className="block w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 text-xl font-bold text-center" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">Válassz Színtémát</label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(THEMES).map(([key, theme]) => (
              <button key={key} onClick={() => setColor(key)} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${color === key ? `border-${key === 'orange' ? 'orange' : key === 'blue' ? 'blue' : key === 'green' ? 'emerald' : 'slate'}-500 bg-gray-50` : 'border-gray-100'}`}>
                <div className={`w-8 h-8 rounded-full ${theme.bg}`}></div>
                <span className="text-xs font-bold text-gray-600">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => name && onComplete({ shopName: name, themeColor: color })} disabled={!name} className={`w-full py-4 rounded-xl font-bold text-white shadow-xl mt-8 transition-all ${name ? THEMES[color].bg : 'bg-gray-300'}`}>Kész, Indulás!</button>
      </div>
    </div>
  );
};

// --- Screen: Dashboard ---
const DashboardScreen = ({ 
  clients, onAdd, onOpen, onDelete, onStart, onOpenSettings, settings, theme 
}: { 
  clients: ClientData[], onAdd: () => void, onOpen: (id: string) => void, onDelete: any, onStart: (client: ClientData, e: React.MouseEvent) => void, onOpenSettings: any, settings: ShopSettings, theme: ThemeConfig
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
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
    <div className="max-w-xl mx-auto min-h-screen p-6 animate-fade-in-up pb-20">
      <div className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{settings.shopName}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
             <CheckCircle size={14} className="text-emerald-500"/> 
             <span>Heti elkészült autók: <b>{weeklyFinished} db</b></span>
          </div>
        </div>
        <button onClick={onOpenSettings} className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-400 hover:text-gray-600">
          <Settings size={20} />
        </button>
      </div>

      {/* TIP Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
        <Lightbulb size={20} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 leading-relaxed font-medium">
          <span className="font-bold">TIPP:</span> A köztes státuszüzenetek ('Javítás Megkezdése') statisztikailag felére csökkentik a türelmetlen telefonhívásokat és növelik a szerviz szakmai megítélését.
        </p>
      </div>

      <button onClick={onAdd} className={`w-full mb-6 ${theme.bg} ${theme.hover} text-white py-4 rounded-2xl font-bold shadow-xl ${theme.shadow} transform transition active:scale-95 flex items-center justify-center gap-2`}>
        <Plus size={20} /> ÚJ AUTÓ FELVÉTELE
      </button>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Keresés rendszám vagy név alapján..." 
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {sortedClients.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Car size={48} className="mx-auto mb-4 opacity-20" />
            <p>{searchTerm ? 'Nincs találat.' : 'Nincs rögzített autó.'}</p>
          </div>
        ) : (
          sortedClients.map(client => (
            <div key={client.id} className={`relative bg-white rounded-2xl border transition-all hover:shadow-md overflow-hidden ${client.status === 'FINISHED' ? 'border-gray-100 opacity-70' : 'border-gray-200 shadow-sm'} ${client.isUrgent && client.status === 'ACTIVE' ? 'ring-2 ring-red-100 border-red-200' : ''}`}>
              {client.isUrgent && client.status === 'ACTIVE' && (
                <div className="bg-red-50 text-red-500 text-[10px] font-bold px-3 py-1 flex items-center gap-1 border-b border-red-100">
                  <Flame size={12} fill="currentColor" /> SÜRGŐS
                </div>
              )}
              <div onClick={() => onOpen(client.id)} className="p-5 flex items-start gap-4 cursor-pointer">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${client.status === 'FINISHED' ? 'bg-emerald-100 text-emerald-600' : theme.light + ' ' + theme.text}`}>
                  {client.status === 'FINISHED' ? <Check size={24} /> : client.licensePlate.substring(0, 2)}
                </div>
                <div className="flex-1 pr-24">
                  <h3 className="font-bold text-lg text-gray-900 font-mono">{client.licensePlate}</h3>
                  <p className="text-sm text-gray-500 font-medium">{client.name}</p>
                </div>
              </div>
              
              {/* Quick Actions for Active Clients */}
              {client.status === 'ACTIVE' && (
                <button 
                  onClick={(e) => onStart(client, e)}
                  className="absolute top-4 right-14 p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors z-20 active:scale-95 flex items-center gap-1"
                  title="Javítás indítása SMS"
                >
                  <Wrench size={16} /> <span className="text-[10px] font-bold">MEGKEZDÉS</span>
                </button>
              )}

              <button onClick={(e) => onDelete(client.id, e)} className="absolute top-4 right-2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-20 active:scale-95">
                <Trash2 size={18} className="pointer-events-none" />
              </button>

              {client.status === 'FINISHED' && (
                <div className="absolute bottom-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-tl-xl pointer-events-none flex items-center gap-1">
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

// --- Screen: Intake ---
const IntakeScreen = ({ onSave, onCancel, theme }: { onSave: (data: any) => void, onCancel: () => void, theme: ThemeConfig }) => {
  const [formData, setFormData] = useState({
    name: '',
    licensePlate: '',
    phone: '+36 ',
    isUrgent: false,
    gdprAccepted: false
  });

  const isValid = formData.name && formData.licensePlate.length >= 3 && formData.phone.length > 7 && formData.gdprAccepted;

  return (
    <div className="max-w-md mx-auto p-6 min-h-screen flex flex-col justify-center animate-fade-in-up">
      <button onClick={onCancel} className="absolute top-6 left-6 p-2 text-gray-400 hover:text-gray-900"><X size={24} /></button>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Új Ügyfél</h2>
        <p className="text-gray-500 mt-1">Adatok rögzítése</p>
      </div>
      <div className="space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Rendszám</label>
          <input type="text" placeholder="AA-AA-123" className={`block w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 ${theme.ring} text-xl font-mono uppercase text-center tracking-widest`} value={formData.licensePlate} onChange={e => setFormData({...formData, licensePlate: formatLicensePlate(e.target.value)})} />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Ügyfél Neve</label>
            <input type="text" placeholder="Név" className={`block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 ${theme.ring}`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Telefonszám</label>
            <input type="tel" placeholder="+36 30..." className={`block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 ${theme.ring}`} value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhoneNumber(e.target.value)})} />
          </div>
        </div>
        <div className="space-y-3 pt-2">
           <label className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 accent-red-500" checked={formData.isUrgent} onChange={e => setFormData({...formData, isUrgent: e.target.checked})} />
              <span className="text-sm font-bold text-red-700">Sürgős munka!</span>
           </label>
           <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
              <input type="checkbox" className={`w-5 h-5 mt-0.5 accent-${theme.bg.split('-')[1]}-500`} checked={formData.gdprAccepted} onChange={e => setFormData({...formData, gdprAccepted: e.target.checked})} />
              <span className="text-xs text-gray-500">Kijelentem, hogy az ügyfél hozzájárult az adatai és a fotók kezeléséhez a javítás idejére. (GDPR)</span>
           </label>
        </div>
        <button onClick={() => isValid && onSave(formData)} disabled={!isValid} className={`w-full mt-6 py-4 text-white rounded-xl font-bold shadow-lg transform transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${theme.bg} ${theme.shadow}`}>MENTÉS ÉS TOVÁBB <ChevronRight size={20} /></button>
      </div>
    </div>
  );
};

// --- Screen: Workshop ---
const WorkshopScreen = ({ 
  client, isOnline, onBack, onUpdateClient, quickActions, setQuickActions, theme, shopName
}: { 
  client: ClientData, isOnline: boolean, onBack: () => void, onUpdateClient: (c: ClientData) => void, quickActions: string[], setQuickActions: any, theme: ThemeConfig, shopName: string
}) => {
  const [diagnosis, setDiagnosis] = useState('');
  
  // Pricing State
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
  const [isSpeechSupported, setIsSpeechSupported] = useState(false); // Check support
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const photos = client.photos;

  useEffect(() => {
    // Check speech support on mount
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSpeechSupported(true);
    }
  }, []);

  // Auto-calculate Total Cost when in Breakdown mode
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
      
      // Trigger upload IMMEDIATELY in background
      if (isOnline) {
        processPhotoUploads(updatedClient.photos);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeletePhoto = (photoId: string) => {
    onUpdateClient({ ...client, photos: photos.filter(p => p.id !== photoId) });
  };

  const processPhotoUploads = async (currentPhotos: PhotoEvidence[] = photos): Promise<string[]> => {
    if (!isOnline) return [];
    
    // Filter pending
    const pendingPhotos = currentPhotos.filter(p => !p.cloudUrl);
    
    // If nothing pending, return existing cloud URLs
    if (pendingPhotos.length === 0) {
        return currentPhotos.map(p => p.cloudUrl).filter(Boolean) as string[];
    }

    setUploadProgress(`Képek feltöltése...`);
    let updatedPhotos = [...currentPhotos];

    for (const photo of pendingPhotos) {
      const cloudUrl = await uploadImageToCloudinary(photo);
      if (cloudUrl) {
          updatedPhotos = updatedPhotos.map(p => p.id === photo.id ? { ...p, cloudUrl, status: 'UPLOADED' } : p);
          // Update client state progressively so UI reflects uploaded status
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

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleGenerateSMS = async (type: SmsType) => {
    if (type === 'DIAGNOSIS' && !diagnosis) return;
    setIsProcessing(true);
    
    const numericCost = parseCost(estimatedCost);
    const numericLabor = parseCost(laborCost);
    const numericParts = parseCost(partsCost);

    // Update Client Data with Costs
    onUpdateClient({ 
        ...client, 
        estimatedCost: numericCost,
        laborCost: numericLabor,
        partsCost: numericParts,
        useBreakdown: useBreakdown
    });

    // Ensure uploads are done (usually they are already done in background)
    let photoUrls: string[] = [];
    if (isOnline) {
       photoUrls = await processPhotoUploads(client.photos);
    }
    
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

  return (
    <div className="max-w-xl mx-auto min-h-screen bg-white flex flex-col pb-10">
      <div className="bg-white/90 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 font-mono tracking-tight leading-none">{client.licensePlate}</h2>
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
            <button onClick={() => fileInputRef.current?.click()} className={`bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg`}>
              <Camera size={16} /> FOTÓ / GALÉRIA
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {photos.map(photo => (
              <div key={photo.id} className="aspect-square rounded-2xl overflow-hidden relative shadow-sm bg-gray-50 border border-gray-100 group cursor-pointer" onClick={() => setPreviewPhotoUrl(photo.url)}>
                <img src={photo.url} className="w-full h-full object-cover" />
                
                {/* Upload Indicator */}
                <div className="absolute bottom-1 left-1">
                    {photo.status === 'UPLOADED' && <div className="bg-emerald-500 text-white p-1 rounded-full"><Check size={8}/></div>}
                    {photo.status === 'PENDING_UPLOAD' && <div className="bg-orange-500 text-white p-1 rounded-full animate-spin"><Loader2 size={8}/></div>}
                </div>

                <button onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }} className="absolute top-1 right-1 bg-white/80 text-red-500 p-1 rounded-full shadow-sm hover:bg-white z-10"><X size={12} /></button>
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="text-white drop-shadow-md" size={24} />
                </div>
              </div>
            ))}
            {photos.length === 0 && (
              <div className="col-span-3 border-2 border-dashed border-gray-100 rounded-2xl p-8 text-center bg-gray-50/50">
                <p className="text-xs text-gray-400">Nincs kép csatolva</p>
              </div>
            )}
          </div>
        </section>

        <section>
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Diagnózis & Költség</h3>
           
           <div className="flex flex-wrap gap-2 mb-5">
              {quickActions.map((action, idx) => (
                <button key={idx} onClick={() => setDiagnosis(prev => prev ? prev + " " + action : action)} className={`px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-700 hover:${theme.border} hover:${theme.text} transition-all active:scale-95`}>
                  {action}
                </button>
              ))}
              <button onClick={() => setIsAddingAction(true)} className="px-3 py-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded-full text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all">
                <Plus size={16} />
              </button>
           </div>

           <div className="space-y-6">
             <div className="relative">
                <textarea 
                  value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                  className={`w-full bg-gray-50 border-0 rounded-2xl p-5 text-gray-900 focus:ring-2 ${theme.ring} min-h-[120px] resize-none pb-12 text-lg`}
                  placeholder="Hiba leírása..."
                />
                
                {isSpeechSupported && (
                    <button 
                    onClick={startDictation}
                    className={`absolute bottom-3 left-3 p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    title="Hangalapú bevitel"
                    >
                    <Mic size={18} />
                    </button>
                )}

                <button 
                  onClick={handleBeautify}
                  disabled={!isOnline || !diagnosis || isBeautifying}
                  className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                    ${isOnline && diagnosis 
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md hover:scale-105 active:scale-95' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                  `}
                >
                  {isBeautifying ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
                  {isOnline ? 'AI Szépítés' : 'Offline'}
                </button>
             </div>

             {/* PRICING SECTION */}
             <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <button 
                    onClick={() => setUseBreakdown(!useBreakdown)}
                    className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-4 hover:text-gray-800 transition-colors"
                >
                    {useBreakdown ? <ToggleRight size={20} className="text-orange-500"/> : <ToggleLeft size={20}/>}
                    Anyag + Munkadíj külön (Ajánlott)
                </button>

                {/* TIP for breakdown */}
                {useBreakdown && (
                  <div className="mb-4 bg-yellow-50 text-yellow-700 text-[10px] p-2 rounded-lg border border-yellow-100 flex items-start gap-2">
                    <Lightbulb size={14} className="shrink-0 mt-0.5" />
                    <span>TIPP: A bontott árajánlatokat (Anyag/Munkadíj) 30%-kal nagyobb arányban fogadják el alku nélkül.</span>
                  </div>
                )}

                {useBreakdown ? (
                    <div className="grid grid-cols-2 gap-3 mb-3 animate-fade-in-up">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Alkatrész</label>
                            <input 
                                type="text" 
                                value={partsCost}
                                onChange={(e) => setPartsCost(formatCost(e.target.value))}
                                placeholder="0"
                                className="w-full bg-white border border-gray-200 rounded-xl py-3 px-3 text-gray-900 font-mono font-bold text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Munkadíj</label>
                            <input 
                                type="text" 
                                value={laborCost}
                                onChange={(e) => setLaborCost(formatCost(e.target.value))}
                                placeholder="0"
                                className="w-full bg-white border border-gray-200 rounded-xl py-3 px-3 text-gray-900 font-mono font-bold text-sm"
                            />
                        </div>
                    </div>
                ) : null}

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Coins size={18}/></div>
                    <input 
                    type="text" 
                    value={estimatedCost}
                    readOnly={useBreakdown}
                    onChange={(e) => !useBreakdown && setEstimatedCost(formatCost(e.target.value))}
                    placeholder="Várható költség (Ft)"
                    className={`w-full bg-white border-0 rounded-xl py-4 pl-12 pr-4 text-gray-900 focus:ring-2 ${theme.ring} font-mono font-bold text-xl ${useBreakdown ? 'bg-gray-100 text-gray-500' : ''}`}
                    />
                    {useBreakdown && <div className="absolute right-4 top-4 text-xs text-gray-400 font-bold">ÖSSZESEN</div>}
                </div>
             </div>
           </div>

           {!generatedSms ? (
             <div className="mt-6 space-y-4">
                <button 
                  onClick={() => handleGenerateSMS('DIAGNOSIS')}
                  disabled={!diagnosis || isProcessing}
                  className={`w-full py-4 text-white rounded-xl font-bold shadow-xl transform transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${theme.bg} ${theme.shadow}`}
                >
                  {isProcessing ? <><Loader2 size={20} className="animate-spin" /> {uploadProgress || 'SMS Tervezése...'}</> : 'SMS TERVEZÉS (Diagnózis)'}
                </button>
                <button 
                  onClick={() => { 
                    onUpdateClient({ ...client, status: 'FINISHED' }); 
                    handleGenerateSMS('FINISHED'); 
                  }} 
                  className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-xl flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} /> AUTÓ KÉSZ (Átvétel)
                </button>
             </div>
           ) : (
             <div className="mt-8 animate-fade-in-up">
               <div className={`bg-white border-2 ${theme.border} rounded-3xl p-6 relative shadow-sm`}>
                 <p className="mt-2 text-gray-800 text-lg font-medium leading-relaxed whitespace-pre-wrap">"{generatedSms}"</p>
                 <div className="mt-6 flex gap-3">
                   <button onClick={() => setGeneratedSms('')} className="flex-1 py-3 bg-gray-50 text-gray-500 rounded-xl font-bold text-sm">Mégsem</button>
                   <button onClick={sendSMS} className={`flex-1 py-3 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 ${theme.bg} ${theme.shadow}`}>
                     <Send size={16} /> KÜLDÉS
                   </button>
                 </div>
               </div>
             </div>
           )}
        </section>
      </div>

      {isAddingAction && (
        <AddActionModal 
          onClose={() => setIsAddingAction(false)}
          onSave={handleSaveNewAction}
          isOnline={isOnline}
          theme={theme}
        />
      )}

      {/* Lightbox Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-fade-in-up" onClick={() => setPreviewPhotoUrl(null)}>
          <button className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full hover:bg-white/40"><X size={32}/></button>
          <img src={previewPhotoUrl} className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

// --- App Component (Moved to end) ---

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
    return saved ? JSON.parse(saved) : [
      "Olajcsere esedékes",
      "Fékbetét kopott, csere javasolt",
      "Műszaki vizsga hamarosan lejár",
      "Akkumulátor gyenge, cserélni kell"
    ];
  });

  const [currentView, setCurrentView] = useState<ViewState>(settings ? 'DASHBOARD' : 'ONBOARDING');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [clientToStart, setClientToStart] = useState<ClientData | null>(null); // New state for Start Modal
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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

  const theme = THEMES[settings?.themeColor || 'orange'];

  const handleOnboardingComplete = (newSettings: ShopSettings) => {
    setSettings(newSettings);
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
  };

  const handleDeleteClient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClientToDelete(id);
  };

  const handleQuickStartSMS = (client: ClientData, e: React.MouseEvent) => {
    e.stopPropagation();
    // Instead of sending immediately, we set the client to start, which triggers the modal
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
  };

  const activeClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-orange-100">
      {!isOnline && (
        <div className="bg-amber-100 text-amber-800 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 border-b border-amber-200 sticky top-0 z-50">
          <WifiOff size={14} /> OFFLINE MÓD - A képek nem kerülnek feltöltésre (AI inaktív)!
        </div>
      )}

      {currentView === 'ONBOARDING' && (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      )}

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

      {currentView === 'INTAKE' && theme && (
        <IntakeScreen 
          theme={theme}
          onSave={handleAddClient} 
          onCancel={() => setCurrentView('DASHBOARD')} 
        />
      )}

      {currentView === 'WORKSHOP' && activeClient && theme && settings && (
        <WorkshopScreen 
          client={activeClient} 
          theme={theme}
          isOnline={isOnline} 
          onUpdateClient={handleUpdateClient}
          onBack={() => { setSelectedClientId(null); setCurrentView('DASHBOARD'); }}
          quickActions={quickActions}
          setQuickActions={setQuickActions}
          shopName={settings.shopName}
        />
      )}

      {/* Start Repair Modal (NEW) */}
      {clientToStart && settings && (
        <StartRepairModal 
          client={clientToStart}
          shopName={settings.shopName}
          onClose={() => setClientToStart(null)}
        />
      )}

      {clientToDelete && theme && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Munkalap törlése</h3>
            <p className="text-gray-500 mb-8 text-center text-sm">Biztosan törlöd? Nem visszavonható.</p>
            <div className="flex gap-3">
              <button onClick={() => setClientToDelete(null)} className="flex-1 py-4 bg-gray-100 rounded-xl font-bold">Mégsem</button>
              <button onClick={executeDelete} className="flex-1 py-4 bg-red-500 text-white rounded-xl font-bold shadow-lg">Törlés</button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && theme && (
        <SettingsModal 
          onClose={() => setShowSettingsModal(false)}
          theme={theme}
          onExport={handleExportData}
          quickActions={quickActions}
          setQuickActions={setQuickActions}
          isOnline={isOnline}
        />
      )}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);