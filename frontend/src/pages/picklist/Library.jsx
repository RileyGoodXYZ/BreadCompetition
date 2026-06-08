import { useState } from "react";
import {
  Plus,
  Users,
  User,
  Star,
  Archive,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Shell } from "@/components/Shell";
import { TopBar } from "@/components/TopBar";
import { PicklistActions } from "@/components/picklist/PicklistActions";
import { NewPicklistDialog } from "@/components/picklist/NewPicklistDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePicklists } from "@/lib/picklists-store";
import { relativeTime } from "@/lib/time";

const byStarred = (a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0);

export default function Library() {
  const navigate = useNavigate();
  const openPicklist = (id) => navigate(`/picklists/${id}`);

  const { sharedLists, myLists, createPicklist, loading, error } =
    usePicklists();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      const id = await createPicklist(payload);
      setDialogOpen(false);
      navigate(`/picklists/${id}`);
    } catch (e) {
      console.error("createPicklist failed", e);
    } finally {
      setSubmitting(false);
    }
  };

  const activeShared = sharedLists.filter((p) => !p.archived).sort(byStarred);
  const activeMy = myLists.filter((p) => !p.archived).sort(byStarred);
  const archived = [
    ...sharedLists.filter((p) => p.archived),
    ...myLists.filter((p) => p.archived),
  ];

  return (
    <Shell>
      <TopBar variant="library" />

      <div className="flex-1 overflow-y-auto scrollbar-warm">
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-10">
          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-6 mb-6 sm:mb-12">
            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-primary-container leading-[1.05]">
                Picklist Library
              </h1>
              <p className="text-on-surface-variant text-sm sm:text-lg mt-1 sm:mt-2 max-w-xl">
                Manage, view, and create picklists
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="hidden md:inline-flex self-start md:self-auto"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-5 h-5" />
              New Picklist
            </Button>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-md border border-error/40 bg-error/5 text-sm text-error">
              Failed to load picklists: {String(error.message ?? error)}
            </div>
          )}

          {loading && picklistsEmpty(activeShared, activeMy, archived) ? (
            <p className="text-on-surface-variant text-sm">Loading…</p>
          ) : (
            <>
              {/* Shared section */}
              <section className="mb-6 sm:mb-16">
                <SectionHeader icon={Users} title="Shared Picklists" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
                  {activeShared.map((p) => (
                    <PicklistCard
                      key={p.id}
                      picklist={p}
                      onOpen={() => openPicklist(p.id)}
                    />
                  ))}
                </div>
              </section>

              {/* My section */}
              <section className="mb-6 sm:mb-16">
                <SectionHeader icon={User} title="My Picklists" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
                  {activeMy.map((p) => (
                    <PicklistCard
                      key={p.id}
                      picklist={p}
                      onOpen={() => openPicklist(p.id)}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setDialogOpen(true)}
                    className="group border-2 border-dashed border-outline-variant/60 rounded sm:rounded-md flex flex-col items-center justify-center min-h-24 sm:min-h-35 w-full transition-all hover:border-primary-container hover:bg-primary-container/5"
                  >
                    <span className="w-10 h-10 mb-2 rounded-full flex items-center justify-center text-outline-variant group-hover:text-primary-container group-hover:scale-110 transition-all">
                      <Plus className="w-8 h-8" strokeWidth={2} />
                    </span>
                    <span className="text-sm font-bold text-on-surface-variant group-hover:text-primary-container transition-colors">
                      Create New
                    </span>
                  </button>
                </div>
              </section>

              {archived.length > 0 && <ArchivedSection items={archived} />}
            </>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="md:hidden fixed bottom-8 right-8 w-16 h-16 bg-primary-container text-on-primary rounded-full shadow-warm-lg flex items-center justify-center active:scale-90 transition-transform z-20"
        aria-label="New picklist"
      >
        <Plus className="w-7 h-7" strokeWidth={2.4} />
      </button>

      <NewPicklistDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
        submitting={submitting}
      />
    </Shell>
  );
}

function picklistsEmpty(...lists) {
  return lists.every((l) => l.length === 0);
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-5 sm:mb-7">
      <div className="p-2 bg-secondary-container rounded-md">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-on-secondary-fixed-variant" />
      </div>
      <h3 className="text-lg sm:text-2xl font-semibold uppercase tracking-tight text-on-surface">
        {title}
      </h3>
      <div className="h-px flex-1 bg-outline-variant/50 ml-2 sm:ml-4" />
    </div>
  );
}

function PicklistCard({ picklist, onOpen }) {
  const { title, event_key: eventKey, starred, updated_at: updatedAt, data } =
    picklist;
  const locked = data?.locked === true;
  const updatedLabel = relativeTime(updatedAt);

  return (
    <article
      onClick={onOpen}
      className="group scout-card-gradient bg-surface-container-lowest border border-outline-variant/40 rounded sm:rounded-md cursor-pointer transition-all hover:border-primary-container/40 hover:shadow-warm-md p-2.5 sm:p-4 flex flex-col gap-3 sm:gap-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          {starred && (
            <Star className="w-4 h-4 fill-current text-amber-500 shrink-0 mt-1" />
          )}
          {locked && (
            <Lock
              className="w-4 h-4 text-on-surface-variant shrink-0 mt-1"
              aria-label="Locked"
            />
          )}
          <h4 className="text-base sm:text-lg font-semibold text-primary-container leading-tight">
            {title}
          </h4>
        </div>
        <PicklistActions picklist={picklist} />
      </div>

      <div className="mt-auto flex items-center justify-end gap-2 sm:gap-3 pt-2 border-t border-outline-variant/30">
        {eventKey && (
          <Badge variant="event" className="truncate max-w-40">
            {eventKey}
          </Badge>
        )}
        {updatedLabel && (
          <span className="text-on-surface-variant font-mono text-[11px] whitespace-nowrap">
            {updatedLabel}
          </span>
        )}
      </div>
    </article>
  );
}

function ArchivedSection({ items }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 mb-5 text-on-surface-variant hover:text-primary-container transition-colors"
        aria-expanded={open}
      >
        <div className="p-2 bg-surface-container rounded-md">
          <Archive className="w-5 h-5" />
        </div>
        <h3 className="text-2xl font-semibold uppercase tracking-tight">
          Archived
        </h3>
        <span className="text-sm font-mono">({items.length})</span>
        <div className="h-px flex-1 bg-outline-variant/50 ml-4" />
        {open ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>
      {open && (
        <ul className="space-y-2">
          {items.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 p-3 bg-surface-container-low border border-outline-variant/40 rounded-md"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-on-surface truncate">
                  {p.title}
                </div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                  {p.kind === "shared" ? "Shared" : "Personal"}
                  {p.updated_at ? ` · ${relativeTime(p.updated_at)}` : ""}
                </div>
              </div>
              <PicklistActions picklist={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
