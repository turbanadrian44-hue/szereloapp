import React, { useState, useEffect } from 'react';
import { ClientData, ShopSettings, ViewState } from './types';
import { THEMES } from './config';
import { OnboardingScreen } from './components/OnboardingScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { IntakeScreen } from './components/IntakeScreen';
import { WorkshopScreen } from './components/WorkshopScreen';
import { SettingsModal, FeatureGateModal, BackupReminderModal, StartRepairModal } from './components/Modals';
import { WifiOff } from 'lucide-react';

export const App = () => {
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
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState<'LOGO' | 'AI' | 'LIMIT' | null>(null);

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

  const handleStartNewClient = () => {
    const activeCount = clients.filter(c => c.status === 'ACTIVE').length;
    if (!settings?.isPro && activeCount >= 5) {
      setShowSalesModal('LIMIT');
      return;
    }
    setCurrentView('INTAKE');
  };

  const handleSaveClient = (data: any) => {
    const newClient: ClientData = {
      id: Date.now().toString(),
      ...data,
      photos: [],
      status: 'ACTIVE',
      createdAt: Date.now()
    };
    setClients([newClient, ...clients]);
    setCurrentView('DASHBOARD');
    
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

  const handleExportData = async () => {
    const dataStr = JSON.stringify(clients);
    const fileName = `szerviz_mentes_${new Date().toISOString().slice(0,10)}.json`;
    const file = new File([dataStr], fileName, { type: 'application/json' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Biztonsági Mentés',
          text: 'Mentsd le a biztonsági mentést!'
        });
        if (settings) {
          setSettings({...settings, clientCountSinceBackup: 0});
          setShowBackupReminder(false);
        }
        return;
      } catch (err) {
        console.log('Sharing failed or cancelled, falling back to download');
      }
    }

    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(dataStr));
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
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

      {currentView === 'ONBOARDING' && <OnboardingScreen onComplete={handleOnboardingComplete} onShowSales={setShowSalesModal} />}

      {currentView === 'DASHBOARD' && settings && (
        <DashboardScreen 
          settings={settings}
          theme={theme}
          clients={clients} 
          onAdd={handleStartNewClient}
          onOpen={(id) => { setSelectedClientId(id); setCurrentView('WORKSHOP'); }}
          onDelete={handleDeleteClient}
          onStart={handleQuickStartSMS}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
      )}

      {currentView === 'INTAKE' && settings && <IntakeScreen themeColor={settings.themeColor} isDark={settings.darkMode} onSave={handleSaveClient} onCancel={() => setCurrentView('DASHBOARD')} />}

      {currentView === 'WORKSHOP' && activeClient && theme && settings && (
        <WorkshopScreen 
          client={activeClient} 
          themeColor={settings.themeColor} 
          isDark={settings.darkMode} 
          isOnline={isOnline} 
          onUpdateClient={handleUpdateClient} 
          onBack={() => { setSelectedClientId(null); setCurrentView('DASHBOARD'); }} 
          quickActions={quickActions} 
          setQuickActions={setQuickActions} 
          shopName={settings.shopName} 
          settings={settings}
          onShowSales={setShowSalesModal}
        />
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
        <SettingsModal 
          onClose={() => setShowSettingsModal(false)} 
          theme={theme} 
          onExport={handleExportData} 
          onImport={handleImportData} 
          quickActions={quickActions} 
          setQuickActions={setQuickActions} 
          isOnline={isOnline} 
          settings={settings} 
          onUpdateSettings={setSettings} 
          onShowSales={setShowSalesModal}
        />
      )}

      {/* SALES MODAL */}
      {showSalesModal && settings && (
        <FeatureGateModal 
          feature={showSalesModal} 
          onClose={() => setShowSalesModal(null)} 
          onActivate={() => { setShowSalesModal(null); setShowSettingsModal(true); }}
        />
      )}

      {/* BACKUP REMINDER MODAL */}
      {showBackupReminder && theme && (
        <BackupReminderModal onClose={() => setShowBackupReminder(false)} onExport={handleExportData} theme={theme} />
      )}
    </div>
  );
};