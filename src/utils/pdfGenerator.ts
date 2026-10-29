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

function createPageHTML(pageNum: number, contract: ContractData, settings: Settings): string {
  const isRitual = contract.type === 'ritual';
  const contractTitle = isRitual 
    ? 'Договор оказания ритуальных услуг' 
    : 'Договор оказания услуг по гистологии';
  const ndsText = isRitual ? settings.ritualNdsText : settings.histologyNdsText;
  const party1 = 'Государственное бюджетное учреждение здравоохранения';
  
  const allServices = getServicesList(contract, settings);
  const selectedServices = getServicesList(contract, settings, true);

  const baseStyle = `font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.5; color: #000; padding: 30px; width: 794px; min-height: 1123px; box-sizing: border-box; background: white;`;

  if (pageNum === 1) {
    // Страница 1: Договор
    return `
      <div style="${baseStyle}">
        <h1 style="text-align: center; font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">${contractTitle}</h1>
        <p style="text-align: center; margin: 0 0 3px 0;">№ ${contract.contractNumber}</p>
        <p style="text-align: center; margin: 0 0 20px 0;">${formatDateRu(contract.contractDate)}</p>
        
        <p style="margin: 0 0 8px 0;">${party1}, именуемое в дальнейшем «Поставщик», в лице ${settings.signerPosition} ${settings.signerFio}, действующего на основании Устава, с одной стороны, и</p>
        
        <p style="margin: 0 0 8px 0;"><strong>Гражданин:</strong> ${contract.fio}, паспорт ${contract.passportSeries} ${contract.passportNumber},</p>
        <p style="margin: 0 0 8px 0;">выдан: ${contract.issuedBy}, дата выдачи: ${contract.issuedDate},</p>
        <p style="margin: 0 0 8px 0;">проживающий по адресу: ${contract.address},</p>
        ${isRitual && contract.deceasedFio ? `<p style="margin: 0 0 8px 0;"><strong>Усопший:</strong> ${contract.deceasedFio}</p>` : ''}
        <p style="margin: 0 0 8px 0;">именуемый в дальнейшем «Заказчик», с другой стороны, заключили настоящий договор о следующем:</p>
        
        <h2 style="font-size: 12px; font-weight: bold; margin: 15px 0 8px 0;">1. ПРЕДМЕТ ДОГОВОРА</h2>
        <p style="margin: 0 0 8px 0;">1.1. Поставщик обязуется оказать Заказчику ${isRitual ? 'ритуальные' : 'гистологические'} услуги, а Заказчик обязуется принять и оплатить эти услуги.</p>
        <p style="margin: 0 0 8px 0;">1.2. Перечень, объём и стоимость услуг определяются в Приложении №1, являющемся неотъемлемой частью настоящего договора.</p>
        
        <h2 style="font-size: 12px; font-weight: bold; margin: 15px 0 8px 0;">2. СТОИМОСТЬ УСЛУГ И ПОРЯДОК РАСЧЁТОВ</h2>
        <p style="margin: 0 0 8px 0;">2.1. Стоимость услуг по настоящему договору составляет ${formatMoney(contract.totalAmount)} руб., ${ndsText}</p>
        <p style="margin: 0 0 8px 0;">2.2. Оплата производится Заказчиком в полном объёме в момент заключения договора.</p>
        
        <h2 style="font-size: 12px; font-weight: bold; margin: 15px 0 8px 0;">3. ПОРЯДОК ОКАЗАНИЯ УСЛУГ</h2>
        <p style="margin: 0 0 8px 0;">3.1. Поставщик оказывает услуги в соответствии с перечнем, указанным в Приложении №1.</p>
        <p style="margin: 0 0 8px 0;">3.2. Услуги считаются оказанными с момента подписания Сторонами акта об оказании услуг.</p>
        
        <h2 style="font-size: 12px; font-weight: bold; margin: 15px 0 8px 0;">4. ОТВЕТСТВЕННОСТЬ СТОРОН</h2>
        <p style="margin: 0 0 8px 0;">4.1. За неисполнение или ненадлежащее исполнение обязательств по настоящему договору Стороны несут ответственность в соответствии с действующим законодательством РФ.</p>
        
        <h2 style="font-size: 12px; font-weight: bold; margin: 15px 0 8px 0;">5. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ</h2>
        <p style="margin: 0 0 8px 0;">5.1. Настоящий договор составлен в двух экземплярах, имеющих равную юридическую силу.</p>
        <p style="margin: 0 0 8px 0;">5.2. Все изменения и дополнения к договору действительны при условии их письменной формы.</p>
        <p style="margin: 0 0 8px 0;">5.3. Споры, возникающие при исполнении договора, разрешаются в порядке, установленном действующим законодательством РФ.</p>
        
        <h2 style="font-size: 12px; font-weight: bold; margin: 20px 0 10px 0;">6. АДРЕСА И ПОДПИСИ СТОРОН:</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 20px;">
              <p style="font-weight: bold; margin: 0 0 5px 0;">Поставщик:</p>
              <p style="margin: 0 0 5px 0;">${party1}</p>
              <p style="margin: 0 0 5px 0;">&nbsp;</p>
              <p style="margin: 0 0 5px 0;">&nbsp;</p>
              <p style="margin: 0 0 5px 0;">&nbsp;</p>
              <p style="margin: 0 0 5px 0;">&nbsp;</p>
              <p style="margin: 0;">________________ /${settings.signerFio}/</p>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 20px;">
              <p style="font-weight: bold; margin: 0 0 5px 0;">Заказчик:</p>
              <p style="margin: 0 0 5px 0;">${contract.fio}</p>
              <p style="margin: 0 0 5px 0;">Паспорт: ${contract.passportSeries} ${contract.passportNumber}</p>
              <p style="margin: 0 0 5px 0;">Адрес: ${contract.address}</p>
              <p style="margin: 0 0 5px 0;">&nbsp;</p>
              <p style="margin: 0 0 5px 0;">&nbsp;</p>
              <p style="margin: 0;">________________ /${contract.fio}/</p>
            </td>
          </tr>
        </table>
      </div>
    `;
  } else if (pageNum === 2) {
    // Страница 2: Приложение №1
    return `
      <div style="${baseStyle}">
        <h1 style="text-align: center; font-size: 14px; font-weight: bold; margin: 0 0 5px 0;">Приложение №1</h1>
        <p style="text-align: center; margin: 0 0 3px 0;">к Договору оказания услуг</p>
        <p style="text-align: center; margin: 0 0 3px 0;">№ ${contract.contractNumber} от ${contract.contractDate}</p>
        <h2 style="text-align: center; font-size: 13px; font-weight: bold; margin: 15px 0 15px 0;">ПЕРЕЧЕНЬ УСЛУГ</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <thead>
            <tr style="background-color: #3c3c3c; color: white;">
              <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 30px; font-weight: bold;">№</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold;">Наименование услуги</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 50px; font-weight: bold;">Кол-во</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: right; width: 80px; font-weight: bold;">Цена, руб.</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: right; width: 80px; font-weight: bold;">Сумма, руб.</th>
            </tr>
          </thead>
          <tbody>
            ${allServices.map(s => `
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
        
        <p style="font-weight: bold; margin: 0 0 5px 0;">Итого: ${formatMoney(contract.totalAmount)} руб.</p>
        <p style="margin: 0 0 15px 0;">${ndsText}</p>
        <p style="margin: 0 0 20px 0;">Приложение составлено в 2 экземплярах, по одному для каждой из Сторон.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 20px;">
              <p style="font-weight: bold; margin: 0 0 10px 0;">Поставщик:</p>
              <p style="margin: 0;">________________ /${settings.signerFio}/</p>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 20px;">
              <p style="font-weight: bold; margin: 0 0 10px 0;">Заказчик:</p>
              <p style="margin: 0;">________________ /${contract.fio}/</p>
            </td>
          </tr>
        </table>
      </div>
    `;
  } else {
    // Страница 3: Акт
    return `
      <div style="${baseStyle}">
        <h1 style="text-align: center; font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">АКТ</h1>
        <p style="text-align: center; margin: 0 0 3px 0;">об оказании услуг</p>
        <p style="text-align: center; margin: 0 0 3px 0;">к Договору № ${contract.contractNumber} от ${contract.contractDate}</p>
        <p style="text-align: center; margin: 0 0 20px 0;">${formatDateRu(contract.contractDate)}</p>
        
        <p style="margin: 0 0 8px 0;">Мы, нижеподписавшиеся, ${party1} (Поставщик) в лице ${settings.signerPosition} ${settings.signerFio} и ${contract.fio} (Заказчик), составили настоящий акт о том, что:</p>
        <p style="margin: 0 0 15px 0;">Поставщиком оказаны следующие услуги:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <thead>
            <tr style="background-color: #3c3c3c; color: white;">
              <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 30px; font-weight: bold;">№</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold;">Наименование услуги</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 50px; font-weight: bold;">Кол-во</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: right; width: 80px; font-weight: bold;">Цена, руб.</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: right; width: 80px; font-weight: bold;">Сумма, руб.</th>
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
        
        <p style="font-weight: bold; margin: 0 0 5px 0;">Общая стоимость оказанных услуг: ${formatMoney(contract.totalAmount)} руб.</p>
        <p style="margin: 0 0 15px 0;">${ndsText}</p>
        <p style="margin: 0 0 8px 0;">Заказчик претензий по объёму, качеству и срокам оказания услуг не имеет.</p>
        <p style="margin: 0 0 20px 0;">Настоящий акт составлен в двух экземплярах, имеющих равную юридическую силу, по одному для каждой из Сторон.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 20px;">
              <p style="font-weight: bold; margin: 0 0 5px 0;">Услуги оказал (Поставщик):</p>
              <p style="margin: 0 0 5px 0;">Должность: ${settings.signerPosition}</p>
              <p style="margin: 0 0 5px 0;">ФИО: ${settings.signerFio}</p>
              <p style="margin: 0 0 10px 0;">&nbsp;</p>
              <p style="margin: 0;">________________ /${settings.signerFio}/</p>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 20px;">
              <p style="font-weight: bold; margin: 0 0 5px 0;">Услуги принял (Заказчик):</p>
              <p style="margin: 0 0 5px 0;">&nbsp;</p>
              <p style="margin: 0 0 5px 0;">&nbsp;</p>
              <p style="margin: 0 0 10px 0;">&nbsp;</p>
              <p style="margin: 0;">________________ /${contract.fio}/</p>
            </td>
          </tr>
        </table>
      </div>
    `;
  }
}

export async function generateContractPDF(contract: ContractData, settings: Settings): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = doc.internal.pageSize.getHeight();
  
  // Генерируем 3 страницы
  for (let pageNum = 1; pageNum <= 3; pageNum++) {
    if (pageNum > 1) doc.addPage();
    
    const pageHTML = createPageHTML(pageNum, contract, settings);
    
    // Создаём контейнер в DOM
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '794px';
    container.style.zIndex = '-1';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    container.innerHTML = pageHTML;
    document.body.appendChild(container);
    
    try {
      // Ждём рендеринг
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const element = container.firstElementChild as HTMLElement;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Вычисляем размеры для вставки
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;
      
      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, scaledHeight);
    } finally {
      document.body.removeChild(container);
    }
  }
  
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
