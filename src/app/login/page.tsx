import { redirect } from "next/navigation";

/** Friendly alias: /login → /sign-in */
export default function LoginPage() {
  redirect("/sign-in");
}
