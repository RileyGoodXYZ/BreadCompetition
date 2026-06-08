// Mock analytics + team data for the Picklist Manager / RobotData pages.
// Picklist *documents* (the list of saved picklists) come from the API via
// `picklists-store.jsx`. These mocks back the team-analytics surfaces that
// don't have a backend endpoint yet — Robot Comparison cards, the Rankings
// table, Robot Analytics, and Scout Notes.

export const ROBOT_CARDS = [
  {
    team: "5940",
    name: "BREAD ROBOTICS",
    drivetrain: "SWERVE DRIVE",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAu9QIfF_uCflns9aLWCxCweCKo1lOo66FbCILBg1WpgB8b5dJY9Zol-DrM-2h5CBqfnelD4d80mGxMa_XwDa341WIM_rYnnX0IPZxKv3Hr1NC3zk6hTDWW6VUPsDufRtjW1d7TJeVTjaeeMgkkBfAAdYXDcmh6Zo-AWOkIK7PHbnMDh84eUs17xiTssPSOPvwnfIVaUcci2Of7CV9smXqNZEF1xy8g2HZVRNnX-uD5WE8jCY1nBYpgUq7wS17A_HQn4yfmY9W6bVg",
    stars: 1,
    trend: {
      peakLabel: "+4.2% Peak",
      peakTone: "primary",
      bars: [
        { height: 0.4, opacity: 0.2 },
        { height: 0.6, opacity: 0.4 },
        { height: 0.5, opacity: 0.6 },
        { height: 0.8, opacity: 0.8 },
        { height: 0.95, opacity: 1 },
        { height: 0.75, opacity: 0.7 },
        { height: 0.9, opacity: 0.9 },
        { height: 1, opacity: 1 },
      ],
    },
    metrics: [
      { label: "Auto", value: "42.5" },
      { label: "Teleop", value: "79.2" },
      { label: "Cycles", value: "12.1" },
      { label: "Consist.", value: "99%" },
      { label: "Uptime", value: "94%" },
      { label: "Avg Load", value: "0.8s" },
      { label: "Defensive Rating", value: "HIGH (S-TIER)" },
    ],
  },
  {
    team: "254",
    name: "THE CHEEZY POOFS",
    drivetrain: "CNC PRECISION",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD8adcZ6mvxCfslLsGwQFRl9YJsBlxCjyb-GyHNLPJB9bRehjlLBRcC4SchK4cHpP4JNlpf8iuyAO73Rq7ZF2s467VEwutPXryHLI6WOfpteUjrGPD6CEKQOt7suX5Hjfpqg3DBuLYRiv6OtRAjOG-is84DH0iKLOc1M-GuzwgRlEGLPJjzo_GoZpBZB4qu2qdTHYq5fYR8GR0-p6Gh4H3RqlEZJkU4uorK2rv6RD-4i-ijtHgxY83K1YgVHrajdi5CJHhy40c7uRg",
    stars: 3,
    trend: {
      peakLabel: "+2.1% Peak",
      peakTone: "primary",
      bars: [
        { height: 0.7, opacity: 0.3 },
        { height: 0.8, opacity: 0.5 },
        { height: 0.85, opacity: 0.7 },
        { height: 0.95, opacity: 0.9 },
        { height: 1, opacity: 1 },
        { height: 0.9, opacity: 0.8 },
        { height: 0.75, opacity: 0.6 },
        { height: 0.65, opacity: 0.4 },
      ],
    },
    metrics: [
      { label: "Auto", value: "48.2" },
      { label: "Teleop", value: "82.1" },
      { label: "Cycles", value: "14.5" },
      { label: "Consist.", value: "98%" },
      { label: "Uptime", value: "99%" },
      { label: "Avg Load", value: "0.5s" },
      { label: "Defensive Rating", value: "MEDIUM (ADAPTIVE)" },
    ],
  },
  {
    team: "1678",
    name: "CITRUS CIRCUITS",
    drivetrain: "SWERVE DRIVE",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAl7D8THb815TJujE2sLJEHU7E5_7cL3Qh5Zzd0pxjkY9Tsv8mUmHKMknFllm7DmQ7fkJxyahwVYDYdTOKAELFkBZy3RDiXwVSNQe8O0KVy97b-iPpvQAO_Ko3kuZe6Ang0SC-6taBcJLIe7YAmGRLLWbxg60e2rqwr7SQ-S9D59vfPAJF0uY2kjVcHpQO3h97m_b0X1WXJ8Li9LAgV4zK2sT-M2Cr1LptxP0adenmVIi1FHs__GH80EXy7p8QgXwOQzu5kXH4H6pQ",
    stars: 2,
    trend: {
      peakLabel: "-1.5% Volatile",
      peakTone: "error",
      bars: [
        { height: 0.9, opacity: 0.8 },
        { height: 1, opacity: 1 },
        { height: 0.7, opacity: 0.7 },
        { height: 0.4, tone: "error" },
        { height: 0.3, tone: "error" },
        { height: 0.55, opacity: 0.4 },
        { height: 0.8, opacity: 0.6 },
        { height: 0.85, opacity: 0.9 },
      ],
    },
    metrics: [
      { label: "Auto", value: "46.8" },
      { label: "Teleop", value: "84.5" },
      { label: "Cycles", value: "13.9" },
      { label: "Consist.", value: "96%" },
      { label: "Uptime", value: "97%" },
      { label: "Avg Load", value: "0.6s" },
      { label: "Defensive Rating", value: "LOW (OFFENSIVE ONLY)" },
    ],
  },
];

export const RANKINGS = [
  {
    rank: 1, number: "254", name: "The Cheezy Poofs",
    auto: "48.2", teleop: "82.1", climb: "92%", speaker: "31.4",
    amp: "12.8", defense: "MEDIUM", consistency: "98%", status: "STABLE",
  },
  {
    rank: 2, number: "1678", name: "Citrus Circuits",
    auto: "46.8", teleop: "84.5", climb: "88%", speaker: "33.1",
    amp: "11.2", defense: "LOW", consistency: "96%", status: "STABLE",
  },
  {
    rank: 3, number: "5940", name: "BREAD Robotics",
    auto: "42.5", teleop: "79.2", climb: "95%", speaker: "28.0",
    amp: "10.4", defense: "HIGH", consistency: "99%", status: "RE-EVAL",
  },
  {
    rank: 4, number: "2056", name: "OP Robotics",
    auto: "44.1", teleop: "80.7", climb: "90%", speaker: "29.6",
    amp: "9.8", defense: "LOW", consistency: "97%", status: "STABLE",
  },
  {
    rank: 5, number: "971", name: "Spartan Robotics",
    auto: "39.4", teleop: "71.0", climb: "82%", speaker: "24.1",
    amp: "8.5", defense: "MEDIUM", consistency: "92%", status: "STABLE",
  },
  {
    rank: 6, number: "118", name: "Robonauts",
    auto: "41.8", teleop: "74.6", climb: "86%", speaker: "26.7",
    amp: "9.1", defense: "HIGH", consistency: "95%", status: "STABLE",
  },
];

export const DEFAULT_COLUMNS = [
  { id: "auto", label: "Auto Average", checked: true },
  { id: "teleop", label: "Teleop Average", checked: true },
  { id: "climb", label: "Climb Success Rate", checked: true },
  { id: "speaker", label: "Speaker Points", checked: true },
  { id: "amp", label: "Amp Points", checked: false },
  { id: "defense", label: "Defense Rating", checked: false },
  { id: "consistency", label: "Consistency %", checked: true },
];

/**
 * Pool of every scouted team — used by the Robot Comparison "Add Robot"
 * picker. Includes the cards above plus extras that are only available
 * to be added.
 */
export const TEAM_POOL = [
  ...ROBOT_CARDS,
  {
    team: "971",
    name: "SPARTAN ROBOTICS",
    drivetrain: "TANK DRIVE",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAu9QIfF_uCflns9aLWCxCweCKo1lOo66FbCILBg1WpgB8b5dJY9Zol-DrM-2h5CBqfnelD4d80mGxMa_XwDa341WIM_rYnnX0IPZxKv3Hr1NC3zk6hTDWW6VUPsDufRtjW1d7TJeVTjaeeMgkkBfAAdYXDcmh6Zo-AWOkIK7PHbnMDh84eUs17xiTssPSOPvwnfIVaUcci2Of7CV9smXqNZEF1xy8g2HZVRNnX-uD5WE8jCY1nBYpgUq7wS17A_HQn4yfmY9W6bVg",
    stars: 2,
    trend: {
      peakLabel: "+1.1% Peak",
      peakTone: "primary",
      bars: [
        { height: 0.5, opacity: 0.3 },
        { height: 0.6, opacity: 0.5 },
        { height: 0.7, opacity: 0.7 },
        { height: 0.75, opacity: 0.8 },
        { height: 0.8, opacity: 0.9 },
        { height: 0.78, opacity: 0.85 },
        { height: 0.82, opacity: 0.95 },
        { height: 0.85, opacity: 1 },
      ],
    },
    metrics: [
      { label: "Auto", value: "39.4" },
      { label: "Teleop", value: "71.0" },
      { label: "Cycles", value: "11.2" },
      { label: "Consist.", value: "92%" },
      { label: "Uptime", value: "95%" },
      { label: "Avg Load", value: "0.9s" },
      { label: "Defensive Rating", value: "MEDIUM" },
    ],
  },
  {
    team: "2056",
    name: "OP ROBOTICS",
    drivetrain: "SWERVE DRIVE",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD8adcZ6mvxCfslLsGwQFRl9YJsBlxCjyb-GyHNLPJB9bRehjlLBRcC4SchK4cHpP4JNlpf8iuyAO73Rq7ZF2s467VEwutPXryHLI6WOfpteUjrGPD6CEKQOt7suX5Hjfpqg3DBuLYRiv6OtRAjOG-is84DH0iKLOc1M-GuzwgRlEGLPJjzo_GoZpBZB4qu2qdTHYq5fYR8GR0-p6Gh4H3RqlEZJkU4uorK2rv6RD-4i-ijtHgxY83K1YgVHrajdi5CJHhy40c7uRg",
    stars: 3,
    trend: {
      peakLabel: "+3.8% Peak",
      peakTone: "primary",
      bars: [
        { height: 0.65, opacity: 0.4 },
        { height: 0.78, opacity: 0.6 },
        { height: 0.82, opacity: 0.75 },
        { height: 0.9, opacity: 0.85 },
        { height: 0.95, opacity: 1 },
        { height: 0.88, opacity: 0.9 },
        { height: 0.92, opacity: 0.95 },
        { height: 1, opacity: 1 },
      ],
    },
    metrics: [
      { label: "Auto", value: "44.1" },
      { label: "Teleop", value: "80.7" },
      { label: "Cycles", value: "13.2" },
      { label: "Consist.", value: "97%" },
      { label: "Uptime", value: "98%" },
      { label: "Avg Load", value: "0.6s" },
      { label: "Defensive Rating", value: "LOW" },
    ],
  },
  {
    team: "9470",
    name: "Ctrl Alt Defeat",
    drivetrain: "SWERVE DRIVE",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD8adcZ6mvxCfslLsGwQFRl9YJsBlxCjyb-GyHNLPJB9bRehjlLBRcC4SchK4cHpP4JNlpf8iuyAO73Rq7ZF2s467VEwutPXryHLI6WOfpteUjrGPD6CEKQOt7suX5Hjfpqg3DBuLYRiv6OtRAjOG-is84DH0iKLOc1M-GuzwgRlEGLPJjzo_GoZpBZB4qu2qdTHYq5fYR8GR0-p6Gh4H3RqlEZJkU4uorK2rv6RD-4i-ijtHgxY83K1YgVHrajdi5CJHhy40c7uRg",
    stars: 2,
    trend: {
      peakLabel: "+1.8% Peak",
      peakTone: "primary",
      bars: [
        { height: 0.55, opacity: 0.4 },
        { height: 0.7, opacity: 0.6 },
        { height: 0.8, opacity: 0.75 },
        { height: 0.88, opacity: 0.9 },
        { height: 0.92, opacity: 1 },
        { height: 0.85, opacity: 0.85 },
        { height: 0.9, opacity: 0.9 },
        { height: 0.95, opacity: 1 },
      ],
    },
    metrics: [
      { label: "Auto", value: "43.0" },
      { label: "Teleop", value: "78.8" },
      { label: "Cycles", value: "12.6" },
      { label: "Consist.", value: "94%" },
      { label: "Uptime", value: "96%" },
      { label: "Avg Load", value: "0.7s" },
      { label: "Defensive Rating", value: "MEDIUM" },
    ],
  },
  {
    team: "118",
    name: "ROBONAUTS",
    drivetrain: "MECANUM",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAl7D8THb815TJujE2sLJEHU7E5_7cL3Qh5Zzd0pxjkY9Tsv8mUmHKMknFllm7DmQ7fkJxyahwVYDYdTOKAELFkBZy3RDiXwVSNQe8O0KVy97b-iPpvQAO_Ko3kuZe6Ang0SC-6taBcJLIe7YAmGRLLWbxg60e2rqwr7SQ-S9D59vfPAJF0uY2kjVcHpQO3h97m_b0X1WXJ8Li9LAgV4zK2sT-M2Cr1LptxP0adenmVIi1FHs__GH80EXy7p8QgXwOQzu5kXH4H6pQ",
    stars: 2,
    trend: {
      peakLabel: "+0.5% Peak",
      peakTone: "primary",
      bars: [
        { height: 0.7, opacity: 0.55 },
        { height: 0.72, opacity: 0.6 },
        { height: 0.74, opacity: 0.65 },
        { height: 0.76, opacity: 0.7 },
        { height: 0.78, opacity: 0.75 },
        { height: 0.79, opacity: 0.8 },
        { height: 0.8, opacity: 0.85 },
        { height: 0.81, opacity: 0.9 },
      ],
    },
    metrics: [
      { label: "Auto", value: "41.8" },
      { label: "Teleop", value: "74.6" },
      { label: "Cycles", value: "12.7" },
      { label: "Consist.", value: "95%" },
      { label: "Uptime", value: "93%" },
      { label: "Avg Load", value: "0.7s" },
      { label: "Defensive Rating", value: "HIGH" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────
 *  Per-robot analytics shown on /robot-data.
 *
 *  Every team in TEAM_POOL gets analytics. Team 9470 is the prebaked
 *  design-spec entry; everyone else is deterministically generated from
 *  their team number so the demo stays varied but stable across loads.
 * ──────────────────────────────────────────────────────────────────── */

// Analytics ranks (independent of picklist RANKINGS).
const ANALYTICS_RANK = {
  254: 1,
  1678: 2,
  2056: 3,
  9470: 4,
  5940: 5,
  118: 6,
  971: 7,
};

const VANGUARD_X_ANALYTICS = {
  team: "9470",
  name: "VANGUARD X",
  drivetrain: "SWERVE DRIVE",
  epaRank: 4,
  epaTotal: 60,
  grade: "A",
  stats: {
    throughput: 19.43,
    scoreAvg: 19.4,
    sotm: true,
    mechScore: 3,
    elecScore: 3,
    foulTotal: 8,
    farAcc: null, // → "no data"
    closeAcc: "error", // → "error :("
    matchCount: 4,
  },
  matches: [
    { match: "M4", scoring: 346, passing: 83, defense: 0 },
    { match: "M15", scoring: 0, passing: 0, defense: 0, noData: true },
    { match: "M41", scoring: 282, passing: 107, defense: 184 },
    { match: "M75", scoring: 341, passing: 100, defense: 0 },
  ],
  rows: [
    {
      match: 4,
      scoreBps: "18.4790",
      passBps: "19",
      defBps: "-",
      drive: 5,
      pass: 3,
      defense: "-",
      steal: "-",
      brokeDie: false,
      driveNote: "really smooth passing bu…",
      defNote: "-",
    },
    {
      match: 15,
      scoreBps: "-",
      passBps: "-",
      defBps: "-",
      drive: 4,
      pass: "-",
      defense: "-",
      steal: "-",
      brokeDie: false,
      driveNote: "mostly self feeding, bump…",
      defNote: "-",
    },
    {
      match: 41,
      scoreBps: "19.8900",
      passBps: "19",
      defBps: "20.048",
      defBpsHighlight: true,
      drive: 6,
      pass: 4,
      defense: 3,
      steal: 2,
      brokeDie: false,
      driveNote: "good at avoiding defense…",
      defNote: "eff…",
      highlight: true,
    },
  ],
};

// Deterministic PRNG seeded by team number — same team always renders
// the same numbers across reloads.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gradeForRank(rank) {
  if (rank <= 1) return "S";
  if (rank <= 5) return "A";
  if (rank <= 15) return "B";
  if (rank <= 30) return "C";
  return "D";
}

const DRIVE_NOTES = [
  "really smooth passing bu…",
  "mostly self feeding, bump…",
  "good at avoiding defense…",
  "huge cycles, missed late…",
  "auto path needs work…",
  "great climb, swift driver…",
  "broke a wheel, recovered…",
  "consistent but slow…",
  "tipped once, recovered fast…",
  "best driver of the day…",
];

function generateAnalytics(teamInfo) {
  const rank = ANALYTICS_RANK[teamInfo.team] ?? 20;
  const seed = parseInt(teamInfo.team, 10) || rank * 17;
  const rng = mulberry32(seed);

  // 4 match labels spread across an event.
  const start = 3 + Math.floor(rng() * 8);
  const labels = [
    start,
    start + 7 + Math.floor(rng() * 5),
    start + 25 + Math.floor(rng() * 8),
    start + 55 + Math.floor(rng() * 12),
  ];

  // ~60% chance one match in the middle has no data, to mirror the
  // design where M15 is missing.
  const noDataIdx = rng() < 0.6 ? 1 : -1;

  const matches = labels.map((n, i) => {
    if (i === noDataIdx) {
      return { match: `M${n}`, scoring: 0, passing: 0, defense: 0, noData: true };
    }
    const tierBoost = Math.max(0, 6 - rank) * 15;
    const scoring = 220 + tierBoost + Math.floor(rng() * 110);
    const passing = 60 + Math.floor(rng() * 60);
    const defense = rng() < 0.45 ? 90 + Math.floor(rng() * 110) : 0;
    return { match: `M${n}`, scoring, passing, defense };
  });

  const throughput = +(20 - rank * 0.5 + (rng() - 0.5) * 1.5).toFixed(2);
  const scoreAvg = +(throughput + (rng() - 0.5) * 0.6).toFixed(2);
  const sotm = rank <= 5 && rng() < 0.55;
  const mechScore = 1 + Math.floor(rng() * 4);
  const elecScore = 1 + Math.floor(rng() * 4);
  const foulTotal = Math.floor(rng() * 12);
  const farAcc = rng() < 0.7 ? `${50 + Math.floor(rng() * 45)}%` : null;
  const closeAcc =
    rng() < 0.18 ? "error" : `${60 + Math.floor(rng() * 35)}%`;
  const matchCount = matches.filter((m) => !m.noData).length;

  // Spreadsheet rows: one per match (first three) — bolds the highest
  // total in the row group, mirrors the design's M41 treatment.
  const subset = matches.slice(0, 3);
  let bestIdx = 0;
  let bestTotal = -1;
  subset.forEach((m, i) => {
    if (m.noData) return;
    const total = m.scoring + m.passing + m.defense;
    if (total > bestTotal) {
      bestTotal = total;
      bestIdx = i;
    }
  });

  const rows = subset.map((m, i) => {
    const isNoData = m.noData;
    const highlight = !isNoData && i === bestIdx;
    return {
      match: parseInt(m.match.slice(1), 10),
      scoreBps: isNoData ? "-" : (15 + rng() * 6).toFixed(4),
      passBps: isNoData ? "-" : String(15 + Math.floor(rng() * 8)),
      defBps:
        isNoData || m.defense === 0 ? "-" : (16 + rng() * 6).toFixed(3),
      defBpsHighlight: highlight && m.defense > 0,
      drive: 1 + Math.floor(rng() * 6),
      pass: isNoData ? "-" : 1 + Math.floor(rng() * 4),
      defense: isNoData ? "-" : 1 + Math.floor(rng() * 4),
      steal: isNoData ? "-" : 1 + Math.floor(rng() * 4),
      brokeDie: rng() < 0.15,
      driveNote: DRIVE_NOTES[Math.floor(rng() * DRIVE_NOTES.length)],
      defNote: rng() < 0.4 ? "eff…" : "-",
      highlight,
    };
  });

  return {
    team: teamInfo.team,
    name: teamInfo.name,
    drivetrain: teamInfo.drivetrain ?? "SWERVE DRIVE",
    epaRank: rank,
    epaTotal: 60,
    grade: gradeForRank(rank),
    stats: {
      throughput,
      scoreAvg,
      sotm,
      mechScore,
      elecScore,
      foulTotal,
      farAcc,
      closeAcc,
      matchCount,
    },
    matches,
    rows,
  };
}

const PREBAKED_ANALYTICS = {
  9470: VANGUARD_X_ANALYTICS,
};

export const ROBOT_ANALYTICS_BY_TEAM = TEAM_POOL.reduce((acc, t) => {
  acc[t.team] = PREBAKED_ANALYTICS[t.team] ?? generateAnalytics(t);
  return acc;
}, {});

export function getAnalyticsForTeam(teamNumber) {
  return ROBOT_ANALYTICS_BY_TEAM[teamNumber] ?? null;
}

// Initial team to render on the page — matches the design.
export const INITIAL_ANALYTICS_TEAM = "9470";

// Back-compat: anyone still importing this gets every team's analytics.
export const ROBOT_ANALYTICS = Object.values(ROBOT_ANALYTICS_BY_TEAM);

/**
 * Subjective scout notes — per team, per match, with raw phase metrics
 * alongside the freeform notes column. Used by the "View Notes" dialog
 * on the robot comparison card.
 */
export const SCOUT_NOTES = {
  5940: [
    { match: 12, auto: 41, teleop: 78, endgame: "Park", scouter: "JD",
      note: "Solid auto, lost a cycle to a tipped cone. Driver kept composure." },
    { match: 18, auto: 44, teleop: 81, endgame: "Deep", scouter: "AK",
      note: "Best run yet — clean handoffs from human player." },
    { match: 24, auto: 43, teleop: 80, endgame: "Deep", scouter: "MN",
      note: "Defended hard in last 30s and still got the climb in." },
    { match: 31, auto: 42, teleop: 77, endgame: "Park", scouter: "PL",
      note: "Intake jammed once mid-match, recovered in ~6s." },
    { match: 38, auto: 45, teleop: 82, endgame: "Deep", scouter: "JD",
      note: "Auto routine landed all three preloads." },
  ],
  254: [
    { match: 9, auto: 48, teleop: 83, endgame: "Deep", scouter: "TR",
      note: "Cycle time is unreal. Picked up the slow alliance partner." },
    { match: 15, auto: 47, teleop: 80, endgame: "Deep", scouter: "SM",
      note: "Got penalized once for pinning. Didn't repeat." },
    { match: 22, auto: 49, teleop: 84, endgame: "Deep", scouter: "AK",
      note: "Cleanest match of the day. No defense played against them." },
    { match: 29, auto: 48, teleop: 82, endgame: "Park", scouter: "TR",
      note: "Endgame climb glitched — they backed off and parked instead." },
    { match: 35, auto: 50, teleop: 83, endgame: "Deep", scouter: "JD",
      note: "Driver demo'd a new evasive pattern; works." },
  ],
  1678: [
    { match: 11, auto: 47, teleop: 85, endgame: "Deep", scouter: "PL",
      note: "Top teleop in the match. Wheel slip noticeable late." },
    { match: 17, auto: 38, teleop: 79, endgame: "Park", scouter: "MN",
      note: "Brownout mid-match — about 8s downtime." },
    { match: 23, auto: 45, teleop: 82, endgame: "Deep", scouter: "SM",
      note: "Strong recovery from earlier match. Adjusted code between matches." },
    { match: 30, auto: 50, teleop: 87, endgame: "Deep", scouter: "TR",
      note: "Cycle pace nearly matches 254. Climber engaged in 4s." },
    { match: 37, auto: 49, teleop: 86, endgame: "Deep", scouter: "AK",
      note: "Pit said they swapped to softer compound — visibly more grip." },
  ],
  971: [
    { match: 8, auto: 38, teleop: 70, endgame: "Park", scouter: "MN",
      note: "Played defense on 1678 successfully for ~40s." },
    { match: 16, auto: 40, teleop: 72, endgame: "Deep", scouter: "TR",
      note: "Auto path drifted left; missed mid-piece." },
    { match: 26, auto: 39, teleop: 71, endgame: "Park", scouter: "PL",
      note: "Consistent if uninspiring. Reliable second-pick material." },
  ],
  2056: [
    { match: 10, auto: 43, teleop: 79, endgame: "Deep", scouter: "JD",
      note: "Fast intake, smooth climbing animation. No misses." },
    { match: 20, auto: 45, teleop: 82, endgame: "Deep", scouter: "AK",
      note: "Their human player is excellent — short tosses save 1-2s/cycle." },
    { match: 28, auto: 44, teleop: 81, endgame: "Deep", scouter: "SM",
      note: "Driver subbed in — no visible drop in performance." },
  ],
  118: [
    { match: 13, auto: 42, teleop: 74, endgame: "Deep", scouter: "PL",
      note: "Defense-heavy match; chose to play offense and won the cycle race." },
    { match: 19, auto: 41, teleop: 75, endgame: "Park", scouter: "MN",
      note: "Bumper damage early; pit crew turned it around in 3 min." },
    { match: 27, auto: 42, teleop: 75, endgame: "Deep", scouter: "TR",
      note: "Smart positioning during endgame, didn't block partner climb." },
  ],
};
