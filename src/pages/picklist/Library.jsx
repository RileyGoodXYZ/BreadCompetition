import { useState } from "react";
import {
  Plus,
  Users,
  User,
  Star,
  Archive,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Shell } from "@/components/picklist/Shell";
import { TopBar } from "@/components/picklist/TopBar";
import { PicklistActions } from "@/components/picklist/PicklistActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePicklists } from "@/lib/picklists-store";
import { cn } from "@/lib/utils";

const byStarred = (a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0);

export default function Library() {
  const navigate = useNavigate();
  const openPicklist = (id) => navigate(`/picklists/${id}`);

  const { sharedLists, myLists } = usePicklists();

  const activeShared = sharedLists.filter((p) => !p.archived).sort(byStarred);
  const activeMy = myLists.filter((p) => !p.archived).sort(byStarred);
  const archived = [
    ...sharedLists.filter((p) => p.archived).map((p) => ({ ...p, _kind: "shared" })),
    ...myLists.filter((p) => p.archived).map((p) => ({ ...p, _kind: "my" })),
  ];

  return (
    <Shell>
      <TopBar variant="library" />

      <div className="flex-1 overflow-y-auto scrollbar-warm">
        <div className="max-w-7xl mx-auto w-full px-6 py-10">
          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="text-5xl font-bold tracking-tight text-primary-container leading-[1.05]">
                Picklist Library
              </h1>
              <p className="text-on-surface-variant text-lg mt-2 max-w-xl">
                Manage, view, and create picklists
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="self-start md:self-auto"
              onClick={() => openPicklist("new")}
            >
              <Plus className="w-5 h-5" />
              New Picklist
            </Button>
          </div>

          {/* Shared section */}
          <section className="mb-16">
            <SectionHeader icon={Users} title="Shared Picklists" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeShared.map((p) => (
                <SharedPicklistCard
                  key={p.id}
                  picklist={p}
                  onOpen={() => openPicklist(p.id)}
                />
              ))}
            </div>
          </section>

          {/* My section */}
          <section className="mb-16">
            <SectionHeader icon={User} title="My Picklists" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeMy.map((p) => (
                <MyPicklistCard
                  key={p.id}
                  picklist={p}
                  onOpen={() => openPicklist(p.id)}
                />
              ))}
              <CreatePicklistCard onClick={() => openPicklist("new")} />
            </div>
          </section>

          {archived.length > 0 && <ArchivedSection items={archived} />}
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => openPicklist("new")}
        className="md:hidden fixed bottom-8 right-8 w-16 h-16 bg-primary-container text-on-primary rounded-full shadow-warm-lg flex items-center justify-center active:scale-90 transition-transform z-20"
        aria-label="New picklist"
      >
        <Plus className="w-7 h-7" strokeWidth={2.4} />
      </button>
    </Shell>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-7">
      <div className="p-2 bg-secondary-container rounded-md">
        <Icon className="w-5 h-5 text-on-secondary-fixed-variant" />
      </div>
      <h3 className="text-2xl font-semibold uppercase tracking-tight text-on-surface">
        {title}
      </h3>
      <div className="h-px flex-1 bg-outline-variant/50 ml-4" />
    </div>
  );
}

function StarBadge() {
  return (
    <div
      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/90 shadow-warm-sm flex items-center justify-center text-amber-500"
      aria-label="Starred"
      title="Starred"
    >
      <Star className="w-4 h-4 fill-current" />
    </div>
  );
}

function SharedPicklistCard({ picklist, onOpen }) {
  const {
    title,
    image,
    status = "synced",
    collaborators = [],
    updatedLabel,
    starred,
  } = picklist;
  const visibleCollabs = collaborators.slice(0, 2);
  const overflow = collaborators.length - visibleCollabs.length;

  return (
    <article
      onClick={onOpen}
      className="group scout-card-gradient bg-surface-container-lowest border border-outline-variant/40 rounded-lg overflow-hidden cursor-pointer transition-all hover:border-primary-container/40 hover:shadow-warm-lg"
    >
      <div className="aspect-video relative bg-surface-container-highest overflow-hidden">
        {image && (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-white/35 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4">
          <Badge variant={status === "drafting" ? "drafting" : "synced"}>
            {status}
          </Badge>
        </div>
        {starred && <StarBadge />}
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-6">
          <h4 className="text-lg font-semibold text-primary-container leading-tight pr-2">
            {title}
          </h4>
          <PicklistActions picklist={picklist} />
        </div>

        <div className="flex items-center justify-between mt-2">
          {collaborators.length > 0 ? (
            <div className="flex -space-x-2">
              {visibleCollabs.map((p, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center border-2 border-white text-[10px] font-bold text-on-secondary-container"
                >
                  {p}
                </div>
              ))}
              {overflow > 0 && (
                <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center border-2 border-white text-[10px] font-bold">
                  +{overflow}
                </div>
              )}
            </div>
          ) : (
            <div />
          )}
          {updatedLabel && (
            <span className="text-on-surface-variant font-mono text-[11px]">
              {updatedLabel}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function MyPicklistCard({ picklist, onOpen }) {
  const {
    title,
    icon: Icon,
    bars = [0.75, 0.5, 0.66],
    teamCount,
    updatedLabel,
    starred,
  } = picklist;
  return (
    <article
      onClick={onOpen}
      className="group scout-card-gradient bg-surface-container-lowest border border-outline-variant/40 rounded-lg overflow-hidden cursor-pointer transition-all hover:border-primary-container/40 hover:shadow-warm-md"
    >
      <div className="aspect-video relative bg-surface-container-low flex items-center justify-center border-b border-outline-variant/30 overflow-hidden">
        {Icon && (
          <Icon
            className="absolute text-primary-container/10 w-16 h-16"
            strokeWidth={1.5}
          />
        )}
        <div className="p-4 w-full h-full flex flex-col justify-end">
          <div className="space-y-1.5">
            {bars.map((w, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full",
                  i % 2 === 0
                    ? "bg-primary-container/20"
                    : "bg-primary-container/10"
                )}
                style={{ width: `${Math.max(20, Math.min(100, w * 100))}%` }}
              />
            ))}
          </div>
        </div>
        {starred && <StarBadge />}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-[15px] font-bold text-primary-container leading-tight pr-1">
            {title}
          </h4>
          <PicklistActions picklist={picklist} />
        </div>
        <p className="text-[10px] text-on-surface-variant font-mono mt-1.5 uppercase tracking-wider">
          {teamCount} teams · modified {updatedLabel}
        </p>
      </div>
    </article>
  );
}

function CreatePicklistCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group border-2 border-dashed border-outline-variant/60 rounded-lg flex flex-col items-center justify-center aspect-video w-full transition-all hover:border-primary-container hover:bg-primary-container/5"
    >
      <span className="w-10 h-10 mb-2 rounded-full flex items-center justify-center text-outline-variant group-hover:text-primary-container group-hover:scale-110 transition-all">
        <Plus className="w-8 h-8" strokeWidth={2} />
      </span>
      <span className="text-sm font-bold text-on-surface-variant group-hover:text-primary-container transition-colors">
        Create New
      </span>
    </button>
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
              key={`${p._kind}-${p.id}`}
              className="flex items-center justify-between gap-3 p-3 bg-surface-container-low border border-outline-variant/40 rounded-md"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-on-surface truncate">
                  {p.title}
                </div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                  {p._kind === "shared" ? "Shared" : "Personal"} ·{" "}
                  {p.updatedLabel}
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
