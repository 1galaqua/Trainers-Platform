import { REQUIRED_FIELD_MESSAGE } from "@/lib/onboarding-form-validation";

type RequiredFieldErrorProps = {
  show?: boolean;
};

export function RequiredFieldError({ show }: RequiredFieldErrorProps) {
  if (!show) return null;
  return <p className="text-destructive text-sm">{REQUIRED_FIELD_MESSAGE}</p>;
}
