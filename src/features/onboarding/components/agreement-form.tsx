"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RequiredFieldError } from "@/features/onboarding/components/required-field-error";
import { SignaturePad } from "@/features/onboarding/components/signature-pad";
import { submitAgreementAction } from "@/server/actions/onboarding";

type AgreementFormProps = {
  content: string;
  isRedo?: boolean;
};

export function AgreementForm({ content, isRedo }: AgreementFormProps) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, true>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function clearFieldError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const errors: Record<string, true> = {};
    if (!agreed) errors.agreed = true;
    if (!signature.startsWith("data:image")) errors.signature = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(null);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setError(null);

    const formData = new FormData();
    if (agreed) formData.set("agreed", "on");
    formData.set("signature", signature);

    const result = await submitAgreementAction(formData);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.push("/dashboard/my-program");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
        {content}
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (e.target.checked) clearFieldError("agreed");
            }}
            className="mt-1"
          />
          קראתי ואני מסכים/ה לתנאי ההסכם
        </label>
        <RequiredFieldError show={Boolean(fieldErrors.agreed)} />
      </div>

      <div className="space-y-2">
        <Label>חתימה דיגיטלית</Label>
        <SignaturePad
          onChange={(value) => {
            setSignature(value);
            if (value.startsWith("data:image")) clearFieldError("signature");
          }}
        />
        <RequiredFieldError show={Boolean(fieldErrors.signature)} />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "שומר..." : isRedo ? "שמירת חתימה מעודכנת" : "חתימה וסיום"}
      </Button>
    </form>
  );
}
