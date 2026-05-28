import { createContext, useContext, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

const MobileNavContext = createContext({
  open: false,
  setOpen: () => {},
});

export const useMobileNav = () => useContext(MobileNavContext);

// Shell component
export function Shell({ children, className }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("picklist-mode");
    document.body.classList.add("picklist-mode");
    return () => {
      document.documentElement.classList.remove("picklist-mode");
      document.body.classList.remove("picklist-mode");
    };
  }, []);

  return (
    <MobileNavContext.Provider
      value={{ open: mobileNavOpen, setOpen: setMobileNavOpen }}
    >
      <div
        className={cn(
          "picklist-app flex h-screen w-screen overflow-hidden bg-surface text-on-surface font-sans text-left",
          className
        )}
      >
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
          {children}
        </main>
      </div>
    </MobileNavContext.Provider>
  );
}
