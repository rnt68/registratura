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
  const result: { no: number; name: string; unit: string; qty: string; price: string; sum: string }[] = [];
  let num = 1;
  
  for (const svc of services) {
    if (!svc.enabled) continue;
    const selected = contract.selectedServices.find(s => s.serviceId === svc.id);
    const unit = contract.type === 'histology' ? 'случай' : 'шт.';
    if (selected) {
      result.push({
        no: num++,
        name: svc.name,
        unit,
        qty: String(selected.quantity),
        price: formatMoney(svc.price),
        sum: formatMoney(svc.price * selected.quantity),
      });
    } else if (!onlySelected) {
      result.push({
        no: num++,
        name: svc.name,
        unit,
        qty: '-',
        price: formatMoney(svc.price),
        sum: '-',
      });
    }
  }
  return result;
}

function createHistologyContractPage1(contract: ContractData, settings: Settings): string {
  const baseStyle = `font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.4; color: #000; padding: 20mm 15mm 20mm 30mm; width: 794px; min-height: 1123px; box-sizing: border-box; background: white;`;
  
  return `
    <div style="${baseStyle}">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5mm;">
        <div style="font-size: 11pt;">Договор оказания платных услуг ${contract.contractNumber}</div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8mm;">
        <div>${contract.contractDate}</div>
        <div>г.Тамбов</div>
      </div>
      
      <p style="text-align: justify; margin-bottom: 3mm; text-indent: 0;">
        На основании Федерального закона от 21.11.2011г. №323-ФЗ «Об основах охраны здоровья граждан в Российской Федерации», Устава, Свидетельства о внесении записи в ЕГРЮЛ №2126829002892, серия 68 №001492171, выдано Инспекцией Федеральной налоговой службы по г. Тамбову 17.01.2012; Лицензии № ЛО-68-01-001260 от 03.10.2019, выданной Управлением здравоохранения по Тамбовской области (392030, Россия, Тамбовская область, г. Тамбов, ул. Советская, 106/Горького, 5/, тел. 84752 79-25-12) Тамбовское областное государственное бюджетное учреждение здравоохранения «Патологоанатомическое бюро» (ТОГБУЗ «ПБ»), именуемое далее «Исполнитель», в лице ${settings.signerPosition.toLowerCase()} ${settings.signerFio.split(' ').map((n, i) => i === 0 ? n : n.charAt(0) + '.').join(' ')}, с одной стороны, и
      </p>
      
      <p style="text-align: justify; margin-bottom: 3mm;">
        ${contract.fio}, Паспорт: ${contract.passportSeries} ${contract.passportNumber} ${contract.issuedBy} ${contract.issuedDate}г., проживающий по адресу: ${contract.address}, именуемый далее «Заказчик», с другой стороны заключили настоящий договор о следующем:
      </p>
      
      <h3 style="text-align: center; font-size: 11pt; margin: 5mm 0 3mm 0;">1. Предмет договора</h3>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">1.1. Исполнитель принимает на себя обязательство оказать услуги Заказчику, указанные в Приложение №1, являющемся неотъемлемой частью Договора, а Заказчик обязуется принять и оплатить эти услуги.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">1.2. Наименование и объем услуг, оказываемых по Договору, указаны в Приложение №1, являющемся неотъемлемой частью Договора.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">1.3. Услуги считаются оказанными после подписания акта приема-сдачи услуг Заказчиком или его уполномоченным представителем.</p>
      
      <h3 style="text-align: center; font-size: 11pt; margin: 5mm 0 3mm 0;">2. Права и обязанности сторон</h3>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">2.1. Заказчик обязуется:</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 15mm;">2.1.1. оплатить услуги в размере и порядке, указанных в пункте 3.1. настоящего договора;</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 15mm;">2.1.2. принять по акту приема-сдачи услуги.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">2.2. Заказчик имеет право:</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 15mm;">2.2.1. требовать от Исполнителя расчета стоимости оказываемых услуг;</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 15mm;">2.2.2. получать от Исполнителя для ознакомления в доступной для понимания и восприятия форме любые сведения и информацию о правилах оказания платных услуг.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">2.3. Исполнитель обязуется:</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 15mm;">2.3.1. оказать услуги качественно в соответствии с предусмотренными медицинскими технологиями и в сроки, указанные в настоящем договоре;</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 15mm;">2.3.2. в случае невыполнения взятых обязательств возместить Заказчику стоимость услуг.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">2.4. Исполнитель имеет право:</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 15mm;">2.4.1. требовать от Заказчика:</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 20mm;">— соблюдения режима работы ТОГБУЗ «ПБ» и выполнения условий Договора.</p>
      
      <h3 style="text-align: center; font-size: 11pt; margin: 5mm 0 3mm 0;">3. Цена и порядок оплаты услуг</h3>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">3.1. Стоимость услуг определяется в соответствии с действующим прейскурантом ТОГБУЗ «ПБ» и составляет сумму ${formatMoney(contract.totalAmount)} ${settings.histologyNdsText}.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">3.2. Оплата услуг осуществляется Заказчиком в любом отделении банка или в ТОГБУЗ «ПБ» путем безналичного расчета в порядке 100-процентной предоплаты до получения услуг путем внесения денежных средств на р/с Исполнителя.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">3.3. При возникновении необходимости оказания дополнительных услуг стоимость услуг может быть изменена Исполнителем с согласия Заказчика. Изменение цены с учетом иных затрат на оказание услуги должно быть произведено в простой письменной форме путем подписания обеими сторонами дополнения к настоящему договору.</p>
      
      <h3 style="text-align: center; font-size: 11pt; margin: 5mm 0 3mm 0;">4. Срок и условия выполнения услуг</h3>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">4.1. Услуги, упомянутые в пункте 1.2. настоящего договора, должны быть выполнены Исполнителем не позднее 14-ти календарных дней после подписания настоящего договора.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">4.2. Сроки, указанные в пункте 4.1. настоящего договора, могут быть увеличены или уменьшены, если в процессе выполнения услуг появятся обстоятельства, влияющие на увеличение или уменьшение срока, указанного в пункте 4.1. настоящего договора.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">4.3. Заказчик подтверждает, что ознакомлен в доступной и понятной форме с информацией, размещенной на стендах Исполнителя, о порядках и стандартах оказания медицинской помощи, о возможности и условиях получения данной услуги бесплатно в рамках Программы государственных гарантий по оказанию бесплатной медицинской помощи населению Тамбовской области на текущий год, о медицинских работниках, отвечающих за предоставление платной услуги (их профессиональном образовании и квалификации) и согласен получать данную Услугу на платной основе по собственной инициативе.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">4.4. Заказчик подтверждает, что получил полную информацию в доступной, понятной форме о работниках осуществляющих оказание платных услуг и их квалификации, об особенностях, Условиях, правилах оказания платных медицинских услуг Исполнителем, и дает свое добровольное согласие по собственной инициативе на оказание услуг, являющихся предметом данного Договора, а так же дает свое согласие на предоставление и обработку своих персональных данных третьим лицам, согласно действующего законодательства РФ.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">4.5. Заказчик уведомлен о том, что граждане, находящиеся на лечении, в соответствии с Федеральным законом «Об основах охраны здоровья граждан в РФ» обязаны соблюдать режим лечения, в т.ч. определенный на период их временной нетрудоспособности и правила поведения пациента в медицинских организациях.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">4.6. Исполнителем доведена до Заказчика и (или) потребителя информация о форме и способах направления обращений (жалоб) в органы государственной власти и организации, а так же почтовый адрес и адрес электронной почты, на которые может быть направлено обращение (жалоба).</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">4.7. После исполнения Договора Исполнитель выдает Заказчику медицинские документы (копии) без взимания дополнительной платы.</p>
    </div>
  `;
}

function createHistologyContractPage2(contract: ContractData, settings: Settings): string {
  const baseStyle = `font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.4; color: #000; padding: 20mm 15mm 20mm 30mm; width: 794px; min-height: 1123px; box-sizing: border-box; background: white;`;
  
  return `
    <div style="${baseStyle}">
      <h3 style="text-align: center; font-size: 11pt; margin: 0 0 3mm 0;">5. Ответственность сторон</h3>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">5.1. Исполнитель гарантирует качество услуг, оказываемых Заказчику в рамках настоящего договора.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">5.2. В случае невозможности исполнения обязательств по настоящему договору, возникшей по вине Заказчика, услуги подлежат оплате Исполнителю в полном объеме.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">5.3. В случае досрочного расторжения договора по инициативе Заказчика по причинам, не зависящим от Исполнителя, Заказчик оплачивает Исполнителю фактически выполненные медицинские услуги, а также возмещает фактически понесенные Исполнителем убытки в соответствии с законодательством Российской Федерации.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">5.4. В случае нарушения срока выполнения медицинских услуг по вине Исполнителя и если это приведет к увеличению срока, указанного в пункте 4.1. настоящего договора, Исполнитель несет все расходы на оказание услуги.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">5.5. Согласно пункту 2 статьи 782 ГК РФ Исполнитель вправе отказаться от исполнения обязательств по настоящему договору лишь при условии полного возмещения Заказчику убытков.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">5.6. В случае, когда невозможность исполнения возникла по обстоятельствам, за которые ни одна из сторон не отвечает, Заказчик возмещает Исполнителю фактически понесенные им расходы (пункт 3 статьи 781 ГК РФ).</p>
      
      <h3 style="text-align: center; font-size: 11pt; margin: 5mm 0 3mm 0;">6. Порядок разрешения споров</h3>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">6.1. Заказчик и Исполнитель примут все меры к разрешению всех споров и/или разногласий, которые могут возникнуть из настоящего договора или в связи с ним, путем переговоров.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">6.2. В случае, если Стороны не могут прийти к соглашению, все споры и/или разногласия, возникшие из настоящего договора или в связи с ним подлежат разрешению в суде.</p>
      
      <h3 style="text-align: center; font-size: 11pt; margin: 5mm 0 3mm 0;">7. Общие положения</h3>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">7.1. Все изменения и дополнения к настоящему договору считаются действительными, если они оформлены в письменном виде и подписаны надлежащим образом уполномоченными лицами Сторон.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">7.2. Любая договоренность между Сторонами, влекущая за собой новые обязательства, которые не вытекают из настоящего договора, должна быть письменно подтверждена Сторонами и соответствующее дополнение должно быть подписано к настоящему договору.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">7.3. После подписания настоящего договора все предыдущие письменные и устные соглашения, переговоры и переписка между Сторонами теряют силу если на них отсутствует ссылка в настоящем договоре.</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">7.4. Настоящий договор подписан в двух экземплярах, имеющих одинаковую юридическую силу (в случае заключения Договора между Исполнителем и Заказчиком, который является Потребителем Услуги), в трех экземплярах, имеющих одинаковую юридическую силу (в случае заключения Договора между Исполнителем, Заказчиком и Потребителем Услуги).</p>
      <p style="text-align: justify; margin-bottom: 2mm; text-indent: 10mm;">7.5. По вопросам, не отраженным в настоящем договоре, Стороны руководствуются нормами законодательства Российской Федерации.</p>
      
      <h3 style="text-align: center; font-size: 11pt; margin: 5mm 0 3mm 0;">8. Юридические адреса, банковские реквизиты и подписи сторон</h3>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 3mm;">
        <tr>
          <td style="width: 50%; vertical-align: top; padding-right: 5mm; font-size: 10pt;">
            <p style="font-weight: bold; margin: 0 0 2mm 0;">Исполнитель</p>
            <p style="margin: 0 0 2mm 0;">Тамбовское областное государственное бюджетное учреждение здравоохранения «Патологоанатомическое бюро» (ТОГБУЗ «ПБ»)</p>
            <p style="margin: 0 0 2mm 0;">Адрес: 392000 г.Тамбов, ул.Московская,29 «б»</p>
            <p style="margin: 0 0 2mm 0;">Телефон: 84752 72-84-24</p>
            <p style="margin: 0 0 2mm 0;">Отделение Тамбов//УФК по Тамбовской области г. Тамбов;</p>
            <p style="margin: 0 0 2mm 0;">БИК 016850200 (БИК УФК по Тамбовской области)</p>
            <p style="margin: 0 0 2mm 0;">р/с 03224643680000006400</p>
            <p style="margin: 0 0 2mm 0;">к/с 40102810645370000057</p>
            <p style="margin: 0 0 2mm 0;">Плательщик УФК по Тамбовской области (ТОГБУЗ «ПБ»)</p>
            <p style="margin: 0 0 2mm 0;">л/с 20646Х74030</p>
            <p style="margin: 0 0 2mm 0;">ОГРН –1036888178172 от 29.01.2003</p>
            <p style="margin: 0 0 2mm 0;">ОКПО-27343165 ИНН-6832006608 КПП-682901001</p>
            <p style="margin: 5mm 0 2mm 0;">${settings.signerPosition} ТОГБУЗ «ПБ»</p>
            <p style="margin: 0;">_______________________ /${settings.signerFio.split(' ').map((n, i) => i === 0 ? n : n.charAt(0) + '.').join('')}/</p>
            <p style="margin: 2mm 0 0 0;">М.П.</p>
          </td>
          <td style="width: 50%; vertical-align: top; padding-left: 5mm; font-size: 10pt;">
            <p style="font-weight: bold; margin: 0 0 2mm 0;">Заказчик</p>
            <p style="margin: 0 0 2mm 0;">${contract.fio}</p>
            <p style="margin: 0 0 2mm 0;">Адрес: ${contract.address}</p>
            <p style="margin: 0 0 2mm 0;">Паспорт: ${contract.passportSeries} ${contract.passportNumber}</p>
            <p style="margin: 0 0 2mm 0;">${contract.issuedBy}</p>
            <p style="margin: 0 0 2mm 0;">${contract.issuedDate}г.</p>
            <p style="margin: 10mm 0 0 0;">_______________________ /${contract.fio}/</p>
          </td>
        </tr>
      </table>
      
      <p style="font-size: 9pt; margin-top: 5mm; text-align: justify;">
        Лицензия на осуществление медицинской деятельности № ЛО-68-01-001260 от 03.10.2019 г. (на осуществление доврачебной медицинской помощи по: гистологии. При осуществлении стационарной медицинской помощи, в том числе: в) при осуществлении специализированной медицинской помощи по: общественному здоровью и организации здравоохранения, патологической анатомии), выданная Управлением здравоохранения по Тамбовской области (392030, Россия, Тамбовская область, г. Тамбов, ул. Советская, 106/Горького, 5/, тел. 84752 79-25-12)
      </p>
    </div>
  `;
}

function createHistologyAppendix(contract: ContractData, settings: Settings): string {
  const baseStyle = `font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.4; color: #000; padding: 20mm 15mm 20mm 30mm; width: 794px; min-height: 1123px; box-sizing: border-box; background: white;`;
  const allServices = getServicesList(contract, settings);
  
  return `
    <div style="${baseStyle}">
      <p style="text-align: center; margin-bottom: 3mm;">Приложение №1</p>
      <p style="text-align: center; margin-bottom: 8mm;">к договору № ${contract.contractNumber} от ${contract.contractDate}</p>
      
      <p style="text-align: center; font-weight: bold; margin-bottom: 5mm;">Перечень работ (услуг)</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 5mm;">
        <thead>
          <tr>
            <th style="border: 1px solid #000; padding: 4px; text-align: center; width: 10mm; font-size: 10pt;">№ п/п</th>
            <th style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10pt;">Наименование работы (услуги)</th>
            <th style="border: 1px solid #000; padding: 4px; text-align: center; width: 18mm; font-size: 10pt;">Ед.изм.</th>
            <th style="border: 1px solid #000; padding: 4px; text-align: center; width: 22mm; font-size: 10pt;">Цена (руб.)</th>
            <th style="border: 1px solid #000; padding: 4px; text-align: center; width: 22mm; font-size: 10pt;">Сумма</th>
          </tr>
        </thead>
        <tbody>
          ${allServices.map(s => `
            <tr>
              <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10pt;">${s.no}.</td>
              <td style="border: 1px solid #000; padding: 4px; font-size: 10pt;">${s.name}</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10pt;">${s.unit}</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10pt;">${s.price}</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10pt;">${s.sum}</td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="3" style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold; font-size: 10pt;">ИТОГО</td>
            <td colspan="2" style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold; font-size: 10pt;">${formatMoney(contract.totalAmount)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function createHistologyAct(contract: ContractData, settings: Settings): string {
  const baseStyle = `font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.4; color: #000; padding: 20mm 15mm 20mm 30mm; width: 794px; min-height: 1123px; box-sizing: border-box; background: white;`;
  const selectedServices = getServicesList(contract, settings, true);
  
  return `
    <div style="${baseStyle}">
      <p style="text-align: center; font-weight: bold; margin-bottom: 5mm;">Акт об оказании услуг к договору № ${contract.contractNumber} от ${contract.contractDate}г.</p>
      
      <p style="text-align: justify; margin-bottom: 5mm;">
        Исполнитель Тамбовское областное государственное бюджетное учреждение здравоохранения «Патологоанатомическое бюро» (ТОГБУЗ «ПБ»), именуемое далее «Исполнитель», в лице ${settings.signerPosition.toLowerCase()} ${settings.signerFio.split(' ').map((n, i) => i === 0 ? n : n.charAt(0) + '.').join(' ')}, с одной стороны, и Заказчик с другой стороны составили настоящий акт о том, что Исполнитель выполнил, а Заказчик принял следующие работы:
      </p>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 5mm;">
        <thead>
          <tr>
            <th style="border: 1px solid #000; padding: 4px; text-align: center; width: 10mm; font-size: 10pt;">№ п/п</th>
            <th style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10pt;">Наименование работы (услуги)</th>
            <th style="border: 1px solid #000; padding: 4px; text-align: center; width: 18mm; font-size: 10pt;">Ед.изм.</th>
            <th style="border: 1px solid #000; padding: 4px; text-align: center; width: 22mm; font-size: 10pt;">Цена (руб.)</th>
            <th style="border: 1px solid #000; padding: 4px; text-align: center; width: 22mm; font-size: 10pt;">Сумма</th>
          </tr>
        </thead>
        <tbody>
          ${selectedServices.map(s => `
            <tr>
              <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10pt;">${s.no}.</td>
              <td style="border: 1px solid #000; padding: 4px; font-size: 10pt;">${s.name}</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10pt;">${s.unit}</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10pt;">${s.price}</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10pt;">${s.sum}</td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="3" style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold; font-size: 10pt;">ИТОГО</td>
            <td colspan="2" style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold; font-size: 10pt;">${formatMoney(contract.totalAmount)}</td>
          </tr>
        </tbody>
      </table>
      
      <p style="margin-bottom: 3mm;">Общая стоимость выполненных работ составила: ${formatMoney(contract.totalAmount)}</p>
      <p style="text-align: justify; margin-bottom: 5mm;">Выше перечисленные услуги выполнены в установленные сроки, в полном объёме и с надлежащим качеством. Претензий друг к другу стороны не имеют.</p>
      <p style="margin-bottom: 8mm;">Акт является приложением к договору № ${contract.contractNumber} от ${contract.contractDate}г.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 5mm;">
        <tr>
          <td style="width: 50%; vertical-align: top; padding-right: 5mm; font-size: 10pt;">
            <p style="font-weight: bold; margin: 0 0 2mm 0;">Исполнитель:</p>
            <p style="margin: 0 0 2mm 0;">Тамбовское областное государственное бюджетное учреждение здравоохранения «Патологоанатомическое бюро» (ТОГБУЗ «ПБ»)</p>
            <p style="margin: 0 0 2mm 0;">Адрес: 392000 г.Тамбов, ул.Московская,29 «б»</p>
            <p style="margin: 0 0 2mm 0;">Телефон: 84752 72-84-24</p>
            <p style="margin: 0 0 2mm 0;">Отделение Тамбов//УФК по Тамбовской области г. Тамбов;</p>
            <p style="margin: 0 0 2mm 0;">БИК 016850200</p>
            <p style="margin: 0 0 2mm 0;">р/с 03224643680000006400</p>
            <p style="margin: 0 0 2mm 0;">к/с 40102810645370000057</p>
            <p style="margin: 0 0 2mm 0;">Плательщик УФК по Тамбовской области (ТОГБУЗ «ПБ»)</p>
            <p style="margin: 0 0 2mm 0;">л/с 20646Х74030</p>
            <p style="margin: 0 0 2mm 0;">ОГРН –1036888178172 от 29.01.2003</p>
            <p style="margin: 0 0 2mm 0;">ОКПО-27343165 ИНН-6832006608 КПП-682901001</p>
            <p style="margin: 5mm 0 2mm 0;">${settings.signerPosition} ТОГБУЗ «ПБ»</p>
            <p style="margin: 0;">_______________________ /${settings.signerFio.split(' ').map((n, i) => i === 0 ? n : n.charAt(0) + '.').join('')}/</p>
            <p style="margin: 2mm 0 0 0;">М.П.</p>
          </td>
          <td style="width: 50%; vertical-align: top; padding-left: 5mm; font-size: 10pt;">
            <p style="font-weight: bold; margin: 0 0 2mm 0;">Заказчик:</p>
            <p style="margin: 0 0 2mm 0;">${contract.fio}</p>
            <p style="margin: 0 0 2mm 0;">${contract.address}</p>
            <p style="margin: 0 0 2mm 0;">${contract.passportSeries} ${contract.passportNumber} ${contract.issuedBy}</p>
            <p style="margin: 0 0 2mm 0;">${contract.issuedDate}г.</p>
            <p style="margin: 10mm 0 0 0;">_______________________ /${contract.fio}/</p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function generateContractPDF(contract: ContractData, settings: Settings): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = doc.internal.pageSize.getWidth();
  
  // Определяем страницы в зависимости от типа договора
  const pages = contract.type === 'histology' 
    ? [
        createHistologyContractPage1(contract, settings),
        createHistologyContractPage2(contract, settings),
        createHistologyAppendix(contract, settings),
        createHistologyAct(contract, settings),
      ]
    : [
        createHistologyContractPage1(contract, settings), // TODO: заменить на ритуальный
        createHistologyContractPage2(contract, settings),
        createHistologyAppendix(contract, settings),
        createHistologyAct(contract, settings),
      ];
  
  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage();
    
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '794px';
    container.style.zIndex = '-1';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    container.innerHTML = pages[i];
    document.body.appendChild(container);
    
    try {
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
