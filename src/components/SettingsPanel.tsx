import { useState } from 'react';
import { Settings, Service } from '../types';
import { saveSettings } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import { X, Plus, Trash2, ToggleLeft, ToggleRight, Save } from 'lucide-react';

interface Props {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
}

export default function SettingsPanel({ settings, onSave, onClose }: Props) {
  const [local, setLocal] = useState<Settings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'general' | 'ritual' | 'histology'>('general');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');

  const handleSave = () => {
    saveSettings(local);
    onSave(local);
    onClose();
  };

  const updateService = (type: 'ritual' | 'histology', id: string, updates: Partial<Service>) => {
    const key = type === 'ritual' ? 'ritualServices' : 'histologyServices';
    setLocal(prev => ({
      ...prev,
      [key]: prev[key].map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  };

  const deleteService = (type: 'ritual' | 'histology', id: string) => {
    const key = type === 'ritual' ? 'ritualServices' : 'histologyServices';
    setLocal(prev => ({
      ...prev,
      [key]: prev[key].filter(s => s.id !== id),
    }));
  };

  const addService = (type: 'ritual' | 'histology') => {
    if (!newServiceName.trim() || !newServicePrice) return;
    const key = type === 'ritual' ? 'ritualServices' : 'histologyServices';
    const newService: Service = {
      id: uuidv4(),
      name: newServiceName.trim(),
      price: parseFloat(newServicePrice) || 0,
      enabled: true,
    };
    setLocal(prev => ({
      ...prev,
      [key]: [...prev[key], newService],
    }));
    setNewServiceName('');
    setNewServicePrice('');
  };

  const tabs = [
    { id: 'general' as const, label: 'Общие' },
    { id: 'ritual' as const, label: 'Ритуальные услуги' },
    { id: 'histology' as const, label: 'Гистология' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Настройки</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Подписант</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Должность</label>
                    <input
                      type="text"
                      value={local.signerPosition}
                      onChange={e => setLocal({ ...local, signerPosition: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">ФИО</label>
                    <input
                      type="text"
                      value={local.signerFio}
                      onChange={e => setLocal({ ...local, signerFio: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Нумерация договоров</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Суффикс для ритуальных</label>
                    <input
                      type="text"
                      value={local.ritualSuffix}
                      onChange={e => setLocal({ ...local, ritualSuffix: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
                      placeholder="/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Текущий номер (ритуальные)</label>
                    <input
                      type="number"
                      value={local.ritualCounter}
                      onChange={e => setLocal({ ...local, ritualCounter: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Суффикс для гистологии</label>
                    <input
                      type="text"
                      value={local.histologySuffix}
                      onChange={e => setLocal({ ...local, histologySuffix: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
                      placeholder="/01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Текущий номер (гистология)</label>
                    <input
                      type="number"
                      value={local.histologyCounter}
                      onChange={e => setLocal({ ...local, histologyCounter: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Текст про НДС</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ритуальные услуги</label>
                    <textarea
                      value={local.ritualNdsText}
                      onChange={e => setLocal({ ...local, ritualNdsText: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none resize-none"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Гистология</label>
                    <textarea
                      value={local.histologyNdsText}
                      onChange={e => setLocal({ ...local, histologyNdsText: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ritual' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Услуги — Ритуальные</h3>
              
              <div className="space-y-2">
                {local.ritualServices.map(svc => (
                  <div key={svc.id} className={`flex items-center gap-2 p-3 rounded-xl border ${svc.enabled ? 'border-gray-100 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                    <button
                      onClick={() => updateService('ritual', svc.id, { enabled: !svc.enabled })}
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                      title={svc.enabled ? 'Отключить' : 'Включить'}
                    >
                      {svc.enabled ? <ToggleRight className="w-5 h-5 text-blue-500" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <input
                      type="text"
                      value={svc.name}
                      onChange={e => updateService('ritual', svc.id, { name: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm rounded border border-transparent hover:border-gray-200 focus:border-blue-400 outline-none"
                    />
                    <input
                      type="number"
                      value={svc.price}
                      onChange={e => updateService('ritual', svc.id, { price: parseFloat(e.target.value) || 0 })}
                      className="w-24 px-2 py-1 text-sm text-right rounded border border-gray-200 focus:border-blue-400 outline-none"
                    />
                    <span className="text-xs text-gray-400">₽</span>
                    <button
                      onClick={() => deleteService('ritual', svc.id)}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-gray-200">
                <input
                  type="text"
                  value={newServiceName}
                  onChange={e => setNewServiceName(e.target.value)}
                  placeholder="Название услуги"
                  className="flex-1 px-2 py-1 text-sm rounded border border-gray-200 focus:border-blue-400 outline-none"
                />
                <input
                  type="number"
                  value={newServicePrice}
                  onChange={e => setNewServicePrice(e.target.value)}
                  placeholder="Цена"
                  className="w-24 px-2 py-1 text-sm text-right rounded border border-gray-200 focus:border-blue-400 outline-none"
                />
                <button
                  onClick={() => addService('ritual')}
                  className="p-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'histology' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Услуги — Гистология</h3>
              
              <div className="space-y-2">
                {local.histologyServices.map(svc => (
                  <div key={svc.id} className={`flex items-center gap-2 p-3 rounded-xl border ${svc.enabled ? 'border-gray-100 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                    <button
                      onClick={() => updateService('histology', svc.id, { enabled: !svc.enabled })}
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                      title={svc.enabled ? 'Отключить' : 'Включить'}
                    >
                      {svc.enabled ? <ToggleRight className="w-5 h-5 text-blue-500" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <input
                      type="text"
                      value={svc.name}
                      onChange={e => updateService('histology', svc.id, { name: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm rounded border border-transparent hover:border-gray-200 focus:border-blue-400 outline-none"
                    />
                    <input
                      type="number"
                      value={svc.price}
                      onChange={e => updateService('histology', svc.id, { price: parseFloat(e.target.value) || 0 })}
                      className="w-24 px-2 py-1 text-sm text-right rounded border border-gray-200 focus:border-blue-400 outline-none"
                    />
                    <span className="text-xs text-gray-400">₽</span>
                    <button
                      onClick={() => deleteService('histology', svc.id)}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-gray-200">
                <input
                  type="text"
                  value={newServiceName}
                  onChange={e => setNewServiceName(e.target.value)}
                  placeholder="Название услуги"
                  className="flex-1 px-2 py-1 text-sm rounded border border-gray-200 focus:border-blue-400 outline-none"
                />
                <input
                  type="number"
                  value={newServicePrice}
                  onChange={e => setNewServicePrice(e.target.value)}
                  placeholder="Цена"
                  className="w-24 px-2 py-1 text-sm text-right rounded border border-gray-200 focus:border-blue-400 outline-none"
                />
                <button
                  onClick={() => addService('histology')}
                  className="p-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Save className="w-4 h-4" />
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
