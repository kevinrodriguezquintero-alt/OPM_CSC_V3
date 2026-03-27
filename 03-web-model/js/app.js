import { api } from "./api.js";
import { renderLgpResult, renderErResult, renderParams, renderSolverConfig, renderSensitivityResult } from "./render.js";
// ── Theme Toggle ───────────────────────────────────────────────────────────

function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}

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

// ── OAT (One-At-a-Time) ──────────────────────────────────────────────────

const SENSITIVITY_PARAMS = [
  "DI", "DD",
  "CP", "CI", "CT", "CTT", "CDA", "CDF", "CMO", "CD",
  "IT", "P", "PP",
  "RB", "RA", "RC", "RD",
  "CA", "CB", "CN", "CH", "CHI", "CR", "CV", "H",
];

function initOat() {
  const grid          = document.getElementById("oat-params-grid");
  const btn           = document.getElementById("oat-btn");
  const container     = document.getElementById("oat-result");
  const checkAll      = document.getElementById("oat-check-all");
  const uncheckAll    = document.getElementById("oat-uncheck-all");
  const maxPctInput   = document.getElementById("oat-max-pct");
  const numStepsInput = document.getElementById("oat-num-steps");
  const runCount      = document.getElementById("oat-run-count");
  const methodSelect  = document.getElementById("oat-method");
  const erStepsWrap   = document.getElementById("oat-er-steps-wrap");
  const erStepsInput  = document.getElementById("oat-er-steps");
  const erPilarWrap   = document.getElementById("oat-er-pilar-wrap");
  const erPilarInput  = document.getElementById("oat-er-pilar");

  methodSelect.addEventListener("change", () => {
    const isEr = methodSelect.value === "er";
    erStepsWrap.classList.toggle("hidden", !isEr);
    erPilarWrap.classList.toggle("hidden", !isEr);
  });

  // Build checkbox grid
  grid.innerHTML = SENSITIVITY_PARAMS.map(p => `
    <div class="scenario-item">
      <label class="scenario-label">
        <input type="checkbox" class="oat-param-cb" value="${p}" />
        <span class="font-mono">${p}</span>
      </label>
    </div>`).join("");

  function updateRunCount() {
    const checked = grid.querySelectorAll(".oat-param-cb:checked").length;
    const maxPct = parseFloat(maxPctInput.value) || 0;
    const stepSize = parseFloat(numStepsInput.value) || 1;
    
    if (stepSize <= 0 || maxPct < 1) {
      runCount.textContent = 0;
      return;
    }
    
    let countPerSide = 0;
    let val = stepSize;
    while (val <= maxPct + 0.0001) {
        countPerSide++;
        val += stepSize;
    }
    if (countPerSide === 0 || Math.abs((val - stepSize) - maxPct) > 0.001) {
        countPerSide++;
    }
    
    runCount.textContent = checked * (countPerSide * 2);
  }

  grid.addEventListener("change", updateRunCount);
  maxPctInput.addEventListener("input", updateRunCount);
  numStepsInput.addEventListener("input", updateRunCount);
  
  // Call once on initialize
  updateRunCount();

  checkAll.addEventListener("click", () => {
    grid.querySelectorAll(".oat-param-cb").forEach(cb => cb.checked = true);
    updateRunCount();
  });
  uncheckAll.addEventListener("click", () => {
    grid.querySelectorAll(".oat-param-cb").forEach(cb => cb.checked = false);
    updateRunCount();
  });

  btn.addEventListener("click", async () => {
    const params_to_test = [...grid.querySelectorAll(".oat-param-cb:checked")].map(cb => cb.value);
    if (params_to_test.length === 0) {
      showError(container, "Selecciona al menos un parámetro.");
      return;
    }
    const maxPct = parseFloat(maxPctInput.value);
    const stepSize = parseFloat(numStepsInput.value);
    if (!maxPct || isNaN(maxPct) || !stepSize || stepSize <= 0) {
      showError(container, "Valores inválidos de parada o tamaño de paso.");
      return;
    }
    const percentages = [];
    let val = stepSize;
    while (val <= maxPct + 0.0001) {
        percentages.push(parseFloat(val.toFixed(2)));
        percentages.push(parseFloat((-val).toFixed(2)));
        val += stepSize;
    }
    const lastPushed = percentages[percentages.length - 2];
    if (lastPushed === undefined || Math.abs(lastPushed - maxPct) > 0.001) {
        percentages.push(parseFloat(maxPct.toFixed(2)));
        percentages.push(parseFloat((-maxPct).toFixed(2)));
    }
    const method = methodSelect.value;
    const steps  = parseInt(erStepsInput.value, 10) || 5;
    btn.disabled = true;
    showSpinner(container);
    try {
      const pilar = erPilarInput.value;
      const data = await api.solveSensitivity(params_to_test, percentages, method, steps, pilar);
      container.innerHTML = renderSensitivityResult(data);
      drawOatCharts(data);
    } catch (e) {
      showError(container, e.message);
    } finally {
      btn.disabled = false;
    }
  });
}

function drawOatCharts(data) {
  function parsePct(changeStr) {
    return parseFloat(changeStr.replace("%", ""));
  }

  const colors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#393b79', '#5254a3', '#6b6ecf', '#9c9ede', '#637939'
  ];

  function buildCombinedChart(canvasId, topRows, objKey, baseValue, title) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    Chart.getChart(canvas)?.destroy();

    const datasets = [];
    const seen = new Set();
    let colorIdx = 0;

    (topRows || []).forEach(r => {
      if (seen.has(r.param)) return;
      seen.add(r.param);

      const paramResults = (data.results || []).filter(res => res.param === r.param && res[objKey] != null);
      const points = [
        { x: 0, y: baseValue },
        ...paramResults.map(res => ({ x: parsePct(res.change), y: res[objKey] }))
      ].sort((a, b) => a.x - b.x);

      datasets.push({
        label: r.param,
        data: points,
        borderColor: colors[colorIdx % colors.length],
        backgroundColor: colors[colorIdx % colors.length],
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        tension: 0,
        showLine: true,
        fill: false,
      });
      colorIdx++;
    });

    new Chart(canvas, {
      type: "scatter",
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: title, font: { size: 16, weight: 'bold' } },
          legend: { display: true, position: 'bottom', align: 'center', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => {
                const pct = ctx.parsed.x;
                const tag = pct === 0 ? "Base" : `${pct > 0 ? "+" : ""}${pct}%`;
                return `${ctx.dataset.label} (${tag}): ${ctx.parsed.y.toLocaleString("es-CO", { maximumFractionDigits: 2 })}`;
              },
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "Perturbación (%)", font: { size: 12 } },
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { 
              stepSize: parseFloat(document.getElementById("oat-num-steps")?.value) || 1,
              autoSkip: false,
              callback: v => `${v > 0 ? "+" : ""}${v}%` 
            },
          },
          y: {
            title: { display: false },
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { callback: v => v.toLocaleString("es-CO", { maximumFractionDigits: 2 }) }
          },
        },
      },
    });
  }

  const bo = data.base_objectives || {};
  buildCombinedChart("sens-combined-cost", data.top_cost, "obj_cost", bo.cost, "Costo vs Perturbación");
  buildCombinedChart("sens-combined-env", data.top_env, "obj_env", bo.emissions, "Emisiones vs Perturbación");
  buildCombinedChart("sens-combined-soc", data.top_soc, "obj_soc", bo.employment, "Empleo vs Perturbación");
}

const SCENARIO_PRESETS = {
  crecimiento: { DI: 15, CA: -10, CB: -10 },
  expansion:   { DI: 14, CA: 20,  CB: 20  },
  restriccion: { CA: -20, CB: -20 },
  presion:     { CV: 20, IT: 20 },
  regulacion:  { DI: 10, CV: 20, IT: 20 },
  adversas:    { DI: -14, CV: 20, CA: -20, CB: -20, IT: 10 },
  critica:     { DI: 20, CV: 20, CA: -10, CB: -10, IT: 10 },
};

// ── Scenarios ────────────────────────────────────────────────────────────

function initScenarios() {
  const grid       = document.getElementById("scenarios-params-grid");
  const btn        = document.getElementById("scenarios-btn");
  const container  = document.getElementById("scenarios-result");
  const checkAll   = document.getElementById("scenarios-check-all");
  const uncheckAll = document.getElementById("scenarios-uncheck-all");
  const method     = document.getElementById("scenarios-method");
  const erWrap     = document.getElementById("scenarios-er-steps-wrap");
  const erSteps    = document.getElementById("scenarios-er-steps");
  const presetSelect = document.getElementById("scenarios-preset");

  presetSelect.addEventListener("change", () => {
    const val = presetSelect.value;
    uncheckAll.click();
    if (!val || !SCENARIO_PRESETS[val]) return;

    const config = SCENARIO_PRESETS[val];
    Object.entries(config).forEach(([p, pct]) => {
      const cb = grid.querySelector(`.scenarios-param-cb[value="${p}"]`);
      const input = grid.querySelector(`.scenarios-param-input[data-param="${p}"]`);
      if (cb) cb.checked = true;
      if (input) input.value = pct;
    });
  });

  const erPilarWrap  = document.getElementById("scenarios-er-pilar-wrap");
  const erPilarInput = document.getElementById("scenarios-er-pilar");

  method.addEventListener("change", () => {
    const isEr = method.value === "er";
    erWrap.classList.toggle("hidden", !isEr);
    erPilarWrap.classList.toggle("hidden", !isEr);
  });

  grid.innerHTML = SENSITIVITY_PARAMS.map(p => `
    <div class="scenario-item">
      <label class="scenario-label">
        <input type="checkbox" class="scenarios-param-cb" value="${p}" />
        <span class="font-mono">${p}</span>
      </label>
      <div class="scenario-input-wrap">
        <input type="number" value="10" step="0.1" class="scenarios-param-input" data-param="${p}" />
        <span class="scenario-pct-sign">%</span>
      </div>
    </div>
  `).join("");

  checkAll.addEventListener("click", () => {
    grid.querySelectorAll(".scenarios-param-cb").forEach(cb => cb.checked = true);
  });
  uncheckAll.addEventListener("click", () => {
    grid.querySelectorAll(".scenarios-param-cb").forEach(cb => cb.checked = false);
  });

  btn.addEventListener("click", async () => {
    const params_to_test = {};
    grid.querySelectorAll(".scenarios-param-cb:checked").forEach(cb => {
      const input = grid.querySelector(`.scenarios-param-input[data-param="${cb.value}"]`);
      params_to_test[cb.value] = parseFloat(input?.value) || 0;
    });

    if (Object.keys(params_to_test).length === 0) {
      showError(container, "Selecciona al menos un parámetro.");
      return;
    }

    const m = method.value;
    const s = parseInt(erSteps.value, 10) || 5;

    btn.disabled = true;
    showSpinner(container);
    try {
      const { renderScenariosResult } = await import("./render.js");
      const data = await api.solveScenarios(params_to_test, m, s, erPilarInput.value);
      container.innerHTML = renderScenariosResult(data);
    } catch (e) {
      showError(container, e.message);
    } finally {
      btn.disabled = false;
    }
  });
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
  initThemeToggle();
  initTabs();
  initInnerTabs();
  initConfig();
  initParams();
  initOat();
  initScenarios();
  initLgp();
  initEr();
});
