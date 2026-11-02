import { useState, useCallback } from 'react';
import { ContractData, Settings, SelectedService } from '../types';
import { capitalizeFio, validateFio, formatPassport, formatIssueDate, validateIssueDate, getTodayFormatted } from '../utils/validation';
import { getNextContractNumber, incrementCounter, addToArchive } from '../utils/storage';
import { generateContractPDF, generateFileName } from '../utils/pdfGenerator';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  type: 'ritual' | 'histology';
  settings: Settings;
  onSettingsChange: (s: Settings) => void;
}

export default function ContractForm({ type, settings, onSettingsChange }: Props) {
  const [fio, setFio] = useState('');
  const [passport, setPassport] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [address, setAddress] = useState('');
  const [deceasedFio, setDeceasedFio] = useState('');
  const [contractDate, setContractDate] = useState(getTodayFormatted());
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const services = type === 'ritual' ? settings.ritualServices : settings.histologyServices;
  const enabledServices = services.filter(s => s.enabled);

  const contractNumber = getNextContractNumber(type, settings);

  const totalAmount = selectedServices.reduce((sum, sel) => {
    const svc = services.find(s => s.id === sel.serviceId);
    return sum + (svc ? svc.price * sel.quantity : 0);
  }, 0);

  const handleFioChange = (value: string) => {
    if (validateFio(value)) {
      setFio(capitalizeFio(value));
    }
  };

  const handleDeceasedFioChange = (value: string) => {
    if (validateFio(value)) {
      setDeceasedFio(capitalizeFio(value));
    }
  };

  const handlePassportChange = (value: string) => {
    const formatted = formatPassport(value);
    setPassport(formatted);
  };

  const handleIssueDateChange = (value: string) => {
    if (validateIssueDate(value)) {
      setIssuedDate(formatIssueDate(value));
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.serviceId === serviceId);
      if (exists) {
        return prev.filter(s => s.serviceId !== serviceId);
      }
      return [...prev, { serviceId, quantity: 1 }];
    });
  };

  const updateQuantity = (serviceId: string, qty: number) => {
    if (qty < 1) return;
    setSelectedServices(prev => prev.map(s => 
      s.serviceId === serviceId ? { ...s, quantity: qty } : s
    ));
  };

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!fio.trim()) newErrors.fio = 'Укажите ФИО';
    if (!passport.replace(/\s/g, '').match(/^\d{10}$/)) newErrors.passport = 'Серия и номер (10 цифр)';
    if (!issuedBy.trim()) newErrors.issuedBy = 'Укажите кем выдан';
    if (!issuedDate.match(/^\d{2}\.\d{2}\.\d{4}$/)) newErrors.issuedDate = 'Формат дд.мм.гггг';
    if (!address.trim()) newErrors.address = 'Укажите адрес';
    if (type === 'ritual' && !deceasedFio.trim()) newErrors.deceasedFio = 'Укажите ФИО усопшего';
    if (selectedServices.length === 0) newErrors.services = 'Выберите хотя бы одну услугу';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fio, passport, issuedBy, issuedDate, address, deceasedFio, selectedServices, type]);

  const handleSubmit = async () => {
    setError('');
    
    if (!validate()) {
      setError('Заполните все обязательные поля');
      return;
    }

    setLoading(true);

    try {
      const [day, month, year] = contractDate.split('.');
      const passportDigits = passport.replace(/\s/g, '');
      
      const contract: ContractData = {
        id: uuidv4(),
        type,
        fio,
        passportSeries: passportDigits.slice(0, 4),
        passportNumber: passportDigits.slice(4),
        issuedBy,
        issuedDate,
        address,
        deceasedFio: type === 'ritual' ? deceasedFio : undefined,
        contractNumber,
        contractDate,
        selectedServices,
        totalAmount,
        createdAt: new Date().toISOString(),
        pdfFileName: '',
      };

      const fileName = generateFileName(contract);
      contract.pdfFileName = fileName;

      const doc = await generateContractPDF(contract, settings);
      const pdfDataUrl = doc.output('datauristring');

      await addToArchive({
        id: contract.id,
        contract,
        pdfDataUrl,
        fileName,
      });

      // Increment counter
      const newSettings = incrementCounter(type, settings);
      onSettingsChange(newSettings);

      // Download PDF
      doc.save(fileName);

      // Reset form
      setFio('');
      setPassport('');
      setIssuedBy('');
      setIssuedDate('');
      setAddress('');
      setDeceasedFio('');
      setContractDate(getTodayFormatted());
      setSelectedServices([]);
      setErrors({});
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(`Ошибка при создании договора: ${err instanceof Error ? err.message : 'неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          {type === 'ritual' ? 'Договор оказания ритуальных услуг' : 'Договор оказания услуг по гистологии'}
        </h2>
        <div className="flex gap-4 mt-2 text-sm text-gray-500">
          <span>№ {contractNumber}</span>
          <span>•</span>
          <span>Дата: {contractDate}</span>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
          ✓ Договор успешно оформлен и сохранён в архив
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          ✗ {error}
        </div>
      )}

      {/* Form */}
      <div className="space-y-6">
        {/* Основные данные */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">Данные заказчика</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ФИО *</label>
              <input
                type="text"
                value={fio}
                onChange={e => handleFioChange(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.fio ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
                placeholder="Иванов Иван Иванович"
              />
              {errors.fio && <p className="text-xs text-red-500 mt-1">{errors.fio}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Паспорт (серия номер) *</label>
              <input
                type="text"
                value={passport}
                onChange={e => handlePassportChange(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.passport ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
                placeholder="1111 222222"
                maxLength={11}
              />
              {errors.passport && <p className="text-xs text-red-500 mt-1">{errors.passport}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата выдачи *</label>
              <input
                type="text"
                value={issuedDate}
                onChange={e => handleIssueDateChange(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.issuedDate ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
                placeholder="22.01.2014"
                maxLength={10}
              />
              {errors.issuedDate && <p className="text-xs text-red-500 mt-1">{errors.issuedDate}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Кем выдан *</label>
              <input
                type="text"
                value={issuedBy}
                onChange={e => setIssuedBy(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.issuedBy ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
                placeholder="ОВД района..."
              />
              {errors.issuedBy && <p className="text-xs text-red-500 mt-1">{errors.issuedBy}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Адрес проживания *</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.address ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
                placeholder="г. Москва, ул. ..."
              />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
            </div>

            {type === 'ritual' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ФИО усопшего *</label>
                <input
                  type="text"
                  value={deceasedFio}
                  onChange={e => handleDeceasedFioChange(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.deceasedFio ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
                  placeholder="Фамилия Имя Отчество"
                />
                {errors.deceasedFio && <p className="text-xs text-red-500 mt-1">{errors.deceasedFio}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата договора</label>
              <input
                type="text"
                value={contractDate}
                onChange={e => setContractDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                placeholder="дд.мм.гггг"
              />
            </div>
          </div>
        </div>

        {/* Услуги */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">Услуги</h3>
          
          {errors.services && <p className="text-xs text-red-500 mb-3">{errors.services}</p>}
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase">✓</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase">Наименование</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-400 uppercase">Цена</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-400 uppercase">Кол-во</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-400 uppercase">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {enabledServices.map(svc => {
                  const selected = selectedServices.find(s => s.serviceId === svc.id);
                  return (
                    <tr key={svc.id} className={`border-b border-gray-50 transition-colors ${selected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={() => toggleService(svc.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-sm text-gray-700">{svc.name}</td>
                      <td className="py-2.5 px-3 text-sm text-gray-600 text-right">{svc.price.toFixed(2)} ₽</td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          value={selected?.quantity || 1}
                          onChange={e => updateQuantity(svc.id, parseInt(e.target.value) || 1)}
                          disabled={!selected}
                          className="w-16 text-center px-2 py-1 rounded-lg border border-gray-200 text-sm disabled:opacity-40 disabled:bg-gray-100"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-sm text-gray-700 text-right font-medium">
                        {selected ? (svc.price * selected.quantity).toFixed(2) + ' ₽' : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">Выбрано услуг: {selectedServices.length}</span>
            <div className="text-right">
              <span className="text-sm text-gray-500">Итого: </span>
              <span className="text-lg font-semibold text-gray-800">{totalAmount.toFixed(2)} ₽</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 active:bg-gray-950 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Создание договора...' : 'Оформить договор и сохранить в архив'}
        </button>
      </div>
    </div>
  );
}
