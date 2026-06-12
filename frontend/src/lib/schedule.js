// Match schedule data for the current event. Faked for now — replace with
// a TBA/FRC schedule fetch when wired up.

export const OUR_TEAM = "5940";

// Event we're currently scouting. Hardcoded until a "set current event" flow
// exists — matches the seed script's EVENT_KEY ("2026arc") so the dev server
// hits real data.
export const CURRENT_EVENT_KEY = "2026arc";

export const CURRENT_EVENT = {
  code: "SVR",
  name: "Silicon Valley Regional",
  shortName: "SVR Regional",
  location: "San Jose, CA",
  dates: "Mar 27 – Mar 30, 2026",
  status: "Qualifications · Day 2",
};

// Upcoming matches at the current event, soonest first.
export const UPCOMING_MATCHES = [
  {
    id: "qm-40",
    number: 40,
    type: "Qual",
    scheduledAt: "11:18 AM",
    startsInLabel: "in 4 min",
    field: "Field 1",
    red: ["973", "8033", "604"],
    blue: ["6036", "1671", "846"],
  },
  {
    id: "qm-41",
    number: 41,
    type: "Qual",
    scheduledAt: "11:30 AM",
    startsInLabel: "in 16 min",
    field: "Field 1",
    red: ["2486", "1351", "8"],
    blue: ["4159", "1280", "1868"],
  },
  {
    id: "qm-42",
    number: 42,
    type: "Qual",
    scheduledAt: "11:42 AM",
    startsInLabel: "in 28 min",
    field: "Field 1",
    red: ["5940", "254", "1678"],
    blue: ["1323", "4414", "971"],
  },
  {
    id: "qm-43",
    number: 43,
    type: "Qual",
    scheduledAt: "11:54 AM",
    startsInLabel: "in 40 min",
    field: "Field 1",
    red: ["115", "1700", "5026"],
    blue: ["192", "100", "3970"],
  },
  {
    id: "qm-44",
    number: 44,
    type: "Qual",
    scheduledAt: "12:06 PM",
    startsInLabel: "in 52 min",
    field: "Field 1",
    red: ["2473", "5026", "8033"],
    blue: ["6036", "4159", "604"],
  },
  {
    id: "qm-58",
    number: 58,
    type: "Qual",
    scheduledAt: "2:12 PM",
    startsInLabel: "in 2h 58m",
    field: "Field 1",
    red: ["5940", "118", "2056"],
    blue: ["971", "1678", "4414"],
  },
];

export function getTeamNextMatch(team = OUR_TEAM) {
  return (
    UPCOMING_MATCHES.find(
      (m) => m.red.includes(team) || m.blue.includes(team)
    ) ?? null
  );
}

export function getAllianceColor(match, team) {
  if (match.red.includes(team)) return "red";
  if (match.blue.includes(team)) return "blue";
  return null;
}
