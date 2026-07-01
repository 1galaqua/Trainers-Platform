"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { BODY_WEIGHT_MAX_KG, BODY_WEIGHT_MIN_KG } from "@/lib/body-weight-validation";
import { MEASUREMENT_MAX_CM, MEASUREMENT_MIN_CM } from "@/lib/measurements-validation";
import { sleepHoursToRange } from "@/lib/sleep-validation";
import { STEPS_MAX, STEPS_MIN } from "@/lib/steps-validation";
import { CALORIES_MAX, CALORIES_MIN } from "@/lib/calories-validation";
import {
  buildSavedCellFromDraft,
  trackingGridRowId,
} from "@/lib/tracking-cell-client-update";
import type { TrackingWeekCell } from "@/lib/tracking-week-data";
import {
  parseWaterAmountMl,
  WATER_MAX_ML,
  WATER_MIN_ML,
} from "@/lib/water-validation";
import {
  clearTrackingCellAction,
  upsertTrackingBodyWeightAction,
  upsertTrackingMeasurementFieldAction,
  upsertTrackingSleepAction,
  upsertTrackingStepsAction,
  upsertTrackingCaloriesAction,
  upsertTrackingWaterAction,
} from "@/server/actions/tracking-cells";

type TrackingGridCellProps = {
  traineeId: string;
  cell: TrackingWeekCell;
  onCellSaved?: (rowId: string, date: string, updated: TrackingWeekCell) => void;
};

function getEditValue(cell: TrackingWeekCell) {
  if (cell.raw == null) return "";
  switch (cell.kind) {
    case "water":
      return String(cell.raw);
    case "steps":
      return String(Math.round(cell.raw));
    case "calories":
      return String(Math.round(cell.raw));
    default:
      return String(cell.raw);
  }
}

function valuesEqual(cell: TrackingWeekCell, draft: string) {
  const trimmed = draft.trim();
  if (trimmed === "") return cell.raw == null;
  const parsed = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(parsed)) return false;

  switch (cell.kind) {
    case "water": {
      const amountMl = parseWaterAmountMl(trimmed);
      return amountMl !== null && amountMl === cell.raw;
    }
    case "steps":
      return Math.round(parsed) === cell.raw;
    case "calories":
      return Math.round(parsed) === cell.raw;
    default:
      return parsed === cell.raw;
  }
}

async function saveCell(traineeId: string, cell: TrackingWeekCell, draft: string) {
  const trimmed = draft.trim();

  if (trimmed === "") {
    if (cell.raw == null) return { success: true as const };
    return clearTrackingCellAction(traineeId, cell.kind, cell.date, cell.fieldKey);
  }

  const formData = new FormData();
  formData.set("date", cell.date);

  switch (cell.kind) {
    case "body-weight":
      formData.set("weightKg", trimmed);
      return upsertTrackingBodyWeightAction(traineeId, formData);
    case "sleep": {
      const hours = Number(trimmed.replace(",", "."));
      if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
        return { error: "יש להזין שעות שינה תקינות" };
      }
      const { sleepStart, sleepEnd } = sleepHoursToRange(hours, cell.sleepEnd ?? "07:00");
      formData.set("sleepStart", sleepStart);
      formData.set("sleepEnd", sleepEnd);
      return upsertTrackingSleepAction(traineeId, formData);
    }
    case "water":
      formData.set("amountMl", trimmed);
      return upsertTrackingWaterAction(traineeId, formData);
    case "steps":
      formData.set("steps", trimmed);
      return upsertTrackingStepsAction(traineeId, formData);
    case "calories":
      formData.set("calories", trimmed);
      return upsertTrackingCaloriesAction(traineeId, formData);
    case "measurement":
      if (cell.fieldKey) formData.set("fieldKey", cell.fieldKey);
      formData.set("valueCm", trimmed);
      return upsertTrackingMeasurementFieldAction(traineeId, formData);
    default:
      return { error: "סוג לא תקין" };
  }
}

function inputModeForKind(kind: TrackingWeekCell["kind"]) {
  switch (kind) {
    case "steps":
    case "calories":
    case "water":
      return "numeric";
    case "body-weight":
    case "sleep":
    case "measurement":
      return "decimal";
    default:
      return "text";
  }
}

function stepForKind(kind: TrackingWeekCell["kind"]) {
  switch (kind) {
    case "steps":
    case "calories":
      return "1";
    case "water":
      return "50";
    case "sleep":
      return "0.5";
    default:
      return "0.1";
  }
}

function minForKind(kind: TrackingWeekCell["kind"]) {
  switch (kind) {
    case "body-weight":
      return BODY_WEIGHT_MIN_KG;
    case "measurement":
      return MEASUREMENT_MIN_CM;
    case "steps":
      return STEPS_MIN;
    case "calories":
      return CALORIES_MIN;
    case "water":
      return WATER_MIN_ML;
    default:
      return 0;
  }
}

function maxForKind(kind: TrackingWeekCell["kind"]) {
  switch (kind) {
    case "body-weight":
      return BODY_WEIGHT_MAX_KG;
    case "measurement":
      return MEASUREMENT_MAX_CM;
    case "steps":
      return STEPS_MAX;
    case "calories":
      return CALORIES_MAX;
    case "sleep":
      return 24;
    case "water":
      return WATER_MAX_ML;
    default:
      return undefined;
  }
}

export function TrackingGridCell({ traineeId, cell, onCellSaved }: TrackingGridCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(getEditValue(cell));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setDraft(getEditValue(cell));
    setError(false);
  }, [cell]);

  async function commit() {
    if (saving || !cell.editable) return;
    if (valuesEqual(cell, draft)) return;

    const parsed = buildSavedCellFromDraft(cell, draft);
    if ("error" in parsed) {
      setError(true);
      return;
    }

    setSaving(true);
    setError(false);
    const result = await saveCell(traineeId, cell, draft);
    setSaving(false);

    if (result && "error" in result && result.error) {
      setError(true);
      return;
    }

    onCellSaved?.(trackingGridRowId(cell), cell.date, parsed);
  }

  if (!cell.editable) {
    return (
      <span
        className={cn(
          "flex h-12 w-full min-w-[5rem] items-center justify-center rounded-md border px-1 text-center text-xs tabular-nums opacity-60",
          cell.raw != null ? "tracking-grid-cell-filled" : "tracking-grid-cell-empty",
        )}
      >
        {cell.display}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={inputModeForKind(cell.kind)}
      step={stepForKind(cell.kind)}
      min={minForKind(cell.kind)}
      max={maxForKind(cell.kind)}
      value={draft}
      disabled={saving}
      placeholder="—"
      aria-label={
        cell.display === "—"
          ? cell.kind === "water"
            ? 'הזנת שתייה במ"ל'
            : "הזנת ערך"
          : cell.display
      }
      title={error ? "שמירה נכשלה — נסה/י שוב" : undefined}
      onChange={(event) => {
        setDraft(event.target.value);
        setError(false);
      }}
      onBlur={() => void commit()}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          inputRef.current?.blur();
        }
        if (event.key === "Escape") {
          setDraft(getEditValue(cell));
          setError(false);
          inputRef.current?.blur();
        }
      }}
      className={cn(
        "h-12 w-full min-w-[5rem] rounded-md border px-1 text-center text-xs transition-colors tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60",
        error
          ? "border-destructive bg-destructive/5"
          : cell.raw != null || draft.trim() !== ""
            ? "tracking-grid-cell-filled"
            : "tracking-grid-cell-empty",
      )}
    />
  );
}
