import { redirect } from "next/navigation";

export default function ResetPasswordRedirectPage() {
  redirect("/forgot-password");
}
