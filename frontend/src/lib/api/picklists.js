import { buildQuery, request } from "./client";

export function listPicklists(params = {}) {
  return request(`/api/picklists${buildQuery(params)}`);
}

export function getPicklist(id) {
  return request(`/api/picklists/${encodeURIComponent(id)}`);
}

export function createPicklist(payload) {
  return request(`/api/picklists`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePicklist(id, patch) {
  return request(`/api/picklists/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deletePicklist(id) {
  return request(`/api/picklists/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
