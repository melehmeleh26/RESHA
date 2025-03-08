
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BookTemplate, Users, Settings, LogOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Sidebar = () => {
  const [expanded, setExpanded] = useState(true);

  const NavItem = ({ to, icon: Icon, label, delay }: { to: string; icon: any; label: string; delay: number }) => {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  "hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive ? "bg-primary/15 text-primary" : "text-foreground/80",
                  !expanded && "justify-center px-2",
                  `animate-slide-in animate-delay-${delay}`
                )
              }
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", expanded ? "mr-1" : "mr-0")} />
              {expanded && <span>{label}</span>}
            </NavLink>
          </TooltipTrigger>
          {!expanded && <TooltipContent side="left">{label}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div
      className={cn(
        "relative flex h-full flex-col border-l bg-card p-4 shadow-left transition-all duration-300 ease-in-out",
        expanded ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center mb-8 animate-fade-in">
        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-white">
          <span className="text-xl font-bold">GF</span>
        </div>
        {expanded && (
          <div className="mr-3 animate-fade-in">
            <h1 className="text-lg font-semibold">GroupsFlow</h1>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <NavItem to="/" icon={LayoutDashboard} label="לוח בקרה" delay={100} />
        <NavItem to="/templates" icon={BookTemplate} label="תבניות" delay={200} />
        <NavItem to="/groups" icon={Users} label="קבוצות" delay={300} />
        <NavItem to="/settings" icon={Settings} label="הגדרות" delay={400} />
      </nav>

      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -left-3 top-20 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:bg-primary/90"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={cn("h-4 w-4 transition-transform", expanded ? "rotate-180" : "")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Status - Free/Premium */}
      <div className={cn(
        "mt-4 rounded-lg bg-secondary/50 p-3 text-center text-sm",
        "border border-border/50 transition-all duration-300",
        expanded ? "animate-fade-in" : "hidden"
      )}>
        <span className="font-semibold">תוכנית חינם</span>
        <div className="mt-1 text-xs text-muted-foreground">
          1/3 פוסטים היום | 3/3 קבוצות
        </div>
      </div>

      {/* Premium button */}
      {expanded && (
        <button className="mt-3 w-full rounded-lg bg-gradient-to-r from-primary to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg animate-fade-in">
          שדרג לפרימיום
        </button>
      )}
    </div>
  );
};

export default Sidebar;
