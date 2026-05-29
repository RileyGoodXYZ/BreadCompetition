import { Link } from "react-router-dom";
import {
  ListChecks,
  Swords,
  Cpu,
  BarChart3,
  ArrowRight,
  Sparkles,
  Wrench,
  Clock,
  MapPin,
  CalendarDays,
  Trophy,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePicklists } from "@/lib/picklists-store";
import { useMatchStrategy } from "@/lib/match-strategy-store";
import {
  CURRENT_EVENT,
  OUR_TEAM,
  UPCOMING_MATCHES,
  getAllianceColor,
  getTeamNextMatch,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

export default function Home() {
  const { sharedLists, myLists } = usePicklists();
  const { strategies } = useMatchStrategy();

  const activePicklists = [...sharedLists, ...myLists].filter(
    (p) => !p.archived
  );
  const recentPicklists = activePicklists.slice(0, 3);
  const recentStrategies = strategies.slice(0, 3);

  const nextMatch = getTeamNextMatch(OUR_TEAM);
  const otherUpcoming = UPCOMING_MATCHES.filter(
    (m) => m.id !== nextMatch?.id
  ).slice(0, 3);

  return (
    <Shell>
      <TopBar variant="library" />

      <div className="flex-1 overflow-y-auto scrollbar-warm">
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-10">
          {/* Hero */}
          <div className="mb-4 sm:mb-8 flex items-center gap-4 sm:gap-6">
            <img
              src={logo}
              alt="Team 5940 Bread Robotics"
              className="w-16 h-16 sm:w-24 sm:h-24 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="text-md font-semibold text-on-surface-variant uppercase mb-2">
                BREAD Competition
              </p>
              <h1 className="text-3xl sm:text-5xl md:text-5xl font-bold tracking-tight text-primary-container leading-[1.05]">
                Welcome back, Akash
              </h1>
            </div>
          </div>

          {/* Current event banner */}
          <EventBanner event={CURRENT_EVENT} />

          {/* Our next match */}
          {nextMatch && (
            <section className="mb-8 sm:mb-16">
              <SectionHeader
                icon={Trophy}
                title={`Our Next Match`}
              />
              <NextMatchCard match={nextMatch} team={OUR_TEAM} />
            </section>
          )}

          {/* Upcoming matches overall */}
          <section className="mb-8 sm:mb-16">
            <SectionHeader
              icon={CalendarDays}
              title="Upcoming Matches"
              actionLabel="Full schedule"
              actionHref="/"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {otherUpcoming.map((m) => (
                <UpcomingMatchCard
                  key={m.id}
                  match={m}
                  ourTeam={OUR_TEAM}
                />
              ))}
            </div>
          </section>

          {/* Recent picklists */}
          <section className="mb-8 sm:mb-16">
            <SectionHeader
              icon={ListChecks}
              title="Recent Picklists"
              actionLabel="View all"
              actionHref="/picklists"
            />
            {recentPicklists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                {recentPicklists.map((p) => (
                  <RecentCard
                    key={p.id}
                    title={p.title}
                    event={p.event}
                    updatedLabel={p.updatedLabel}
                    href={`/picklists/${p.id}`}
                  />
                ))}
              </div>
            ) : (
              <EmptyHint
                label="No picklists yet"
                actionLabel="Create one"
                href="/picklists"
              />
            )}
          </section>

          {/* Recent strategies */}
          <section className="mb-6 sm:mb-16">
            <SectionHeader
              icon={Swords}
              title="Recent Strategies"
              actionLabel="View all"
              actionHref="/match-strategy"
            />
            {recentStrategies.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                {recentStrategies.map((s) => (
                  <RecentCard
                    key={s.id}
                    title={s.title}
                    event={s.event}
                    updatedLabel={s.updatedLabel}
                    href={`/match-strategy/${s.id}`}
                  />
                ))}
              </div>
            ) : (
              <EmptyHint
                label="No strategies yet"
                actionLabel="Plan a match"
                href="/match-strategy"
              />
            )}
          </section>
        </div>
      </div>
    </Shell>
  );
}

function SectionHeader({ icon: Icon, title, actionLabel, actionHref }) {
  return (
    <div className="flex items-center gap-3 mb-5 sm:mb-7">
      <div className="p-2 bg-secondary-container rounded-md">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-on-secondary-fixed-variant" />
      </div>
      <h3 className="text-lg sm:text-2xl font-semibold uppercase tracking-tight text-on-surface">
        {title}
      </h3>
      <div className="h-px flex-1 bg-outline-variant/50 ml-2 sm:ml-4" />
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary-container transition-colors"
        >
          {actionLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

function ModuleCard({ icon: Icon, label, value, hint, href }) {
  return (
    <Link
      to={href}
      className="group scout-card-gradient bg-surface-container-lowest border border-outline-variant/40 rounded sm:rounded-md p-3 sm:p-5 transition-all hover:border-primary-container/40 hover:shadow-warm-md flex flex-col gap-3 sm:gap-4 min-h-28 sm:min-h-40"
    >
      <div className="flex items-center justify-between">
        <div className="p-2 bg-primary-container/10 text-primary-container rounded-md group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary-container group-hover:translate-x-0.5 transition-all" />
      </div>
      <div className="mt-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </p>
        <p className="text-2xl sm:text-3xl font-bold text-primary-container leading-none mt-1">
          {value}
        </p>
        <p className="text-[11px] sm:text-xs text-on-surface-variant mt-1.5 sm:mt-2">
          {hint}
        </p>
      </div>
    </Link>
  );
}

function RecentCard({ title, event, updatedLabel, href }) {
  return (
    <Link
      to={href}
      className="group scout-card-gradient bg-surface-container-lowest border border-outline-variant/40 rounded sm:rounded-md p-2.5 sm:p-4 transition-all hover:border-primary-container/40 hover:shadow-warm-md flex flex-col gap-3"
    >
      <h4 className="text-base sm:text-lg font-semibold text-primary-container leading-tight">
        {title}
      </h4>
      <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/30">
        {event ? (
          <Badge variant="event" className="truncate max-w-40">
            {event}
          </Badge>
        ) : (
          <span />
        )}
        {updatedLabel && (
          <span className="text-on-surface-variant font-mono text-[11px] whitespace-nowrap">
            {updatedLabel}
          </span>
        )}
      </div>
    </Link>
  );
}

function EventBanner({ event }) {
  return (
    <div className="mb-6 sm:mb-12 scout-card-gradient border border-primary-container/30 bg-surface-container-lowest rounded sm:rounded-md p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 sm:p-2.5 bg-primary-container text-on-primary rounded-md shrink-0">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Currently competing at
          </p>
          <h2 className="text-base sm:text-xl font-bold text-primary-container leading-tight truncate">
            {event.name}
          </h2>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 sm:ml-auto text-[11px] sm:text-xs font-mono text-on-surface-variant">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {event.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          {event.dates}
        </span>
        <Badge variant="event">{event.status}</Badge>
      </div>
    </div>
  );
}

function NextMatchCard({ match, team }) {
  const color = getAllianceColor(match, team);
  return (
    <article className="scout-card-gradient bg-surface-container-lowest border border-outline-variant/40 rounded sm:rounded-md p-3 sm:p-6 flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            {match.type} · {match.field}
          </p>
          <h3 className="text-2xl sm:text-4xl font-bold text-primary-container leading-tight mt-1">
            Match {match.number}
          </h3>
        </div>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end shrink-0">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-container">
            <Clock className="w-4 h-4" />
            {match.scheduledAt}
          </span>
          <Badge variant="event">{match.startsInLabel}</Badge>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
        <AllianceBlock
          label="Red Alliance"
          teams={match.red}
          color="red"
          ourTeam={team}
          highlight={color === "red"}
        />
        <AllianceBlock
          label="Blue Alliance"
          teams={match.blue}
          color="blue"
          ourTeam={team}
          highlight={color === "blue"}
        />
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <Link to="/match-strategy">
          <Button variant="primary" size="sm">
            <Swords className="w-4 h-4" />
            Plan strategy
          </Button>
        </Link>
      </div>
    </article>
  );
}

function AllianceBlock({ label, teams, color, ourTeam, highlight }) {
  const dotColor = color === "red" ? "bg-red-600" : "bg-blue-600";
  return (
    <div
      className={cn(
        "rounded sm:rounded-md border p-2.5 sm:p-3",
        highlight
          ? "border-primary-container/50 bg-primary-container/5"
          : "border-outline-variant/40 bg-surface-container-low/60"
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={cn("w-2 h-2 rounded-full", dotColor)} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </span>
      </div>
      <div className="font-mono text-sm sm:text-base text-on-surface">
        {teams.map((t, i) => (
          <span key={t}>
            <Link
              to={`/robot-data?team=${t}`}
              className={cn(
                "hover:underline underline-offset-4 decoration-2 decoration-on-surface/30",
                t === ourTeam &&
                  "font-bold text-primary-container decoration-primary-container/50"
              )}
            >
              {t}
            </Link>
            {i < teams.length - 1 && " · "}
          </span>
        ))}
      </div>
    </div>
  );
}

function UpcomingMatchCard({ match, ourTeam }) {
  const isOurs = match.red.includes(ourTeam) || match.blue.includes(ourTeam);
  return (
    <article
      className={cn(
        "scout-card-gradient bg-surface-container-lowest border rounded sm:rounded-md p-3 sm:p-4 flex flex-col gap-3 sm:gap-4",
        isOurs
          ? "border-primary-container/50 bg-primary-container/5"
          : "border-outline-variant/40"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            {match.type}
          </p>
          <h4 className="text-xl sm:text-2xl font-bold text-primary-container leading-tight mt-0.5">
            Match {match.number}
          </h4>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm text-on-surface">
            <Clock className="w-3.5 h-3.5 text-on-surface-variant" />
            {match.scheduledAt}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            {match.startsInLabel}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2 pt-2 border-t border-outline-variant/30">
        <AllianceLine teams={match.red} color="red" ourTeam={ourTeam} />
        <AllianceLine teams={match.blue} color="blue" ourTeam={ourTeam} />
      </div>

      {isOurs && (
        <Badge variant="event" className="self-start">
          Team {ourTeam}
        </Badge>
      )}
    </article>
  );
}

function AllianceLine({ teams, color, ourTeam }) {
  const dotColor = color === "red" ? "bg-red-600" : "bg-blue-600";
  const label = color === "red" ? "Red" : "Blue";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />
      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-9 shrink-0">
        {label}
      </span>
      <span className="font-mono text-xs sm:text-sm text-on-surface truncate">
        {teams.map((t, i) => (
          <span key={t}>
            <span
              className={cn(
                t === ourTeam && "font-bold text-primary-container"
              )}
            >
              {t}
            </span>
            {i < teams.length - 1 && " · "}
          </span>
        ))}
      </span>
    </div>
  );
}

function EmptyHint({ label, actionLabel, href }) {
  return (
    <Link
      to={href}
      className="group block border-2 border-dashed border-outline-variant/60 rounded sm:rounded-md p-6 text-center transition-all hover:border-primary-container hover:bg-primary-container/5"
    >
      <p className="text-sm font-semibold text-on-surface-variant group-hover:text-primary-container transition-colors">
        {label}
      </p>
      <p className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant/70 group-hover:text-primary-container mt-1 inline-flex items-center gap-1">
        {actionLabel}
        <ArrowRight className="w-3 h-3" />
      </p>
    </Link>
  );
}
