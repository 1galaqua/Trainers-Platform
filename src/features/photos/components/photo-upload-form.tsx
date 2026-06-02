"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { photoCategoryLabels } from "@/lib/program-labels";
import { uploadProgressPhotoAction } from "@/server/actions/photos";

type PhotoUploadFormProps = {
  remainingThisWeek: number;
};

export function PhotoUploadForm({ remainingThisWeek }: PhotoUploadFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (remainingThisWeek <= 0) {
      setError("הגעת למכסת 3 תמונות השבוע");
      return;
    }

    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setError("יש לבחור תמונה");
      setLoading(false);
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData });
    if (!uploadRes.ok) {
      setError("שגיאה בהעלאת הקובץ");
      setLoading(false);
      return;
    }

    const { url } = (await uploadRes.json()) as { url: string };
    const formData = new FormData(form);
    formData.set("imageUrl", url);

    const result = await uploadProgressPhotoAction(formData);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border p-4">
      <p className="text-muted-foreground text-sm">
        נותרו {remainingThisWeek} תמונות השבוע (מקסימום 3)
      </p>
      <div className="space-y-2">
        <Label htmlFor="category">קטגוריה</Label>
        <Select id="category" name="category" required defaultValue="FRONT">
          {Object.entries(photoCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">תמונה</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept="image/*"
          required
          className="block w-full text-sm"
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={loading || remainingThisWeek <= 0}>
        {loading ? "מעלה..." : "העלאת תמונה"}
      </Button>
    </form>
  );
}
