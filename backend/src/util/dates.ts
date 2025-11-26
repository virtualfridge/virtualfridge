import logger from './logger';

export const parseDate = (input: string, format = 'yyyy-mm-dd') => {
  const parts = input.match(/\d+/g);
  if (!parts) {
    throw new Error(`Invalid date input: ${input}`);
  }

  // Support only known components
  const fmt: Partial<Record<'yyyy' | 'mm' | 'dd', number>> = {};
  let i = 0;

  format.replace(/(yyyy|mm|dd)/g, part => {
    fmt[part as keyof typeof fmt] = i++;
    return part;
  });

  // Default missing components
  const year =
    fmt.yyyy !== undefined ? Number(parts[fmt.yyyy]) : new Date().getFullYear(); // Current year if missing
  // NOTE: Months are 0-indexed in JS/TS
  const month = fmt.mm !== undefined ? Number(parts[fmt.mm]) - 1 : 0; // January if missing
  const day = fmt.dd !== undefined ? Number(parts[fmt.dd]) : 1; // Default to 1 if missing

  return new Date(year, month, day);
};

export const dateDiffInDays = (a: Date, b: Date) => {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  logger.debug(`Date a: ${a.toDateString()}, Date b: ${b.toDateString()}`);
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  logger.debug(`UTC1: ${utc1}, UTC2: ${utc2}`);

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
};

export const addDaysToDate = (originalDate: Date, daysToAdd: number) => {
  const newDate = new Date(originalDate);
  newDate.setDate(originalDate.getDate() + daysToAdd);
  return newDate;
};
