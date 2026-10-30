export interface Service {
  id: string;
  name: string;
  price: number;
  enabled: boolean;
}

export interface SelectedService {
  serviceId: string;
  quantity: number;
}

export interface ContractData {
  id: string;
  type: 'ritual' | 'histology';
  fio: string;
  passportSeries: string;
  passportNumber: string;
  issuedBy: string;
  issuedDate: string;
  address: string;
  deceasedFio?: string;
  contractNumber: string;
  contractDate: string;
  selectedServices: SelectedService[];
  totalAmount: number;
  createdAt: string;
  pdfFileName: string;
}

export interface Settings {
  ritualSuffix: string;
  histologySuffix: string;
  ritualCounter: number;
  histologyCounter: number;
  signerPosition: string;
  signerFio: string;
  ritualNdsText: string;
  histologyNdsText: string;
  ritualServices: Service[];
  histologyServices: Service[];
}

export interface ArchiveRecord {
  id: string;
  contract: ContractData;
  pdfDataUrl: string;
  fileName: string;
}
