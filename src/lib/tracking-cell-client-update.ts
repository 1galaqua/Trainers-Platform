import { parseBodyWeightKg } from "@/lib/body-weight-validation";
import { parseCalories } from "@/lib/calories-validation";
import { parseMeasurementCm } from "@/lib/measurements-validation";
import { parseSteps } from "@/lib/steps-validation";
import { sleepHoursToRange } from "@/lib/sleep-validation";
import {
  formatTrackingCellDisplay,
  type TrackingWeekCell,
} from "@/lib/tracking-week-data";
import { parseWaterAmountMl } from "@/lib/water-validation";

export function trackingGridRowId(cell: TrackingWeekCell): string {
  return cell.kind === "measurement" ? (cell.fieldKey ?? cell.kind) : cell.kind;
}

export function buildSavedCellFromDraft(
  cell: TrackingWeekCell,
  draft: string,
): TrackingWeekCell | { error: string } {
  const trimmed = draft.trim();

  if (trimmed === "") {
    return {
      ...cell,
      raw: null,
      display: "—",
      sleepStart: undefined,
      sleepEnd: undefined,
    };
  }

  switch (cell.kind) {
    case "body-weight": {
      const raw = parseBodyWeightKg(trimmed);
      if (raw == null) return { error: "ערך לא תקין" };
      return { ...cell, raw, display: formatTrackingCellDisplay(cell.kind, raw) };
    }
    case "sleep": {
      const hours = Number(trimmed.replace(",", "."));
      if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
        return { error: "יש להזין שעות שינה תקינות" };
      }
      const { sleepStart, sleepEnd } = sleepHoursToRange(hours, cell.sleepEnd ?? "07:00");
      return {
        ...cell,
        raw: hours,
        display: formatTrackingCellDisplay(cell.kind, hours),
        sleepStart,
        sleepEnd,
      };
    }
    case "water": {
      const raw = parseWaterAmountMl(trimmed);
      if (raw == null) return { error: "ערך לא תקין" };
      return { ...cell, raw, display: formatTrackingCellDisplay(cell.kind, raw) };
    }
    case "steps": {
      const raw = parseSteps(trimmed);
      if (raw == null) return { error: "ערך לא תקין" };
      return { ...cell, raw, display: formatTrackingCellDisplay(cell.kind, raw) };
    }
    case "calories": {
      const raw = parseCalories(trimmed);
      if (raw == null) return { error: "ערך לא תקין" };
      return { ...cell, raw, display: formatTrackingCellDisplay(cell.kind, raw) };
    }
    case "measurement": {
      const raw = parseMeasurementCm(trimmed);
      if (raw == null) return { error: "ערך לא תקין" };
      return { ...cell, raw, display: formatTrackingCellDisplay(cell.kind, raw) };
    }
    default:
      return { error: "סוג לא תקין" };
  }
}
