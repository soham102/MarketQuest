import { Suspense } from "react";
import type { Metadata } from "next";
import { SignInView } from "@/components/auth/sign-in-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-12 h-96 max-w-md rounded-3xl" />}>
      <SignInView />
    </Suspense>
  );
}
