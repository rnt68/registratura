import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { ContractData, Settings, Service } from '../types';

function formatMoney(amount: number): string {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatDateRu(dateStr: string): string {
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  const parts = dateStr.split('.');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[0]);
  const monthIndex = parseInt(parts[1]) - 1;
  const year = parts[2];
  return `«${day}» ${months[monthIndex]} ${year} г.`;
}

function getSelectedServicesData(contract: ContractData, settings: Settings) {
  const services = contract.type === 'ritual' ? settings.ritualServices : settings.histologyServices;
  const result: { no: number; name: string; qty: string; price: string; sum: string }[] = [];
  let num = 1;
  
  for (const svc of services) {
    if (!svc.enabled) continue;
    const selected = contract.selectedServices.find(s => s.serviceId === svc.id);
    if (selected) {
      result.push({
        no: num++,
        name: svc.name,
        qty: String(selected.quantity),
        price: formatMoney(svc.price),
        sum: formatMoney(svc.price * selected.quantity),
      });
    }
  }
  return result;
}

function getAllServicesForTable(contract: ContractData, settings: Settings) {
  const services = contract.type === 'ritual' ? settings.ritualServices : settings.histologyServices;
  const result: { no: number; name: string; qty: string; price: string; sum: string }[] = [];
  let num = 1;
  
  for (const svc of services) {
    if (!svc.enabled) continue;
    const selected = contract.selectedServices.find(s => s.serviceId === svc.id);
    if (selected) {
      result.push({
        no: num++,
        name: svc.name,
        qty: String(selected.quantity),
        price: formatMoney(svc.price),
        sum: formatMoney(svc.price * selected.quantity),
      });
    } else {
      result.push({
        no: num++,
        name: svc.name,
        qty: '-',
        price: formatMoney(svc.price),
        sum: '-',
      });
    }
  }
  return result;
}

export function generateContractPDF(contract: ContractData, settings: Settings): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const isRitual = contract.type === 'ritual';
  const contractTitle = isRitual 
    ? 'Договор оказания ритуальных услуг' 
    : 'Договор оказания услуг по гистологии';
  const ndsText = isRitual ? settings.ritualNdsText : settings.histologyNdsText;

  // ============ СТРАНИЦА 1: ДОГОВОР ============
  
  // Заголовок
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(contractTitle, pageWidth / 2, y, { align: 'center' });
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`№ ${contract.contractNumber}`, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(formatDateRu(contract.contractDate), pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Текст договора
  doc.setFontSize(10);
  const lineHeight = 5;
  
  const party1 = isRitual 
    ? 'Государственное бюджетное учреждение здравоохранения' 
    : 'Государственное бюджетное учреждение здравоохранения';
  
  const lines = [
    `${party1}, именуемое в дальнейшем «Поставщик», в лице ${settings.signerPosition}`,
    `${settings.signerFio}, действующего на основании Устава, с одной стороны, и`,
    ``,
    `Гражданин: ${contract.fio}, паспорт ${contract.passportSeries} ${contract.passportNumber},`,
    `выдан: ${contract.issuedBy}, дата выдачи: ${contract.issuedDate},`,
    `проживающий по адресу: ${contract.address},`,
    `именуемый в дальнейшем «Заказчик», с другой стороны, заключили настоящий договор о`,
    `следующем:`,
    ``,
    `1. ПРЕДМЕТ ДОГОВОРА`,
    ``,
    `1.1. Поставщик обязуется оказать Заказчику ${isRitual ? 'ритуальные' : 'гистологические'} услуги,`,
    `а Заказчик обязуется принять и оплатить эти услуги.`,
    ``,
    `1.2. Перечень, объём и стоимость услуг определяются в Приложении №1,`,
    `являющемся неотъемлемой частью настоящего договора.`,
    ``,
    `2. СТОИМОСТЬ УСЛУГ И ПОРЯДОК РАСЧЁТОВ`,
    ``,
    `2.1. Стоимость услуг по настоящему договору составляет ${formatMoney(contract.totalAmount)} руб.,`,
    `${ndsText}`,
    ``,
    `2.2. Оплата производится Заказчиком в полном объёме в момент заключения договора.`,
    ``,
    `3. ПОРЯДОК ОКАЗАНИЯ УСЛУГ`,
    ``,
    `3.1. Поставщик оказывает услуги в соответствии с перечнем, указанным в Приложении №1.`,
    `3.2. Услуги считаются оказанными с момента подписания Сторонами акта об оказании услуг.`,
    ``,
    `4. ОТВЕТСТВЕННОСТЬ СТОРОН`,
    ``,
    `4.1. За неисполнение или ненадлежащее исполнение обязательств по настоящему договору`,
    `Стороны несут ответственность в соответствии с действующим законодательством РФ.`,
    ``,
    `5. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ`,
    ``,
    `5.1. Настоящий договор составлен в двух экземплярах, имеющих равную юридическую силу.`,
    `5.2. Все изменения и дополнения к договору действительны при условии их письменной формы.`,
    `5.3. Споры, возникающие при исполнении договора, разрешаются в порядке,`,
    `установленном действующим законодательством РФ.`,
  ];

  if (isRitual && contract.deceasedFio) {
    lines.splice(5, 0, ``, `Усопший: ${contract.deceasedFio}`);
  }

  for (const line of lines) {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  y += 10;
  
  // Подписи
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('6. АДРЕСА И ПОДПИСИ СТОРОН:', margin, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Левая колонка - Поставщик
  const colWidth = contentWidth / 2;
  doc.setFont('helvetica', 'bold');
  doc.text('Поставщик:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(party1, margin, y + 5);
  doc.text(``, margin, y + 10);
  doc.text(``, margin, y + 15);
  doc.text(``, margin, y + 20);
  doc.text(``, margin, y + 25);
  doc.text(`________________ /${settings.signerFio}/`, margin, y + 30);
  
  // Правая колонка - Заказчик
  const rightX = margin + colWidth + 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Заказчик:', rightX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(contract.fio, rightX, y + 5);
  doc.text(`Паспорт: ${contract.passportSeries} ${contract.passportNumber}`, rightX, y + 10);
  doc.text(`Адрес: ${contract.address}`, rightX, y + 15);
  doc.text(``, rightX, y + 20);
  doc.text(``, rightX, y + 25);
  doc.text(`________________ /${contract.fio}/`, rightX, y + 30);

  // ============ СТРАНИЦА 2: ПРИЛОЖЕНИЕ №1 ============
  doc.addPage();
  y = 20;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Приложение №1', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.text('к Договору оказания услуг', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`№ ${contract.contractNumber} от ${contract.contractDate}`, pageWidth / 2, y, { align: 'center' });
  y += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ПЕРЕЧЕНЬ УСЛУГ', pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Таблица услуг
  const allServices = getAllServicesForTable(contract, settings);
  
  autoTable(doc, {
    startY: y,
    head: [['№', 'Наименование услуги', 'Кол-во', 'Цена, руб.', 'Сумма, руб.']],
    body: allServices.map(s => [
      String(s.no),
      s.name,
      s.qty,
      s.price,
      s.sum,
    ]),
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Итого: ${formatMoney(contract.totalAmount)} руб.`, margin, y);
  y += 6;
  doc.text(`${ndsText}`, margin, y);
  y += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Приложение составлено в 2 экземплярах, по одному для каждой из Сторон.', margin, y);
  y += 15;
  
  // Подписи в приложении
  doc.setFont('helvetica', 'bold');
  doc.text('Поставщик:', margin, y);
  doc.text('Заказчик:', rightX, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`________________ /${settings.signerFio}/`, margin, y);
  doc.text(`________________ /${contract.fio}/`, rightX, y);

  // ============ СТРАНИЦА 3: АКТ ============
  doc.addPage();
  y = 20;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('АКТ', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.text('об оказании услуг', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`к Договору № ${contract.contractNumber} от ${contract.contractDate}`, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(formatDateRu(contract.contractDate), pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const actLines = [
    `Мы, нижеподписавшиеся, ${party1} (Поставщик) в лице ${settings.signerPosition}`,
    `${settings.signerFio} и ${contract.fio} (Заказчик), составили настоящий акт о том, что:`,
    ``,
    `Поставщиком оказаны следующие услуги:`,
    ``,
  ];

  for (const line of actLines) {
    doc.text(line, margin, y);
    y += lineHeight;
  }

  // Таблица оказанных услуг
  const selectedServices = getSelectedServicesData(contract, settings);
  
  autoTable(doc, {
    startY: y,
    head: [['№', 'Наименование услуги', 'Кол-во', 'Цена, руб.', 'Сумма, руб.']],
    body: selectedServices.map(s => [
      String(s.no),
      s.name,
      s.qty,
      s.price,
      s.sum,
    ]),
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Общая стоимость оказанных услуг: ${formatMoney(contract.totalAmount)} руб.`, margin, y);
  y += 6;
  doc.text(`${ndsText}`, margin, y);
  y += 10;
  
  doc.setFont('helvetica', 'normal');
  const actEndLines = [
    `Заказчик претензий по объёму, качеству и срокам оказания услуг не имеет.`,
    ``,
    `Настоящий акт составлен в двух экземплярах, имеющих равную юридическую силу,`,
    `по одному для каждой из Сторон.`,
  ];
  
  for (const line of actEndLines) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  y += 15;
  
  // Подписи в акте
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('Услуги оказал (Поставщик):', margin, y);
  doc.text('Услуги принял (Заказчик):', rightX, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Должность: ${settings.signerPosition}`, margin, y);
  y += 5;
  doc.text(`ФИО: ${settings.signerFio}`, margin, y);
  y += 10;
  doc.text(`________________ /${settings.signerFio}/`, margin, y);
  doc.text(`________________ /${contract.fio}/`, rightX, y);

  return doc;
}

export function generateFileName(contract: ContractData): string {
  const date = contract.contractDate;
  const number = contract.contractNumber.replace(/\//g, '_');
  
  if (contract.type === 'ritual' && contract.deceasedFio) {
    return `Договор-${contract.fio}-${contract.deceasedFio} (${number})${date}.pdf`;
  }
  return `Договор-${contract.fio} (${number})${date}.pdf`;
}
