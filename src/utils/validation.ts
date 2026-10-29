export function capitalizeFio(input: string): string {
  return input
    .split(' ')
    .filter(Boolean)
    .map(word => {
      // Handle hyphenated names like Иванов-Петров
      return word
        .split('-')
        .map(part => {
          if (part.length === 0) return part;
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join('-');
    })
    .join(' ');
}

export function validateFio(value: string): boolean {
  // Only letters, spaces, hyphens, and ё allowed
  const regex = /^[а-яА-ЯёЁa-zA-Z\s\-]+$/;
  return regex.test(value) || value === '';
}

export function formatPassport(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 4) return digits;
  return digits.slice(0, 4) + ' ' + digits.slice(4);
}

export function validatePassport(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length <= 10;
}

export function formatIssueDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + '.' + digits.slice(2);
  return digits.slice(0, 2) + '.' + digits.slice(2, 4) + '.' + digits.slice(4);
}

export function validateIssueDate(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return true;
  if (digits.length < 8) return true;
  
  const day = parseInt(digits.slice(0, 2));
  const month = parseInt(digits.slice(2, 4));
  const year = parseInt(digits.slice(4, 8));
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Check days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return false;
  
  return true;
}

export function isValidDate(dateStr: string): boolean {
  const parts = dateStr.split('.');
  if (parts.length !== 3) return false;
  
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return false;
  
  return true;
}

export function getTodayFormatted(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}.${month}.${year}`;
}
