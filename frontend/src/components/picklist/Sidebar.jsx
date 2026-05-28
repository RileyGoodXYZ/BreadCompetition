import { useEffect, useState } from "react";
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
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileNav } from "./Shell";

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Picklists", icon: ListChecks, href: "/picklists" },
  { label: "Robot Data", icon: BarChart3, href: "/robot-data" },
  { label: "Match Strategy", icon: Swords, href: "/match-strategy" },
  { label: "Match Scouting", icon: Cpu, href: "/data-scout/prematch" },
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

export function MobileMenuButton({ className }) {
  const { setOpen } = useMobileNav();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open navigation"
      className={cn(
        "lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:text-primary-container hover:bg-primary-container/5 transition-colors",
        className
      )}
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}

export function Sidebar({ defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { pathname } = useLocation();
  const { open: mobileOpen, setOpen: setMobileOpen } = useMobileNav();

  // Close drawer on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Lock body scroll when drawer is open on mobile.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
          className="lg:hidden fixed inset-0 z-40 bg-inverse-surface/40 backdrop-blur-sm"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] bg-surface-container border-r border-outline-variant/30 py-6 px-3 flex flex-col overflow-y-auto scrollbar-warm",
          "transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between mb-8 px-4">
          <div>
            <h1 className="text-xl font-black text-primary-container tracking-tight leading-none">
              Team 5940
            </h1>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant/80 mt-1">
              BREAD ROBOTICS
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary-container hover:bg-primary-container/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <NavList pathname={pathname} collapsed={false} />

        <div className="mt-auto border-t border-outline-variant/30 pt-5 space-y-1">
          {FOOTER_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-primary-container rounded-full transition-colors"
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            );
          })}
        </div>
      </aside>

      {/* Desktop sidebar */}
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

        <NavList pathname={pathname} collapsed={collapsed} />

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
    </>
  );
}

function NavList({ pathname, collapsed }) {
  return (
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
  );
}
