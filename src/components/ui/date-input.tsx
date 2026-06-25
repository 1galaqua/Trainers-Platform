"use client";

import * as React from "react";
import { CalendarDays, Clock } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  normalizeTimeInputValue,
  sanitizeTimeInputDraft,
} from "@/lib/tracking-validation";
import { cn } from "@/lib/utils";

function openDatePicker(input: HTMLInputElement | null | undefined) {
  if (!input || input.disabled) return;

  input.focus({ preventScroll: true });

  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
      return;
    } catch {
      // Some browsers reject showPicker outside a direct user gesture.
    }
  }

  input.click();
}

function DateInput({ className, disabled, id, ...props }: React.ComponentProps<typeof Input>) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  function handleIconClick() {
    const input =
      wrapperRef.current?.querySelector<HTMLInputElement>('input[type="date"]') ??
      (document.getElementById(inputId) as HTMLInputElement | null);
    openDatePicker(input);
  }

  return (
    <div
      ref={wrapperRef}
      dir="ltr"
      className={cn(
        "flex h-8 max-h-8 min-h-8 w-full max-w-full min-w-0 items-stretch overflow-hidden rounded-lg border border-input bg-transparent transition-colors dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        "has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50",
        className,
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label="פתיחת בוחר תאריך"
        onClick={handleIconClick}
        className="flex w-8 shrink-0 cursor-pointer items-center justify-center border-input border-r text-muted-foreground disabled:cursor-not-allowed"
      >
        <CalendarDays aria-hidden className="pointer-events-none size-4 shrink-0" />
      </button>
      <Input
        id={inputId}
        type="date"
        disabled={disabled}
        className="input-date-rtl-field h-full min-h-0 flex-1 rounded-none border-0 bg-transparent px-2 py-0 shadow-none focus-visible:ring-0 dark:[color-scheme:dark]"
        {...props}
      />
    </div>
  );
}

function TimeInput({
  className,
  onChange,
  onBlur,
  inputMode,
  placeholder = "17:30",
  autoComplete = "off",
  maxLength = 5,
  ...props
}: React.ComponentProps<typeof Input>) {
  function emitValue(
    event: React.ChangeEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>,
    nextValue: string,
  ) {
    if (onChange && "nativeEvent" in event) {
      event.target.value = nextValue;
      onChange(event as React.ChangeEvent<HTMLInputElement>);
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = sanitizeTimeInputDraft(event.target.value);
    event.target.value = nextValue;
    onChange?.(event);
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    const normalized = normalizeTimeInputValue(event.target.value);
    if (normalized != null && normalized !== event.target.value) {
      event.target.value = normalized;
      emitValue(event, normalized);
    }
    onBlur?.(event);
  }

  return (
    <div
      dir="ltr"
      className={cn(
        "grid w-full max-w-full min-w-0 grid-cols-[2.75rem_minmax(0,1fr)] items-stretch overflow-hidden rounded-lg border border-input bg-transparent transition-colors dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        "has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50",
        className,
      )}
    >
      <div className="flex items-center justify-center border-input border-r text-muted-foreground">
        <Clock aria-hidden className="pointer-events-none size-4 shrink-0" />
      </div>
      <Input
        type="text"
        inputMode={inputMode ?? "numeric"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        pattern="[0-9]{2}:[0-9]{2}"
        title="שעה בפורמט 24 שעות, למשל 17:30"
        className="input-time-rtl-field h-8 w-full min-w-0 rounded-none border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    </div>
  );
}

export { DateInput, TimeInput };
