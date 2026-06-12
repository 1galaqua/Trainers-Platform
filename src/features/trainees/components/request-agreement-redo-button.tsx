"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requestAgreementRedoAction } from "@/server/actions/trainees";

type RequestAgreementRedoButtonProps = {
  traineeId: string;
  agreementRedoPending: boolean;
  hasAgreement: boolean;
  size?: "sm" | "default";
  variant?: "outline" | "secondary";
  className?: string;
};

export function RequestAgreementRedoButton({
  traineeId,
  agreementRedoPending,
  hasAgreement,
  size = "sm",
  variant = "outline",
  className,
}: RequestAgreementRedoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hasAgreement) return null;

  async function handleClick() {
    if (agreementRedoPending) return;

    setLoading(true);
    setError(null);
    const result = await requestAgreementRedoAction(traineeId);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={loading || agreementRedoPending}
        onClick={handleClick}
        className={cn(className)}
      >
        {agreementRedoPending
          ? "ממתין לחתימת הסכם מחדש"
          : loading
            ? "שולח..."
            : "בקש חתימת הסכם מחדש"}
      </Button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
