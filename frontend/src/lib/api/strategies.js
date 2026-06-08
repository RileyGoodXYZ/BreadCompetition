import { buildQuery, request } from "./client";

export function listStrategies(params = {}) {
  return request(`/api/strategies${buildQuery(params)}`);
}

export function getStrategy(id) {
  return request(`/api/strategies/${encodeURIComponent(id)}`);
}

export function createStrategy(payload) {
  return request(`/api/strategies`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStrategy(id, patch) {
  return request(`/api/strategies/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteStrategy(id) {
  return request(`/api/strategies/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
