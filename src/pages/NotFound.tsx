
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center animate-fade-in">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-medium">העמוד לא נמצא</h2>
          <p className="max-w-md text-muted-foreground">
            הדף שחיפשת אינו קיים או שהועבר למיקום אחר.
          </p>
        </div>
        <Button className="inline-flex items-center gap-2" asChild>
          <a href="/">
            <span>חזור לדף הבית</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
