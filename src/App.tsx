import { useState, useEffect } from 'react';
import { LogOut, LayoutDashboard, BookPlus, BookMinus, FileBarChart, Settings as SettingsIcon, Church, History } from 'lucide-react';
import { useConfig } from '@/hooks/useConfig';
import { Home } from '@/pages/Home';
import { Dashboard } from '@/pages/Dashboard';
import { EntryForm } from '@/pages/EntryForm';
import { ExitForm } from '@/pages/ExitForm';
import { Reports } from '@/pages/Reports';
import { HistoryPage } from '@/pages/HistoryPage';
import { SettingsPage } from '@/pages/Settings';

type Page = 'home' | 'dashboard' | 'entry' | 'exit' | 'history' | 'reports' | 'settings';

export default function App() {
  const { config, categories, loading, loadConfig } = useConfig();
  const [page, setPage] = useState<Page>('home');
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!authed) setPage('home');
  }, [authed]);

  if (loading || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!authed || page === 'home') {
    return (
      <Home
        config={config}
        onLogin={() => {
          setAuthed(true);
          setPage('dashboard');
        }}
      />
    );
  }

  const navItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'entry' as Page, label: 'Entrée', icon: BookPlus },
    { id: 'exit' as Page, label: 'Sortie', icon: BookMinus },
    { id: 'history' as Page, label: 'Historique', icon: History },
    { id: 'reports' as Page, label: 'Rapports', icon: FileBarChart },
    { id: 'settings' as Page, label: 'Paramètres', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center">
                <Church className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-800 leading-tight">{config.nom_communaute}</p>
                <p className="text-xs text-gray-500 leading-tight">{config.paroisse}</p>
              </div>
            </div>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => {
                setAuthed(false);
                setPage('home');
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {page === 'dashboard' && (
          <Dashboard config={config} categories={categories} onNavigate={(p) => setPage(p as Page)} />
        )}
        {page === 'entry' && (
          <EntryForm config={config} categories={categories} onBack={() => setPage('dashboard')} />
        )}
        {page === 'exit' && (
          <ExitForm config={config} onBack={() => setPage('dashboard')} />
        )}
        {page === 'history' && (
          <HistoryPage config={config} onBack={() => setPage('dashboard')} />
        )}
        {page === 'reports' && (
          <Reports config={config} onBack={() => setPage('dashboard')} />
        )}
        {page === 'settings' && (
          <SettingsPage
            config={config}
            onBack={() => setPage('dashboard')}
            onConfigChange={loadConfig}
          />
        )}
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex flex-col items-center gap-1 py-2 px-2 flex-1 transition-colors ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="h-16 lg:hidden"></div>
    </div>
  );
}

