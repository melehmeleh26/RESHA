
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";

const Layout = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading to show our smooth animations
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-float">
          <div className="h-16 w-16 rounded-full bg-primary/20 p-3">
            <div className="h-full w-full animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <div className={cn("h-full animate-fade-in")}>
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6 animate-fade-in animate-delay-100">
        <div className="container mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
