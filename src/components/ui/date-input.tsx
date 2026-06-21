import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const pickerIndicatorClasses =
  "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-2.5 [&::-webkit-calendar-picker-indicator]:right-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer";

function DateInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Input
        type="date"
        dir="ltr"
        className={cn(
          "min-w-0 py-2 pl-10 pr-3 text-right [color-scheme:light] dark:[color-scheme:dark]",
          pickerIndicatorClasses,
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TimeInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Input
        type="time"
        dir="ltr"
        className={cn(
          "min-w-0 py-2 pl-10 pr-3 text-right [color-scheme:light] dark:[color-scheme:dark]",
          pickerIndicatorClasses,
          className,
        )}
        {...props}
      />
    </div>
  );
}

export { DateInput, TimeInput };
