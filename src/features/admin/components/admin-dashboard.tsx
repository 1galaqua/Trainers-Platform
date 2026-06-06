"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { AdminCoachStat } from "@/lib/admin-stats";

type AdminDashboardProps = {
  coaches: AdminCoachStat[];
  adminName?: string | null;
};

export function AdminDashboard({ coaches, adminName }: AdminDashboardProps) {
  const [coachFilter, setCoachFilter] = useState("all");

  const filteredCoaches = useMemo(() => {
    if (coachFilter === "all") return coaches;
    return coaches.filter((coach) => coach.id === coachFilter);
  }, [coachFilter, coaches]);

  const totalTrainees = coaches.reduce((sum, coach) => sum + coach.traineeCount, 0);
  const selectedCoach = coachFilter === "all" ? null : coaches.find((c) => c.id === coachFilter);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">ניהול מאמנים</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {adminName ? `שלום ${adminName} — ` : ""}
          סקירת מאמנים ומספר מתאמנים לכל מאמן/ית
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">מאמנים</CardTitle>
            <CardDescription>סה״כ במערכת</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-3xl">{coaches.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">מתאמנים</CardTitle>
            <CardDescription>משויכים למאמנים</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-3xl">{totalTrainees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ממוצע</CardTitle>
            <CardDescription>מתאמנים למאמן</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-3xl">
              {coaches.length > 0 ? (totalTrainees / coaches.length).toFixed(1) : "0"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:max-w-sm">
          <label htmlFor="coach-filter" className="font-medium text-sm">
            סינון לפי מאמן/ית
          </label>
          <Select
            id="coach-filter"
            value={coachFilter}
            onChange={(e) => setCoachFilter(e.target.value)}
          >
            <option value="all">כל המאמנים ({coaches.length})</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.displayName ?? coach.email ?? "ללא שם"} ({coach.traineeCount} מתאמנים)
              </option>
            ))}
          </Select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-border border-b bg-muted/40 text-start">
                <th className="px-4 py-3 font-medium">מאמן/ית</th>
                <th className="px-4 py-3 font-medium">אימייל</th>
                <th className="px-4 py-3 font-medium">טלפון</th>
                <th className="px-4 py-3 font-medium text-center">מתאמנים</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoaches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    {coaches.length === 0 ? "אין מאמנים רשומים במערכת" : "לא נמצאו תוצאות"}
                  </td>
                </tr>
              ) : (
                filteredCoaches.map((coach) => (
                  <tr key={coach.id} className="border-border border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{coach.displayName ?? "—"}</td>
                    <td className="px-4 py-3" dir="ltr">
                      {coach.email ?? "—"}
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      {coach.phoneNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{coach.traineeCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedCoach && selectedCoach.trainees.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-lg">
              מתאמנים של {selectedCoach.displayName ?? selectedCoach.email}
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[360px] text-sm">
                <thead>
                  <tr className="border-border border-b bg-muted/40 text-start">
                    <th className="px-4 py-3 font-medium">שם</th>
                    <th className="px-4 py-3 font-medium">אימייל</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCoach.trainees.map((trainee) => (
                    <tr key={trainee.id} className="border-border border-b last:border-0">
                      <td className="px-4 py-3">{trainee.displayName ?? "—"}</td>
                      <td className="px-4 py-3" dir="ltr">
                        {trainee.email ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
