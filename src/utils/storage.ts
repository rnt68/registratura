import { Settings, ArchiveRecord, Service } from '../types';
import { v4 as uuidv4 } from 'uuid';

const SETTINGS_KEY = 'contract_settings';
const DB_NAME = 'contract_registry_db';
const STORE_NAME = 'archive';

const defaultRitualServices: Service[] = [
  { id: uuidv4(), name: 'Туалет тела', price: 1500, enabled: true },
  { id: uuidv4(), name: 'Бальзамирование тела', price: 3500, enabled: true },
  { id: uuidv4(), name: 'Санитарно-гигиеническая обработка тела', price: 2000, enabled: true },
  { id: uuidv4(), name: 'Одевание тела', price: 1000, enabled: true },
  { id: uuidv4(), name: 'Предпохоронное сохранение тела (за 1 день)', price: 1800, enabled: true },
  { id: uuidv4(), name: 'Прокат траурного зала', price: 3000, enabled: true },
  { id: uuidv4(), name: 'Предоставление катафалка', price: 5000, enabled: true },
  { id: uuidv4(), name: 'Копка могилы', price: 4500, enabled: true },
  { id: uuidv4(), name: 'Установка ограды', price: 6000, enabled: true },
  { id: uuidv4(), name: 'Установка памятника', price: 8000, enabled: true },
];

const defaultHistologyServices: Service[] = [
  { id: uuidv4(), name: 'Прижизненное гистологическое исследование', price: 800, enabled: true },
  { id: uuidv4(), name: 'Посмертное гистологическое исследование', price: 1200, enabled: true },
  { id: uuidv4(), name: 'Иммуногистохимическое исследование', price: 2500, enabled: true },
  { id: uuidv4(), name: 'Повторное исследование ранее приготовленных препаратов', price: 600, enabled: true },
  { id: uuidv4(), name: 'Срочное исследование (в течение 1 часа)', price: 1500, enabled: true },
  { id: uuidv4(), name: 'Консультация готовых препаратов', price: 500, enabled: true },
];

export function getDefaultSettings(): Settings {
  return {
    ritualSuffix: '/10',
    histologySuffix: '/01',
    ritualCounter: 1,
    histologyCounter: 1,
    signerPosition: 'Главный врач',
    signerFio: 'Молчанов Олег Васильевич',
    ritualNdsText: 'в том числе НДС (по конкретно оказанной услуге):',
    histologyNdsText: 'НДС не облагается в соответствии с подп. 2 п. 2 ст. 149 НК РФ',
    ritualServices: defaultRitualServices,
    histologyServices: defaultHistologyServices,
  };
}

export function loadSettings(): Settings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return getDefaultSettings();
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// IndexedDB helpers
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function loadArchive(): Promise<ArchiveRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  } catch (e) {
    console.error('Error loading archive:', e);
    return [];
  }
}

export async function addToArchive(record: ArchiveRecord): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error('Error adding to archive:', e);
    throw e;
  }
}

export async function removeFromArchive(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error('Error removing from archive:', e);
    throw e;
  }
}

export function getNextContractNumber(type: 'ritual' | 'histology', settings: Settings): string {
  if (type === 'ritual') {
    return `${settings.ritualCounter}${settings.ritualSuffix}`;
  }
  return `${settings.histologyCounter}${settings.histologySuffix}`;
}

export function incrementCounter(type: 'ritual' | 'histology', settings: Settings): Settings {
  const newSettings = { ...settings };
  if (type === 'ritual') {
    newSettings.ritualCounter = settings.ritualCounter + 1;
  } else {
    newSettings.histologyCounter = settings.histologyCounter + 1;
  }
  saveSettings(newSettings);
  return newSettings;
}
