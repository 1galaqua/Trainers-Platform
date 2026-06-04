import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { buildOnboardingExportHtml } from "@/lib/onboarding-export-html";
import { fetchTraineeOnboardingExportData } from "@/lib/fetch-onboarding-export";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user || user.role !== "COACH") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: traineeId } = await context.params;
  const data = await fetchTraineeOnboardingExportData(user.id, traineeId);

  if (!data) {
    return new NextResponse(
      `<!DOCTYPE html><html lang="he" dir="rtl"><body style="font-family:Arial;padding:2rem"><h1>לא ניתן להוריד</h1><p>המתאמן טרם השלים את השאלון והחתימה, או שאין הרשאה.</p><p><a href="javascript:history.back()">חזרה</a></p></body></html>`,
      {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }

  const html = buildOnboardingExportHtml(data);
  const safeName =
    data.traineeName.replace(/[^\w\u0590-\u05FF\s-]/g, "").trim() || "trainee";

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="onboarding-${safeName}.html"`,
      "Cache-Control": "no-store",
    },
  });
}
