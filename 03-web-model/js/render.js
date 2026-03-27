// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n === null || n === undefined) return "—";
  return typeof n === "number" ? n.toLocaleString("es-CO", { maximumFractionDigits: 4 }) : String(n);
}

function statusBadge(status) {
  const ok = status === "optimal";
  return `<span class="badge ${ok ? "badge-ok" : "badge-err"}">${status}</span>`;
}

function th(...cols) {
  return `<tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr>`;
}

function td(...cols) {
  return `<tr>${cols.map(c => `<td>${c}</td>`).join("")}</tr>`;
}

// ── Inner tabs (Resultado / Logs) ───────────────────────────────────────────

function renderInnerTabs(ns, tabs) {
  const btnHtml = tabs.map((t, i) => `
    <button class="inner-tab-btn ${i === 0 ? "inner-tab-active" : ""}"
            data-inner-ns="${ns}" data-inner-tab="${t.id}">
      ${t.label}
    </button>`).join("");

  const paneHtml = tabs.map((t, i) => `
    <div class="inner-pane ${i === 0 ? "" : "hidden"}"
         data-inner-ns="${ns}" data-inner-pane="${t.id}">
      ${t.content}
    </div>`).join("");

  return `
    <div class="inner-tabs-bar">${btnHtml}</div>
    <div class="inner-panes">${paneHtml}</div>`;
}

function renderTerminal(text) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `
    <div class="terminal-wrap">
      <div class="terminal-header">
        <span class="terminal-title">Solver output</span>
        <button class="copy-btn" onclick="
          navigator.clipboard.writeText(this.closest('.terminal-wrap').querySelector('pre').textContent);
          this.textContent='Copiado';
          setTimeout(()=>this.textContent='Copiar',1800);
        ">Copiar</button>
      </div>
      <pre class="terminal-body">${escaped || "(sin output)"}</pre>
    </div>`;
}

// ── LGP ────────────────────────────────────────────────────────────────────

export function renderLgpResult(data) {
  if (!data) return `<p class="text-[var(--c-error-text)]">Sin datos.</p>`;

  const stepsHtml = (data.steps || []).map(s => {
    const objs = s.objectives || {};
    return `
      <div class="step-card">
        <div class="step-header">
          <span class="step-num">Paso ${s.step}</span>
          <span class="step-priority">${s.priority}</span>
          ${statusBadge(s.status)}
        </div>
        <table class="data-table mt-2">
          <thead>${th("Objetivo", "Valor")}</thead>
          <tbody>
            ${td("Costo", fmt(objs.cost))}
            ${td("Emisiones", fmt(objs.emissions))}
            ${td("Empleo", fmt(objs.employment))}
          </tbody>
        </table>
      </div>`;
  }).join("");

  const vars = data.variables;
  let varsHtml = "";
  if (vars) {
    varsHtml = `
      <h3 class="section-subtitle">Variables de decisión</h3>
      <div class="vars-grid">
        ${renderVarTable("X — Flujo productor→intermediario", ["i", "j", "value"], vars.X)}
        ${renderVarTable("Y — Flujo intermediario→retailer", ["j", "k", "value"], vars.Y)}
        ${renderVarTable("Z — Viajes productor→intermediario", ["i", "j", "value"], vars.Z)}
        ${renderVarTable("ZZ — Viajes intermediario→retailer", ["j", "k", "value"], vars.ZZ)}
        ${renderVarTable("W — Hectáreas por productor", ["i", "value"], vars.W)}
        ${renderVarTable("S — Personal intermediario", ["j", "value"], vars.S)}
        ${renderVarTable("SS — Personal retailer", ["k", "value"], vars.SS)}
        ${renderVarTable("B — Variantes activas", ["u", "value"], vars.B)}
      </div>`;
  }

  // Logs: one entry per step (log field added by backend)
  const combinedLog = (data.steps || [])
    .map(s => `=== Paso ${s.step} — ${s.priority} ===\n${s.log || "(sin log)"}`)
    .join("\n");

  return `
    <div class="result-status mb-4">
      <strong>Estado final:</strong> ${statusBadge(data.status)}
      &nbsp; <strong>Solver:</strong> <code>${data.solver}</code>
    </div>
    ${renderInnerTabs("lgp", [
      { id: "resultado", label: "Resultado", content: `
        <h3 class="section-subtitle">Pasos LGP</h3>
        <div class="steps-grid">${stepsHtml}</div>
        ${varsHtml}` },
      { id: "logs", label: "Logs", content: renderTerminal(combinedLog) },
    ])}`;
}

function renderVarTable(title, cols, rows) {
  if (!rows || rows.length === 0) return "";
  const header = th(...cols.map(c => c.toUpperCase()));
  const body = rows.map(r => td(...cols.map(c => fmt(r[c])))).join("");
  return `
    <div class="var-block">
      <h4 class="var-title">${title}</h4>
      <table class="data-table">
        <thead>${header}</thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}

// ── ER ─────────────────────────────────────────────────────────────────────

export function renderErResult(data) {
  if (!data) return `<p class="text-[var(--c-error-text)]">Sin datos.</p>`;

  // Payoff table
  const pt = data.payoff_table || {};
  const payoffHtml = `
    <h3 class="section-subtitle">Resultados base</h3>
    <table class="data-table">
      <thead>${th("Escenario", "Costo", "Emisiones", "Empleo")}</thead>
      <tbody>
        ${td("Min Costo",      fmt(pt.min_cost?.cost),      fmt(pt.min_cost?.emissions),      fmt(pt.min_cost?.employment))}
        ${td("Min Emisiones",  fmt(pt.min_emissions?.cost), fmt(pt.min_emissions?.emissions), fmt(pt.min_emissions?.employment))}
        ${td("Max Social",     fmt(pt.max_social?.cost),    fmt(pt.max_social?.emissions),    fmt(pt.max_social?.employment))}
      </tbody>
    </table>`;

  // Pareto frontier table
  const pf = data.pareto_frontier || [];
  const paretoRows = pf.map(p => {
    const o = p.objectives || {};
    return td(p.iteration, fmt(p.epsilon), statusBadge(p.status), fmt(o.cost), fmt(o.emissions), fmt(o.employment));
  }).join("");
  const paretoHtml = `
    <h3 class="section-subtitle mt-6">Frontera de Pareto</h3>
    <table class="data-table">
      <thead>${th("Iter", "ε (Emisiones)", "Estado", "Costo", "Emisiones", "Empleo")}</thead>
      <tbody>${paretoRows}</tbody>
    </table>`;

  // Last iteration variables
  const vars = data.last_iteration_variables;
  const varsHtml = vars ? `
    <h3 class="section-subtitle mt-6">Variables de decisión</h3>
    <div class="vars-grid">
      ${renderVarTable("X — Flujo productor→intermediario", ["i", "j", "value"], vars.X)}
      ${renderVarTable("Y — Flujo intermediario→retailer", ["j", "k", "value"], vars.Y)}
      ${renderVarTable("Z — Viajes productor→intermediario", ["i", "j", "value"], vars.Z)}
      ${renderVarTable("ZZ — Viajes intermediario→retailer", ["j", "k", "value"], vars.ZZ)}
      ${renderVarTable("W — Hectáreas por productor", ["i", "value"], vars.W)}
      ${renderVarTable("S — Personal intermediario", ["j", "value"], vars.S)}
      ${renderVarTable("SS — Personal retailer", ["k", "value"], vars.SS)}
      ${renderVarTable("B — Variantes activas", ["u", "value"], vars.B)}
    </div>` : "";

  return `
    <div class="result-status mb-4">
      <strong>Solver:</strong> <code>${data.solver}</code>
      &nbsp; <strong>Steps:</strong> ${data.steps}
    </div>
    ${renderInnerTabs("er", [
      { id: "resultado", label: "Resultado", content: `
        ${payoffHtml}
        ${paretoHtml}
        ${varsHtml}` },
      { id: "logs", label: "Logs", content: renderTerminal(data.log || "") },
    ])}`;
}

// ── Params (editable) ───────────────────────────────────────────────────────

const PARAM_DESCRIPTIONS = {
  PRODUCERS:         "Conjunto de productores (I)",
  INTERMEDIARIES:    "Conjunto de intermediarios (J)",
  RETAILERS:         "Conjunto de detallistas (K)",
  PRODUCER_VARIANTS: "Variantes de productor (U)",
  RB:  "Rendimiento máximo total (Kg/Ha·semana)",
  RA:  "Rendimiento por variante de productor u (Kg/Ha·semana)",
  RC:  "Rendimiento máximo del cultivo base por productor i (Kg/Ha·semana)",
  RD:  "Rendimiento mínimo del cultivo base por productor i (Kg/Ha·semana)",
  CA:  "Capacidad productiva por persona en intermediario j (Kg/persona)",
  CB:  "Capacidad productiva por persona en detallista k (Kg/persona)",
  CP:  "Costo de producción en productor i ($/Kg)",
  CI:  "Costo de procesamiento en intermediario j ($/Kg)",
  CT:  "Costo de transporte productor i → intermediario j ($/Kg)",
  CTT: "Costo de transporte intermediario j → detallista k ($/Kg)",
  CD:  "Costo de mano de obra en detallista k ($/semana)",
  CDA: "Costo por daño en ruta productor i → intermediario j ($/Kg)",
  CDF: "Costo por daño en ruta intermediario j → detallista k ($/Kg)",
  P:   "Porcentaje de daño productor i → intermediario j (%)",
  PP:  "Porcentaje de daño intermediario j → detallista k (%)",
  CN:  "Capacidad de producción en productor i (Kg/día)",
  CH:  "Capacidad de despacho en productor i (Kg/día)",
  CHI: "Capacidad de despacho en intermediario j (Kg/día)",
  CR:  "Capacidad de recepción en detallista k (Kg/día)",
  DI:  "Demanda mínima en intermediario j (Kg/día)",
  DD:  "Demanda mínima en detallista k (Kg/día)",
  CV:  "Capacidad del vehículo en intermediario j (Kg/viaje)",
  CMO: "Costo de mano de obra en intermediario j ($/semana)",
  H:   "Número de hectáreas por variante de productor u (Ha·semana)",
  DPI: "Distancia/impacto ambiental ruta productor i → intermediario j (km)",
  DID: "Distancia/impacto ambiental ruta intermediario j → detallista k (km)",
  IT:  "Factor de impacto de transporte por intermediario j",
};

export function renderParams(data) {
  if (!data) return `<p class="text-[var(--c-error-text)]">Sin datos.</p>`;

  const rows = Object.entries(data).map(([key, val]) => {
    let kind, inputHtml;

    if (typeof val === "number") {
      // scalar
      kind = "scalar";
      inputHtml = `<input type="number" step="any" class="param-input"
        data-param="${key}" data-kind="scalar" value="${val}">`;

    } else if (Array.isArray(val)) {
      if (val.length === 0 || typeof val[0] !== "object") {
        // list of primitives
        kind = "list";
        inputHtml = `<input type="text" class="param-input param-input-list"
          data-param="${key}" data-kind="list" value="${val.join(", ")}">`;
      } else {
        // dict2: [{k1, k2, value}, ...]
        kind = "dict2";
        const keys = Object.keys(val[0]).filter(k => k !== "value");
        const k1name = keys[0], k2name = keys[1];
        const bodyRows = val.map(entry => `
          <tr>
            <td class="idx-cell">${entry[k1name]}</td>
            <td class="idx-cell">${entry[k2name]}</td>
            <td><input type="number" step="any" class="param-input"
                  data-param="${key}" data-kind="dict2"
                  data-k1name="${k1name}" data-k1val="${entry[k1name]}"
                  data-k2name="${k2name}" data-k2val="${entry[k2name]}"
                  value="${entry.value}"></td>
          </tr>`).join("");
        inputHtml = `
          <div class="dict2-wrap">
            <table class="data-table dict2-table">
              <thead>${th(k1name.toUpperCase(), k2name.toUpperCase(), "Valor")}</thead>
              <tbody>${bodyRows}</tbody>
            </table>
          </div>`;
      }

    } else if (typeof val === "object" && val !== null) {
      // dict1: {"1": v, "2": v, ...}
      kind = "dict1";
      const pairs = Object.entries(val).map(([k, v]) => `
        <span class="dict1-key">${k}</span>
        <input type="number" step="any" class="param-input"
               data-param="${key}" data-kind="dict1" data-key="${k}"
               value="${v}">`).join("");
      inputHtml = `<div class="dict1-grid">${pairs}</div>`;

    } else {
      kind = typeof val;
      inputHtml = String(val ?? "—");
    }

    const desc = PARAM_DESCRIPTIONS[key] ?? "";
    return `
      <tr>
        <td><strong>${key}</strong></td>
        <td class="param-desc">${desc}</td>
        <td><span class="type-tag">${kind}</span></td>
        <td>${inputHtml}</td>
      </tr>`;
  }).join("");

  return `
    <table class="data-table params-table">
      <thead>${th("Parámetro", "Descripción", "Tipo", "Valor / Editar")}</thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ── Sensitivity Analysis ────────────────────────────────────────────────────

function elasticityClass(e) {
  if (e === null || e === undefined) return "";
  const abs = Math.abs(e);
  if (abs > 0.5) return "elas-high";
  if (abs > 0.1) return "elas-mid";
  return "";
}

function renderTopTable(rows, objTitle, objKey, elasKey) {
  if (!rows || rows.length === 0) return `<p class="text-subtle italic text-sm">Sin resultados.</p>`;
  const body = rows.map(r => {
    const e = r[elasKey];
    const cls = elasticityClass(e);
    return `<tr>
      <td><strong>${r.param}</strong></td>
      <td>${r.change}</td>
      <td>${r[objKey] !== undefined ? fmt(r[objKey]) : "—"}</td>
      <td class="${cls}">${e !== null && e !== undefined ? e.toFixed(4) : "—"}</td>
    </tr>`;
  }).join("");
  return `
    <table class="data-table">
      <thead>${th("Parámetro", "Cambio", objTitle, "Elasticidad")}</thead>
      <tbody>${body}</tbody>
    </table>`;
}

export function renderSensitivityResult(data) {
  if (!data) return `<p class="text-[var(--c-error-text)]">Sin datos.</p>`;

  const bo = data.base_objectives || {};
  const baseCard = `
    <div class="step-card mb-4">
      <div class="step-header"><span class="step-num">Objetivos Base</span></div>
      <table class="data-table mt-2">
        <thead>${th("Objetivo", "Valor")}</thead>
        <tbody>
          ${td("Costo", fmt(bo.cost))}
          ${td("Emisiones", fmt(bo.emissions))}
          ${td("Empleo", fmt(bo.employment))}
        </tbody>
      </table>
    </div>`;

  function renderTopCard(title, tableRows, objTitle, objKey, elasKey) {
    return `
      <div class="sens-top-card" style="margin: 0 auto;">
        <div style="margin-bottom: 0.6rem;">
          <h3 class="sens-top-title" style="margin-bottom:0px;">${title}</h3>
        </div>
        ${renderTopTable(tableRows, objTitle, objKey, elasKey)}
      </div>`;
  }

  const topCost = renderTopCard("PARÁMETROS CON ELASTICIDAD — COSTO", data.top_cost, "Costo", "obj_cost", "elas_cost");
  const topEnv  = renderTopCard("PARÁMETROS CON ELASTICIDAD — EMISIONES", data.top_env, "Emisiones", "obj_env", "elas_env");
  const topSoc  = renderTopCard("PARÁMETROS CON ELASTICIDAD — EMPLEO", data.top_soc, "Empleo", "obj_soc", "elas_soc");

  function pctCell(newVal, baseVal) {
    if (newVal === null || newVal === undefined) return `<td>—</td>`;
    const pct = baseVal !== 0 ? ((newVal - baseVal) / baseVal) * 100 : 0;
    const sign = pct >= 0 ? "+" : "";
    return `<td>
      <div class="sens-val">${fmt(newVal)}</div>
      <div class="sens-delta sens-delta-neutral">${sign}${pct.toFixed(2)}%</div>
    </td>`;
  }

  const allRows = (data.results || []).map(r => {
    if (r.error) {
      return `<tr>
        <td><strong>${r.param}</strong></td>
        <td>${r.change}</td>
        <td colspan="6">
          <span class="badge badge-err">Sin solución factible</span>
          <span class="text-subtle text-xs ml-2">${r.error}</span>
        </td>
      </tr>`;
    }
    const cc = elasticityClass(r.elas_cost);
    const ec = elasticityClass(r.elas_env);
    return `<tr>
      <td><strong>${r.param}</strong></td>
      <td>${r.change}</td>
      ${pctCell(r.obj_cost, bo.cost)}
      ${pctCell(r.obj_env,  bo.emissions)}
      ${pctCell(r.obj_soc,  bo.employment)}
      <td class="${cc}">${r.elas_cost !== null && r.elas_cost !== undefined ? r.elas_cost.toFixed(4) : "—"}</td>
      <td class="${ec}">${r.elas_env  !== null && r.elas_env  !== undefined ? r.elas_env.toFixed(4)  : "—"}</td>
      <td>${r.elas_soc !== null && r.elas_soc !== undefined ? r.elas_soc.toFixed(4) : "—"}</td>
    </tr>`;
  }).join("");

  const fullTable = `
    <div class="flex justify-end mb-2">
      <button class="text-xs text-accent hover:underline" onclick="
        const table = this.closest('div').nextElementSibling;
        const rows = Array.from(table.querySelectorAll('tr'));
        const tsv = rows.map(r => {
          return Array.from(r.querySelectorAll('th, td')).map(c => {
            const v = c.querySelector('.sens-val');
            return (v ? v.innerText : c.innerText).trim();
          }).join('\\t');
        }).join('\\n');
        navigator.clipboard.writeText(tsv);
        const old = this.textContent;
        this.textContent = 'Copiado';
        setTimeout(() => this.textContent = old, 1500);
      ">Copiar</button>
    </div>
    <table class="data-table">
      <thead>${th("Parámetro", "Cambio", "Costo", "Emisiones", "Empleo", "E.Costo", "E.Emisiones", "E.Empleo")}</thead>
      <tbody>${allRows}</tbody>
    </table>`;

  const chartsSection = `
    <div class="sens-charts-grid" style="display:flex; flex-direction:column; gap:1.5rem;">
      <div class="sens-chart-wrap" style="height:400px; background:var(--c-bg-surface); border:1px solid var(--c-border); border-radius:0.5rem; padding:1rem; position:relative;">
        <canvas id="sens-combined-cost"></canvas>
      </div>
      <div class="sens-chart-wrap" style="height:400px; background:var(--c-bg-surface); border:1px solid var(--c-border); border-radius:0.5rem; padding:1rem; position:relative;">
        <canvas id="sens-combined-env"></canvas>
      </div>
      <div class="sens-chart-wrap" style="height:400px; background:var(--c-bg-surface); border:1px solid var(--c-border); border-radius:0.5rem; padding:1rem; position:relative;">
        <canvas id="sens-combined-soc"></canvas>
      </div>
    </div>`;

  const tabsContent = renderInnerTabs("sens", [
    { id: "graficos", label: "Gráficos", content: chartsSection },
    { id: "top-costo", label: "Costo", content: topCost },
    { id: "top-emisiones", label: "Emisiones", content: topEnv },
    { id: "top-empleo", label: "Empleo", content: topSoc },
    { id: "completos", label: "Tabla Completa", content: fullTable },
  ]);

  return `${baseCard}${tabsContent}`;
}

// ── Solver Config ──────────────────────────────────────────────────────────

export function renderSolverConfig(data, badgeEl, selectEl) {
  if (!data) return;
  if (badgeEl) {
    badgeEl.textContent = data.active || data.solver || "—";
    badgeEl.className = "solver-badge";
  }
  if (selectEl && data.available) {
    const current = selectEl.value || data.active;
    selectEl.innerHTML = data.available
      .map(s => `<option value="${s}" ${s === current ? "selected" : ""}>${s}</option>`)
      .join("");
  }
}

export function renderScenariosResult(data) {
  if (!data) return `<p class="text-[var(--c-error-text)] text-center py-4">Sin datos de escenario.</p>`;
  
  const { base, propuesto, inverso, params_modified } = data;

  function renderScenarioCard(title, objs, hint) {
    if (!objs) return `
      <div class="sens-top-card" style="border-color: var(--c-error-border); background: var(--c-error-bg);">
        <h3 class="sens-top-title" style="color: var(--c-error-text);">${title}</h3>
        <div class="flex flex-col items-center justify-center py-8 text-[var(--c-error-text)] text-center px-4">
           <svg class="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
           <p class="font-bold">Inviabilidad Detectada</p>
           <p class="text-xs mt-2 text-[var(--c-error-text)] leading-relaxed">${hint || "Las restricciones del modelo no se cumplen para esta configuración."}</p>
        </div>
      </div>`;
    
    const diff = (val, baseVal, reverse = false) => {
       if (baseVal === undefined || baseVal === null || baseVal === 0) return "";
       const p = ((val - baseVal) / baseVal) * 100;
       let cls = "sens-delta-neutral";
       if (Math.abs(p) > 0.001) {
         if (reverse) {
           cls = p > 0 ? "sens-delta-good" : "sens-delta-bad";
         } else {
           cls = p < 0 ? "sens-delta-good" : "sens-delta-bad";
         }
       }
       return `<div class="sens-delta ${cls}">${p >= 0 ? "+" : ""}${p.toFixed(2)}%</div>`;
    };

    return `
      <div class="sens-top-card">
        <h3 class="sens-top-title">${title}</h3>
        <table class="data-table mt-2">
          <thead>${th("Objetivo", "Valor", "Variación")}</thead>
          <tbody>
            <tr>
              <td><span class="font-medium">Costo</span></td>
              <td>${fmt(objs.cost)}</td>
              <td>${diff(objs.cost, base.cost)}</td>
            </tr>
            <tr>
              <td><span class="font-medium">Emisiones</span></td>
              <td>${fmt(objs.emissions)}</td>
              <td>${diff(objs.emissions, base.emissions)}</td>
            </tr>
            <tr>
              <td><span class="font-medium">Empleo</span></td>
              <td>${fmt(objs.employment)}</td>
              <td>${diff(objs.employment, base.employment, true)}</td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  const cardsHtml = `
    <div class="sens-top-grid">
      ${renderScenarioCard(`Escenario Propuesto`, propuesto, "La configuración de parámetros ingresada ha vuelto inviable el plan de producción.")}
      ${renderScenarioCard(`Escenario Inverso`, inverso, "La configuración inversa de los parámetros es incompatible con las restricciones del sistema.")}
    </div>`;

  const paramsEntries = Object.entries(params_modified || {});

  return `
    <div class="bg-surface border border-line rounded-xl p-6 mb-6 shadow-sm">
      <h4 class="text-xs font-bold text-muted uppercase tracking-widest mb-3">Parámetros en el Escenario</h4>
      <p class="text-sm text-muted mb-4">
        Se han aplicado perturbaciones individuales a <strong>${paramsEntries.length}</strong> variables:
      </p>
      <div class="flex flex-wrap gap-2">
        ${paramsEntries.map(([p, pct]) => `
          <div class="flex items-center bg-surface border border-line rounded-lg shadow-sm overflow-hidden">
            <span class="px-3 py-1.5 text-xs font-bold text-main bg-surface-alt border-r border-line">${p}</span>
            <span class="px-3 py-1.5 text-sm text-muted font-mono font-semibold">${pct >= 0 ? "+" : ""}${pct}%</span>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="bg-surface border border-line rounded-xl p-6 mb-6 shadow-sm">
       <div class="text-center mb-6">
         <h3 class="text-xs font-bold text-main uppercase tracking-[0.2em]">Comparativa vs Base</h3>
       </div>
       ${cardsHtml}
    </div>
  `;
}
