export const BASE = "http://localhost:8000";

async function apiFetch(path, options = {}) {
  const init = {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json" },
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }
  const res = await fetch(BASE + path, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  health:      () => apiFetch("/health"),
  getSolver:   () => apiFetch("/config/solver"),
  setSolver:   (name) => apiFetch("/config/solver", { method: "PUT", body: { solver: name } }),
  getParams:   () => apiFetch("/params"),
  updateParams: (body) => apiFetch("/params", { method: "PUT", body }),
  resetParams: () => apiFetch("/params/reset", { method: "POST" }),
  solveLgp:    () => apiFetch("/solve/lgp", { method: "POST" }),
  solveEr:     (steps) => apiFetch("/solve/er", { method: "POST", body: { steps } }),
  
  async solveSensitivity(params_to_test, percentages, method = "lgp", steps = 5, er_pilar = "middle") {
    const r = await fetch(`${BASE}/solve/sensitivity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params_to_test, percentages, method, steps, er_pilar }),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async solveScenarios(params_to_test, method = "lgp", steps = 5, er_pilar = "middle", escenario_id = null) {
    const r = await fetch(`${BASE}/solve/scenarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params_to_test, method, steps, er_pilar, escenario_id }),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async solveSensitivityRanges(params = ["CA","CB","CN","RA","RC","CV","DI","DD","IT"]) {
    const r = await fetch(`${BASE}/solve/sensitivity-ranges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params }),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};
