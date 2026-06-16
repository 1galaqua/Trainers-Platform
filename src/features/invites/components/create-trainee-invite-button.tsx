"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createTraineeInviteAction } from "@/server/actions/invites";
import { buildTraineeInviteWhatsAppMessage } from "@/lib/trainee-invite";

export function CreateTraineeInviteButton() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [coachName, setCoachName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    setCopied(false);

    const result = await createTraineeInviteAction();
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    if (result && "success" in result && result.success) {
      setUrl(result.url);
      setCoachName(result.coachName);
    }
  }

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsAppShare() {
    if (!url || !coachName) return;
    const text = buildTraineeInviteWhatsAppMessage(coachName, url);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setUrl(null);
      setCoachName(null);
      setError(null);
      setCopied(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button>
            <UserPlus className="size-4" />
            צור מתאמן חדש
          </Button>
        }
      />
      <SheetContent
        side="right"
        className="w-full sm:max-w-md [&>button]:top-3 [&>button]:right-auto [&>button]:left-3"
      >
        <SheetHeader>
          <SheetTitle>הזמנת מתאמן חדש</SheetTitle>
          <SheetDescription>
            צור/י קישור הזמנה ייחודי ושלח/י אותו למתאמן/ית בוואטסאפ או בכל דרך אחרת.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {!url ? (
            <>
              <p className="text-muted-foreground text-sm">
                המתאמן/ית ימלא/תמלא שאלון, יחתום/תחתום על ההסכם ויפתח/תפתח חשבון — והוא/היא
                תשויך/תשויך אליך אוטומטית.
              </p>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button className="w-full" onClick={handleCreate} disabled={loading}>
                {loading ? "יוצר קישור..." : "יצירת קישור הזמנה"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="font-medium text-sm">קישור ההזמנה</p>
                <div className="flex gap-2">
                  <Input value={url} readOnly dir="ltr" className="text-xs" />
                  <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>
              <Button className="w-full" variant="outline" onClick={handleWhatsAppShare}>
                <MessageCircle className="size-4" />
                שליחה בוואטסאפ
              </Button>
              <p className="text-muted-foreground text-xs">
                הקישור תקף ל-30 יום וניתן לשימוש חד-פעמי.
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
