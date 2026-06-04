"use client";

import { useEffect, useState } from "react";

export function VerifyEmailPendingDevLink() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("tp_dev_verify_url");
    if (stored) {
      setUrl(stored);
      sessionStorage.removeItem("tp_dev_verify_url");
    }
  }, []);

  if (!url) return null;

  return (
    <p className="mx-auto max-w-sm rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-center text-xs">
      <span className="font-medium">מצב פיתוח (ללא מייל):</span>{" "}
      <a href={url} className="text-primary underline" dir="ltr">
        לחץ/י לאימות
      </a>
    </p>
  );
}
