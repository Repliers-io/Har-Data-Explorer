import { Link, useLocation } from "wouter";
import { LayoutDashboard, BarChart3, Star, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import harLogo from "@/assets/har-logo.svg";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Listing Views", href: "/views", icon: BarChart3 },
  { name: "Reviews", href: "/reviews", icon: Star },
  { name: "Showings", href: "/showings", icon: CalendarDays },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 shrink-0 items-center px-5 border-b border-sidebar-border bg-card">
        <img src={harLogo} alt="HAR" className="h-10 w-auto" />
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto pt-6 px-4 pb-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs uppercase">
            H
          </div>
          <div>
            <p className="font-medium text-foreground">Houston Agent</p>
            <p className="text-xs">Pro Member</p>
          </div>
        </div>
      </div>
    </div>
  );
}
