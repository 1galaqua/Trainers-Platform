import * as React from "react";
import { CalendarDays, Clock } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function DateInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative min-w-0 w-full">
      <Input
        type="date"
        className={cn("input-date-rtl dark:[color-scheme:dark]", className)}
        {...props}
      />
      <CalendarDays
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

function TimeInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative min-w-0 w-full">
      <Input
        type="time"
        className={cn("input-time-rtl dark:[color-scheme:dark]", className)}
        {...props}
      />
      <Clock
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export { DateInput, TimeInput };
