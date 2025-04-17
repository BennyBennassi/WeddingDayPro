import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="container flex items-center justify-center py-20">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-3xl font-bold">404 Page Not Found</h1>
          
          <p className="mt-4 text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <Link href="/">
            <Button className="mt-6">
              Return Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
