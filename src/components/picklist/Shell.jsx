import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

// Shell component
export function Shell({ children, className }) {
  useEffect(() => {
    document.documentElement.classList.add("picklist-mode");
    document.body.classList.add("picklist-mode");
    return () => {
      document.documentElement.classList.remove("picklist-mode");
      document.body.classList.remove("picklist-mode");
    };
  }, []);

  return (
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
  );
}
