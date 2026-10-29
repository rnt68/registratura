import { useState } from 'react';
import { Settings } from './types';
import { loadSettings } from './utils/storage';
import ContractForm from './components/ContractForm';
import Archive from './components/Archive';
import SettingsPanel from './components/SettingsPanel';
import { Settings as SettingsIcon, Archive as ArchiveIcon, FileText, FlaskConical } from 'lucide-react';

type Tab = 'ritual' | 'histology' | 'archive';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('ritual');
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-800 hidden sm:block">Реестр договоров</span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('ritual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'ritual'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Ритуальные</span>
              </button>
              <button
                onClick={() => setActiveTab('histology')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'histology'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                <span className="hidden sm:inline">Гистология</span>
              </button>
              <button
                onClick={() => setActiveTab('archive')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'archive'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <ArchiveIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Архив</span>
              </button>
            </nav>

            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Настройки"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'ritual' && (
          <ContractForm
            type="ritual"
            settings={settings}
            onSettingsChange={setSettings}
          />
        )}
        {activeTab === 'histology' && (
          <ContractForm
            type="histology"
            settings={settings}
            onSettingsChange={setSettings}
          />
        )}
        {activeTab === 'archive' && <Archive />}
      </main>

      {/* Settings modal */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
