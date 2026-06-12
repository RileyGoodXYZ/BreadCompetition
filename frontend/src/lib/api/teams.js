import { buildQuery, request } from "./client";

export function listTeams(params = {}) {
  return request(`/api/teams${buildQuery(params)}`);
}

export function getTeam(teamNumber) {
  return request(`/api/teams/${encodeURIComponent(teamNumber)}`);
}
