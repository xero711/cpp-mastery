export function dateInJapan(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "01";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function lessonSlotForDate(date: string, startDate: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const elapsed = Math.max(0, Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(startYear, startMonth - 1, startDay)) / 86_400_000));
  const dayIndex = Math.min(727, elapsed);
  return { week: Math.floor(dayIndex / 7) + 1, day: dayIndex % 7 + 1, elapsedDays: dayIndex };
}

export function formatJapaneseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "long", timeZone: "Asia/Tokyo" }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}
