// Tiny wrapper around the Django REST API.
const BASE = "https://6mj7gj-8000.csb.app/api";

export async function listQuotes() {
  const res = await fetch(`${BASE}/quotes/`);
  if (!res.ok) throw new Error(`GET failed: ${res.status}`);
  const data = await res.json();
  return data.results; // DRF pagination wraps rows in `results`
}

export async function createQuote(payload) {
  const res = await fetch(`${BASE}/quotes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`POST failed: ${res.status}`);
  return res.json();
}
