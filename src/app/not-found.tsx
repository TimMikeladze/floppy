import { Home } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl font-bold text-muted-foreground/30">404</div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Page not found
          </h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Button asChild className="w-full">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
