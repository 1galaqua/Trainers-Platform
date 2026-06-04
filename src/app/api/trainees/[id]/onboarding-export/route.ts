import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { buildOnboardingExportHtml } from "@/lib/onboarding-export-html";
import { getTraineeOnboardingExportAction } from "@/server/actions/coach-onboarding";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || session.role !== "COACH") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: traineeId } = await context.params;
  const ownsTrainee = await isCoachOwnerOfTrainee(session.userId, traineeId);
  if (!ownsTrainee) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await getTraineeOnboardingExportAction(traineeId);
  if (!data) {
    return NextResponse.json(
      { error: "המתאמן טרם השלים שאלון או חתימה" },
      { status: 404 },
    );
  }

  const html = buildOnboardingExportHtml(data);
  const safeName = data.traineeName.replace(/[^\w\u0590-\u05FF\s-]/g, "").trim() || "trainee";

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="onboarding-${safeName}.html"`,
    },
  });
}
