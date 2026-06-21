import { NextResponse } from "next/server";

import { isSameOriginRequest } from "@/lib/csrf";
import { dbActionErrorMessage } from "@/lib/db-errors";
import {
  resetPasswordByIdentity,
  resetPasswordInputFromFormData,
} from "@/lib/reset-password";
import { getDatabaseUrl, getServerConfigIssue, serverConfigErrorMessage } from "@/lib/server-env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "בקשה לא מורשית" }, { status: 403 });
  }

  const configIssue = getServerConfigIssue();
  if (configIssue === "missing_database_url") {
    return NextResponse.json(
      { error: serverConfigErrorMessage(configIssue) },
      { status: 503 },
    );
  }

  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: serverConfigErrorMessage("missing_database_url") },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const result = await resetPasswordByIdentity(resetPasswordInputFromFormData(formData));

    if ("error" in result) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/auth/forgot-password:", error);
    return NextResponse.json(
      { error: dbActionErrorMessage(error) },
      { status: 500 },
    );
  }
}
