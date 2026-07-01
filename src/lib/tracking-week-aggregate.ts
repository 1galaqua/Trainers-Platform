import { ObjectId } from "mongodb";

import { getMongoDb } from "@/lib/mongodb";
import { MEASUREMENT_FIELDS } from "@/lib/measurements-validation";
import { prisma } from "@/lib/prisma";

export type WeekLogsPayload = {
  bodyWeightLogs: Array<{ recordedDay: string; weightKg: number }>;
  sleepLogs: Array<{ recordedDay: string; sleepStart: string; sleepEnd: string }>;
  waterLogs: Array<{ recordedDay: string; amountMl: number }>;
  stepsLogs: Array<{ recordedDay: string; steps: number }>;
  caloriesLogs: Array<{ recordedDay: string; calories: number }>;
  measurementsLogs: Array<
    { recordedDay: string } & Partial<Record<(typeof MEASUREMENT_FIELDS)[number]["key"], number | null>>
  >;
};

const TRACKING_LOG_COLLECTIONS = {
  bodyWeightLogs: "BodyWeightLog",
  sleepLogs: "SleepLog",
  waterLogs: "WaterLog",
  stepsLogs: "StepsLog",
  caloriesLogs: "CaloriesLog",
  measurementsLogs: "MeasurementsLog",
} as const;

type FacetKey = keyof typeof TRACKING_LOG_COLLECTIONS;

function lookupBranch(collection: string, traineeObjectId: ObjectId, weekStart: string, weekEnd: string) {
  return [
    {
      $lookup: {
        from: collection,
        pipeline: [
          {
            $match: {
              traineeId: traineeObjectId,
              recordedDay: { $gte: weekStart, $lte: weekEnd },
            },
          },
        ],
        as: "rows",
      },
    },
    { $unwind: { path: "$rows", preserveNullAndEmptyArrays: false } },
    { $replaceRoot: { newRoot: "$rows" } },
  ];
}

function mapMeasurementsLog(doc: Record<string, unknown>) {
  const entry: WeekLogsPayload["measurementsLogs"][number] = {
    recordedDay: String(doc.recordedDay),
  };

  for (const field of MEASUREMENT_FIELDS) {
    const value = doc[field.key];
    if (typeof value === "number") {
      entry[field.key] = value;
    }
  }

  return entry;
}

function mapFacetResults(result: Partial<Record<FacetKey, unknown[]>>): WeekLogsPayload {
  const bodyWeightLogs = (result.bodyWeightLogs ?? []).map((doc) => {
    const row = doc as Record<string, unknown>;
    return {
      recordedDay: String(row.recordedDay),
      weightKg: Number(row.weightKg),
    };
  });

  const sleepLogs = (result.sleepLogs ?? []).map((doc) => {
    const row = doc as Record<string, unknown>;
    return {
      recordedDay: String(row.recordedDay),
      sleepStart: String(row.sleepStart),
      sleepEnd: String(row.sleepEnd),
    };
  });

  const waterLogs = (result.waterLogs ?? []).map((doc) => {
    const row = doc as Record<string, unknown>;
    return {
      recordedDay: String(row.recordedDay),
      amountMl: Number(row.amountMl),
    };
  });

  const stepsLogs = (result.stepsLogs ?? []).map((doc) => {
    const row = doc as Record<string, unknown>;
    return {
      recordedDay: String(row.recordedDay),
      steps: Number(row.steps),
    };
  });

  const caloriesLogs = (result.caloriesLogs ?? []).map((doc) => {
    const row = doc as Record<string, unknown>;
    return {
      recordedDay: String(row.recordedDay),
      calories: Number(row.calories),
    };
  });

  const measurementsLogs = (result.measurementsLogs ?? []).map((doc) =>
    mapMeasurementsLog(doc as Record<string, unknown>),
  );

  return {
    bodyWeightLogs,
    sleepLogs,
    waterLogs,
    stepsLogs,
    caloriesLogs,
    measurementsLogs,
  };
}

async function loadWeekLogsPayloadWithAggregate(
  traineeId: string,
  weekStart: string,
  weekEnd: string,
): Promise<WeekLogsPayload> {
  const db = await getMongoDb();
  const traineeObjectId = new ObjectId(traineeId);

  const facetStages = Object.fromEntries(
    Object.entries(TRACKING_LOG_COLLECTIONS).map(([key, collection]) => [
      key,
      lookupBranch(collection, traineeObjectId, weekStart, weekEnd),
    ]),
  );

  const cursor = db.collection("BodyWeightLog").aggregate([
    { $documents: [{ _scope: "tracking-week" }] },
    { $facet: facetStages },
  ]);

  const [result] = await cursor.toArray();
  if (!result) {
    return {
      bodyWeightLogs: [],
      sleepLogs: [],
      waterLogs: [],
      stepsLogs: [],
      caloriesLogs: [],
      measurementsLogs: [],
    };
  }

  return mapFacetResults(result as Partial<Record<FacetKey, unknown[]>>);
}

async function loadWeekLogsPayloadWithPrisma(
  traineeId: string,
  weekStart: string,
  weekEnd: string,
): Promise<WeekLogsPayload> {
  const dayRange = { gte: weekStart, lte: weekEnd };
  const [bodyWeightLogs, sleepLogs, waterLogs, stepsLogs, caloriesLogs, measurementsLogs] =
    await Promise.all([
      prisma.bodyWeightLog.findMany({ where: { traineeId, recordedDay: dayRange } }),
      prisma.sleepLog.findMany({ where: { traineeId, recordedDay: dayRange } }),
      prisma.waterLog.findMany({ where: { traineeId, recordedDay: dayRange } }),
      prisma.stepsLog.findMany({ where: { traineeId, recordedDay: dayRange } }),
      prisma.caloriesLog.findMany({ where: { traineeId, recordedDay: dayRange } }),
      prisma.measurementsLog.findMany({ where: { traineeId, recordedDay: dayRange } }),
    ]);

  return {
    bodyWeightLogs,
    sleepLogs,
    waterLogs,
    stepsLogs,
    caloriesLogs,
    measurementsLogs,
  };
}

export async function loadWeekLogsPayload(
  traineeId: string,
  weekStart: string,
  weekEnd: string,
): Promise<WeekLogsPayload> {
  try {
    return await loadWeekLogsPayloadWithAggregate(traineeId, weekStart, weekEnd);
  } catch {
    return loadWeekLogsPayloadWithPrisma(traineeId, weekStart, weekEnd);
  }
}

export { mapFacetResults as mapTrackingWeekFacetResultsForTests };
