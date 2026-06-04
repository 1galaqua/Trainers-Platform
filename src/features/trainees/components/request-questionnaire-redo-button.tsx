"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { requestQuestionnaireRedoAction } from "@/server/actions/trainees";

type RequestQuestionnaireRedoButtonProps = {
  traineeId: string;
  questionnaireRedoPending: boolean;
  hasQuestionnaire: boolean;
  size?: "sm" | "default";
  variant?: "outline" | "secondary";
};

export function RequestQuestionnaireRedoButton({
  traineeId,
  questionnaireRedoPending,
  hasQuestionnaire,
  size = "sm",
  variant = "outline",
}: RequestQuestionnaireRedoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hasQuestionnaire) return null;

  async function handleClick() {
    if (questionnaireRedoPending) return;

    setLoading(true);
    setError(null);
    const result = await requestQuestionnaireRedoAction(traineeId);
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
        disabled={loading || questionnaireRedoPending}
        onClick={handleClick}
      >
        {questionnaireRedoPending
          ? "ממתין למילוי שאלון מחדש"
          : loading
            ? "שולח..."
            : "בקש מילוי שאלון מחדש"}
      </Button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
