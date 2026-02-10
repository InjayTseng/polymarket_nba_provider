export function formatDateEt(date: Date): string {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = dtf.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }
  return `${values.year}-${values.month}-${values.day}`;
}

export function addDaysDateString(dateYYYYMMDD: string, offsetDays: number): string {
  const parsed = new Date(`${dateYYYYMMDD}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return dateYYYYMMDD;
  }
  parsed.setUTCDate(parsed.getUTCDate() + offsetDays);
  return parsed.toISOString().slice(0, 10);
}

