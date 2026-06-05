import { redirect } from "next/navigation";

export default function VerifyEmailPendingRedirectPage() {
  redirect("/sign-in");
}
