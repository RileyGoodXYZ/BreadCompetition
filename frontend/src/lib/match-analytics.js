// Shared helpers for turning raw match submissions into chart/table-ready

export const MISSING = "no data";

export function buildChartMatches(submissions) {
  const sorted = [...submissions].sort(
    (a, b) => (a.match_number ?? 0) - (b.match_number ?? 0)
  );
  return sorted.map((s) => {
    const d = s.data ?? {};
    const noShow = d.prematch_no_show === true;
    return {
      match: `M${s.match_number ?? "?"}`,
      scoring: noShow ? 0 : Number(d.score ?? 0),
      passing: noShow ? 0 : Number(d.pass ?? 0),
      defense: noShow ? 0 : Number(d.defense ?? 0),
      noData: noShow,
    };
  });
}

export function buildSubmissionRows(submissions) {
  const sorted = [...submissions].sort(
    (a, b) => (a.match_number ?? 0) - (b.match_number ?? 0)
  );
  return sorted.map((s) => {
    const { data: d, ...top } = s;
    return { ...top, ...(d ?? {}) };
  });
}


export function aggregateEventStats(submissions) {
  const sums = {}; 

  for (const s of submissions) {
    const team = s.team_number;
    if (team == null) continue;
    sums[team] ??= {};
    const d = s.data ?? {};
    for (const [key, raw] of Object.entries(d)) {
      let value;
      if (typeof raw === "number" && Number.isFinite(raw)) value = raw;
      else if (typeof raw === "boolean") value = raw ? 1 : 0;
      else continue; 
      allKeys.add(key);
      const acc = (sums[team][key] ??= { sum: 0, count: 0 });
      acc.sum += value;
      acc.count += 1;
    }
  }

  const columns = [...allKeys]
    .sort((a, b) => a.localeCompare(b))
    .map((id) => ({ id, label: humanizeKey(id) }));

  const byTeam = {};
  for (const [team, perKey] of Object.entries(sums)) {
    byTeam[team] = {};
    for (const { id } of columns) {
      const acc = perKey[id];
      byTeam[team][id] = acc ? +(acc.sum / acc.count).toFixed(2) : null;
    }
  }

  return { columns, byTeam };
}

export function humanizeKey(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatCell(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  return String(value);
}
