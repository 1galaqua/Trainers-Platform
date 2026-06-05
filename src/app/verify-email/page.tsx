import { redirect } from "next/navigation";

export default function VerifyEmailRedirectPage() {
  redirect("/sign-in");
}
