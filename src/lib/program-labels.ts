import type { PhotoCategory, ProgramType } from "@prisma/client";

export const programTypeLabels: Record<ProgramType, string> = {
  STRENGTH: "כוח",
  HYPERTROPHY: "היפרטרופיה (מסה)",
  CUTTING: "חיטוב",
  ENDURANCE: "סיבולת",
  CUSTOM: "מותאם אישית",
};

export const photoCategoryLabels: Record<PhotoCategory, string> = {
  FRONT: "חזית",
  SIDE: "צד",
  BACK: "גב",
};

export function calcVolume(weightKg: number, reps: number, sets: number): number {
  return weightKg * reps * sets;
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const agreementContent = `
הסכם שירותי אימון אישי

1. המתאמן/ה מתחייב/ת לדווח בכנות על ביצוע האימונים, משקלים וחזרות.
2. המאמן/ית מתחייב/ת לבנות תוכנית אימון מותאמת אישית ולעקוב אחר ההתקדמות.
3. יש לדווח על כל פציעה, כאב או מגבלה רפואית לפני ובמהלך האימון.
4. המידע האישי והרפואי יישמר בצורה מאובטחת ולא יועבר לצד שלישי ללא הסכמה.
5. ביטול או שינוי תוכנית יתואם מראש עם המאמן/ית.
6. השימוש בפלטפורמה הוא לצורך מעקב אימונים בלבד ואינו מהווה ייעוץ רפואי.

בחתימתי אני מאשר/ת שקראתי והבנתי את תנאי ההסכם.
`.trim();
