// Mock per-team stat cards used on the Strategy Detail alliance columns.
// Strategy *documents* (the saved match-strategy list) come from the API
// via `match-strategy-store.jsx`. This mock backs the per-team stat blocks
// because there is no team-analytics endpoint yet.

export const STRATEGY_TEAM_STATS = {
  "5940": {
    team: "5940",
    name: "BREAD Robotics",
    auto: { epa: "24.5", winPct: "92%" },
    teleop: { epa: "48.2", pieces: "12.4" },
    accuracy: { close: "98%", moving: "Yes" },
    traits: { intake: "Under", bump: "None" },
  },
  "254": {
    team: "254",
    name: "The Cheezy Poofs",
    auto: { epa: "32.1", winPct: "98%" },
    teleop: { epa: "65.0", pieces: "18.2" },
    accuracy: { close: "99%", moving: "Yes" },
    traits: { intake: "Over", bump: "No" },
  },
  "1678": {
    team: "1678",
    name: "Citrus Circuits",
    auto: { epa: "28.4", winPct: "89%" },
    teleop: { epa: "54.3", pieces: "14.1" },
    accuracy: { close: "95%", moving: "Yes" },
    traits: { intake: "Under", bump: "No" },
  },
  "1323": {
    team: "1323",
    name: "MadTown Robotics",
    auto: { epa: "30.2", winPct: "95%" },
    teleop: { epa: "59.8", pieces: "16.5" },
    accuracy: { close: "97%", moving: "Yes" },
    traits: { intake: "Over", bump: "No" },
  },
  "4414": {
    team: "4414",
    name: "HighTide Robotics",
    auto: { epa: "26.7", winPct: "88%" },
    teleop: { epa: "52.1", pieces: "13.2" },
    accuracy: { close: "93%", moving: "Yes" },
    traits: { intake: "Under", bump: "No" },
  },
  "971": {
    team: "971",
    name: "Spartan Robotics",
    auto: { epa: "29.1", winPct: "94%" },
    teleop: { epa: "58.4", pieces: "15.8" },
    accuracy: { close: "96%", moving: "Yes" },
    traits: { intake: "Over", bump: "No" },
  },
  "118": {
    team: "118",
    name: "Robonauts",
    auto: { epa: "27.5", winPct: "90%" },
    teleop: { epa: "55.0", pieces: "14.5" },
    accuracy: { close: "94%", moving: "Yes" },
    traits: { intake: "Under", bump: "No" },
  },
  "2056": {
    team: "2056",
    name: "OP Robotics",
    auto: { epa: "31.0", winPct: "96%" },
    teleop: { epa: "61.2", pieces: "17.0" },
    accuracy: { close: "97%", moving: "Yes" },
    traits: { intake: "Over", bump: "No" },
  },
};

/** Columns of the strategy timeline table. */
export const TIMELINE_COLUMNS = [
  { id: "auto", label: "Auto" },
  { id: "transition", label: "Transition" },
  { id: "shift1", label: "Shift 1" },
  { id: "shift2", label: "Shift 2" },
  { id: "shift3", label: "Shift 3" },
  { id: "endgame", label: "Endgame" },
];

