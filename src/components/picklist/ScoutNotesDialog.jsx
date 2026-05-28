import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SCOUT_NOTES } from "@/pages/picklist/data";

// Subjective scout notes
export function ScoutNotesDialog({ open, onOpenChange, robot }) {
  const rows = robot ? SCOUT_NOTES[robot.team] ?? [] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[calc(100vw-1.5rem)]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl">
            {robot ? (
              <>
                <Link
                  to={`/robot-data?team=${robot.team}`}
                  className="hover:underline underline-offset-4 decoration-2 decoration-primary-container/40"
                >
                  {robot.team} {robot.name}
                </Link>
                : Subjective Notes
              </>
            ) : (
              "Subjective Notes"
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto scrollbar-warm px-2 pb-2 pt-3 min-h-0">
          {rows.length === 0 ? (
            <p className="text-sm text-on-surface-variant py-10 text-center">
              No scout notes have been recorded for this team yet.
            </p>
          ) : (
            <div className="overflow-x-auto scrollbar-warm">
              <table className="w-full border-collapse text-left min-w-160">
                <thead className="bg-surface-container border-b border-outline-variant/30">
                  <tr>
                    <Th>Match</Th>
                    <Th>Auto</Th>
                    <Th>Teleop</Th>
                    <Th>Endgame</Th>
                    <Th>Scouter</Th>
                    <Th className="min-w-50">Note</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {rows.map((r) => (
                    <tr
                      key={r.match}
                      className="transition-colors hover:bg-primary-container/[0.03]"
                    >
                      <Td className="font-mono font-semibold text-on-surface">
                        {String(r.match).padStart(2, "0")}
                      </Td>
                      <Td className="font-mono text-on-surface-variant">{r.auto}</Td>
                      <Td className="font-mono text-on-surface-variant">{r.teleop}</Td>
                      <Td>
                        <span className="px-2 py-0.5 rounded-full bg-secondary-container text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                          {r.endgame}
                        </span>
                      </Td>
                      <Td className="text-on-surface-variant">{r.scouter}</Td>
                      <Td className="text-on-surface leading-snug">{r.note}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Th({ className = "", children }) {
  return (
    <th
      className={`px-3 py-2 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ className = "", children }) {
  return <td className={`px-3 py-2 align-top text-xs sm:text-sm ${className}`}>{children}</td>;
}
