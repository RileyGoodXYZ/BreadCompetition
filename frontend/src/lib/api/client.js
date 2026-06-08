const BASE = import.meta.env.VITE_API_URL ?? "";

export async function request(path, init) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(
      `${init?.method ?? "GET"} ${path} -> ${res.status} ${text}`
    );
  }
  if (res.status === 204) return null;
  return res.json();
}

export function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}
