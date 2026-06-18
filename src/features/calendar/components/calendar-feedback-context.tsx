"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type CalendarFeedbackContextValue = {
  successMessage: string | null;
  showSuccess: (message: string) => void;
};

const CalendarFeedbackContext = createContext<CalendarFeedbackContextValue | null>(null);

export function CalendarFeedbackProvider({ children }: { children: ReactNode }) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
  }, []);

  useEffect(() => {
    if (!successMessage) return;

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  return (
    <CalendarFeedbackContext.Provider value={{ successMessage, showSuccess }}>
      {children}
    </CalendarFeedbackContext.Provider>
  );
}

export function useCalendarFeedback() {
  const context = useContext(CalendarFeedbackContext);
  if (!context) {
    throw new Error("useCalendarFeedback must be used within CalendarFeedbackProvider");
  }
  return context;
}

export function CalendarSuccessBanner({ message }: { message: string }) {
  return (
    <p
      role="status"
      className="rounded-lg border border-green-200 bg-green-50 p-3 text-center text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400"
    >
      {message}
    </p>
  );
}
