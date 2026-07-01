import { describe, expect, it } from "vitest";

import { buildSavedCellFromDraft, trackingGridRowId } from "@/lib/tracking-cell-client-update";
import type { TrackingWeekCell } from "@/lib/tracking-week-data";

const baseCell: TrackingWeekCell = {
  date: "2026-06-21",
  raw: null,
  display: "—",
  editable: true,
  kind: "body-weight",
};

describe("buildSavedCellFromDraft", () => {
  it("clears a filled cell", () => {
    const cleared = buildSavedCellFromDraft(
      { ...baseCell, raw: 80, display: '80 ק"ג' },
      "",
    );
    expect(cleared).toMatchObject({ raw: null, display: "—" });
  });

  it("parses body weight draft", () => {
    const saved = buildSavedCellFromDraft(baseCell, "80.5");
    expect(saved).toMatchObject({ raw: 80.5 });
    expect(saved).toHaveProperty("display", '80.5 ק"ג');
  });

  it("uses field key as row id for measurements", () => {
    const cell: TrackingWeekCell = {
      ...baseCell,
      kind: "measurement",
      fieldKey: "chestCm",
    };
    expect(trackingGridRowId(cell)).toBe("chestCm");
  });
});
