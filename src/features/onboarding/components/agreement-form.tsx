"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
        {content}
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1"
        />
        קראתי ואני מסכים/ה לתנאי ההסכם
      </label>

      <div className="space-y-2">
        <Label>חתימה דיגיטלית</Label>
        <SignaturePad onChange={setSignature} />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={loading || !agreed || !signature}>
        {loading ? "שומר..." : isRedo ? "שמירת חתימה מעודכנת" : "חתימה וסיום"}
      </Button>
    </form>
  );
}
