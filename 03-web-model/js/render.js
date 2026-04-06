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
      <div class="bg-surface border border-line rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
        <div class="bg-surface-alt px-3 py-2 border-b border-line flex justify-between items-center">
          <h5 class="text-[10px] font-bold text-main uppercase tracking-widest">
            PASO ${s.step}: <span class="text-accent">${s.priority === "social" ? "EMPLEO" : s.priority.toUpperCase()}</span>
          </h5>
          ${statusBadge(s.status)}
        </div>
        <div class="p-1">
          <table class="data-table text-[11px] w-full">
            <thead>
              <tr>
                <th class="!text-left !px-3 font-bold uppercase tracking-wider">OBJETIVO</th>
                <th class="!text-center font-bold uppercase tracking-wider">VALOR</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="!text-left font-bold !px-3">COSTO</td>
                <td class="!text-center font-mono">${fmt(objs.cost)}</td>
              </tr>
              <tr>
                <td class="!text-left font-bold !px-3">EMISIONES</td>
                <td class="!text-center font-mono">${fmt(objs.emissions)}</td>
              </tr>
              <tr>
                <td class="!text-left font-bold !px-3">EMPLEO</td>
                <td class="!text-center font-mono">${fmt(objs.employment)}</td>
              </tr>
            </tbody>
          </table>
        </div>
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
    <div class="bg-surface border border-line rounded-xl overflow-hidden shadow-sm mb-6">
      <div class="bg-surface-alt px-4 py-2 border-b border-line">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Resultados Base (Payoff Table)</h5>
      </div>
      <table class="data-table text-[11px] w-full">
        <thead>
          <tr>
            <th class="!text-left !px-4 font-bold">ESCENARIO</th>
            <th class="!text-center font-bold">COSTO</th>
            <th class="!text-center font-bold">EMISIONES</th>
            <th class="!text-center font-bold">EMPLEO</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="!text-left font-bold !px-4">Min Costo</td>
            <td class="!text-center font-mono">${fmt(pt.min_cost?.cost)}</td>
            <td class="!text-center font-mono">${fmt(pt.min_cost?.emissions)}</td>
            <td class="!text-center font-mono">${fmt(pt.min_cost?.employment)}</td>
          </tr>
          <tr>
            <td class="!text-left font-bold !px-4">Min Emisiones</td>
            <td class="!text-center font-mono">${fmt(pt.min_emissions?.cost)}</td>
            <td class="!text-center font-mono">${fmt(pt.min_emissions?.emissions)}</td>
            <td class="!text-center font-mono">${fmt(pt.min_emissions?.employment)}</td>
          </tr>
          <tr>
            <td class="!text-left font-bold !px-4">Max Empleo</td>
            <td class="!text-center font-mono">${fmt(pt.max_social?.cost)}</td>
            <td class="!text-center font-mono">${fmt(pt.max_social?.emissions)}</td>
            <td class="!text-center font-mono">${fmt(pt.max_social?.employment)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;

  // Pareto frontier table
  const pf = data.pareto_frontier || [];
  const paretoRows = pf.map(p => {
    const o = p.objectives || {};
    return `
      <tr>
        <td class="!text-center font-bold !px-4">${p.iteration}</td>
        <td class="!text-center font-mono">${fmt(p.epsilon)}</td>
        <td class="!text-center">${statusBadge(p.status)}</td>
        <td class="!text-center font-mono">${fmt(o.cost)}</td>
        <td class="!text-center font-mono">${fmt(o.emissions)}</td>
        <td class="!text-center font-mono">${fmt(o.employment)}</td>
      </tr>`;
  }).join("");

  const paretoHtml = `
    <div class="bg-surface border border-line rounded-xl overflow-hidden shadow-sm mb-6">
      <div class="bg-surface-alt px-4 py-2 border-b border-line">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Frontera de Pareto (Iteraciones)</h5>
      </div>
      <table class="data-table text-[11px] w-full">
        <thead>
            <th class="!text-center !px-4 font-bold">ITER</th>
            <th class="!text-center font-bold">ε (EMISIONES)</th>
            <th class="!text-center font-bold">ESTADO</th>
            <th class="!text-center font-bold">COSTO</th>
            <th class="!text-center font-bold">EMISIONES</th>
            <th class="!text-center font-bold">EMPLEO</th>
          </tr>
        </thead>
        <tbody>${paretoRows}</tbody>
      </table>
    </div>`;

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

function renderTopTable(rows, objTitle, objKey, elasKey, tableId) {
  if (!rows || rows.length === 0) return `<p class="text-subtle italic text-sm">Sin resultados.</p>`;
  const body = rows.map(r => {
    const e = r[elasKey];
    const cls = elasticityClass(e);
    return `<tr>
      <td class="px-4 text-left"><strong>${r.param}</strong></td>
      <td class="text-center font-mono text-sm text-muted">${r.change}</td>
      <td class="text-center font-mono text-sm">${r[objKey] !== undefined ? fmt(r[objKey]) : "—"}</td>
      <td class="text-center font-bold font-mono text-sm ${cls}">${e !== null && e !== undefined ? e.toFixed(4) : "—"}</td>
    </tr>`;
  }).join("");
  return `
    <table class="data-table text-[13px] w-full" id="${tableId || ''}">
      <thead>
        <tr>
          <th class="px-4 text-left">Parámetro</th>
          <th class="text-center">Cambio</th>
          <th class="text-center">${objTitle.toUpperCase()}</th>
          <th class="text-center">Elasticidad</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>`;
}

function renderGlobalRankings(elasRows, freqRows) {
  const tableElas = `
    <div class="sens-top-card" style="margin:0;">
      <div class="flex justify-between items-center mb-2">
        <h3 class="sens-top-title">GLOBAL: MÁXIMA ELASTICIDAD</h3>
        <button class="text-accent hover:text-main transition-colors p-1" onclick="
          const t = this.closest('.sens-top-card').querySelector('table');
          const tsv = Array.from(t.querySelectorAll('tr')).map(r => Array.from(r.querySelectorAll('th, td')).map(c => c.innerText.trim()).join('\\t')).join('\\n');
          navigator.clipboard.writeText(tsv);
          const old = this.innerHTML; this.innerHTML = '<span class=\\'text-[10px]\\'>Copiado ✓</span>'; setTimeout(() => this.innerHTML = old, 1500);
        ">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <table class="data-table text-[13px] w-full" id="table-global-elas">
        <thead>
          <tr>
            <th class="px-4 text-left">Parámetro</th>
            <th class="text-center">Máx. Elasticidad</th>
            <th class="text-center">Pilares de Impacto</th>
          </tr>
        </thead>
        <tbody>
          ${(elasRows || []).map(r => `
            <tr>
              <td class="px-4 text-left"><strong>${r.param}</strong></td>
              <td class="text-center font-bold font-mono ${elasticityClass(r.maxElasticity)}">${r.maxElasticity.toFixed(4)}</td>
              <td class="text-center text-[11px] text-muted">${r.pillarsStr}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;

  const tableFreq = `
    <div class="sens-top-card" style="margin:0;">
      <div class="flex justify-between items-center mb-2">
        <h3 class="sens-top-title">GLOBAL: DIVERSIDAD DE IMPACTO</h3>
        <button class="text-accent hover:text-main transition-colors p-1" onclick="
          const t = this.closest('.sens-top-card').querySelector('table');
          const tsv = Array.from(t.querySelectorAll('tr')).map(r => Array.from(r.querySelectorAll('th, td')).map(c => c.innerText.trim()).join('\\t')).join('\\n');
          navigator.clipboard.writeText(tsv);
          const old = this.innerHTML; this.innerHTML = '<span class=\\'text-[10px]\\'>Copiado ✓</span>'; setTimeout(() => this.innerHTML = old, 1500);
        ">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <table class="data-table text-[13px] w-full" id="table-global-freq">
        <thead>
          <tr>
            <th class="px-4 text-left">Parámetro</th>
            <th class="text-center">Nº Pilares</th>
            <th class="text-center">Pilares</th>
          </tr>
        </thead>
        <tbody>
          ${(freqRows || []).map(r => `
            <tr>
              <td class="px-4 text-left"><strong>${r.param}</strong></td>
              <td class="text-center font-bold text-accent">${r.pillarCount}</td>
              <td class="text-center text-[10px] text-muted">${r.pillarsStr}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;

  return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1">
      ${tableElas}
      ${tableFreq}
    </div>`;
}


export function renderSensitivityResult(data) {
  if (!data) return `<p class="text-[var(--c-error-text)]">Sin datos.</p>`;

  const bo = data.base_objectives || {};
  const baseCard = `
    <div class="bg-surface border border-line rounded-xl overflow-hidden shadow-sm mb-6">
      <div class="bg-surface-alt px-4 py-2 border-b border-line">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Referencia de Objetivos Base</h5>
      </div>
      <table class="data-table text-[11px] w-full">
        <thead>
          <tr>
            <th class="!text-left !px-4 font-bold">OBJETIVO</th>
            <th class="!text-center font-bold">VALOR</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="!text-left font-bold !px-4">Costo</td>
            <td class="!text-center font-mono">${fmt(bo.cost)}</td>
          </tr>
          <tr>
            <td class="!text-left font-bold !px-4">Emisiones</td>
            <td class="!text-center font-mono">${fmt(bo.emissions)}</td>
          </tr>
          <tr>
            <td class="!text-left font-bold !px-4">Empleo</td>
            <td class="!text-center font-mono">${fmt(bo.employment)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;

  function renderTopCard(title, tableRows, objTitle, objKey, elasKey, tableId) {
    return `
      <div class="sens-top-card" style="margin: 0 auto;">
        <div class="flex justify-between items-center mb-2">
          <h3 class="sens-top-title" style="margin-bottom:0px;">${title}</h3>
          <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="
            const table = document.getElementById('${tableId}');
            const rows = Array.from(table.querySelectorAll('tr'));
            const tsv = rows.map(r => Array.from(r.querySelectorAll('th, td')).map(c => c.innerText.replace(/\\n/g, ' ').trim()).join('\\t')).join('\\n');
            navigator.clipboard.writeText(tsv);
            const old = this.innerHTML; 
            this.innerHTML = '<span class=\\'text-[11px] font-bold px-1\\'>Copiado ✓</span>'; 
            setTimeout(() => this.innerHTML = old, 1500);
          ">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
          </button>
        </div>
        ${renderTopTable(tableRows, objTitle, objKey, elasKey, tableId)}
      </div>`;
  }

  const topCost = renderTopCard("PARÁMETROS CON ELASTICIDAD — COSTO", data.top_cost, "Costo", "obj_cost", "elas_cost", "table-top-cost");
  const topEnv  = renderTopCard("PARÁMETROS CON ELASTICIDAD — EMISIONES", data.top_env, "Emisiones", "obj_env", "elas_env", "table-top-env");
  const topSoc  = renderTopCard("PARÁMETROS CON ELASTICIDAD — EMPLEO", data.top_soc, "Empleo", "obj_soc", "elas_soc", "table-top-soc");
  const globalRankings = renderGlobalRankings(data.top_global_elas, data.top_global_freq);

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
      <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="
        const table = this.closest('div').nextElementSibling;
        const rows = Array.from(table.querySelectorAll('tr'));
        const tsv = rows.map(r => {
          return Array.from(r.querySelectorAll('th, td')).map(c => {
            const v = c.querySelector('.sens-val');
            return (v ? v.innerText : c.innerText).trim();
          }).join('\\t');
        }).join('\\n');
        navigator.clipboard.writeText(tsv);
        const old = this.innerHTML;
        this.innerHTML = '<span class=\\'text-[11px] font-bold px-1\\'>Copiado ✓</span>';
        setTimeout(() => this.innerHTML = old, 1500);
      ">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
      </button>
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
    { id: "global", label: "Global", content: globalRankings },
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

function _renderScenarioCard(title, objs, base, hint) {
  if (!objs) return `
    <div class="sens-top-card" style="border-color: var(--c-error-border); background: var(--c-error-bg);">
      <h3 class="sens-top-title" style="color: var(--c-error-text); text-align:center;">${title}</h3>
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
    <div class="sens-top-card scenario-card">
      <h3 class="sens-top-title" style="text-align:center;">${title}</h3>
      <table class="data-table mt-2">
        <thead>${th("OBJETIVO", "VALOR", "VARIACIÓN")}</thead>
        <tbody>
          <tr>
            <td><strong>Costo</strong></td>
            <td>${fmt(objs.cost)}</td>
            <td>${diff(objs.cost, base.cost)}</td>
          </tr>
          <tr>
            <td><strong>Emisiones</strong></td>
            <td>${fmt(objs.emissions)}</td>
            <td>${diff(objs.emissions, base.emissions)}</td>
          </tr>
          <tr>
            <td><strong>Empleo</strong></td>
            <td>${fmt(objs.employment)}</td>
            <td>${diff(objs.employment, base.employment, true)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
}

export function renderScenariosResult(data) {
  if (!data) return `<p class="text-[var(--c-error-text)] text-center py-4">Sin datos de escenario.</p>`;
  
  const { base, propuesto, inverso, params_modified } = data;

  const cardsHtml = `
    <div class="sens-top-grid">
      ${_renderScenarioCard(`Escenario Propuesto`, propuesto, base, "La configuración de parámetros ingresada ha vuelto inviable el plan de producción.")}
      ${_renderScenarioCard(`Escenario Inverso`, inverso, base, "La configuración inversa de los parámetros es incompatible con las restricciones del sistema.")}
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

function _renderOpComparison(lgpObjs, erObjs, tableId) {
  if (!lgpObjs || !erObjs || !lgpObjs.metrics || !erObjs.metrics) return "";

  const l = lgpObjs.metrics;
  const e = erObjs.metrics;

  const diffStr = (vL, vE) => {
    if (typeof vL !== "number" || typeof vE !== "number" || vL === 0) return "—";
    const p = ((vE - vL) / vL) * 100;
    const cls = Math.abs(p) > 0.001 ? (p > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400") : "text-muted";
    return `<span class="${cls} font-bold font-mono">${p > 0 ? "+" : ""}${p.toFixed(1)}%</span>`;
  };

  const fmtO = (v) => typeof v === "number" ? fmt(v) : v;

  const row = (name, vL, vE) => `
    <tr>
      <td class="!text-left font-bold !px-3 !py-2">${name}</td>
      <td class="!text-center font-mono border-l border-line/50 !px-3 !py-2">${fmtO(vL)}</td>
      <td class="!text-center font-mono !px-3 !py-2">${fmtO(vE)}</td>
      <td class="!text-center !px-3 !py-2">${diffStr(vL, vE)}</td>
    </tr>
  `;

  const rowsHtml = [
    row("Personal Intermediarios", l.pers_int, e.pers_int),
    row("Personal Detallistas", l.pers_det, e.pers_det),
    row("Viajes Totales (Rutas)", l.viajes_totales, e.viajes_totales),
    row("Flujo Productor → Inter. (kg)", l.flujo_pi, e.flujo_pi),
    row("Flujo Inter. → Detallista (kg)", l.flujo_id, e.flujo_id),
    row("Top Intermediarios", l.top_intermediarios, e.top_intermediarios),
    row("Top Rutas Activas", l.top_rutas, e.top_rutas)
  ].join("");

  return `
    <div class="mt-4 border border-line rounded-lg overflow-hidden relative shadow-sm mb-6 bg-surface">
      <div class="bg-surface-alt px-4 py-2 border-b border-line flex justify-between items-center">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Decisiones Operativas Clave</h5>
        <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="
          const table = document.getElementById('${tableId}');
          const rows = Array.from(table.querySelectorAll('tr'));
          const tsv = rows.map(r => Array.from(r.querySelectorAll('th, td')).map(c => c.innerText.replace(/\\n/g, ' ').trim()).join('\\t')).join('\\n');
          navigator.clipboard.writeText(tsv);
          const old = this.innerHTML; 
          this.innerHTML = '<span class=\\'text-[11px] font-bold px-1\\'>Copiado ✓</span>'; 
          setTimeout(() => this.innerHTML = old, 1500);
        ">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table" id="${tableId}" style="width:100%;">
          <thead>
            <tr>
              <th class="!text-left !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Decisión Operativa</th>
              <th class="!text-center border-l border-line/50 !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Valor LGP</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Valor ER</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia (%)</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderCombinedScenariosResult(lgp, er) {
  if (!lgp || !er) return `<p class="text-[var(--c-error-text)] text-center py-4">Error al cargar datos comparativos.</p>`;
  
  const paramsEntries = Object.entries(lgp.params_modified || {});
  const base = lgp.base; // Should be same for both

  const gridHtml = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      <!-- Columna LGP -->
      <div class="scenario-group">
        <h4 class="text-xs font-bold text-center text-main uppercase tracking-[0.05em] mb-1">Programación por Metas Lexicográfica</h4>
        ${_renderScenarioCard(`PROPUESTO`, lgp.propuesto, base)}
        ${_renderScenarioCard(`INVERSO`, lgp.inverso, base)}
      </div>

      <!-- Columna ER -->
      <div class="scenario-group">
        <h4 class="text-xs font-bold text-center text-main uppercase tracking-[0.05em] mb-1">Epsilon-Restricción</h4>
        ${_renderScenarioCard(`PROPUESTO`, er.propuesto, base)}
        ${_renderScenarioCard(`INVERSO`, er.inverso, base)}
      </div>
    </div>
    
    <div class="mt-8 border-t border-line/50 pt-6">
      <h3 class="text-xs font-bold text-muted uppercase tracking-[0.1em] mb-2 pl-1"><span class="w-2 h-2 rounded-full bg-accent inline-block mr-2"></span>Comparación Operativa: Escenario Propuesto</h3>
      ${_renderOpComparison(lgp.propuesto, er.propuesto, 'op-table-prop')}
      
      <h3 class="text-xs font-bold text-muted uppercase tracking-[0.1em] mb-2 pl-1 mt-6"><span class="w-2 h-2 rounded-full bg-accent inline-block mr-2"></span>Comparación Operativa: Escenario Inverso</h3>
      ${_renderOpComparison(lgp.inverso, er.inverso, 'op-table-inv')}
    </div>
  `;

  return `
    <div class="bg-surface border border-line rounded-xl p-6 mb-6 shadow-sm">
      <h4 class="text-xs font-bold text-muted uppercase tracking-widest mb-3">Parámetros en el Escenario</h4>
      <div class="flex flex-wrap gap-2 mb-6">
        ${paramsEntries.map(([p, pct]) => `
          <div class="flex items-center bg-surface border border-line rounded-lg shadow-sm overflow-hidden text-xs">
            <span class="px-2 py-1 font-bold text-main bg-surface-alt border-r border-line">${p}</span>
            <span class="px-2 py-1 text-muted font-mono font-semibold">${pct >= 0 ? "+" : ""}${pct}%</span>
          </div>
        `).join("")}
      </div>
      
      ${gridHtml}
    </div>
  `;
}


// ── Sensitivity Ranges Comparison (LGP vs ER) ──────────────────────────────

function _fmtShadow(v) {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("es-CO", { maximumFractionDigits: 4 });
}

function _shadowClass(v) {
  if (v === null || v === undefined) return "";
  const a = Math.abs(v);
  if (a > 50) return "elas-high";
  if (a > 5) return "elas-mid";
  return "";
}

function _renderBaseRangeComparison(lgp, er) {
  if (!lgp && !er) return "";
  return `
    <div class="mb-8 border border-line rounded-xl overflow-hidden bg-surface-alt shadow-sm">
      <div class="bg-surface px-4 py-3 border-b border-line text-center">
        <h3 class="text-[11px] font-bold text-main uppercase tracking-widest">Referencia de Objetivos Base</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table text-[11px] w-full">
          <thead>
            <tr>
              <th class="!text-left !px-4 font-bold uppercase tracking-widest text-[10px]">OBJETIVO</th>
              <th class="!text-center font-bold uppercase tracking-widest text-[10px]">LGP</th>
              <th class="!text-center font-bold uppercase tracking-widest text-[10px]">ER</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="!px-4 text-muted uppercase">Costo</td>
              <td class="!text-center font-mono">${lgp ? fmt(lgp.cost) : "—"}</td>
              <td class="!text-center font-mono">${er ? fmt(er.cost) : "—"}</td>
            </tr>
            <tr>
              <td class="!px-4 text-muted uppercase">Emisiones</td>
              <td class="!text-center font-mono">${lgp ? fmt(lgp.emissions) : "—"}</td>
              <td class="!text-center font-mono">${er ? fmt(er.emissions) : "—"}</td>
            </tr>
            <tr>
              <td class="!px-4 text-muted uppercase">Empleo</td>
              <td class="!text-center font-mono">${lgp ? fmt(lgp.employment) : "—"}</td>
              <td class="!text-center font-mono">${er ? fmt(er.employment) : "—"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

export function renderRangesComparison(data) {
  if (!data || !data.ranges || data.ranges.length === 0) {
    return `<p class="text-[var(--c-error-text)] text-center py-4">Sin datos de rangos de sensibilidad.</p>`;
  }

  const rows = data.ranges;

  const baseComparison = _renderBaseRangeComparison(data.lgp_base, data.er_base);

  const theadStr = `
    <tr>
      <th class="!text-left align-bottom border-r border-line/50 !px-2 !py-2 font-bold uppercase tracking-widest text-[10px]">Parámetro</th>
      <th class="!text-left align-bottom !px-2 !py-2 font-bold uppercase tracking-widest text-[10px]">Unidad</th>
      <th class="!text-center align-bottom border-r border-line/50 !px-2 !py-2 font-bold uppercase tracking-widest text-[10px]">Base</th>
      <th class="!text-center align-bottom leading-tight !px-2 !py-2 font-bold uppercase tracking-widest text-[10px]">SP<br>Costo</th>
      <th class="!text-center align-bottom leading-tight !px-2 !py-2 font-bold uppercase tracking-widest text-[10px]">SP<br>Emisiones</th>
      <th class="!text-center align-bottom border-r border-line/50 leading-tight !px-2 !py-2 font-bold uppercase tracking-widest text-[10px]">SP<br>Empleo</th>
      <th class="!text-center align-bottom leading-tight !px-2 !py-2 text-green-600 dark:text-green-400 font-bold uppercase tracking-widest text-[10px]">↑ %<br>Max</th>
      <th class="!text-center align-bottom border-r border-line/50 leading-tight !px-2 !py-2 text-red-600 dark:text-red-400 font-bold uppercase tracking-widest text-[10px]">↓ %<br>Max</th>
      <th class="!text-center align-bottom !px-2 !py-2 font-bold uppercase tracking-widest text-[10px]">Mínimo</th>
      <th class="!text-center align-bottom !px-2 !py-2 font-bold uppercase tracking-widest text-[10px]">Máximo</th>
    </tr>
  `;

  // ── LGP Table ──
  const paramUnits = {
    // Capacidades y Demandas
    CN: "kg/día", CH: "kg/día", CHI: "kg/día", CR: "kg/día",
    DI: "kg/día", DD: "kg/día", CV: "kg/viaje",
    // Rendimientos y Tierra
    RA: "kg/Ha·se semana", RB: "kg/Ha·se semana", 
    RC: "kg/Ha·se semana", RD: "kg/Ha·se semana",
    H: "Ha/semana",
    // Costos y Mano de Obra
    CP: "$/kg", CI: "$/kg", CT: "$/kg", CTT: "$/kg", 
    CDA: "$/kg", CDF: "$/kg", 
    CMO: "$/semana", CD: "$/detallista",
    CA: "kg/persona", CB: "kg/persona",
    // Otros
    IT: "kg CO2/km", P: "% daño", PP: "% daño"
  };

  const lgpRowsStr = rows.map(r => `<tr>
    <td class="font-bold border-r border-line/50 align-middle !px-2 !py-1.5">${r.param}</td>
    <td class="!text-left text-[10px] text-muted leading-tight max-w-[130px] align-middle !px-2 !py-1.5" style="white-space:normal;">${paramUnits[r.param] || "—"}</td>
    <td class="!text-center font-mono border-r border-line/50 align-middle !px-2 !py-1.5">${fmt(r.base_value)}</td>
    <td class="!text-center font-mono align-middle !px-2 !py-1.5 ${_shadowClass(r.lgp_shadow_cost)}">${_fmtShadow(r.lgp_shadow_cost)}</td>
    <td class="!text-center font-mono align-middle !px-2 !py-1.5 ${_shadowClass(r.lgp_shadow_env)}">${_fmtShadow(r.lgp_shadow_env)}</td>
    <td class="!text-center font-mono border-r border-line/50 align-middle !px-2 !py-1.5 ${_shadowClass(r.lgp_shadow_soc)}">${_fmtShadow(r.lgp_shadow_soc)}</td>
    <td class="!text-center font-mono text-xs text-green-600 dark:text-green-400 align-middle !px-2 !py-1.5">${r.allowable_increase_pct != null ? "+" + r.allowable_increase_pct + "%" : "—"}</td>
    <td class="!text-center font-mono text-xs text-red-600 dark:text-red-400 border-r border-line/50 align-middle !px-2 !py-1.5">${r.allowable_decrease_pct != null ? "−" + r.allowable_decrease_pct + "%" : "—"}</td>
    <td class="!text-center font-mono text-[11px] align-middle !px-2 !py-1.5">${r.min_value != null ? fmt(r.min_value) : "—"}</td>
    <td class="!text-center font-mono text-[11px] align-middle !px-2 !py-1.5">${r.max_value != null ? fmt(r.max_value) : "—"}</td>
  </tr>`).join("");

  const lgpTable = `
    <div class="mb-8 p-1">
      <h3 class="text-xs font-bold text-main uppercase tracking-[0.1em] mb-2 text-center">
        Programación por Metas Lexicográfica (LGP)
      </h3>
      <table class="data-table text-[11px] w-full" style="table-layout: auto;">
        <thead>${theadStr}</thead>
        <tbody>${lgpRowsStr}</tbody>
      </table>
    </div>`;

  // ── ER Table ──
  const erRowsStr = rows.map(r => `<tr>
    <td class="font-bold border-r border-line/50 align-middle !px-2 !py-1.5">${r.param}</td>
    <td class="!text-left text-[10px] text-muted leading-tight max-w-[130px] align-middle !px-2 !py-1.5" style="white-space:normal;">${paramUnits[r.param] || "—"}</td>
    <td class="!text-center font-mono border-r border-line/50 align-middle !px-2 !py-1.5">${fmt(r.base_value)}</td>
    <td class="!text-center font-mono align-middle !px-2 !py-1.5 ${_shadowClass(r.er_shadow_cost)}">${_fmtShadow(r.er_shadow_cost)}</td>
    <td class="!text-center font-mono align-middle !px-2 !py-1.5 ${_shadowClass(r.er_shadow_env)}">${_fmtShadow(r.er_shadow_env)}</td>
    <td class="!text-center font-mono border-r border-line/50 align-middle !px-2 !py-1.5 ${_shadowClass(r.er_shadow_soc)}">${_fmtShadow(r.er_shadow_soc)}</td>
    <td class="!text-center font-mono text-xs text-green-600 dark:text-green-400 align-middle !px-2 !py-1.5">${r.allowable_increase_pct != null ? "+" + r.allowable_increase_pct + "%" : "—"}</td>
    <td class="!text-center font-mono text-xs text-red-600 dark:text-red-400 border-r border-line/50 align-middle !px-2 !py-1.5">${r.allowable_decrease_pct != null ? "−" + r.allowable_decrease_pct + "%" : "—"}</td>
    <td class="!text-center font-mono text-[11px] align-middle !px-2 !py-1.5">${r.min_value != null ? fmt(r.min_value) : "—"}</td>
    <td class="!text-center font-mono text-[11px] align-middle !px-2 !py-1.5">${r.max_value != null ? fmt(r.max_value) : "—"}</td>
  </tr>`).join("");

  const erTable = `
    <div class="mb-4 p-1">
      <h3 class="text-xs font-bold text-main uppercase tracking-[0.1em] mb-2 text-center">
        Epsilon-Restricción (ER)
      </h3>
      <table class="data-table text-[11px] w-full" style="table-layout: auto;">
        <thead>${theadStr}</thead>
        <tbody>${erRowsStr}</tbody>
      </table>
    </div>`;

  // ── Legend ──
  const legend = `
    <div class="text-[10px] text-muted mt-4 border-t border-line pt-3 flex flex-col items-center gap-1">
      <p><strong>SP</strong> = Precio Sombra (Impacto Unitario: incremento en el objetivo por cada unidad [kg, viaje, ha] que aumenta el parámetro). &nbsp; <strong>↑ / ↓ % Max</strong> = Variación admisible sin perder factibilidad.</p>
      <p><span class="elas-high px-1 rounded mx-1">Rojo</span> Alta sensibilidad &nbsp;|&nbsp; <span class="elas-mid px-1 rounded mx-1">Amarillo</span> Sensibilidad media</p>
    </div>`;

  return `
    <div class="bg-surface border border-line rounded-xl p-4 md:p-6 shadow-sm w-full">
      ${baseComparison}
      ${lgpTable}
      ${erTable}
      ${legend}
    </div>`;
}


