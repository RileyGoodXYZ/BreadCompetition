import { buildQuery, request } from "./client";

export function listEvents(params = {}) {
  return request(`/api/events${buildQuery(params)}`);
}

export function getEvent(eventKey) {
  return request(`/api/events/${encodeURIComponent(eventKey)}`);
}

export function listEventTeams(eventKey, params = {}) {
  return request(
    `/api/events/${encodeURIComponent(eventKey)}/teams${buildQuery(params)}`
  );
}

export function listEventMatches(eventKey, params = {}) {
  return request(
    `/api/events/${encodeURIComponent(eventKey)}/matches${buildQuery(params)}`
  );
}
