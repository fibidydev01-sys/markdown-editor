import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold">Page not found</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              This page doesn't exist in this notebook. It may have been
              moved or renamed.
            </p>
          </div>

          <Button asChild className="mt-2">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
