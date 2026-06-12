import { buildQuery, request } from "./client";

export function listSubmissions(params = {}) {
  return request(`/api/submissions${buildQuery(params)}`);
}
