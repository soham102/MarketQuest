import type { Metadata } from "next";
import { AccountView } from "@/components/auth/account-view";

export const metadata: Metadata = { title: "Account" };

// Signed-out visitors are redirected to /sign-in by src/proxy.ts before this renders.
export default function AccountPage() {
  return <AccountView />;
}
