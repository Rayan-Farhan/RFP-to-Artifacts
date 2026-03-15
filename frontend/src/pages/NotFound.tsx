import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Error 404</p>
        <h1 className="mt-2 text-6xl font-extrabold text-foreground sm:text-7xl">Page not found</h1>
        <p className="mt-4 text-base text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="mt-8 gap-2 rounded-xl px-6">
          <a href="/">
            <ArrowLeft className="h-4 w-4" />
            Return Home
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
