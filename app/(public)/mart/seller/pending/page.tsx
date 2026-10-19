import Link from "next/link";
import { CheckCircle2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SellerApplicationPendingPage() {
  return (
    <div className="container flex min-h-screen items-center justify-center py-20 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </div>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-upsa-navy dark:text-white">Application Received!</h1>
        <p className="mb-8 text-muted-foreground dark:text-gray-300 text-balance">
          Thank you for applying to sell on Campus Mart. Our team will review your application and verify your details shortly.
        </p>
        <Button asChild className="w-full sm:w-auto bg-upsa-navy hover:bg-upsa-navy/90 text-white dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-white font-bold">
          <Link href="/mart">
            <Home className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Link>
        </Button>
      </div>
    </div>
  );
}
