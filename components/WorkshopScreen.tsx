import React, { useState, useEffect, useRef } from 'react';
import { 
  X, CheckCircle, Camera, Check, Loader2, Maximize2, Mic, Sparkles, Lock, ToggleRight, ToggleLeft, Lightbulb, Coins, Send, Plus
} from 'lucide-react';
import { ClientData, PhotoEvidence, ShopSettings, ThemeConfig, SmsType } from '../types';
import { beautifyDiagnosisText, generateStaticSms } from '../aiService';
import { uploadImageToCloudinary, formatCost, parseCost } from '../utils';
import { AddActionModal } from './Modals';

export const WorkshopScreen = ({ 
  client, isOnline, onBack, onUpdateClient, quickActions, setQuickActions, themeColor, shopName, isDark, settings, onShowSales
}: { 
  client: ClientData, isOnline: boolean, onBack: () => void, onUpdateClient: (c: ClientData) => void, quickActions: string[], setQuickActions: any, themeColor: string, shopName: string, isDark: boolean, settings: ShopSettings, onShowSales: (feat: 'LOGO' | 'AI' | 'LIMIT') => void
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
    if (!settings.isPro) {
      onShowSales('AI');
      return;
    }
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

                <button 
                  onClick={handleBeautify}
                  disabled={!isOnline || !diagnosis || isBeautifying}
                  className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm
                    ${isOnline && diagnosis && settings.isPro
                      ? 'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 active:scale-95' 
                      : (isDark ? 'bg-slate-700 text-gray-500 border-slate-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200')}
                  `}
                >
                  {!settings.isPro ? <Lock size={14}/> : (isBeautifying ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />)}
                  {settings.isPro ? (isOnline ? 'AI Szépítés' : 'Offline') : 'AI (PRO)'}
                </button>
             </div>

             {/* PRICING SECTION */}
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

      {isAddingAction && (
        <AddActionModal 
          onClose={() => setIsAddingAction(false)} 
          onSave={handleSaveNewAction} 
          isOnline={isOnline} 
          themeColor={themeColor} 
          isDark={isDark}
          isPro={settings.isPro}
          onShowSales={onShowSales}
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