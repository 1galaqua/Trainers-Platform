"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { programTypeLabels } from "@/lib/program-labels";
import type { ProgramType } from "@/lib/prisma-client";

export type CoachProgramListItem = {
  id: string;
  name: string;
  type: ProgramType;
  isActive: boolean;
  traineeId: string;
  traineeName: string | null;
  exerciseCount: number;
  sessionCount: number;
};

type CoachProgramsListProps = {
  programs: CoachProgramListItem[];
};

function traineeLabel(name: string | null) {
  return name?.trim() || "מתאמן";
}

export function CoachProgramsList({ programs }: CoachProgramsListProps) {
  const [traineeId, setTraineeId] = useState<string>("all");
  const [nameQuery, setNameQuery] = useState("");

  const traineeOptions = useMemo(() => {
    const byId = new Map<string, string | null>();
    for (const program of programs) {
      if (!byId.has(program.traineeId)) {
        byId.set(program.traineeId, program.traineeName);
      }
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => traineeLabel(a.name).localeCompare(traineeLabel(b.name), "he"));
  }, [programs]);

  const filtered = useMemo(() => {
    const query = nameQuery.trim().toLowerCase();

    return programs.filter((program) => {
      if (traineeId !== "all" && program.traineeId !== traineeId) return false;

      if (!query) return true;

      const label = traineeLabel(program.traineeName).toLowerCase();
      return label.includes(query) || program.name.toLowerCase().includes(query);
    });
  }, [programs, traineeId, nameQuery]);

  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          אין עדיין תוכניות. צור תוכנית ראשונה למתאמן.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1 space-y-1 sm:max-w-xs">
          <Label htmlFor="program-trainee-filter">סינון לפי מתאמן</Label>
          <Select
            id="program-trainee-filter"
            value={traineeId}
            onChange={(e) => setTraineeId(e.target.value)}
          >
            <option value="all">כל המתאמנים</option>
            {traineeOptions.map((trainee) => (
              <option key={trainee.id} value={trainee.id}>
                {traineeLabel(trainee.name)}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[200px] flex-1 space-y-1 sm:max-w-xs">
          <Label htmlFor="program-name-search">חיפוש לפי שם</Label>
          <Input
            id="program-name-search"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="שם מתאמן או תוכנית..."
          />
        </div>
        <p className="text-muted-foreground text-sm">
          {filtered.length} מתוך {programs.length} תוכניות
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-border py-8 text-center text-muted-foreground text-sm">
          אין תוכניות התואמות לסינון שנבחר
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((program) => (
            <Card
              key={program.id}
              className="relative cursor-pointer overflow-hidden transition-colors hover:border-primary/40 hover:bg-muted/20"
            >
              <Link
                href={`/dashboard/workouts/${program.id}`}
                className="absolute inset-0 z-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`צפייה בתוכנית ${program.name}`}
              />
              <CardHeader className="relative z-[1] pointer-events-none">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{program.name}</CardTitle>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Badge variant="secondary">{programTypeLabels[program.type]}</Badge>
                    {!program.isActive && <Badge variant="outline">לא פעילה</Badge>}
                  </div>
                </div>
                <CardDescription>{traineeLabel(program.traineeName)}</CardDescription>
              </CardHeader>
              <CardContent className="relative z-[1] flex flex-wrap items-center justify-between gap-2">
                <span className="pointer-events-none text-muted-foreground text-xs">
                  {program.exerciseCount} תרגילים · {program.sessionCount} אימונים שבוצעו
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="pointer-events-auto"
                  render={<Link href={`/dashboard/workouts/${program.id}/edit`} />}
                >
                  עריכה
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
