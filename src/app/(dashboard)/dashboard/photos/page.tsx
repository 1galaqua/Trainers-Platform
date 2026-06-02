import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { PhotoUploadForm } from "@/features/photos/components/photo-upload-form";
import { requireTraineeOnboarded } from "@/lib/auth";
import { photoCategoryLabels } from "@/lib/program-labels";
import { getMyPhotosAction, getWeeklyPhotoCountAction } from "@/server/actions/photos";

export const metadata = {
  title: `תמונות התקדמות | ${siteConfig.shortName}`,
};

export default async function PhotosPage() {
  await requireTraineeOnboarded();
  const [photos, weeklyCount] = await Promise.all([
    getMyPhotosAction(),
    getWeeklyPhotoCountAction(),
  ]);

  const remaining = Math.max(0, 3 - weeklyCount);

  const byWeek = photos.reduce(
    (acc, photo) => {
      const key = photo.weekStart.toISOString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(photo);
      return acc;
    },
    {} as Record<string, typeof photos>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">תמונות התקדמות</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          העלאה של עד 3 תמונות בשבוע — חזית, צד וגב
        </p>
      </div>

      <PhotoUploadForm remainingThisWeek={remaining} />

      <div className="space-y-6">
        {Object.entries(byWeek).map(([weekKey, weekPhotos]) => (
          <Card key={weekKey}>
            <CardHeader>
              <CardTitle className="text-base">
                שבוע {new Date(weekKey).toLocaleDateString("he-IL")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {weekPhotos.map((photo) => (
                  <div key={photo.id} className="space-y-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.imageUrl}
                      alt={photoCategoryLabels[photo.category]}
                      className="aspect-[3/4] w-full rounded-lg border border-border object-cover"
                    />
                    <p className="text-muted-foreground text-xs">
                      {photoCategoryLabels[photo.category]}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
