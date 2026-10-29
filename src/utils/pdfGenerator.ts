import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ContractData, Settings } from '../types';

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

function getServicesList(contract: ContractData, settings: Settings, onlySelected: boolean = false) {
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
    } else if (!onlySelected) {
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

function createContractHTML(contract: ContractData, settings: Settings): string {
  const isRitual = contract.type === 'ritual';
  const contractTitle = isRitual 
    ? 'Договор оказания ритуальных услуг' 
    : 'Договор оказания услуг по гистологии';
  const ndsText = isRitual ? settings.ritualNdsText : settings.histologyNdsText;
  const party1 = 'Государственное бюджетное учреждение здравоохранения';
  
  const services = getServicesList(contract, settings);
  const selectedServices = getServicesList(contract, settings, true);

  return `
    <div style="font-family: 'Arial', 'Helvetica', sans-serif; font-size: 11px; line-height: 1.5; color: #000; padding: 20px; width: 794px;">
      
      <!-- СТРАНИЦА 1: ДОГОВОР -->
      <div style="page-break-after: always;">
        <h1 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 5px;">${contractTitle}</h1>
        <p style="text-align: center; margin-bottom: 3px;">№ ${contract.contractNumber}</p>
        <p style="text-align: center; margin-bottom: 20px;">${formatDateRu(contract.contractDate)}</p>
        
        <p style="margin-bottom: 8px;">${party1}, именуемое в дальнейшем «Поставщик», в лице ${settings.signerPosition}</p>
        <p style="margin-bottom: 8px;">${settings.signerFio}, действующего на основании Устава, с одной стороны, и</p>
        
        <p style="margin-bottom: 8px;"><strong>Гражданин:</strong> ${contract.fio}, паспорт ${contract.passportSeries} ${contract.passportNumber},</p>
        <p style="margin-bottom: 8px;">выдан: ${contract.issuedBy}, дата выдачи: ${contract.issuedDate},</p>
        <p style="margin-bottom: 8px;">проживающий по адресу: ${contract.address},</p>
        ${isRitual && contract.deceasedFio ? `<p style="margin-bottom: 8px;"><strong>Усопший:</strong> ${contract.deceasedFio}</p>` : ''}
        <p style="margin-bottom: 8px;">именуемый в дальнейшем «Заказчик», с другой стороны, заключили настоящий договор о следующем:</p>
        
        <h2 style="font-size: 12px; font-weight: bold; margin-top: 15px; margin-bottom: 8px;">1. ПРЕДМЕТ ДОГОВОРА</h2>
        <p style="margin-bottom: 8px;">1.1. Поставщик обязуется оказать Заказчику ${isRitual ? 'ритуальные' : 'гистологические'} услуги, а Заказчик обязуется принять и оплатить эти услуги.</p>
        <p style="margin-bottom: 8px;">1.2. Перечень, объём и стоимость услуг определяются в Приложении №1, являющемся неотъемлемой частью настоящего договора.</p>
        
        <h2 style="font-size: 12px; font-weight: bold; margin-top: 15px; margin-bottom: 8px;">2. СТОИМОСТЬ УСЛУГ И ПОРЯДОК РАСЧЁТОВ</h2>
        <p style="margin-bottom: 8px;">2.1. Стоимость услуг по настоящему договору составляет ${formatMoney(contract.totalAmount)} руб., ${ndsText}</p>
        <p style="margin-bottom: 8px;">2.2. Оплата производится Заказчиком в полном объёме в момент заключения договора.</p>
        
        <h2 style="font-size: 12px; font-weight: bold; margin-top: 15px; margin-bottom: 8px;">3. ПОРЯДОК ОКАЗАНИЯ УСЛУГ</h2>
        <p style="margin-bottom: 8px;">3.1. Поставщик оказывает услуги в соответствии с перечнем, указанным в Приложении №1.</p>
        <p style="margin-bottom: 8px;">3.2. Услуги считаются оказанными с момента подписания Сторонами акта об оказании услуг.</p>
        
        <h2 style="font-size: 12px; font-weight: bold; margin-top: 15px; margin-bottom: 8px;">4. ОТВЕТСТВЕННОСТЬ СТОРОН</h2>
        <p style="margin-bottom: 8px;">4.1. За неисполнение или ненадлежащее исполнение обязательств по настоящему договору Стороны несут ответственность в соответствии с действующим законодательством РФ.</p>
        
        <h2 style="font-size: 12px; font-weight: bold; margin-top: 15px; margin-bottom: 8px;">5. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ</h2>
        <p style="margin-bottom: 8px;">5.1. Настоящий договор составлен в двух экземплярах, имеющих равную юридическую силу.</p>
        <p style="margin-bottom: 8px;">5.2. Все изменения и дополнения к договору действительны при условии их письменной формы.</p>
        <p style="margin-bottom: 8px;">5.3. Споры, возникающие при исполнении договора, разрешаются в порядке, установленном действующим законодательством РФ.</p>
        
        <h2 style="font-size: 12px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">6. АДРЕСА И ПОДПИСИ СТОРОН:</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 20px;">
              <p style="font-weight: bold; margin-bottom: 5px;">Поставщик:</p>
              <p style="margin-bottom: 5px;">${party1}</p>
              <p style="margin-bottom: 5px;">&nbsp;</p>
              <p style="margin-bottom: 5px;">&nbsp;</p>
              <p style="margin-bottom: 5px;">&nbsp;</p>
              <p style="margin-bottom: 5px;">&nbsp;</p>
              <p>________________ /${settings.signerFio}/</p>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 20px;">
              <p style="font-weight: bold; margin-bottom: 5px;">Заказчик:</p>
              <p style="margin-bottom: 5px;">${contract.fio}</p>
              <p style="margin-bottom: 5px;">Паспорт: ${contract.passportSeries} ${contract.passportNumber}</p>
              <p style="margin-bottom: 5px;">Адрес: ${contract.address}</p>
              <p style="margin-bottom: 5px;">&nbsp;</p>
              <p style="margin-bottom: 5px;">&nbsp;</p>
              <p>________________ /${contract.fio}/</p>
            </td>
          </tr>
        </table>
      </div>
      
      <!-- СТРАНИЦА 2: ПРИЛОЖЕНИЕ №1 -->
      <div style="page-break-after: always;">
        <h1 style="text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 5px;">Приложение №1</h1>
        <p style="text-align: center; margin-bottom: 3px;">к Договору оказания услуг</p>
        <p style="text-align: center; margin-bottom: 3px;">№ ${contract.contractNumber} от ${contract.contractDate}</p>
        <h2 style="text-align: center; font-size: 13px; font-weight: bold; margin-top: 15px; margin-bottom: 15px;">ПЕРЕЧЕНЬ УСЛУГ</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <thead>
            <tr style="background-color: #3c3c3c; color: white;">
              <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 30px;">№</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: left;">Наименование услуги</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 50px;">Кол-во</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: right; width: 80px;">Цена, руб.</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: right; width: 80px;">Сумма, руб.</th>
            </tr>
          </thead>
          <tbody>
            ${services.map(s => `
              <tr>
                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${s.no}</td>
                <td style="border: 1px solid #000; padding: 5px;">${s.name}</td>
                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${s.qty}</td>
                <td style="border: 1px solid #000; padding: 5px; text-align: right;">${s.price}</td>
                <td style="border: 1px solid #000; padding: 5px; text-align: right;">${s.sum}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p style="font-weight: bold; margin-bottom: 5px;">Итого: ${formatMoney(contract.totalAmount)} руб.</p>
        <p style="margin-bottom: 15px;">${ndsText}</p>
        <p style="margin-bottom: 20px;">Приложение составлено в 2 экземплярах, по одному для каждой из Сторон.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 20px;">
              <p style="font-weight: bold; margin-bottom: 10px;">Поставщик:</p>
              <p>________________ /${settings.signerFio}/</p>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 20px;">
              <p style="font-weight: bold; margin-bottom: 10px;">Заказчик:</p>
              <p>________________ /${contract.fio}/</p>
            </td>
          </tr>
        </table>
      </div>
      
      <!-- СТРАНИЦА 3: АКТ -->
      <div>
        <h1 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 5px;">АКТ</h1>
        <p style="text-align: center; margin-bottom: 3px;">об оказании услуг</p>
        <p style="text-align: center; margin-bottom: 3px;">к Договору № ${contract.contractNumber} от ${contract.contractDate}</p>
        <p style="text-align: center; margin-bottom: 20px;">${formatDateRu(contract.contractDate)}</p>
        
        <p style="margin-bottom: 8px;">Мы, нижеподписавшиеся, ${party1} (Поставщик) в лице ${settings.signerPosition} ${settings.signerFio} и ${contract.fio} (Заказчик), составили настоящий акт о том, что:</p>
        <p style="margin-bottom: 15px;">Поставщиком оказаны следующие услуги:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <thead>
            <tr style="background-color: #3c3c3c; color: white;">
              <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 30px;">№</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: left;">Наименование услуги</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 50px;">Кол-во</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: right; width: 80px;">Цена, руб.</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: right; width: 80px;">Сумма, руб.</th>
            </tr>
          </thead>
          <tbody>
            ${selectedServices.map(s => `
              <tr>
                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${s.no}</td>
                <td style="border: 1px solid #000; padding: 5px;">${s.name}</td>
                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${s.qty}</td>
                <td style="border: 1px solid #000; padding: 5px; text-align: right;">${s.price}</td>
                <td style="border: 1px solid #000; padding: 5px; text-align: right;">${s.sum}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p style="font-weight: bold; margin-bottom: 5px;">Общая стоимость оказанных услуг: ${formatMoney(contract.totalAmount)} руб.</p>
        <p style="margin-bottom: 15px;">${ndsText}</p>
        <p style="margin-bottom: 8px;">Заказчик претензий по объёму, качеству и срокам оказания услуг не имеет.</p>
        <p style="margin-bottom: 20px;">Настоящий акт составлен в двух экземплярах, имеющих равную юридическую силу, по одному для каждой из Сторон.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 20px;">
              <p style="font-weight: bold; margin-bottom: 5px;">Услуги оказал (Поставщик):</p>
              <p style="margin-bottom: 5px;">Должность: ${settings.signerPosition}</p>
              <p style="margin-bottom: 5px;">ФИО: ${settings.signerFio}</p>
              <p style="margin-bottom: 10px;">&nbsp;</p>
              <p>________________ /${settings.signerFio}/</p>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 20px;">
              <p style="font-weight: bold; margin-bottom: 5px;">Услуги принял (Заказчик):</p>
              <p style="margin-bottom: 5px;">&nbsp;</p>
              <p style="margin-bottom: 5px;">&nbsp;</p>
              <p style="margin-bottom: 10px;">&nbsp;</p>
              <p>________________ /${contract.fio}/</p>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;
}

export async function generateContractPDF(contract: ContractData, settings: Settings): Promise<jsPDF> {
  const html = createContractHTML(contract, settings);
  
  // Create temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width at 96 DPI
  container.innerHTML = html;
  document.body.appendChild(container);
  
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pages = container.children;
    
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) doc.addPage();
      
      const canvas = await html2canvas(pages[i] as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      doc.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
    }
    
    return doc;
  } finally {
    document.body.removeChild(container);
  }
}

export function generateFileName(contract: ContractData): string {
  const date = contract.contractDate;
  const number = contract.contractNumber.replace(/\//g, '_');
  
  if (contract.type === 'ritual' && contract.deceasedFio) {
    return `Договор-${contract.fio}-${contract.deceasedFio} (${number})${date}.pdf`;
  }
  return `Договор-${contract.fio} (${number})${date}.pdf`;
}
