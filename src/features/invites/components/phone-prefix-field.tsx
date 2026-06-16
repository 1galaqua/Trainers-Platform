"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { digitsOnly, ISRAELI_MOBILE_PREFIXES } from "@/lib/user-identity";

type PhonePrefixFieldProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
};

export function PhonePrefixField({ id, name, value, onChange, invalid }: PhonePrefixFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-[4.75rem] shrink-0">
      <Input
        id={id}
        name={name}
        inputMode="numeric"
        autoComplete="tel-area-code"
        maxLength={3}
        value={value}
        onChange={(e) => onChange(digitsOnly(e.target.value).slice(0, 3))}
        className={cn("pr-7 text-center", invalid && "border-destructive")}
        placeholder="050"
        aria-label="קידומת טלפון"
        aria-expanded={open}
        aria-haspopup="listbox"
      />
      <button
        type="button"
        className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="פתיחת רשימת קידומות"
      >
        <ChevronDown className="size-3.5" />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md"
        >
          {ISRAELI_MOBILE_PREFIXES.map((prefix) => (
            <li key={prefix} role="option" aria-selected={value === prefix}>
              <button
                type="button"
                className="w-full px-2.5 py-1.5 text-center text-sm hover:bg-muted"
                onClick={() => {
                  onChange(prefix);
                  setOpen(false);
                }}
              >
                {prefix}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
