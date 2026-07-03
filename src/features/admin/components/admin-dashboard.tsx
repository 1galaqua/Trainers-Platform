"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { AdminCoachStat } from "@/lib/admin-stats";

type AdminDashboardProps = {
  coaches: AdminCoachStat[];
  adminName?: string | null;
};

type TraineeViewFilter = "all" | "active" | "inactive";

export function AdminDashboard({ coaches, adminName }: AdminDashboardProps) {
  const [coachFilter, setCoachFilter] = useState("all");
  const [traineeViewFilter, setTraineeViewFilter] = useState<TraineeViewFilter>("all");

  const filteredCoaches = useMemo(() => {
    if (coachFilter === "all") return coaches;
    return coaches.filter((coach) => coach.id === coachFilter);
  }, [coachFilter, coaches]);

  const totalTrainees = coaches.reduce((sum, coach) => sum + coach.traineeCount, 0);
  const totalActiveTrainees = coaches.reduce((sum, coach) => sum + coach.activeTraineeCount, 0);
  const selectedCoach = coachFilter === "all" ? null : coaches.find((c) => c.id === coachFilter);

  const displayedTrainees = useMemo(() => {
    if (!selectedCoach) return [];
    if (traineeViewFilter === "active") {
      return selectedCoach.trainees.filter((t) => t.status === "active");
    }
    if (traineeViewFilter === "inactive") {
      return selectedCoach.trainees.filter((t) => t.status === "inactive");
    }
    return selectedCoach.trainees;
  }, [selectedCoach, traineeViewFilter]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">ניהול מאמנים</h1>
        <p className="mt-1 text-muted-foreground text-base">
          {adminName ? `שלום ${adminName} — ` : ""}
          סקירת מאמנים, מתאמנים פעילים ולא פעילים
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-base">מתאמנים פעילים</CardTitle>
            <CardDescription>בתקופת ליווי + מכסת אימונים</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-3xl text-green-600 dark:text-green-400">
              {totalActiveTrainees}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">מתאמנים</CardTitle>
            <CardDescription>סה״כ משויכים</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-3xl">{totalTrainees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">לא פעילים</CardTitle>
            <CardDescription>מכסה או תקופה הסתיימו</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-3xl text-muted-foreground">
              {totalTrainees - totalActiveTrainees}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-2 sm:max-w-sm sm:flex-1">
            <label htmlFor="coach-filter" className="font-medium text-sm">
              סינון לפי מאמן/ית
            </label>
            <Select
              id="coach-filter"
              value={coachFilter}
              onChange={(e) => {
                setCoachFilter(e.target.value);
                setTraineeViewFilter("all");
              }}
            >
              <option value="all">כל המאמנים ({coaches.length})</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.displayName ?? coach.email ?? "ללא שם"} — {coach.activeTraineeCount}{" "}
                  פעילים / {coach.traineeCount} סה״כ
                </option>
              ))}
            </Select>
          </div>

          {selectedCoach && (
            <div className="flex flex-col gap-2 sm:max-w-xs sm:flex-1">
              <label htmlFor="trainee-status-filter" className="font-medium text-sm">
                סטטוס מתאמנים
              </label>
              <Select
                id="trainee-status-filter"
                value={traineeViewFilter}
                onChange={(e) => setTraineeViewFilter(e.target.value as TraineeViewFilter)}
              >
                <option value="all">כל המתאמנים ({selectedCoach.traineeCount})</option>
                <option value="active">פעילים ({selectedCoach.activeTraineeCount})</option>
                <option value="inactive">לא פעילים ({selectedCoach.inactiveTraineeCount})</option>
              </Select>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-border border-b bg-muted/40 text-start">
                <th className="px-4 py-3 font-medium">מאמן/ית</th>
                <th className="px-4 py-3 font-medium">אימייל</th>
                <th className="px-4 py-3 font-medium">טלפון</th>
                <th className="px-4 py-3 font-medium text-center">פעילים</th>
                <th className="px-4 py-3 font-medium text-center">סה״כ</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoaches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
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
                    <td className="px-4 py-3 text-center font-semibold text-green-600 dark:text-green-400">
                      {coach.activeTraineeCount}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{coach.traineeCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedCoach && (
          <div className="space-y-3">
            <h2 className="font-semibold text-lg">
              מתאמנים של {selectedCoach.displayName ?? selectedCoach.email}
              {traineeViewFilter === "active" && " — פעילים"}
              {traineeViewFilter === "inactive" && " — לא פעילים"}
            </h2>

            {displayedTrainees.length === 0 ? (
              <p className="text-muted-foreground text-base">אין מתאמנים להצגה בסינון הנוכחי.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-border border-b bg-muted/40 text-start">
                      <th className="px-4 py-3 font-medium">שם</th>
                      <th className="px-4 py-3 font-medium">אימייל</th>
                      <th className="px-4 py-3 font-medium text-center">סטטוס</th>
                      <th className="px-4 py-3 font-medium text-center">אימונים נותרו</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedTrainees.map((trainee) => (
                      <tr key={trainee.id} className="border-border border-b last:border-0">
                        <td className="px-4 py-3">{trainee.displayName ?? "—"}</td>
                        <td className="px-4 py-3" dir="ltr">
                          {trainee.email ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={trainee.status === "active" ? "default" : "outline"}
                            className={
                              trainee.status === "active"
                                ? "bg-green-600 text-white hover:bg-green-600/90"
                                : undefined
                            }
                          >
                            {trainee.status === "active" ? "פעיל" : "לא פעיל"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">{trainee.workoutsRemaining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
