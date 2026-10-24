import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function NotFound() {
  return (
    <EmptyState
      icon={<Compass />}
      title="This page doesn't exist"
      className="mx-auto mt-16 max-w-lg"
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/learn">Browse lessons</Link>
          </Button>
        </div>
      }
    >
      The link may be out of date. Your progress is safe.
    </EmptyState>
  );
}
