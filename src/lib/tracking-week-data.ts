import { computeSleepHours } from "@/lib/sleep-validation";
import { formatCaloriesDisplay } from "@/lib/calories-validation";
import { formatStepsDisplay } from "@/lib/steps-validation";
import { MEASUREMENT_FIELDS, type MeasurementFieldKey } from "@/lib/measurements-validation";
import { buildWeekDayHeaders, averageNumbers } from "@/lib/tracking-week-navigation";
import { mlToLitersInput } from "@/lib/water-validation";

export type TrackingWeekCell = {
  date: string;
  raw: number | null;
  display: string;
  editable: boolean;
  kind: TrackingWeekRowKind;
  fieldKey?: MeasurementFieldKey;
  sleepStart?: string;
  sleepEnd?: string;
};

export type TrackingWeekRowKind =
  | "body-weight"
  | "sleep"
  | "water"
  | "steps"
  | "calories"
  | "measurement";

export type TrackingWeekRow = {
  id: string;
  label: string;
  kind: TrackingWeekRowKind;
  fieldKey?: MeasurementFieldKey;
  cells: TrackingWeekCell[];
  weeklyAverage: { raw: number | null; display: string };
};

export type TrackingWeekGrid = {
  days: ReturnType<typeof buildWeekDayHeaders>;
  rows: TrackingWeekRow[];
};

export type TrackingWeekRawLogs = {
  bodyWeightByDay: Map<string, number>;
  sleepHoursByDay: Map<string, number>;
  sleepTimesByDay: Map<string, { sleepStart: string; sleepEnd: string }>;
  waterMlByDay: Map<string, number>;
  stepsByDay: Map<string, number>;
  caloriesByDay: Map<string, number>;
  measurementsByDay: Map<string, Partial<Record<MeasurementFieldKey, number>>>;
};

function formatWeightKg(value: number) {
  return Number.isInteger(value) ? `${value} ק"ג` : `${value.toFixed(1)} ק"ג`;
}

function formatSleepHours(value: number) {
  return `${value.toFixed(1)} ש'`;
}

function formatLitersFromMl(ml: number) {
  const liters = mlToLitersInput(ml);
  return `${liters.toLocaleString("he-IL")} ל'`;
}

function formatMeasurementCm(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function emptyDisplay() {
  return "—";
}

function buildCell(
  date: string,
  raw: number | null,
  display: string,
  editable: boolean,
  kind: TrackingWeekRowKind,
  fieldKey?: MeasurementFieldKey,
  extras?: Pick<TrackingWeekCell, "sleepStart" | "sleepEnd">,
): TrackingWeekCell {
  return { date, raw, display, editable, kind, fieldKey, ...extras };
}

export function buildTrackingWeekRawLogs(params: {
  bodyWeightLogs: Array<{ recordedDay: string; weightKg: number }>;
  sleepLogs: Array<{ recordedDay: string; sleepStart: string; sleepEnd: string }>;
  waterLogs: Array<{ recordedDay: string; amountMl: number }>;
  stepsLogs: Array<{ recordedDay: string; steps: number }>;
  caloriesLogs: Array<{ recordedDay: string; calories: number }>;
  measurementsLogs: Array<
    { recordedDay: string } & Partial<Record<MeasurementFieldKey, number | null>>
  >;
}): TrackingWeekRawLogs {
  const bodyWeightByDay = new Map<string, number>();
  for (const log of params.bodyWeightLogs) {
    bodyWeightByDay.set(log.recordedDay, log.weightKg);
  }

  const sleepHoursByDay = new Map<string, number>();
  const sleepTimesByDay = new Map<string, { sleepStart: string; sleepEnd: string }>();
  for (const log of params.sleepLogs) {
    sleepHoursByDay.set(log.recordedDay, computeSleepHours(log.sleepStart, log.sleepEnd));
    sleepTimesByDay.set(log.recordedDay, {
      sleepStart: log.sleepStart,
      sleepEnd: log.sleepEnd,
    });
  }

  const waterMlByDay = new Map<string, number>();
  for (const log of params.waterLogs) {
    waterMlByDay.set(log.recordedDay, log.amountMl);
  }

  const stepsByDay = new Map<string, number>();
  for (const log of params.stepsLogs) {
    stepsByDay.set(log.recordedDay, log.steps);
  }

  const caloriesByDay = new Map<string, number>();
  for (const log of params.caloriesLogs) {
    caloriesByDay.set(log.recordedDay, log.calories);
  }

  const measurementsByDay = new Map<string, Partial<Record<MeasurementFieldKey, number>>>();
  for (const log of params.measurementsLogs) {
    const entry: Partial<Record<MeasurementFieldKey, number>> = {};
    for (const field of MEASUREMENT_FIELDS) {
      const value = log[field.key];
      if (value != null) entry[field.key] = value;
    }
    measurementsByDay.set(log.recordedDay, entry);
  }

  return {
    bodyWeightByDay,
    sleepHoursByDay,
    sleepTimesByDay,
    waterMlByDay,
    stepsByDay,
    caloriesByDay,
    measurementsByDay,
  };
}

function isEditable(isFuture: boolean, canEdit: boolean) {
  return canEdit && !isFuture;
}

export function buildDailyTrackingWeekGrid(
  weekStart: string,
  raw: TrackingWeekRawLogs,
  canEdit: boolean,
  now = new Date(),
): TrackingWeekGrid {
  const days = buildWeekDayHeaders(weekStart, now);
  const dayDates = days.map((day) => day.date);

  const rowDefs: Array<{
    id: string;
    label: string;
    kind: TrackingWeekRowKind;
    getValue: (date: string) => number | null;
    format: (value: number) => string;
    averageDecimals: number;
  }> = [
    {
      id: "body-weight",
      label: "משקל גוף",
      kind: "body-weight",
      getValue: (date) => raw.bodyWeightByDay.get(date) ?? null,
      format: formatWeightKg,
      averageDecimals: 1,
    },
    {
      id: "sleep",
      label: "שינה",
      kind: "sleep",
      getValue: (date) => raw.sleepHoursByDay.get(date) ?? null,
      format: formatSleepHours,
      averageDecimals: 1,
    },
    {
      id: "water",
      label: "שתייה",
      kind: "water",
      getValue: (date) => raw.waterMlByDay.get(date) ?? null,
      format: (value) => formatLitersFromMl(value),
      averageDecimals: 1,
    },
    {
      id: "steps",
      label: "צעדים",
      kind: "steps",
      getValue: (date) => raw.stepsByDay.get(date) ?? null,
      format: (value) => formatStepsDisplay(value),
      averageDecimals: 0,
    },
    {
      id: "calories",
      label: "קלוריות",
      kind: "calories",
      getValue: (date) => raw.caloriesByDay.get(date) ?? null,
      format: (value) => formatCaloriesDisplay(value),
      averageDecimals: 0,
    },
  ];

  const rows: TrackingWeekRow[] = rowDefs.map((rowDef) => {
    const rawValues = dayDates.map((date) => rowDef.getValue(date));
    const cells = days.map((day, index) => {
      const value = rawValues[index];
      const sleepTimes = rowDef.kind === "sleep" ? raw.sleepTimesByDay.get(day.date) : undefined;
      return buildCell(
        day.date,
        value,
        value == null ? emptyDisplay() : rowDef.format(value),
        isEditable(day.isFuture, canEdit),
        rowDef.kind,
        undefined,
        sleepTimes,
      );
    });

    const avgRaw =
      rowDef.kind === "water"
        ? averageNumbers(
            rawValues.map((value) => (value == null ? null : mlToLitersInput(value))),
            rowDef.averageDecimals,
          )
        : averageNumbers(rawValues, rowDef.averageDecimals);

    const avgDisplay =
      avgRaw == null
        ? emptyDisplay()
        : rowDef.kind === "water"
          ? `${avgRaw.toLocaleString("he-IL")} ל'`
          : rowDef.kind === "steps"
            ? formatStepsDisplay(avgRaw)
            : rowDef.kind === "calories"
              ? formatCaloriesDisplay(avgRaw)
              : rowDef.kind === "sleep"
              ? formatSleepHours(avgRaw)
              : formatWeightKg(avgRaw);

    return {
      id: rowDef.id,
      label: rowDef.label,
      kind: rowDef.kind,
      cells,
      weeklyAverage: { raw: avgRaw, display: avgDisplay },
    };
  });

  return { days, rows };
}

export function buildMeasurementsTrackingWeekGrid(
  weekStart: string,
  raw: TrackingWeekRawLogs,
  canEdit: boolean,
  now = new Date(),
): TrackingWeekGrid {
  const days = buildWeekDayHeaders(weekStart, now);
  const dayDates = days.map((day) => day.date);

  const rows: TrackingWeekRow[] = MEASUREMENT_FIELDS.map((field) => {
    const rawValues = dayDates.map((date) => {
      const dayLog = raw.measurementsByDay.get(date);
      return dayLog?.[field.key] ?? null;
    });

    const cells = days.map((day, index) => {
      const value = rawValues[index];
      return buildCell(
        day.date,
        value,
        value == null ? emptyDisplay() : formatMeasurementCm(value),
        isEditable(day.isFuture, canEdit),
        "measurement",
        field.key,
      );
    });

    const avgRaw = averageNumbers(rawValues, 1);
    return {
      id: field.key,
      label: field.label,
      kind: "measurement" as const,
      fieldKey: field.key,
      cells,
      weeklyAverage: {
        raw: avgRaw,
        display: avgRaw == null ? emptyDisplay() : formatMeasurementCm(avgRaw),
      },
    };
  });

  return { days, rows };
}
