import { useState, useEffect } from 'react';
import { ArchiveRecord } from '../types';
import { loadArchive, removeFromArchive, saveArchive } from '../utils/storage';
import { Search, Download, Trash2, FileText, Eye, X } from 'lucide-react';

export default function Archive() {
  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [search, setSearch] = useState('');
  const [previewRecord, setPreviewRecord] = useState<ArchiveRecord | null>(null);

  useEffect(() => {
    setRecords(loadArchive());
  }, []);

  const filteredRecords = records.filter(r => {
    const q = search.toLowerCase();
    const c = r.contract;
    return (
      c.fio.toLowerCase().includes(q) ||
      c.contractNumber.toLowerCase().includes(q) ||
      c.contractDate.includes(q) ||
      (c.deceasedFio && c.deceasedFio.toLowerCase().includes(q))
    );
  }).sort((a, b) => new Date(b.contract.createdAt).getTime() - new Date(a.contract.createdAt).getTime());

  const handleDownload = (record: ArchiveRecord) => {
    const link = document.createElement('a');
    link.href = record.pdfDataUrl;
    link.download = record.fileName;
    link.click();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Удалить договор из архива приложения?\nКопия файла на сервере будет сохранена.')) return;
    removeFromArchive(id);
    setRecords(loadArchive());
  };

  const handlePreview = (record: ArchiveRecord) => {
    setPreviewRecord(record);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Архив договоров</h2>
        <p className="text-sm text-gray-500 mt-1">Всего записей: {records.length}</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по ФИО, номеру договора, дате..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
        />
      </div>

      {/* Records */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{records.length === 0 ? 'Архив пуст' : 'Ничего не найдено'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map(record => (
            <div key={record.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      record.contract.type === 'ritual' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-teal-100 text-teal-700'
                    }`}>
                      {record.contract.type === 'ritual' ? 'Ритуальные' : 'Гистология'}
                    </span>
                    <span className="text-sm font-medium text-gray-800">№ {record.contract.contractNumber}</span>
                    <span className="text-xs text-gray-400">{record.contract.contractDate}</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium truncate">{record.contract.fio}</p>
                  {record.contract.deceasedFio && (
                    <p className="text-xs text-gray-500 truncate">Усопший: {record.contract.deceasedFio}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {record.contract.totalAmount.toFixed(2)} ₽ • {record.contract.selectedServices.length} услуг
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePreview(record)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Просмотр"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(record)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Скачать PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                    title="Удалить из архива"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreviewRecord(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Информация о договоре</h3>
              <button onClick={() => setPreviewRecord(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400 text-xs uppercase">Тип</span>
                  <p className="font-medium">{previewRecord.contract.type === 'ritual' ? 'Ритуальные услуги' : 'Гистология'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase">Номер</span>
                  <p className="font-medium">{previewRecord.contract.contractNumber}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase">Дата</span>
                  <p className="font-medium">{previewRecord.contract.contractDate}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase">Сумма</span>
                  <p className="font-medium">{previewRecord.contract.totalAmount.toFixed(2)} ₽</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 text-xs uppercase">ФИО заказчика</span>
                  <p className="font-medium">{previewRecord.contract.fio}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 text-xs uppercase">Паспорт</span>
                  <p className="font-medium">{previewRecord.contract.passportSeries} {previewRecord.contract.passportNumber}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 text-xs uppercase">Кем выдан</span>
                  <p className="font-medium">{previewRecord.contract.issuedBy}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase">Дата выдачи</span>
                  <p className="font-medium">{previewRecord.contract.issuedDate}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase">Адрес</span>
                  <p className="font-medium">{previewRecord.contract.address}</p>
                </div>
                {previewRecord.contract.deceasedFio && (
                  <div className="col-span-2">
                    <span className="text-gray-400 text-xs uppercase">ФИО усопшего</span>
                    <p className="font-medium">{previewRecord.contract.deceasedFio}</p>
                  </div>
                )}
              </div>
              
              <div>
                <span className="text-gray-400 text-xs uppercase">Выбранные услуги</span>
                <div className="mt-2 space-y-1">
                  {previewRecord.contract.selectedServices.map(sel => (
                    <div key={sel.serviceId} className="flex justify-between text-sm py-1 border-b border-gray-50">
                      <span className="text-gray-600">Услуга</span>
                      <span className="text-gray-800">×{sel.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  onClick={() => handleDownload(previewRecord)}
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Скачать PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
