export type QuestionFieldType = "number" | "text" | "textarea";

export type QuestionField = {
  key: string;
  label: string;
  type: QuestionFieldType;
  required: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
};

export const DEFAULT_AGREEMENT_TEXT = `הסכם שירותי אימון אישי

1. המתאמן/ה מתחייב/ת לדווח בכנות על ביצוע האימונים, משקלים וחזרות.
2. המאמן/ית מתחייב/ת לבנות תוכנית אימון מותאמת אישית ולעקוב אחר ההתקדמות.
3. יש לדווח על כל פציעה, כאב או מגבלה רפואית לפני ובמהלך האימון.
4. המידע האישי והרפואי יישמר בצורה מאובטחת ולא יועבר לצד שלישי ללא הסכמה.
5. ביטול או שינוי תוכנית יתואם מראש עם המאמן/ית.
6. השימוש בפלטפורמה הוא לצורך מעקב אימונים בלבד ואינו מהווה ייעוץ רפואי.

בחתימתי אני מאשר/ת שקראתי והבנתי את תנאי ההסכם.`.trim();

export const DEFAULT_QUESTIONNAIRE_FIELDS: QuestionField[] = [
  { key: "age", label: "גיל", type: "number", required: true, min: 14, max: 100 },
  { key: "heightCm", label: "גובה (ס״מ)", type: "number", required: true, min: 100, max: 250 },
  { key: "weightKg", label: "משקל (ק״ג)", type: "number", required: true, min: 30, step: 0.1 },
  {
    key: "sessionsPerWeek",
    label: "אימונים בשבוע",
    type: "number",
    required: true,
    min: 1,
    max: 7,
  },
  {
    key: "goal",
    label: "מטרת האימון",
    type: "textarea",
    required: true,
    placeholder: "לדוגמה: עלייה במסת שריר",
  },
  { key: "experience", label: "ניסיון באימונים", type: "textarea", required: true },
  {
    key: "injuries",
    label: "פציעות / מגבלות",
    type: "textarea",
    required: false,
    placeholder: "אין / פרט...",
  },
  {
    key: "equipment",
    label: "ציוד זמין",
    type: "textarea",
    required: true,
    placeholder: "חדר כושר / בית / משקולות...",
  },
];

export type CoachOnboardingTemplateData = {
  questionnaireFields: QuestionField[];
  agreementText: string;
  updatedAt: string;
};

export function parseQuestionFields(value: unknown): QuestionField[] {
  if (!Array.isArray(value)) return DEFAULT_QUESTIONNAIRE_FIELDS;
  const parsed = value.filter(
    (item): item is QuestionField =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as QuestionField).key === "string" &&
      typeof (item as QuestionField).label === "string" &&
      ["number", "text", "textarea"].includes((item as QuestionField).type),
  );
  return parsed.length > 0 ? parsed : DEFAULT_QUESTIONNAIRE_FIELDS;
}

export function legacyFieldsFromAnswers(answers: Record<string, unknown>) {
  const num = (key: string) => {
    const v = answers[key];
    if (v === "" || v == null) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };
  const str = (key: string) => {
    const v = answers[key];
    return v == null ? null : String(v).trim() || null;
  };

  return {
    age: num("age"),
    heightCm: num("heightCm"),
    weightKg: num("weightKg"),
    sessionsPerWeek: num("sessionsPerWeek"),
    goal: str("goal"),
    experience: str("experience"),
    injuries: str("injuries"),
    equipment: str("equipment"),
  };
}

export function answersFromLegacyResponse(response: {
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: string | null;
  experience: string | null;
  injuries: string | null;
  sessionsPerWeek: number | null;
  equipment: string | null;
}): Record<string, string | number | null> {
  return {
    age: response.age,
    heightCm: response.heightCm,
    weightKg: response.weightKg,
    sessionsPerWeek: response.sessionsPerWeek,
    goal: response.goal,
    experience: response.experience,
    injuries: response.injuries,
    equipment: response.equipment,
  };
}

export function formatAnswerValue(value: unknown, field: QuestionField): string {
  if (value == null || value === "") return "—";
  if (field.type === "number" && field.key === "heightCm") return `${value} ס״מ`;
  if (field.type === "number" && field.key === "weightKg") return `${value} ק״ג`;
  return String(value);
}
