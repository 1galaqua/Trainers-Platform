import { cn } from "@/lib/utils";
import type { TraineeStatus } from "@/lib/trainee-status";

type TraineeStatusIndicatorProps = {
  status: TraineeStatus;
  className?: string;
  title?: string;
};

const statusLabels: Record<TraineeStatus, string> = {
  active: "פעיל — יש אימונים בתוקף ותקופת ליווי פעילה",
  inactive: "לא פעיל — מכסה הסתיימה או תקופת הליווי פגה",
};

export function TraineeStatusIndicator({ status, className, title }: TraineeStatusIndicatorProps) {
  const isActive = status === "active";

  return (
    <span
      className={cn(
        "inline-block size-3 shrink-0 rounded-full",
        isActive ? "bg-emerald-500" : "bg-red-500",
        className,
      )}
      title={title ?? statusLabels[status]}
      aria-label={title ?? statusLabels[status]}
    />
  );
}
