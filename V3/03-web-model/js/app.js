import { api } from "./api.js";
import { renderLgpResult, renderErResult, renderParams, renderSolverConfig, renderSensitivityResult } from "./render.js";

// ── Tab switching ──────────────────────────────────────────────────────────

function initTabs() {
  const tabs = document.querySelectorAll("[data-tab]");
  const sections = document.querySelectorAll("section[id^='tab-']");

  function activateTab(name) {
    tabs.forEach(t => t.classList.toggle("tab-active", t.dataset.tab === name));
    sections.forEach(s => s.classList.toggle("hidden", s.id !== `tab-${name}`));
    const url = new URL(window.location);
    url.searchParams.set("tab", name);
    history.replaceState(null, "", url);
  }

  tabs.forEach(t => t.addEventListener("click", () => activateTab(t.dataset.tab)));

  const initial = new URL(window.location).searchParams.get("tab") || "config";
  activateTab(initial);
}

// ── Spinner helpers ────────────────────────────────────────────────────────

function showSpinner(el) {
  el.innerHTML = `<div class="spinner" role="status" aria-label="Cargando…"></div>`;
}

function showError(el, msg) {
  el.innerHTML = `<div class="error-box"><strong>Error:</strong> ${msg}</div>`;
}

// ── Config ─────────────────────────────────────────────────────────────────

function initConfig() {
  const badge  = document.getElementById("solver-badge");
  const select = document.getElementById("solver-select");
  const btn    = document.getElementById("solver-btn");
  const msg    = document.getElementById("solver-msg");

  async function loadSolver() {
    try {
      const data = await api.getSolver();
      renderSolverConfig(data, badge, select);
    } catch (e) {
      if (badge) badge.textContent = "error";
    }
  }

  btn.addEventListener("click", async () => {
    msg.textContent = "";
    try {
      const data = await api.setSolver(select.value);
      renderSolverConfig(data, badge, select);
      msg.textContent = `Solver cambiado a "${select.value}".`;
      msg.className = "feedback-ok";
    } catch (e) {
      msg.textContent = e.message;
      msg.className = "feedback-err";
    }
  });

  loadSolver();
}

// ── Params ─────────────────────────────────────────────────────────────────

function collectParamsPatch(container) {
  const patch = {};
  container.querySelectorAll(".param-input").forEach(input => {
    const { param, kind } = input.dataset;
    const raw = input.value;

    if (kind === "scalar") {
      patch[param] = parseFloat(raw);
    } else if (kind === "list") {
      patch[param] = raw.split(",").map(x => parseInt(x.trim(), 10)).filter(x => !isNaN(x));
    } else if (kind === "dict1") {
      if (!patch[param]) patch[param] = {};
      patch[param][input.dataset.key] = parseFloat(raw);
    } else if (kind === "dict2") {
      if (!patch[param]) patch[param] = [];
      const { k1name, k1val, k2name, k2val } = input.dataset;
      patch[param].push({
        [k1name]: parseInt(k1val, 10),
        [k2name]: parseInt(k2val, 10),
        value: parseFloat(raw),
      });
    }
  });
  return patch;
}

function initParams() {
  const container   = document.getElementById("params-container");
  const saveBtn     = document.getElementById("params-save-btn");
  const resetBtn    = document.getElementById("params-reset-btn");
  const exportBtn   = document.getElementById("params-export-btn");
  const importInput = document.getElementById("params-import-input");
  const msg         = document.getElementById("params-msg");

  async function loadParams() {
    showSpinner(container);
    try {
      const data = await api.getParams();
      container.innerHTML = renderParams(data);
    } catch (e) {
      showError(container, e.message);
    }
  }

  saveBtn.addEventListener("click", async () => {
    msg.textContent = "";
    try {
      const patch = collectParamsPatch(container);
      await api.updateParams(patch);
      msg.textContent = "Parámetros guardados.";
      msg.className = "feedback-ok";
    } catch (e) {
      msg.textContent = e.message;
      msg.className = "feedback-err";
    }
  });

  exportBtn.addEventListener("click", async () => {
    msg.textContent = "";
    try {
      const data = await api.getParams();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "params.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      msg.textContent = e.message;
      msg.className = "feedback-err";
    }
  });

  importInput.addEventListener("change", async () => {
    const file = importInput.files[0];
    if (!file) return;
    importInput.value = "";
    msg.textContent = "";
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await api.updateParams(data);
      msg.textContent = `"${file.name}" importado.`;
      msg.className = "feedback-ok";
      loadParams();
    } catch (e) {
      msg.textContent = `Error al importar: ${e.message}`;
      msg.className = "feedback-err";
    }
  });

  resetBtn.addEventListener("click", async () => {
    msg.textContent = "";
    try {
      await api.resetParams();
      msg.textContent = "Parámetros restaurados.";
      msg.className = "feedback-ok";
      loadParams();
    } catch (e) {
      msg.textContent = e.message;
      msg.className = "feedback-err";
    }
  });

  loadParams();
}

// ── LGP ────────────────────────────────────────────────────────────────────

function initLgp() {
  const btn       = document.getElementById("lgp-btn");
  const container = document.getElementById("lgp-result");

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    showSpinner(container);
    try {
      const data = await api.solveLgp();
      container.innerHTML = renderLgpResult(data);
    } catch (e) {
      showError(container, e.message);
    } finally {
      btn.disabled = false;
    }
  });
}

// ── ER ─────────────────────────────────────────────────────────────────────


function initEr() {
  const btn        = document.getElementById("er-btn");
  const stepsInput = document.getElementById("er-steps");
  const container  = document.getElementById("er-result");

  btn.addEventListener("click", async () => {
    const steps = parseInt(stepsInput.value, 10) || 5;
    btn.disabled = true;
    showSpinner(container);
    try {
      const data = await api.solveEr(steps);
      container.innerHTML = renderErResult(data);
    } catch (e) {
      showError(container, e.message);
    } finally {
      btn.disabled = false;
    }
  });
}

// ── Sensitivity ────────────────────────────────────────────────────────────

const SENSITIVITY_PARAMS = [
  "DI", "DD",
  "CP", "CI", "CT", "CTT", "CDA", "CDF", "CMO", "CD",
  "IT", "P", "PP",
  "RB", "RA", "RC", "RD",
  "CA", "CB", "CN", "CH", "CHI", "CR", "CV", "H",
];

function initSensitivity() {
  const grid          = document.getElementById("sensitivity-params-grid");
  const btn           = document.getElementById("sensitivity-btn");
  const container     = document.getElementById("sensitivity-result");
  const checkAll      = document.getElementById("sensitivity-check-all");
  const uncheckAll    = document.getElementById("sensitivity-uncheck-all");
  const pctPos        = document.getElementById("sensitivity-pct-pos");
  const pctNeg        = document.getElementById("sensitivity-pct-neg");
  const runCount      = document.getElementById("sensitivity-run-count");
  const methodSelect  = document.getElementById("sensitivity-method");
  const erStepsWrap   = document.getElementById("sensitivity-er-steps-wrap");
  const erStepsInput  = document.getElementById("sensitivity-er-steps");

  methodSelect.addEventListener("change", () => {
    erStepsWrap.classList.toggle("hidden", methodSelect.value !== "er");
  });

  // Build checkbox grid
  grid.innerHTML = SENSITIVITY_PARAMS.map(p => `
    <label class="flex items-center gap-1.5 text-sm cursor-pointer select-none sensitivity-param-label">
      <input type="checkbox" class="sensitivity-param-cb" value="${p}" checked />
      <span class="font-mono">${p}</span>
    </label>`).join("");

  function updateRunCount() {
    const checked = grid.querySelectorAll(".sensitivity-param-cb:checked").length;
    const pcts = [pctPos.value, pctNeg.value].filter(v => v !== "").length;
    runCount.textContent = checked * pcts;
  }

  grid.addEventListener("change", updateRunCount);
  pctPos.addEventListener("input", updateRunCount);
  pctNeg.addEventListener("input", updateRunCount);

  checkAll.addEventListener("click", () => {
    grid.querySelectorAll(".sensitivity-param-cb").forEach(cb => cb.checked = true);
    updateRunCount();
  });
  uncheckAll.addEventListener("click", () => {
    grid.querySelectorAll(".sensitivity-param-cb").forEach(cb => cb.checked = false);
    updateRunCount();
  });

  btn.addEventListener("click", async () => {
    const params_to_test = [...grid.querySelectorAll(".sensitivity-param-cb:checked")].map(cb => cb.value);
    if (params_to_test.length === 0) {
      showError(container, "Selecciona al menos un parámetro.");
      return;
    }
    const percentages = [parseFloat(pctPos.value), parseFloat(pctNeg.value)].filter(v => !isNaN(v));
    const method = methodSelect.value;
    const steps  = parseInt(erStepsInput.value, 10) || 5;
    btn.disabled = true;
    showSpinner(container);
    try {
      const data = await api.solveSensitivity(params_to_test, percentages, method, steps);
      container.innerHTML = renderSensitivityResult(data);
      drawSensitivityCharts(data);
    } catch (e) {
      showError(container, e.message);
    } finally {
      btn.disabled = false;
    }
  });
}

function drawSensitivityCharts(data) {
  function parsePct(changeStr) {
    return parseFloat(changeStr.replace("%", ""));
  }

  function buildParamChart(canvasId, param, objKey, baseValue, yLabel) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    Chart.getChart(canvas)?.destroy();

    const paramResults = (data.results || [])
      .filter(r => r.param === param && r[objKey] != null);

    const points = [
      { x: 0, y: baseValue },
      ...paramResults.map(r => ({ x: parsePct(r.change), y: r[objKey] })),
    ].sort((a, b) => a.x - b.x);

    new Chart(canvas, {
      type: "scatter",
      data: {
        datasets: [{
          data: points,
          borderColor: "#6366f1",
          backgroundColor: "#6366f1",
          pointRadius: 5,
          pointHoverRadius: 8,
          borderWidth: 2,
          tension: 0,
          showLine: true,
          fill: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const pct = ctx.parsed.x;
                const tag = pct === 0 ? "Base" : `${pct > 0 ? "+" : ""}${pct}%`;
                return ` ${tag}: ${ctx.parsed.y.toLocaleString("es-CO", { maximumFractionDigits: 2 })}`;
              },
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "Perturbación (%)", font: { size: 10 } },
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { font: { size: 10 }, callback: v => `${v > 0 ? "+" : ""}${v}%` },
          },
          y: {
            title: { display: true, text: yLabel, font: { size: 10 } },
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { font: { size: 9 } },
          },
        },
      },
    });
  }

  function drawGroup(topRows, ns, objKey, baseValue, yLabel) {
    const seen = new Set();
    (topRows || []).forEach(r => {
      if (seen.has(r.param)) return;
      seen.add(r.param);
      buildParamChart(`sens-chart-${ns}-${r.param}`, r.param, objKey, baseValue, yLabel);
    });
  }

  const bo = data.base_objectives || {};
  drawGroup(data.top_cost, "cost", "obj_cost", bo.cost,       "Costo");
  drawGroup(data.top_env,  "env",  "obj_env",  bo.emissions,  "Emisiones");
  drawGroup(data.top_soc,  "soc",  "obj_soc",  bo.employment, "Empleo");
}

// ── Inner tabs (delegated, works after innerHTML injection) ────────────────

function initInnerTabs() {
  document.addEventListener("click", e => {
    const btn = e.target.closest(".inner-tab-btn");
    if (!btn) return;
    const ns   = btn.dataset.innerNs;
    const tabId = btn.dataset.innerTab;
    const scope = btn.closest(".inner-panes")?.parentElement
               ?? document;

    scope.querySelectorAll(`.inner-tab-btn[data-inner-ns="${ns}"]`)
      .forEach(b => b.classList.toggle("inner-tab-active", b === btn));
    scope.querySelectorAll(`.inner-pane[data-inner-ns="${ns}"]`)
      .forEach(p => p.classList.toggle("hidden", p.dataset.innerPane !== tabId));
  });
}

// ── Boot ───────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initInnerTabs();
  initConfig();
  initParams();
  initSensitivity();
  initLgp();
  initEr();
});
