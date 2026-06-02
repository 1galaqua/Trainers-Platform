import { isOfflineDemoSession } from "@/lib/auth";

export async function OfflineDbBanner() {
  if (!(await isOfflineDemoSession())) return null;

  return (
    <div
      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-950 text-sm dark:text-amber-100"
      role="status"
    >
      <strong>מצב דemo ללא מסד נתונים</strong> — MongoDB Atlas לא מחובר. ניתן לגלוש בממשק, אך
      שמירת נתונים לא תעבוד. ב-Atlas הוסף IP{" "}
      <code className="font-mono text-xs" dir="ltr">
        93.172.248.102
      </code>{" "}
      תחת Network Access.
    </div>
  );
}
