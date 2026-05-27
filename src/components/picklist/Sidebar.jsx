import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  ListChecks,
  Cog,
  Wrench,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Cpu,
  BarChart3,
  Swords,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Picklists", icon: ListChecks, href: "/picklists" },
  { label: "Robot Data", icon: BarChart3, href: "/robot-data" },
  { label: "Match Strategy", icon: Swords, href: "/match-strategy" },
  { label: "Match Scouting", icon: Cpu, href: "/prematch" },
  { label: "Pit Scouting", icon: Wrench, href: "/pit" },
  { label: "Settings", icon: Cog, href: "/settings" },
];

const FOOTER_ITEMS = [
  { label: "Help", icon: HelpCircle, href: "#" },
  { label: "Logout", icon: LogOut, href: "#" },
];

function isPicklistRoute(pathname) {
  return pathname.startsWith("/picklists");
}

function isMatchStrategyRoute(pathname) {
  return pathname.startsWith("/match-strategy");
}

export function Sidebar({ defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { pathname } = useLocation();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-full py-6 px-3 bg-surface-container border-r border-outline-variant/30 shrink-0 overflow-hidden relative",
        "transition-[width] duration-300 ease-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Collapse toggle handle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute top-6 -right-3 z-10 w-6 h-6 bg-surface-container-high border border-outline-variant/40 rounded-full flex items-center justify-center hover:bg-surface-bright transition-colors shadow-sm"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-primary-container" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-primary-container" />
        )}
      </button>

      {/* Brand */}
      <div
        className={cn(
          "mb-10 transition-all",
          collapsed ? "px-2 text-center" : "px-4"
        )}
      >
        {collapsed ? (
          <div className="text-2xl font-black text-primary-container leading-none">
            5940
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black text-primary-container tracking-tight leading-none">
              Team 5940
            </h1>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-on-surface-variant/80 mt-1.5">
              BREAD ROBOTICS
            </p>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/picklists"
              ? isPicklistRoute(pathname)
              : item.href === "/match-strategy"
                ? isMatchStrategyRoute(pathname)
                : pathname === item.href;
          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "flex items-center gap-3 py-3 rounded-full transition-all",
                collapsed ? "justify-center px-0" : "px-4",
                active
                  ? "bg-primary-container text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-primary-container hover:bg-primary-container/5"
              )}
            >
              <Icon
                className="w-5 h-5 shrink-0"
                strokeWidth={active ? 2.4 : 2}
              />
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "mt-auto border-t border-outline-variant/30 pt-5 space-y-1",
          collapsed && "items-center flex flex-col"
        )}
      >
        {FOOTER_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 py-2 text-on-surface-variant hover:text-primary-container rounded-full transition-colors",
                collapsed ? "justify-center px-0" : "px-4"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </a>
          );
        })}
      </div>
    </aside>
  );
}
