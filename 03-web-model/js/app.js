import { api } from "./api.js";
import { renderLgpResult, renderErResult, renderParams, renderSolverConfig, renderSensitivityResult, fmt } from "./render.js";
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

function showSpinner(el, msg = "Cargando…") {
  el.innerHTML = `
    <div class="flex flex-col items-center py-6 text-center">
      <div class="spinner !m-0 mb-4" role="status" aria-label="${msg}"></div>
      <p class="text-xs font-bold text-muted uppercase tracking-[0.2em] animate-pulse">${msg}</p>
    </div>`;
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
    showSpinner(container, "Cargando Parámetros...");
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

/**
 * Muestra una barra de progreso premium en un contenedor.
 * Retorna una función para actualizar el % (0-100) y el subtítulo.
 */
function showProgressBar(container, title, total) {
  container.innerHTML = `
    <div class="p-8 bg-surface-alt rounded-xl border border-line shadow-sm text-center">
      <p class="text-xs font-bold text-main uppercase tracking-[0.2em] mb-4" id="pbar-title">${title}</p>
      <div class="w-full bg-page rounded-full h-2.5 mb-2 overflow-hidden border border-line">
        <div id="pbar-fill" class="bg-accent h-full transition-all duration-500 ease-out" style="width: 0%"></div>
      </div>
      <p class="text-[11px] text-muted font-medium" id="pbar-subtext">Iniciando...</p>
    </div>
  `;
  const fill = document.getElementById("pbar-fill");
  const subtext = document.getElementById("pbar-subtext");
  
  return (current, subtitle) => {
    const pct = Math.min(100, Math.round((current / total) * 100));
    fill.style.width = `${pct}%`;
    if (subtitle) subtext.innerText = subtitle;
  };
}

// ── LGP ────────────────────────────────────────────────────────────────────

function initLgp() {
  const btn       = document.getElementById("lgp-btn");
  const container = document.getElementById("lgp-result");

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    const update = showProgressBar(container, "Modelado Lexicográfico", 1);
    update(0.1, "Construyendo modelo y cargando parámetros...");
    try {
      const data = await api.solveLgp();
      update(1, "¡Optimización exitosa!");
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
    const update = showProgressBar(container, "Frontera de Pareto (ER)", 1);
    update(0.1, `Generando ${steps} puntos en la frontera de Pareto...`);
    try {
      const data = await api.solveEr(steps);
      update(1, "Frontera generada correctamente.");
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
  methodSelect.addEventListener("change", () => {
    const isEr = methodSelect.value === "er";
    erStepsWrap.classList.toggle("hidden", !isEr);
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
    let valStep = stepSize;
    while (valStep <= maxPct + 0.0001) {
        percentages.push(parseFloat(valStep.toFixed(2)));
        percentages.push(parseFloat((-valStep).toFixed(2)));
        valStep += stepSize;
    }
    const lastPushed = percentages[percentages.length - 2];
    if (lastPushed === undefined || Math.abs(lastPushed - maxPct) > 0.001) {
        percentages.push(parseFloat(maxPct.toFixed(2)));
        percentages.push(parseFloat((-maxPct).toFixed(2)));
    }
    const method = methodSelect.value;
    const steps  = parseInt(erStepsInput.value, 10) || 5;
    btn.disabled = true;
    try {
      const pilar = "middle";
      const totalParams = params_to_test.length;
      const totalSteps = totalParams * percentages.length;
      const update = showProgressBar(container, "Sensibilidad OAT", totalSteps);
      
      let finalData = null;
      let globalIdx = 0;

      for (let i = 0; i < totalParams; i++) {
        const p = params_to_test[i];
        
        for (let j = 0; j < percentages.length; j++) {
            const pct = percentages[j];
            globalIdx++;
            update(globalIdx, `Simulación ${globalIdx}/${totalSteps}: ${p} (${pct >= 0 ? "+" : ""}${fmt(pct)}%)`);
            
            try {
                const part = await api.solveSensitivity([p], [pct], method, steps, pilar);
                if (!finalData) {
                    finalData = part;
                } else {
                    finalData.results.push(...part.results);
                }
            } catch (err) {
                console.error(`Error en simulación ${p} (${pct}%):`, err);
                // Si falla una individual, agregamos el error al set de resultados para no perder consistencia
                if (finalData) {
                    finalData.results.push({
                        param: p,
                        change: `${pct >= 0 ? "+" : ""}${fmt(pct)}%`,
                        error: "Se perdió la conexión con el servidor en esta simulación específica."
                    });
                }
            }
        }
      }
      
      // Sanitizar formatos de punto decimal en las cadenas de cambio antes de procesar rankings
      (finalData.results || []).forEach(r => {
        if (typeof r.change === "string") r.change = r.change.replace('.', ',');
      });

      // Recalcular Top rankings agrupado por diversidad y frecuencia
      const sortElas = (arr, key) => {
        const valid = arr.filter(r => r[key] !== null && r[key] !== undefined && Math.abs(r[key]) > 0);
        const grouped = {};
        valid.forEach(r => {
          if (!grouped[r.param]) {
            grouped[r.param] = { param: r.param, count: 0, maxAbs: 0, bestRow: null };
          }
          grouped[r.param].count++;
          const absVal = Math.abs(r[key]);
          if (absVal > grouped[r.param].maxAbs) {
            grouped[r.param].maxAbs = absVal;
            grouped[r.param].bestRow = r;
          }
        });

        return Object.values(grouped)
          .sort((a, b) => {
            if (Math.abs(b.maxAbs - a.maxAbs) > 1e-7) return b.maxAbs - a.maxAbs; // Primero por magnitud de elasticidad (Promesa del Top)
            return b.count - a.count; // Desempate por frecuencia de impactos
          })
          .map(g => ({ ...g.bestRow, frequency: g.count }));
      };

      finalData.top_cost = sortElas(finalData.results, "elas_cost");
      finalData.top_env  = sortElas(finalData.results, "elas_env");
      finalData.top_soc  = sortElas(finalData.results, "elas_soc");

      // Ranking Global (Agrupado por parámetro)
      const globalAgg = {};
      (finalData.results || []).forEach(r => {
        if (!globalAgg[r.param]) {
          globalAgg[r.param] = { 
            param: r.param, 
            maxElas: 0, 
            pillars: new Set() 
          };
        }
        const ec = Math.abs(r.elas_cost || 0);
        const ee = Math.abs(r.elas_env || 0);
        const es = Math.abs(r.elas_soc || 0);
        globalAgg[r.param].maxElas = Math.max(globalAgg[r.param].maxElas, ec, ee, es);
        if (ec > 1e-5) globalAgg[r.param].pillars.add("Costo");
        if (ee > 1e-5) globalAgg[r.param].pillars.add("Emisiones");
        if (es > 1e-5) globalAgg[r.param].pillars.add("Empleo");
      });

      const globalList = Object.values(globalAgg).map(g => ({
        param: g.param,
        maxElasticity: g.maxElas,
        pillarCount: g.pillars.size,
        pillarsStr: Array.from(g.pillars).join(", ")
      }));

      finalData.top_global_elas = [...globalList].sort((a,b) => b.maxElasticity - a.maxElasticity);
      finalData.top_global_freq = [...globalList].sort((a,b) => b.pillarCount - a.pillarCount || b.maxElasticity - a.maxElasticity);

      update(totalSteps, "Analizando rankings de impacto...");
      container.innerHTML = renderSensitivityResult(finalData);
      drawOatCharts(finalData);
    } catch (e) {
      showError(container, e.message);
    } finally {
      btn.disabled = false;
    }
  });
}

// ── Rangos (LGP vs ER) ───────────────────────────────────────────────────

function initRobustness() {
  const btn = document.getElementById("robustness-btn");
  const container = document.getElementById("robustness-result");
  const grid = document.getElementById("robustness-params-grid");
  const checkAll = document.getElementById("robustness-check-all");
  const uncheckAll = document.getElementById("robustness-uncheck-all");

  if (!btn || !container) return;

  grid.innerHTML = SENSITIVITY_PARAMS.map(p => `
    <div class="scenario-item">
      <label class="scenario-label">
        <input type="checkbox" class="robustness-param-cb" value="${p}" />
        <span class="font-mono">${p}</span>
      </label>
    </div>`).join("");

  checkAll.addEventListener("click", () => {
    grid.querySelectorAll(".robustness-param-cb").forEach(cb => cb.checked = true);
  });
  uncheckAll.addEventListener("click", () => {
    grid.querySelectorAll(".robustness-param-cb").forEach(cb => cb.checked = false);
  });

  btn.addEventListener("click", async () => {
    const params_to_test = [...grid.querySelectorAll(".robustness-param-cb:checked")].map(cb => cb.value);
    if (params_to_test.length === 0) {
      showError(container, "Selecciona al menos un parámetro.");
      return;
    }
    
    btn.disabled = true;
    const total = params_to_test.length;
    const update = showProgressBar(container, "Análisis de Rangos", total);

    try {
      const { renderRangesComparison } = await import("./render.js");
      
      update(0, "Calculando base (Compromiso Pareto)...");
      const baseResult = await api.solveSensitivityRanges([]);
      
      const allRows = [];
      for (let i = 0; i < total; i++) {
        const p = params_to_test[i];
        update(i, `Analizando límites de factibilidad: ${p} (${i + 1}/${total})`);
        
        const paramResult = await api.solveSensitivityRanges([p]);
        if (paramResult.ranges && paramResult.ranges.length > 0) {
          allRows.push(paramResult.ranges[0]);
        }
      }

      update(total, "Finalizando reporte de robustez...");
      const finalData = { ...baseResult, ranges: allRows };
      container.innerHTML = renderRangesComparison(finalData);

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
                const tag = pct === 0 ? "Base" : `${pct > 0 ? "+" : ""}${fmt(pct)}%`;
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
  // Eje 1: Contexto Macroeconómico y Demanda
  boom_demanda: { DI: 14.5, DD: 35 },
  crecimiento: { DI: 15, CA: -10, CB: -10 },
  
  // Eje 2: Estrategia Corporativa
  expansion: { DI: 14, CA: 20, CB: 20 },
  
  // Eje 3: Sostenibilidad y Viabilidad Verde
  transicion_verde: { CI: 15, CT: 15, IT: -30, CV: 25 },
  regulacion_ambiental: { DI: 10, IT: 20, CV: 20 },
  
  // Eje 4: Impacto Social y Automatización
  super_eficiencia: { CA: 50, CB: 50, CP: 10 },
  fomento_laboral: { CA: 100, CB: 100 },
  
  // Eje 5: Vulnerabilidad y Límites
  crisis_climatica: { RC: -35, RA: -40, CP: 20 },
  huelga_transporte: { CV: -40, CT: 50, CTT: 50 },
};

// ── Scenarios ────────────────────────────────────────────────────────────

function initScenarios() {
  const grid       = document.getElementById("scenarios-params-grid");
  const btn        = document.getElementById("scenarios-btn");
  const container  = document.getElementById("scenarios-result");
  const checkAll   = document.getElementById("scenarios-check-all");
  const uncheckAll = document.getElementById("scenarios-uncheck-all");
  const erWrap     = document.getElementById("scenarios-er-steps-wrap");
  const erSteps    = document.getElementById("scenarios-er-steps"); // Puede ser null
  const presetSelect = document.getElementById("scenarios-preset");

  // Método fijo: siempre comparar LGP vs ER
  const method = { value: "both" };

  presetSelect.addEventListener("change", () => {
    const val = presetSelect.value;
    
    // Si selecciona "Elige un Escenario", no hacer nada
    if (!val) return;
    
    // Limpiar checkboxes e inputs sin resetear el select
    grid.querySelectorAll(".scenarios-param-cb").forEach(cb => cb.checked = false);
    grid.querySelectorAll(".scenarios-param-input").forEach(input => input.value = 0);
    
    // Special case: base comparison - select all params with 0%
    if (val === "base") {
      grid.querySelectorAll(".scenarios-param-cb").forEach(cb => {
        cb.checked = true;
        const input = grid.querySelector(`.scenarios-param-input[data-param="${cb.value}"]`);
        if (input) input.value = 0;
      });
      return;
    }
    
    if (!SCENARIO_PRESETS[val]) return;

    const config = SCENARIO_PRESETS[val];
    Object.entries(config).forEach(([p, pct]) => {
      const cb = grid.querySelector(`.scenarios-param-cb[value="${p}"]`);
      const input = grid.querySelector(`.scenarios-param-input[data-param="${p}"]`);
      if (cb) cb.checked = true;
      if (input) input.value = pct;
    });
  });

  // Eliminado: event listener del selector de método ya que ahora es fijo (both)
  // method.addEventListener("change", () => {
  //   const isEr = method.value === "er";
  //   erWrap.classList.toggle("hidden", !isEr);
  // });

  grid.innerHTML = SENSITIVITY_PARAMS.map(p => `
    <div class="scenario-item">
      <label class="scenario-label">
        <input type="checkbox" class="scenarios-param-cb" value="${p}" />
        <span class="font-mono">${p}</span>
      </label>
      <div class="scenario-input-wrap">
        <input type="number" value="0" step="0.1" class="scenarios-param-input" data-param="${p}" />
        <span class="scenario-pct-sign">%</span>
      </div>
    </div>
  `).join("");

  // Initialize: all parameters unchecked and values at 0 by default
  // (the select starts with "Elige un Escenario" as placeholder)

  checkAll.addEventListener("click", () => {
    grid.querySelectorAll(".scenarios-param-cb").forEach(cb => cb.checked = true);
  });
  uncheckAll.addEventListener("click", () => {
    grid.querySelectorAll(".scenarios-param-cb").forEach(cb => cb.checked = false);
    grid.querySelectorAll(".scenarios-param-input").forEach(input => input.value = 0);
    presetSelect.value = ""; // Volver a "Elige un Escenario"
  });

  btn.addEventListener("click", async () => {
    const params_vals = {};
    grid.querySelectorAll(".scenarios-param-cb:checked").forEach(cb => {
      const input = grid.querySelector(`.scenarios-param-input[data-param="${cb.value}"]`);
      params_vals[cb.value] = parseFloat(input?.value) || 0;
    });

    if (Object.keys(params_vals).length === 0) {
      showError(container, "Selecciona al menos un parámetro.");
      return;
    }

    const m = method.value;
    const s = erSteps ? parseInt(erSteps.value, 10) || 5 : 5;
    btn.disabled = true;

    const stepsTotal = m === "both" ? 2 : 1;
    const update = showProgressBar(container, "Análisis de Escenarios", stepsTotal);

    try {
      const { renderScenariosResult, renderCombinedScenariosResult } = await import("./render.js");

      if (m === "both") {
        update(0, "Fase 1/2: Resolviendo Metas Lexicográficas (LGP)...");
        const lgpData = await api.solveScenarios(params_vals, "lgp", s, "middle");
        
        update(1, "Fase 2/2: Resolviendo Epsilon-Restricción (ER)...");
        const erData = await api.solveScenarios(params_vals, "er", s, "middle");
        
        update(2, "¡Simulación mutivariables completada!");
        const selectedValue = presetSelect.value;
        const scenarioName = selectedValue && selectedValue !== ""
          ? presetSelect.options[presetSelect.selectedIndex].text
          : "Escenario Propuesto";
        container.innerHTML = renderCombinedScenariosResult(lgpData, erData, scenarioName);
      } else {
        update(0.5, `Evaluando configuración bajo método ${m.toUpperCase()}...`);
        const data = await api.solveScenarios(params_vals, m, s, "middle");
        update(1, "Listo.");
        container.innerHTML = renderScenariosResult(data);
      }
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
  initRobustness();
  initLgp();
  initEr();
});
