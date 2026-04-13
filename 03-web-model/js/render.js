// ── Helpers ────────────────────────────────────────────────────────────────
window.copyTableToClipboard = function (btn, tableId) {
  const table = tableId ? document.getElementById(tableId) : btn.closest('div').nextElementSibling;
  if (!table) return;
  const rows = Array.from(table.querySelectorAll('tr'));

  // Regex para quitar puntos de miles (ej: 1.234) pero mantener el punto decimal (ej: 1.2345)
  // En es-CO, el punto es de miles, pero si toFixed o similar se usa, puede ser decimal.
  // Solo quitamos puntos que tengan exactamente 3 dígitos detrás y no otro dígito.
  const clean = (s) => {
    if (!s) return "";
    return s.replace(/\u00A0/g, ' ')       // NBSP a espacio
      .replace(/[\u2212\u2013]/g, '-') // Menos tipográfico y En-dash a guion ASCII
      .replace(/\.(?=\d{3}(?!\d))/g, '')
      .trim();
  };

  const tsv = rows.map(r => {
    return Array.from(r.querySelectorAll('th, td')).map(c => {
      const v = c.querySelector('.sens-val');
      let val = (v ? v.innerText : c.innerText);
      // Quitar saltos de línea internos para Excel
      return clean(val.replace(/\n/g, ' '));
    }).join('\t');
  }).join('\n');

  navigator.clipboard.writeText(tsv);
  const old = btn.innerHTML;
  btn.innerHTML = '<span class="text-[10px] font-bold px-1">Copiado ✓</span>';
  setTimeout(() => btn.innerHTML = old, 1500);
};

export function fmt(n, minFrac = 0) {
  if (n === null || n === undefined) return "—";
  return typeof n === "number" ? n.toLocaleString("es-CO", {
    minimumFractionDigits: minFrac,
    maximumFractionDigits: 4
  }) : String(n);
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
      <h3 class="text-xs font-bold text-muted uppercase tracking-widest mb-3 mt-6">Decisiones Operativas</h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        ${renderVarTable("X — Flujo productor→intermediario", ["i", "j", "value"], vars.X)}
        ${renderVarTable("Y — Flujo intermediario→detallista", ["j", "k", "value"], vars.Y)}
        ${renderVarTable("Z — Viajes productor→intermediario", ["i", "j", "value"], vars.Z)}
        ${renderVarTable("ZZ — Viajes intermediario→detallista", ["j", "k", "value"], vars.ZZ)}
        ${renderVarTable("W — Hectáreas por productor", ["i", "value"], vars.W)}
        ${renderVarTable("S — Personal centro de acopio", ["value"], vars.S)}
        ${renderVarTable("SS — Personal intermediario", ["j", "value"], vars.SS)}
        ${renderVarTable("SSS — Personal detallista", ["k", "value"], vars.SSS)}
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
    {
      id: "resultado", label: "Resultado", content: `
        <h3 class="section-subtitle">Pasos LGP</h3>
        <div class="steps-grid">${stepsHtml}</div>
        ${varsHtml}`
    },
    { id: "logs", label: "Logs", content: renderTerminal(combinedLog) },
  ])}`;
}

function renderVarTable(title, cols, rows) {
  if (!rows || rows.length === 0) return "";
  const header = th(...cols.map(c => c.toUpperCase()));
  const body = rows.map(r => td(...cols.map(c => fmt(r[c])))).join("");
  return `
    <div class="bg-surface border border-line rounded-xl overflow-hidden shadow-sm mb-4">
      <div class="bg-surface-alt px-4 py-2 border-b border-line flex justify-between items-center">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">${title}</h5>
        <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table text-[11px] w-full">
          <thead>${header}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>
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
    <h3 class="text-xs font-bold text-muted uppercase tracking-widest mb-3 mt-6">Decisiones Operativas — Última Iteración</h3>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      ${renderVarTable("X — Flujo productor→intermediario", ["i", "j", "value"], vars.X)}
      ${renderVarTable("Y — Flujo intermediario→detallista", ["j", "k", "value"], vars.Y)}
      ${renderVarTable("Z — Viajes productor→intermediario", ["i", "j", "value"], vars.Z)}
      ${renderVarTable("ZZ — Viajes intermediario→detallista", ["j", "k", "value"], vars.ZZ)}
      ${renderVarTable("W — Hectáreas por productor", ["i", "value"], vars.W)}
      ${renderVarTable("S — Personal centro de acopio", ["value"], vars.S)}
      ${renderVarTable("SS — Personal intermediario", ["j", "value"], vars.SS)}
      ${renderVarTable("SSS — Personal detallista", ["k", "value"], vars.SSS)}
      ${renderVarTable("B — Variantes activas", ["u", "value"], vars.B)}
    </div>` : "";

  return `
    <div class="result-status mb-4">
      <strong>Solver:</strong> <code>${data.solver}</code>
      &nbsp; <strong>Steps:</strong> ${data.steps}
    </div>
    ${renderInnerTabs("er", [
    {
      id: "resultado", label: "Resultado", content: `
        ${payoffHtml}
        ${paretoHtml}
        ${varsHtml}`
    },
    { id: "logs", label: "Logs", content: renderTerminal(data.log || "") },
  ])}`;
}

// ── Params (editable) ───────────────────────────────────────────────────────

const PARAM_DESCRIPTIONS = {
  PRODUCTORES: "Conjunto de productores (I)",
  INTERMEDIARIOS: "Conjunto de intermediarios (J)",
  DETALLISTAS: "Conjunto de detallistas (K)",
  VARIANTES_PRODUCTOR: "Variantes de productor (U)",
  RB: "Rendimiento máximo total (Kg/Ha·semana)",
  RA: "Rendimiento por variante de productor u (Kg/Ha·semana)",
  RC: "Rendimiento máximo del cultivo base por productor i (Kg/Ha·semana)",
  RD: "Rendimiento mínimo del cultivo base por productor i (Kg/Ha·semana)",
  CA: "Capacidad productiva de una persona en centro de acopio (40 Kg/persona)",
  M: "Límite máximo de kilómetros recorridos (km/semana)",
  CB: "Capacidad productiva por persona en intermediario j (Kg/persona)",
  CC: "Capacidad productiva por persona en detallista k (Kg/persona)",
  CP: "Costo de producción en productor i ($/Kg)",
  CI: "Costo de procesamiento en intermediario j ($/Kg)",
  CT: "Costo de transporte productor i → intermediario j ($/km/viaje)",
  CTT: "Costo de transporte intermediario j → detallista k ($/km/viaje)",
  CD: "Costo de mano de obra en detallista k ($/semana)",
  CDA: "Costo por daño en ruta productor i → intermediario j ($/Kg)",
  CDF: "Costo por daño en ruta intermediario j → detallista k ($/Kg)",
  P: "Porcentaje de daño productor i → intermediario j (%)",
  PP: "Porcentaje de daño intermediario j → detallista k (%)",
  CN: "Capacidad de producción en productor i (Kg/día)",
  CH: "Capacidad de despacho en productor i (Kg/día)",
  CRI: "Capacidad de recepción/despacho en intermediario j (Kg/día)",
  CR: "Capacidad de recepción en detallista k (Kg/día)",
  DI: "Demanda mínima en intermediario j (Kg/día)",
  DD: "Demanda mínima en detallista k (Kg/día)",
  CV: "Capacidad del vehículo en intermediario j (Kg/viaje)",
  CMO: "Costo de mano de obra en intermediario j ($/semana)",
  CMP: "Costo de mano de obra en centro de acopio ($/semana)",
  H: "Número de hectáreas por variante de productor u (Ha·semana)",
  DPI: "Distancia/impacto ambiental ruta productor i → intermediario j (km)",
  DID: "Distancia/impacto ambiental ruta intermediario j → detallista k (km)",
  IT: "Factor de impacto de transporte por intermediario j",
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
      <td class="text-center font-bold font-mono text-sm ${cls}">${e !== null && e !== undefined ? fmt(e, 4) : "—"}</td>
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
        <button class="text-accent hover:text-main transition-colors p-1" onclick="copyTableToClipboard(this)">
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
              <td class="text-center font-bold font-mono ${elasticityClass(r.maxElasticity)}">${fmt(r.maxElasticity, 4)}</td>
              <td class="text-center text-[11px] text-muted">${r.pillarsStr}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;

  const tableFreq = `
    <div class="sens-top-card" style="margin:0;">
      <div class="flex justify-between items-center mb-2">
        <h3 class="sens-top-title">GLOBAL: DIVERSIDAD DE IMPACTO</h3>
        <button class="text-accent hover:text-main transition-colors p-1" onclick="copyTableToClipboard(this)">
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
          <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="copyTableToClipboard(this, '${tableId}')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
          </button>
        </div>
        ${renderTopTable(tableRows, objTitle, objKey, elasKey, tableId)}
      </div>`;
  }

  const topCost = renderTopCard("PARÁMETROS CON ELASTICIDAD — COSTO", data.top_cost, "Costo", "obj_cost", "elas_cost", "table-top-cost");
  const topEnv = renderTopCard("PARÁMETROS CON ELASTICIDAD — EMISIONES", data.top_env, "Emisiones", "obj_env", "elas_env", "table-top-env");
  const topSoc = renderTopCard("PARÁMETROS CON ELASTICIDAD — EMPLEO", data.top_soc, "Empleo", "obj_soc", "elas_soc", "table-top-soc");
  const globalRankings = renderGlobalRankings(data.top_global_elas, data.top_global_freq);

  function pctCell(newVal, baseVal) {
    if (newVal === null || newVal === undefined) return `<td>—</td>`;
    const pct = baseVal !== 0 ? ((newVal - baseVal) / baseVal) * 100 : 0;
    const sign = pct >= 0 ? "+" : "";
    return `<td>
      <div class="sens-val">${fmt(newVal)}</div>
      <div class="sens-delta sens-delta-neutral">${sign}${fmt(pct, 2)}%</div>
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
      ${pctCell(r.obj_env, bo.emissions)}
      ${pctCell(r.obj_soc, bo.employment)}
      <td class="${cc}">${r.elas_cost !== null && r.elas_cost !== undefined ? fmt(r.elas_cost, 4) : "—"}</td>
      <td class="${ec}">${r.elas_env !== null && r.elas_env !== undefined ? fmt(r.elas_env, 4) : "—"}</td>
      <td>${r.elas_soc !== null && r.elas_soc !== undefined ? fmt(r.elas_soc, 4) : "—"}</td>
    </tr>`;
  }).join("");

  const fullTable = `
    <div class="flex justify-end mb-2">
      <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="copyTableToClipboard(this)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
      </button>
    </div>
    <table class="data-table">
      <thead>${th("Parámetro", "Cambio", "Costo", "Emisiones", "Empleo", "E.Costo", "E.Emisiones", "E.Empleo")}</thead>
      <tbody>${allRows}</tbody>
    </table>`;

  const exportBtn = (id, name) => `<button class="chart-export-btn" onclick="exportChart('${id}', '${name}')" title="Descargar PNG" style="position:absolute; top:0.5rem; right:0.5rem; z-index:10; background:none; border:none; padding:0.25rem; cursor:pointer; color:var(--c-text-main); opacity:0.7;">
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
  </button>`;

  const chartsSection = `
    <div class="sens-charts-grid" style="display:flex; flex-direction:column; gap:1.5rem;">
      <div class="sens-chart-wrap" style="height:400px; background:var(--c-bg-surface); border:1px solid var(--c-border); border-radius:0.5rem; padding:1rem; position:relative;">
        ${exportBtn('sens-combined-cost', 'costo_vs_perturbacion')}
        <canvas id="sens-combined-cost"></canvas>
      </div>
      <div class="sens-chart-wrap" style="height:400px; background:var(--c-bg-surface); border:1px solid var(--c-border); border-radius:0.5rem; padding:1rem; position:relative;">
        ${exportBtn('sens-combined-env', 'emisiones_vs_perturbacion')}
        <canvas id="sens-combined-env"></canvas>
      </div>
      <div class="sens-chart-wrap" style="height:400px; background:var(--c-bg-surface); border:1px solid var(--c-border); border-radius:0.5rem; padding:1rem; position:relative;">
        ${exportBtn('sens-combined-soc', 'empleo_vs_perturbacion')}
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
  const solverList = data.available || data.options || [];
  if (selectEl && solverList.length) {
    const current = selectEl.value || data.active;
    selectEl.innerHTML = solverList
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
    return `<div class="sens-delta ${cls}">${p >= 0 ? "+" : ""}${fmt(p, 2)}%</div>`;
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

  const { base, propuesto, params_modified } = data;

  const cardsHtml = `
    <div class="sens-top-grid">
      ${_renderScenarioCard(`Escenario Propuesto`, propuesto, base, "La configuración de parámetros ingresada ha vuelto inviable el plan de producción.")}
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
            <span class="px-3 py-1.5 text-sm text-muted font-mono font-semibold">${pct >= 0 ? "+" : ""}${fmt(pct)}%</span>
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

function _renderCostBreakdownComparison(lgpObjs, erObjs) {
  if (!lgpObjs || !erObjs) return "";

  const lgpCost = lgpObjs.cost_breakdown;
  const erCost = erObjs.cost_breakdown;

  if (!lgpCost || !erCost) return "";

  const diffCost = (vL, vE) => {
    if (vE === 0) return "—";
    const p = ((vL - vE) / vE) * 100;
    const absP = Math.abs(p);
    if (absP < 0.05) {
      return `<span class="text-muted font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 2)}%</span>`;
    }
    // Menor costo es mejor (verde), mayor es peor (rojo)
    const cls = p < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return `<span class="${cls} font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 2)}%</span>`;
  };

  const diffValue = (vL, vE) => {
    const diff = vE - vL;
    if (Math.abs(diff) < 0.01) return `<span class="text-muted">—</span>`;
    const sign = diff > 0 ? "+" : "";
    const cls = diff < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return `<span class="${cls} font-mono text-xs">${sign}${fmt(diff, 0)}</span>`;
  };

  const row = (label, lgpVal, erVal, indent = false) => `
    <tr>
      <td class="!text-left ${indent ? 'pl-6' : ''} !px-3 !py-2 ${indent ? 'text-muted' : 'font-bold'}">${label}</td>
      <td class="!text-center font-mono border-l border-line/50 !px-3 !py-2">${fmt(lgpVal)}</td>
      <td class="!text-center font-mono !px-3 !py-2">${fmt(erVal)}</td>
      <td class="!text-center !px-3 !py-2">${diffValue(lgpVal, erVal)}</td>
      <td class="!text-center !px-3 !py-2">${diffCost(lgpVal, erVal)}</td>
    </tr>
  `;

  const categoryRow = (label, lgpVal, erVal) => `
    <tr class="bg-surface-alt/50">
      <td class="!text-left font-bold !px-3 !py-2">${label}</td>
      <td class="!text-center font-mono border-l border-line/50 !px-3 !py-2">${fmt(lgpVal)}</td>
      <td class="!text-center font-mono !px-3 !py-2">${fmt(erVal)}</td>
      <td class="!text-center !px-3 !py-2">${diffValue(lgpVal, erVal)}</td>
      <td class="!text-center !px-3 !py-2">${diffCost(lgpVal, erVal)}</td>
    </tr>
  `;

  return `
    <div class="border border-line rounded-lg overflow-hidden relative shadow-sm mb-6 bg-surface">
      <div class="bg-surface-alt px-4 py-2 border-b border-line flex justify-between items-center">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Desglose de Costos</h5>
        <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table" style="width:100%;">
          <thead>
            <tr>
              <th class="!text-left !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Categoría de Costo</th>
              <th class="!text-center border-l border-line/50 !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">LGP</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">ER</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia ($)</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia (%)</th>
            </tr>
          </thead>
          <tbody>
            ${row("Producción", lgpCost.production, erCost.production)}
            ${row("Intermediación", lgpCost.intermediation, erCost.intermediation)}
            ${categoryRow("Mano de Obra Total", lgpCost.labor_total, erCost.labor_total)}
            ${row("Centros de Acopio", lgpCost.labor_acopio, erCost.labor_acopio, true)}
            ${row("Intermediarios", lgpCost.labor_intermediario, erCost.labor_intermediario, true)}
            ${row("Detallistas", lgpCost.labor_detallista, erCost.labor_detallista, true)}
            ${categoryRow("Transporte Total", lgpCost.transport_total, erCost.transport_total)}
            ${row("Productor a Intermediario", lgpCost.transport_pi, erCost.transport_pi, true)}
            ${row("Intermediario a Detallista", lgpCost.transport_id, erCost.transport_id, true)}
            ${categoryRow("Daño Total", lgpCost.damage_total, erCost.damage_total)}
            ${row("Productor a Intermediario", lgpCost.damage_pi, erCost.damage_pi, true)}
            ${row("Intermediario a Detallista", lgpCost.damage_id, erCost.damage_id, true)}
            <tr class="border-t-2 border-line">
              <td class="!text-left font-bold !px-3 !py-2 text-main">COSTO TOTAL</td>
              <td class="!text-center font-mono font-bold border-l border-line/50 !px-3 !py-2 text-main">${fmt(lgpCost.total)}</td>
              <td class="!text-center font-mono font-bold !px-3 !py-2 text-main">${fmt(erCost.total)}</td>
              <td class="!text-center !px-3 !py-2">${diffValue(lgpCost.total, erCost.total)}</td>
              <td class="!text-center !px-3 !py-2">${diffCost(lgpCost.total, erCost.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function _renderEmissionsBreakdownComparison(lgpObjs, erObjs) {
  if (!lgpObjs || !erObjs) return "";

  const lgpEmissions = lgpObjs.emissions_breakdown;
  const erEmissions = erObjs.emissions_breakdown;

  if (!lgpEmissions || !erEmissions) return "";

  const diffEmissions = (vL, vE) => {
    if (vE === 0) return "—";
    const p = ((vL - vE) / vE) * 100;
    const absP = Math.abs(p);
    if (absP < 0.05) {
      return `<span class="text-muted font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 2)}%</span>`;
    }
    // Menor emisión es mejor (verde), mayor es peor (rojo)
    const cls = p < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return `<span class="${cls} font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 2)}%</span>`;
  };

  const diffValue = (vL, vE) => {
    const diff = vE - vL;
    if (Math.abs(diff) < 0.01) return `<span class="text-muted">—</span>`;
    const sign = diff > 0 ? "+" : "";
    const cls = diff < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return `<span class="${cls} font-mono text-xs">${sign}${fmt(diff, 0)}</span>`;
  };

  const row = (label, lgpVal, erVal, indent = false) => `
    <tr>
      <td class="!text-left ${indent ? 'pl-6' : ''} !px-3 !py-2 ${indent ? 'text-muted' : 'font-bold'}">${indent ? '└─ ' : ''}${label}</td>
      <td class="!text-center font-mono border-l border-line/50 !px-3 !py-2">${fmt(lgpVal)}</td>
      <td class="!text-center font-mono !px-3 !py-2">${fmt(erVal)}</td>
      <td class="!text-center !px-3 !py-2">${diffValue(lgpVal, erVal)}</td>
      <td class="!text-center !px-3 !py-2">${diffEmissions(lgpVal, erVal)}</td>
    </tr>
  `;

  return `
    <div class="border border-line rounded-lg overflow-hidden relative shadow-sm mb-6 bg-surface">
      <div class="bg-surface-alt px-4 py-2 border-b border-line flex justify-between items-center">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Desglose de Emisiones</h5>
        <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table" style="width:100%;">
          <thead>
            <tr>
              <th class="!text-left !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Componente</th>
              <th class="!text-center border-l border-line/50 !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">LGP</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">ER</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia (kg CO2)</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia (%)</th>
            </tr>
          </thead>
          <tbody>
            ${row("Transporte P→I", lgpEmissions.transport_pi, erEmissions.transport_pi)}
            ${row("Transporte I→D", lgpEmissions.transport_id, erEmissions.transport_id)}
            <tr class="border-t-2 border-line bg-surface-alt/50">
              <td class="!text-left font-bold !px-3 !py-2 text-main">EMISIONES TOTALES</td>
              <td class="!text-center font-mono font-bold border-l border-line/50 !px-3 !py-2 text-main">${fmt(lgpEmissions.total)}</td>
              <td class="!text-center font-mono font-bold !px-3 !py-2 text-main">${fmt(erEmissions.total)}</td>
              <td class="!text-center !px-3 !py-2">${diffValue(lgpEmissions.total, erEmissions.total)}</td>
              <td class="!text-center !px-3 !py-2">${diffEmissions(lgpEmissions.total, erEmissions.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function _renderEmploymentBreakdownComparison(lgpObjs, erObjs) {
  if (!lgpObjs || !erObjs) return "";

  const lgpEmployment = lgpObjs.employment_breakdown;
  const erEmployment = erObjs.employment_breakdown;

  if (!lgpEmployment || !erEmployment) return "";

  // Obtener detalles por ubicación
  const lgpIntersDetail = lgpEmployment.intermediarios_detail || [];
  const erIntersDetail = erEmployment.intermediarios_detail || [];
  const lgpRetailersDetail = lgpEmployment.detallistas_detail || [];
  const erRetailersDetail = erEmployment.detallistas_detail || [];

  // Funciones de diff
  const diffEmployment = (vL, vE) => {
    if (vE === 0) return "—";
    const p = ((vL - vE) / vE) * 100;
    const absP = Math.abs(p);
    if (absP < 0.05) {
      return `<span class="text-muted font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 2)}%</span>`;
    }
    const cls = p > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return `<span class="${cls} font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 2)}%</span>`;
  };

  const diffValue = (vL, vE) => {
    const diff = vE - vL;
    if (Math.abs(diff) < 0.01) return `<span class="text-muted">—</span>`;
    const sign = diff > 0 ? "+" : "";
    const cls = diff > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return `<span class="${cls} font-mono text-xs">${sign}${fmt(diff, 0)}</span>`;
  };

  // Crear maps para empleo por ubicación
  const lgpIntersMap = Object.fromEntries(lgpIntersDetail.map(i => [i.location, i.value]));
  const erIntersMap = Object.fromEntries(erIntersDetail.map(i => [i.location, i.value]));
  const lgpRetailersMap = Object.fromEntries(lgpRetailersDetail.map(r => [r.location, r.value]));
  const erRetailersMap = Object.fromEntries(erRetailersDetail.map(r => [r.location, r.value]));

  // Todos los IDs únicos
  const allIntersIds = Array.from(new Set([...lgpIntersDetail.map(i => i.location), ...erIntersDetail.map(i => i.location)]));
  const allRetailersIds = Array.from(new Set([...lgpRetailersDetail.map(r => r.location), ...erRetailersDetail.map(r => r.location)]));

  // Ordenar por empleo total descendente
  allIntersIds.sort((a, b) => ((lgpIntersMap[b] || 0) + (erIntersMap[b] || 0)) - ((lgpIntersMap[a] || 0) + (erIntersMap[a] || 0)));
  allRetailersIds.sort((a, b) => ((lgpRetailersMap[b] || 0) + (erRetailersMap[b] || 0)) - ((lgpRetailersMap[a] || 0) + (erRetailersMap[a] || 0)));

  // Generar filas para intermediarios
  const intersRowsHtml = allIntersIds.map(loc => {
    const lgpVal = lgpIntersMap[loc] || 0;
    const erVal = erIntersMap[loc] || 0;
    const lgpHas = lgpVal > 0.01;
    const erHas = erVal > 0.01;
    const isNewLGP = lgpHas && !erHas;
    const isNewER = erHas && !lgpHas;
    const rowClass = isNewLGP ? "bg-green-500/10" : isNewER ? "bg-red-500/10" : "";

    return `
      <tr class="${rowClass}">
        <td class="!text-left font-mono text-xs !px-3 !py-1.5">${loc}</td>
        <td class="!text-center font-mono border-l border-line/50 !px-3 !py-1.5 ${lgpHas ? '' : 'text-muted'}">${lgpHas ? fmt(lgpVal, 0) : '—'}</td>
        <td class="!text-center font-mono !px-3 !py-1.5 ${erHas ? '' : 'text-muted'}">${erHas ? fmt(erVal, 0) : '—'}</td>
        <td class="!text-center !px-3 !py-1.5">${diffValue(lgpVal, erVal)}</td>
        <td class="!text-center !px-3 !py-1.5">${diffEmployment(lgpVal, erVal)}</td>
      </tr>
    `;
  }).join("");

  // Generar filas para detallistas
  const retailersRowsHtml = allRetailersIds.map(loc => {
    const lgpVal = lgpRetailersMap[loc] || 0;
    const erVal = erRetailersMap[loc] || 0;
    const lgpHas = lgpVal > 0.01;
    const erHas = erVal > 0.01;
    const isNewLGP = lgpHas && !erHas;
    const isNewER = erHas && !lgpHas;
    const rowClass = isNewLGP ? "bg-green-500/10" : isNewER ? "bg-red-500/10" : "";

    return `
      <tr class="${rowClass}">
        <td class="!text-left font-mono text-xs !px-3 !py-1.5">${loc}</td>
        <td class="!text-center font-mono border-l border-line/50 !px-3 !py-1.5 ${lgpHas ? '' : 'text-muted'}">${lgpHas ? fmt(lgpVal, 0) : '—'}</td>
        <td class="!text-center font-mono !px-3 !py-1.5 ${erHas ? '' : 'text-muted'}">${erHas ? fmt(erVal, 0) : '—'}</td>
        <td class="!text-center !px-3 !py-1.5">${diffValue(lgpVal, erVal)}</td>
        <td class="!text-center !px-3 !py-1.5">${diffEmployment(lgpVal, erVal)}</td>
      </tr>
    `;
  }).join("");

  // Totales
  const totalIntersLGP = lgpEmployment.intermediarios;
  const totalIntersER = erEmployment.intermediarios;
  const totalRetailersLGP = lgpEmployment.detallistas;
  const totalRetailersER = erEmployment.detallistas;
  const totalLGP = lgpEmployment.total;
  const totalER = erEmployment.total;

  // Tabla de Empleo en Intermediarios
  const tableInters = allIntersIds.length > 0 ? `
    <div class="border border-line rounded-lg overflow-hidden relative shadow-sm mb-4 bg-surface">
      <div class="bg-surface-alt px-4 py-2 border-b border-line flex justify-between items-center">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Empleo en Intermediarios (S)</h5>
        <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table" style="width:100%;">
          <thead class="bg-surface-alt">
            <tr>
              <th class="!text-left !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Ubicación</th>
              <th class="!text-center border-l border-line/50 !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">LGP (personas)</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">ER (personas)</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia (%)</th>
            </tr>
          </thead>
          <tbody>
            ${intersRowsHtml}
            <tr class="border-t-2 border-line bg-surface-alt/50">
              <td class="!text-left font-bold !px-3 !py-2 text-main">TOTAL INTERMEDIARIOS</td>
              <td class="!text-center font-mono font-bold border-l border-line/50 !px-3 !py-2 text-main">${fmt(totalIntersLGP, 0)}</td>
              <td class="!text-center font-mono font-bold !px-3 !py-2 text-main">${fmt(totalIntersER, 0)}</td>
              <td class="!text-center !px-3 !py-2">${diffValue(totalIntersLGP, totalIntersER)}</td>
              <td class="!text-center !px-3 !py-2">${diffEmployment(totalIntersLGP, totalIntersER)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-2 bg-surface-alt/50 text-[10px] text-muted border-t border-line">
        <span class="inline-block w-3 h-3 bg-green-500/20 rounded mr-1"></span> Ubicación solo en LGP
        <span class="inline-block w-3 h-3 bg-red-500/20 rounded ml-3 mr-1"></span> Ubicación solo en ER
      </div>
    </div>
  ` : '';

  // Tabla de Empleo en Detallistas
  const tableRetailers = allRetailersIds.length > 0 ? `
    <div class="border border-line rounded-lg overflow-hidden relative shadow-sm mb-4 bg-surface">
      <div class="bg-surface-alt px-4 py-2 border-b border-line flex justify-between items-center">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Empleo en Detallistas (SS)</h5>
        <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table" style="width:100%;">
          <thead class="bg-surface-alt">
            <tr>
              <th class="!text-left !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Ubicación</th>
              <th class="!text-center border-l border-line/50 !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">LGP (personas)</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">ER (personas)</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia (%)</th>
            </tr>
          </thead>
          <tbody>
            ${retailersRowsHtml}
            <tr class="border-t-2 border-line bg-surface-alt/50">
              <td class="!text-left font-bold !px-3 !py-2 text-main">TOTAL DETALLISTAS</td>
              <td class="!text-center font-mono font-bold border-l border-line/50 !px-3 !py-2 text-main">${fmt(totalRetailersLGP, 0)}</td>
              <td class="!text-center font-mono font-bold !px-3 !py-2 text-main">${fmt(totalRetailersER, 0)}</td>
              <td class="!text-center !px-3 !py-2">${diffValue(totalRetailersLGP, totalRetailersER)}</td>
              <td class="!text-center !px-3 !py-2">${diffEmployment(totalRetailersLGP, totalRetailersER)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-2 bg-surface-alt/50 text-[10px] text-muted border-t border-line">
        <span class="inline-block w-3 h-3 bg-green-500/20 rounded mr-1"></span> Ubicación solo en LGP
        <span class="inline-block w-3 h-3 bg-red-500/20 rounded ml-3 mr-1"></span> Ubicación solo en ER
      </div>
    </div>
  ` : '';

  // Tabla de Resumen Total - ELIMINADA

  return tableInters + tableRetailers;
}

function _renderProducerVariantsComparison(lgpObjs, erObjs) {
  if (!lgpObjs || !erObjs) return "";

  const lgpVariants = lgpObjs.producer_variants;
  const erVariants = erObjs.producer_variants;

  if (!lgpVariants || !erVariants) return "";

  // Funciones de diff
  const diffValue = (vL, vE) => {
    const diff = vE - vL;
    if (Math.abs(diff) < 0.01) return `<span class="text-muted">—</span>`;
    const sign = diff > 0 ? "+" : "";
    const cls = diff > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return `<span class="${cls} font-mono text-xs">${sign}${fmt(diff, 1)}</span>`;
  };

  const diffPct = (vL, vE) => {
    if (typeof vL !== "number" || typeof vE !== "number" || vE === 0) return `<span class="text-muted">—</span>`;
    const p = ((vL - vE) / vE) * 100;
    const absP = Math.abs(p);
    if (absP < 0.05) return `<span class="text-muted font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 1)}%</span>`;
    const cls = p > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return `<span class="${cls} font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 1)}%</span>`;
  };

  // Obtener desglose de hectáreas
  const lgpBreakdown = lgpVariants.hectares_breakdown || [];
  const erBreakdown = erVariants.hectares_breakdown || [];

  // Crear maps de variantes
  const lgpHaMap = Object.fromEntries(lgpBreakdown.map(v => [v.variant, v.hectares]));
  const erHaMap = Object.fromEntries(erBreakdown.map(v => [v.variant, v.hectares]));
  const lgpYieldMap = Object.fromEntries(lgpBreakdown.map(v => [v.variant, v.yield_kg_ha]));
  const erYieldMap = Object.fromEntries(erBreakdown.map(v => [v.variant, v.yield_kg_ha]));

  // Todos los IDs de variantes únicos
  const allVariantIds = Array.from(new Set([...lgpBreakdown.map(v => v.variant), ...erBreakdown.map(v => v.variant)]));

  // Ordenar por hectáreas totales descendente
  allVariantIds.sort((a, b) => ((lgpHaMap[b] || 0) + (erHaMap[b] || 0)) - ((lgpHaMap[a] || 0) + (erHaMap[a] || 0)));

  // Generar filas para cada variante - Tabla de Hectáreas
  const haRowsHtml = allVariantIds.map(variant => {
    const lgpHa = lgpHaMap[variant] || 0;
    const erHa = erHaMap[variant] || 0;
    const lgpHas = lgpHa > 0.01;
    const erHas = erHa > 0.01;
    const isNewLGP = lgpHas && !erHas;
    const isNewER = erHas && !lgpHas;
    const rowClass = isNewLGP ? "bg-green-500/10" : isNewER ? "bg-red-500/10" : "";

    return `
      <tr class="${rowClass}">
        <td class="!text-left font-mono text-xs !px-3 !py-1.5">Variante ${variant}</td>
        <td class="!text-center font-mono border-l border-line/50 !px-3 !py-1.5 ${lgpHas ? '' : 'text-muted'}">${lgpHas ? fmt(lgpHa, 1) : '—'}</td>
        <td class="!text-center font-mono !px-3 !py-1.5 ${erHas ? '' : 'text-muted'}">${erHas ? fmt(erHa, 1) : '—'}</td>
        <td class="!text-center !px-3 !py-1.5">${diffValue(lgpHa, erHa)}</td>
      </tr>
    `;
  }).join("");

  // Generar filas para cada variante - Tabla de Rendimientos
  const yieldRowsHtml = allVariantIds.map(variant => {
    const lgpYield = lgpYieldMap[variant] || 0;
    const erYield = erYieldMap[variant] || 0;
    const lgpHa = lgpHaMap[variant] || 0;
    const erHa = erHaMap[variant] || 0;
    const lgpHas = lgpHa > 0.01;
    const erHas = erHa > 0.01;
    const isNewLGP = lgpHas && !erHas;
    const isNewER = erHas && !lgpHas;
    const rowClass = isNewLGP ? "bg-green-500/10" : isNewER ? "bg-red-500/10" : "";

    return `
      <tr class="${rowClass}">
        <td class="!text-left font-mono text-xs !px-3 !py-1.5">Variante ${variant}</td>
        <td class="!text-center font-mono border-l border-line/50 !px-3 !py-1.5 ${lgpHas ? '' : 'text-muted'}">${lgpHas ? fmt(lgpYield, 1) : '—'}</td>
        <td class="!text-center font-mono !px-3 !py-1.5 ${erHas ? '' : 'text-muted'}">${erHas ? fmt(erYield, 1) : '—'}</td>
        <td class="!text-center !px-3 !py-1.5">${diffValue(lgpYield, erYield)}</td>
      </tr>
    `;
  }).join("");

  // Totales
  const totalHaLGP = lgpVariants.total_hectares || 0;
  const totalHaER = erVariants.total_hectares || 0;
  const totalVariantsLGP = lgpVariants.total_variants || 0;
  const totalVariantsER = erVariants.total_variants || 0;

  // Tabla 1: Hectáreas
  const tableHa = allVariantIds.length > 0 ? `
    <div class="border border-line rounded-lg overflow-hidden relative shadow-sm mb-4 bg-surface">
      <div class="bg-surface-alt px-4 py-2 border-b border-line flex justify-between items-center">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Hectáreas por Variante</h5>
        <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table" style="width:100%;">
          <thead class="bg-surface-alt">
            <tr>
              <th class="!text-left !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Variante</th>
              <th class="!text-center border-l border-line/50 !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Hectáreas LGP</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Hectáreas ER</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            ${haRowsHtml}
            <tr class="border-t-2 border-line bg-surface-alt/50">
              <td class="!text-left font-bold !px-3 !py-2 text-main">TOTAL HECTÁREAS</td>
              <td class="!text-center font-mono font-bold border-l border-line/50 !px-3 !py-2 text-main">${fmt(totalHaLGP, 1)}</td>
              <td class="!text-center font-mono font-bold !px-3 !py-2 text-main">${fmt(totalHaER, 1)}</td>
              <td class="!text-center !px-3 !py-2">${diffValue(totalHaLGP, totalHaER)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-2 bg-surface-alt/50 text-[10px] text-muted border-t border-line">
        <span class="inline-block w-3 h-3 bg-green-500/20 rounded mr-1"></span> Variante solo en LGP
        <span class="inline-block w-3 h-3 bg-red-500/20 rounded ml-3 mr-1"></span> Variante solo en ER
      </div>
    </div>
  ` : '';

  // Tabla 2: Rendimientos
  const tableYield = allVariantIds.length > 0 ? `
    <div class="border border-line rounded-lg overflow-hidden relative shadow-sm mb-4 bg-surface">
      <div class="bg-surface-alt px-4 py-2 border-b border-line flex justify-between items-center">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Rendimiento por Variante (kg/Ha)</h5>
        <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table" style="width:100%;">
          <thead class="bg-surface-alt">
            <tr>
              <th class="!text-left !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Variante</th>
              <th class="!text-center border-l border-line/50 !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Rend. LGP</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Rend. ER</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            ${yieldRowsHtml}
          </tbody>
        </table>
      </div>
      <div class="px-4 py-2 bg-surface-alt/50 text-[10px] text-muted border-t border-line">
        <span class="inline-block w-3 h-3 bg-green-500/20 rounded mr-1"></span> Variante solo en LGP
        <span class="inline-block w-3 h-3 bg-red-500/20 rounded ml-3 mr-1"></span> Variante solo en ER
      </div>
    </div>
  ` : '';

  return tableHa + tableYield;
}

function _renderIntermediariesComparison(lgpObjs, erObjs) {
  if (!lgpObjs || !erObjs) return "";

  const lgpInters = lgpObjs.metrics?.inters_list || [];
  const erInters = erObjs.metrics?.inters_list || [];

  if (lgpInters.length === 0 && erInters.length === 0) return "";

  // Crear mapa de todos los intermediarios únicos
  const allInterIds = new Set();
  lgpInters.forEach(i => allInterIds.add(i.id));
  erInters.forEach(i => allInterIds.add(i.id));

  // Funciones de diff
  const diffValue = (vL, vE) => {
    if (typeof vL !== "number" || typeof vE !== "number") return `<span class="text-muted">—</span>`;
    const diff = vE - vL;
    if (Math.abs(diff) < 0.01) return `<span class="text-muted">—</span>`;
    const sign = diff > 0 ? "+" : "";
    const cls = diff > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return `<span class="${cls} font-mono text-xs">${sign}${fmt(diff, 0)}</span>`;
  };

  const diffPct = (vL, vE) => {
    if (typeof vL !== "number" || typeof vE !== "number" || vE === 0) return `<span class="text-muted">—</span>`;
    const p = ((vL - vE) / vE) * 100;
    const absP = Math.abs(p);
    if (absP < 0.05) return `<span class="text-muted font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 1)}%</span>`;
    const cls = p > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return `<span class="${cls} font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 1)}%</span>`;
  };

  // Crear filas para cada intermediario
  const lgpMap = Object.fromEntries(lgpInters.map(i => [i.id, i.flow]));
  const erMap = Object.fromEntries(erInters.map(i => [i.id, i.flow]));

  const sortedInters = Array.from(allInterIds).sort((a, b) => {
    // Ordenar por flujo total (suma de ambos métodos) descendente
    const flowA = (lgpMap[a] || 0) + (erMap[a] || 0);
    const flowB = (lgpMap[b] || 0) + (erMap[b] || 0);
    return flowB - flowA;
  });

  const rowsHtml = sortedInters.map(interId => {
    const lgpFlow = lgpMap[interId] || 0;
    const erFlow = erMap[interId] || 0;
    const lgpHas = lgpFlow > 0.01;
    const erHas = erFlow > 0.01;

    // Clase especial si el intermediario solo existe en uno de los métodos
    const isNewLGP = lgpHas && !erHas;
    const isNewER = erHas && !lgpHas;
    const rowClass = isNewLGP ? "bg-green-500/10" : isNewER ? "bg-red-500/10" : "";

    return `
      <tr class="${rowClass}">
        <td class="!text-left font-mono text-xs !px-3 !py-1.5">${interId}</td>
        <td class="!text-center font-mono border-l border-line/50 !px-3 !py-1.5 ${lgpHas ? '' : 'text-muted'}">${lgpHas ? fmt(lgpFlow) : '—'}</td>
        <td class="!text-center font-mono !px-3 !py-1.5 ${erHas ? '' : 'text-muted'}">${erHas ? fmt(erFlow) : '—'}</td>
        <td class="!text-center !px-3 !py-1.5">${diffValue(lgpFlow, erFlow)}</td>
        <td class="!text-center !px-3 !py-1.5">${diffPct(lgpFlow, erFlow)}</td>
      </tr>
    `;
  }).join("");

  // Calcular totales
  const totalLGP = Object.values(lgpMap).reduce((a, b) => a + b, 0);
  const totalER = Object.values(erMap).reduce((a, b) => a + b, 0);

  return `
    <div class="border border-line rounded-lg overflow-hidden relative shadow-sm mb-6 bg-surface">
      <div class="bg-surface-alt px-4 py-2 border-b border-line flex justify-between items-center">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Intermediarios Activos (Detalle)</h5>
        <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table" style="width:100%;">
          <thead class="bg-surface-alt">
            <tr>
              <th class="!text-left !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Intermediario</th>
              <th class="!text-center border-l border-line/50 !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Flujo LGP (kg)</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Flujo ER (kg)</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia (%)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="border-t-2 border-line bg-surface-alt/50">
              <td class="!text-left font-bold !px-3 !py-2 text-main">TOTAL FLUJO</td>
              <td class="!text-center font-mono font-bold border-l border-line/50 !px-3 !py-2 text-main">${fmt(totalLGP)}</td>
              <td class="!text-center font-mono font-bold !px-3 !py-2 text-main">${fmt(totalER)}</td>
              <td class="!text-center !px-3 !py-2">${diffValue(totalLGP, totalER)}</td>
              <td class="!text-center !px-3 !py-2">${diffPct(totalLGP, totalER)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-2 bg-surface-alt/50 text-[10px] text-muted border-t border-line">
        <span class="inline-block w-3 h-3 bg-green-500/20 rounded mr-1"></span> Intermediario solo en LGP
        <span class="inline-block w-3 h-3 bg-red-500/20 rounded ml-3 mr-1"></span> Intermediario solo en ER
      </div>
    </div>
  `;
}

function _renderRoutesComparison(lgpObjs, erObjs) {
  if (!lgpObjs || !erObjs) return "";

  const lgpRoutes = lgpObjs.metrics?.routes_list || [];
  const erRoutes = erObjs.metrics?.routes_list || [];

  if (lgpRoutes.length === 0 && erRoutes.length === 0) return "";

  // Funciones de diff
  const diffValue = (vL, vE) => {
    if (typeof vL !== "number" || typeof vE !== "number") return `<span class="text-muted">—</span>`;
    const diff = vE - vL;
    if (Math.abs(diff) < 0.01) return `<span class="text-muted">—</span>`;
    const sign = diff > 0 ? "+" : "";
    const cls = diff > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return `<span class="${cls} font-mono text-xs">${sign}${fmt(diff, 0)}</span>`;
  };

  const diffPct = (vL, vE) => {
    if (typeof vL !== "number" || typeof vE !== "number" || vE === 0) return `<span class="text-muted">—</span>`;
    const p = ((vL - vE) / vE) * 100;
    const absP = Math.abs(p);
    if (absP < 0.05) return `<span class="text-muted font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 1)}%</span>`;
    const cls = p > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return `<span class="${cls} font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 1)}%</span>`;
  };

  // Crear maps
  const lgpMap = Object.fromEntries(lgpRoutes.map(r => [r.route, r.flow]));
  const erMap = Object.fromEntries(erRoutes.map(r => [r.route, r.flow]));

  // Separar rutas X y Y
  const lgpX = lgpRoutes.filter(r => r.route.startsWith('X['));
  const lgpY = lgpRoutes.filter(r => r.route.startsWith('Y['));
  const erX = erRoutes.filter(r => r.route.startsWith('X['));
  const erY = erRoutes.filter(r => r.route.startsWith('Y['));

  // Todos los nombres únicos
  const allXNames = Array.from(new Set([...lgpX.map(r => r.route), ...erX.map(r => r.route)]));
  const allYNames = Array.from(new Set([...lgpY.map(r => r.route), ...erY.map(r => r.route)]));

  // Ordenar por flujo total descendente
  allXNames.sort((a, b) => ((lgpMap[b] || 0) + (erMap[b] || 0)) - ((lgpMap[a] || 0) + (erMap[a] || 0)));
  allYNames.sort((a, b) => ((lgpMap[b] || 0) + (erMap[b] || 0)) - ((lgpMap[a] || 0) + (erMap[a] || 0)));

  // Generar filas para rutas X
  const xRowsHtml = allXNames.map(route => {
    const lgpFlow = lgpMap[route] || 0;
    const erFlow = erMap[route] || 0;
    const lgpHas = lgpFlow > 0.01;
    const erHas = erFlow > 0.01;
    const isNewLGP = lgpHas && !erHas;
    const isNewER = erHas && !lgpHas;
    const rowClass = isNewLGP ? "bg-green-500/10" : isNewER ? "bg-red-500/10" : "";

    return `
      <tr class="${rowClass}">
        <td class="!text-left font-mono text-xs !px-3 !py-1.5">${route}</td>
        <td class="!text-center font-mono border-l border-line/50 !px-3 !py-1.5 ${lgpHas ? '' : 'text-muted'}">${lgpHas ? fmt(lgpFlow) : '—'}</td>
        <td class="!text-center font-mono !px-3 !py-1.5 ${erHas ? '' : 'text-muted'}">${erHas ? fmt(erFlow) : '—'}</td>
        <td class="!text-center !px-3 !py-1.5">${diffValue(lgpFlow, erFlow)}</td>
        <td class="!text-center !px-3 !py-1.5">${diffPct(lgpFlow, erFlow)}</td>
      </tr>
    `;
  }).join("");

  // Generar filas para rutas Y
  const yRowsHtml = allYNames.map(route => {
    const lgpFlow = lgpMap[route] || 0;
    const erFlow = erMap[route] || 0;
    const lgpHas = lgpFlow > 0.01;
    const erHas = erFlow > 0.01;
    const isNewLGP = lgpHas && !erHas;
    const isNewER = erHas && !lgpHas;
    const rowClass = isNewLGP ? "bg-green-500/10" : isNewER ? "bg-red-500/10" : "";

    return `
      <tr class="${rowClass}">
        <td class="!text-left font-mono text-xs !px-3 !py-1.5">${route}</td>
        <td class="!text-center font-mono border-l border-line/50 !px-3 !py-1.5 ${lgpHas ? '' : 'text-muted'}">${lgpHas ? fmt(lgpFlow) : '—'}</td>
        <td class="!text-center font-mono !px-3 !py-1.5 ${erHas ? '' : 'text-muted'}">${erHas ? fmt(erFlow) : '—'}</td>
        <td class="!text-center !px-3 !py-1.5">${diffValue(lgpFlow, erFlow)}</td>
        <td class="!text-center !px-3 !py-1.5">${diffPct(lgpFlow, erFlow)}</td>
      </tr>
    `;
  }).join("");

  // Totales por tipo
  const totalXLGP = lgpX.reduce((a, r) => a + r.flow, 0);
  const totalXER = erX.reduce((a, r) => a + r.flow, 0);
  const totalYLGP = lgpY.reduce((a, r) => a + r.flow, 0);
  const totalYER = erY.reduce((a, r) => a + r.flow, 0);

  // Tabla de Rutas X (P→I)
  const tableX = allXNames.length > 0 ? `
    <div class="border border-line rounded-lg overflow-hidden relative shadow-sm mb-4 bg-surface">
      <div class="bg-surface-alt px-4 py-2 border-b border-line flex justify-between items-center">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Rutas Productor → Intermediario (X)</h5>
        <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table" style="width:100%;">
          <thead class="bg-surface-alt">
            <tr>
              <th class="!text-left !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Ruta</th>
              <th class="!text-center border-l border-line/50 !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Flujo LGP (kg)</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Flujo ER (kg)</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia (%)</th>
            </tr>
          </thead>
          <tbody>
            ${xRowsHtml}
            <tr class="border-t-2 border-line bg-surface-alt/50">
              <td class="!text-left font-bold !px-3 !py-2 text-main">TOTAL FLUJO X</td>
              <td class="!text-center font-mono font-bold border-l border-line/50 !px-3 !py-2 text-main">${fmt(totalXLGP)}</td>
              <td class="!text-center font-mono font-bold !px-3 !py-2 text-main">${fmt(totalXER)}</td>
              <td class="!text-center !px-3 !py-2">${diffValue(totalXLGP, totalXER)}</td>
              <td class="!text-center !px-3 !py-2">${diffPct(totalXLGP, totalXER)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-2 bg-surface-alt/50 text-[10px] text-muted border-t border-line">
        <span class="inline-block w-3 h-3 bg-green-500/20 rounded mr-1"></span> Ruta solo en LGP
        <span class="inline-block w-3 h-3 bg-red-500/20 rounded ml-3 mr-1"></span> Ruta solo en ER
      </div>
    </div>
  ` : '';

  // Tabla de Rutas Y (I→D)
  const tableY = allYNames.length > 0 ? `
    <div class="border border-line rounded-lg overflow-hidden relative shadow-sm mb-6 bg-surface">
      <div class="bg-surface-alt px-4 py-2 border-b border-line flex justify-between items-center">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Rutas Intermediario → Detallista (Y)</h5>
        <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table" style="width:100%;">
          <thead class="bg-surface-alt">
            <tr>
              <th class="!text-left !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Ruta</th>
              <th class="!text-center border-l border-line/50 !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Flujo LGP (kg)</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Flujo ER (kg)</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia (%)</th>
            </tr>
          </thead>
          <tbody>
            ${yRowsHtml}
            <tr class="border-t-2 border-line bg-surface-alt/50">
              <td class="!text-left font-bold !px-3 !py-2 text-main">TOTAL FLUJO Y</td>
              <td class="!text-center font-mono font-bold border-l border-line/50 !px-3 !py-2 text-main">${fmt(totalYLGP)}</td>
              <td class="!text-center font-mono font-bold !px-3 !py-2 text-main">${fmt(totalYER)}</td>
              <td class="!text-center !px-3 !py-2">${diffValue(totalYLGP, totalYER)}</td>
              <td class="!text-center !px-3 !py-2">${diffPct(totalYLGP, totalYER)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-2 bg-surface-alt/50 text-[10px] text-muted border-t border-line">
        <span class="inline-block w-3 h-3 bg-green-500/20 rounded mr-1"></span> Ruta solo en LGP
        <span class="inline-block w-3 h-3 bg-red-500/20 rounded ml-3 mr-1"></span> Ruta solo en ER
      </div>
    </div>
  ` : '';

  return tableX + tableY;
}

function _renderTripsComparison(lgpObjs, erObjs) {
  if (!lgpObjs || !erObjs) return "";

  const lgpTrips = lgpObjs.metrics?.trips_list || [];
  const erTrips = erObjs.metrics?.trips_list || [];

  if (lgpTrips.length === 0 && erTrips.length === 0) return "";

  // Funciones de diff
  const diffValue = (vL, vE) => {
    if (typeof vL !== "number" || typeof vE !== "number") return `<span class="text-muted">—</span>`;
    const diff = vE - vL;
    if (Math.abs(diff) < 0.01) return `<span class="text-muted">—</span>`;
    const sign = diff > 0 ? "+" : "";
    const cls = diff > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return `<span class="${cls} font-mono text-xs">${sign}${fmt(diff, 0)}</span>`;
  };

  const diffPct = (vL, vE) => {
    if (typeof vL !== "number" || typeof vE !== "number" || vE === 0) return `<span class="text-muted">—</span>`;
    const p = ((vL - vE) / vE) * 100;
    const absP = Math.abs(p);
    if (absP < 0.05) return `<span class="text-muted font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 1)}%</span>`;
    const cls = p > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return `<span class="${cls} font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 1)}%</span>`;
  };

  // Crear maps
  const lgpMap = Object.fromEntries(lgpTrips.map(t => [t.trip, t.value]));
  const erMap = Object.fromEntries(erTrips.map(t => [t.trip, t.value]));

  // Separar viajes Z y ZZ
  const lgpZ = lgpTrips.filter(t => t.trip.startsWith('Z['));
  const lgpZZ = lgpTrips.filter(t => t.trip.startsWith('ZZ['));
  const erZ = erTrips.filter(t => t.trip.startsWith('Z['));
  const erZZ = erTrips.filter(t => t.trip.startsWith('ZZ['));

  // Todos los nombres únicos
  const allZNames = Array.from(new Set([...lgpZ.map(t => t.trip), ...erZ.map(t => t.trip)]));
  const allZZNames = Array.from(new Set([...lgpZZ.map(t => t.trip), ...erZZ.map(t => t.trip)]));

  // Ordenar por valor total descendente
  allZNames.sort((a, b) => ((lgpMap[b] || 0) + (erMap[b] || 0)) - ((lgpMap[a] || 0) + (erMap[a] || 0)));
  allZZNames.sort((a, b) => ((lgpMap[b] || 0) + (erMap[b] || 0)) - ((lgpMap[a] || 0) + (erMap[a] || 0)));

  // Generar filas para viajes Z
  const zRowsHtml = allZNames.map(trip => {
    const lgpVal = lgpMap[trip] || 0;
    const erVal = erMap[trip] || 0;
    const lgpHas = lgpVal > 0.01;
    const erHas = erVal > 0.01;
    const isNewLGP = lgpHas && !erHas;
    const isNewER = erHas && !lgpHas;
    const rowClass = isNewLGP ? "bg-green-500/10" : isNewER ? "bg-red-500/10" : "";

    return `
      <tr class="${rowClass}">
        <td class="!text-left font-mono text-xs !px-3 !py-1.5">${trip}</td>
        <td class="!text-center font-mono border-l border-line/50 !px-3 !py-1.5 ${lgpHas ? '' : 'text-muted'}">${lgpHas ? fmt(lgpVal, 0) : '—'}</td>
        <td class="!text-center font-mono !px-3 !py-1.5 ${erHas ? '' : 'text-muted'}">${erHas ? fmt(erVal, 0) : '—'}</td>
        <td class="!text-center !px-3 !py-1.5">${diffValue(lgpVal, erVal)}</td>
        <td class="!text-center !px-3 !py-1.5">${diffPct(lgpVal, erVal)}</td>
      </tr>
    `;
  }).join("");

  // Generar filas para viajes ZZ
  const zzRowsHtml = allZZNames.map(trip => {
    const lgpVal = lgpMap[trip] || 0;
    const erVal = erMap[trip] || 0;
    const lgpHas = lgpVal > 0.01;
    const erHas = erVal > 0.01;
    const isNewLGP = lgpHas && !erHas;
    const isNewER = erHas && !lgpHas;
    const rowClass = isNewLGP ? "bg-green-500/10" : isNewER ? "bg-red-500/10" : "";

    return `
      <tr class="${rowClass}">
        <td class="!text-left font-mono text-xs !px-3 !py-1.5">${trip}</td>
        <td class="!text-center font-mono border-l border-line/50 !px-3 !py-1.5 ${lgpHas ? '' : 'text-muted'}">${lgpHas ? fmt(lgpVal, 0) : '—'}</td>
        <td class="!text-center font-mono !px-3 !py-1.5 ${erHas ? '' : 'text-muted'}">${erHas ? fmt(erVal, 0) : '—'}</td>
        <td class="!text-center !px-3 !py-1.5">${diffValue(lgpVal, erVal)}</td>
        <td class="!text-center !px-3 !py-1.5">${diffPct(lgpVal, erVal)}</td>
      </tr>
    `;
  }).join("");

  // Totales por tipo
  const totalZLGP = lgpZ.reduce((a, t) => a + t.value, 0);
  const totalZER = erZ.reduce((a, t) => a + t.value, 0);
  const totalZZLGP = lgpZZ.reduce((a, t) => a + t.value, 0);
  const totalZZER = erZZ.reduce((a, t) => a + t.value, 0);

  // Tabla de Viajes Z (P→I)
  const tableZ = allZNames.length > 0 ? `
    <div class="border border-line rounded-lg overflow-hidden relative shadow-sm mb-4 bg-surface">
      <div class="bg-surface-alt px-4 py-2 border-b border-line flex justify-between items-center">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Viajes Productor → Intermediario (Z)</h5>
        <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table" style="width:100%;">
          <thead class="bg-surface-alt">
            <tr>
              <th class="!text-left !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Viaje</th>
              <th class="!text-center border-l border-line/50 !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Viajes LGP</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Viajes ER</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia (%)</th>
            </tr>
          </thead>
          <tbody>
            ${zRowsHtml}
            <tr class="border-t-2 border-line bg-surface-alt/50">
              <td class="!text-left font-bold !px-3 !py-2 text-main">TOTAL VIAJES Z</td>
              <td class="!text-center font-mono font-bold border-l border-line/50 !px-3 !py-2 text-main">${fmt(totalZLGP, 0)}</td>
              <td class="!text-center font-mono font-bold !px-3 !py-2 text-main">${fmt(totalZER, 0)}</td>
              <td class="!text-center !px-3 !py-2">${diffValue(totalZLGP, totalZER)}</td>
              <td class="!text-center !px-3 !py-2">${diffPct(totalZLGP, totalZER)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-2 bg-surface-alt/50 text-[10px] text-muted border-t border-line">
        <span class="inline-block w-3 h-3 bg-green-500/20 rounded mr-1"></span> Viaje solo en LGP
        <span class="inline-block w-3 h-3 bg-red-500/20 rounded ml-3 mr-1"></span> Viaje solo en ER
      </div>
    </div>
  ` : '';

  // Tabla de Viajes ZZ (I→D)
  const tableZZ = allZZNames.length > 0 ? `
    <div class="border border-line rounded-lg overflow-hidden relative shadow-sm mb-6 bg-surface">
      <div class="bg-surface-alt px-4 py-2 border-b border-line flex justify-between items-center">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Viajes Intermediario → Detallista (ZZ)</h5>
        <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table" style="width:100%;">
          <thead class="bg-surface-alt">
            <tr>
              <th class="!text-left !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Viaje</th>
              <th class="!text-center border-l border-line/50 !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Viajes LGP</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Viajes ER</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia (%)</th>
            </tr>
          </thead>
          <tbody>
            ${zzRowsHtml}
            <tr class="border-t-2 border-line bg-surface-alt/50">
              <td class="!text-left font-bold !px-3 !py-2 text-main">TOTAL VIAJES ZZ</td>
              <td class="!text-center font-mono font-bold border-l border-line/50 !px-3 !py-2 text-main">${fmt(totalZZLGP, 0)}</td>
              <td class="!text-center font-mono font-bold !px-3 !py-2 text-main">${fmt(totalZZER, 0)}</td>
              <td class="!text-center !px-3 !py-2">${diffValue(totalZZLGP, totalZZER)}</td>
              <td class="!text-center !px-3 !py-2">${diffPct(totalZZLGP, totalZZER)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-2 bg-surface-alt/50 text-[10px] text-muted border-t border-line">
        <span class="inline-block w-3 h-3 bg-green-500/20 rounded mr-1"></span> Viaje solo en LGP
        <span class="inline-block w-3 h-3 bg-red-500/20 rounded ml-3 mr-1"></span> Viaje solo en ER
      </div>
    </div>
  ` : '';

  return tableZ + tableZZ;
}

function _renderOpComparison(lgpObjs, erObjs, tableId) {
  if (!lgpObjs || !erObjs || !lgpObjs.metrics || !erObjs.metrics) return "";

  const l = lgpObjs.metrics;
  const e = erObjs.metrics;

  const diffStr = (vL, vE) => {
    if (typeof vL !== "number" || typeof vE !== "number" || vE === 0) return "—";
    const p = ((vL - vE) / vE) * 100;
    const absP = Math.abs(p);
    if (absP < 0.05) {
      return `<span class="text-muted font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 2)}%</span>`;
    }
    const cls = Math.abs(p) > 0.001 ? (p > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400") : "text-muted";
    return `<span class="${cls} font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 1)}%</span>`;
  };

  const diffValue = (vL, vE) => {
    const diff = vE - vL;
    if (Math.abs(diff) < 0.01) return `<span class="text-muted">—</span>`;
    const sign = diff > 0 ? "+" : "";
    const cls = diff > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return `<span class="${cls} font-mono text-xs">${sign}${fmt(diff, 0)}</span>`;
  };

  const fmtO = (v) => typeof v === "number" ? fmt(v) : v;

  const row = (name, vL, vE) => `
    <tr>
      <td class="!text-left font-bold !px-3 !py-2">${name}</td>
      <td class="!text-center font-mono border-l border-line/50 !px-3 !py-2">${fmtO(vL)}</td>
      <td class="!text-center font-mono !px-3 !py-2">${fmtO(vE)}</td>
      <td class="!text-center !px-3 !py-2">${diffValue(vL, vE)}</td>
      <td class="!text-center !px-3 !py-2">${diffStr(vL, vE)}</td>
    </tr>
  `;

  return `
    <div class="border border-line rounded-lg overflow-hidden relative shadow-sm mb-6 bg-surface">
      <div class="bg-surface-alt px-4 py-2 border-b border-line flex justify-between items-center">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Decisiones Operativas Clave</h5>
        <button class="text-accent hover:text-main transition-colors flex items-center justify-center p-1 rounded" title="Copiar Tabla" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table" id="${tableId}" style="width:100%;">
          <thead>
            <tr>
              <th class="!text-left !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Decisión Operativa</th>
              <th class="!text-center border-l border-line/50 !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">LGP</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">ER</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Diferencia (%)</th>
            </tr>
          </thead>
          <tbody>
            ${row("Viajes Totales (Rutas)", l.viajes_totales, e.viajes_totales)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderCombinedScenariosResult(lgp, er, scenarioName = "Escenario Personalizado") {
  if (!lgp || !er) return `<p class="text-[var(--c-error-text)] text-center py-4">Error al cargar datos comparativos.</p>`;

  // Verificar si los escenarios son factibles
  if (!lgp.propuesto || !er.propuesto) {
    const errorTitle = "Escenario Infactible";
    const errorMsg = !lgp.propuesto && !er.propuesto
      ? "Ambos métodos LGP y ER no pueden resolver el modelo con los parámetros seleccionados."
      : !lgp.propuesto
        ? "El método LGP no puede resolver el modelo con los parámetros seleccionados."
        : "El método ER no puede resolver el modelo con los parámetros seleccionados.";

    return `
      <div class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-8 mb-6">
        <div class="flex flex-col items-center text-center">
          <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h4 class="font-bold text-red-800 dark:text-red-300 text-sm uppercase tracking-wide">${errorTitle}</h4>
          <p class="text-red-700 dark:text-red-400 mt-2 text-sm max-w-md">${errorMsg}</p>
        </div>
      </div>`;
  }

  // Verificar si existe el escenario base
  if (!lgp.base || !er.base) {
    return `
      <div class="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-8 mb-6">
        <div class="flex flex-col items-center text-center">
          <div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h4 class="font-bold text-amber-800 dark:text-amber-300 text-sm uppercase tracking-wide">Datos Incompletos</h4>
          <p class="text-amber-700 dark:text-amber-400 mt-2 text-sm max-w-md">No se encontraron datos del escenario base necesarios para la comparación.</p>
          <p class="text-muted text-xs mt-3 max-w-sm">Intenta recargar la página o ejecutar el análisis nuevamente.</p>
        </div>
      </div>`;
  }

  const paramsEntries = Object.entries(lgp.params_modified || {});
  const base = lgp.base; // Should be same for both

  // Organizar parámetros en filas: 2 de 10 y 1 de 5
  const chunkSize = 10;
  const chunks = [];
  for (let i = 0; i < paramsEntries.length; i += chunkSize) {
    chunks.push(paramsEntries.slice(i, i + chunkSize));
  }

  const renderParam = ([p, pct]) => `
    <div class="flex items-center bg-surface border border-line rounded-lg shadow-sm overflow-hidden text-xs">
      <span class="px-2 py-1 font-bold text-main bg-surface-alt border-r border-line">${p}</span>
      <span class="px-2 py-1 text-muted font-mono font-semibold">${pct >= 0 ? "+" : ""}${fmt(pct)}%</span>
    </div>
  `;

  const rowsHtml = chunks.map(chunk => `
    <div class="flex flex-wrap gap-2 justify-center">${chunk.map(renderParam).join("")}</div>
  `).join("");

  // Tabla única comparativa de objetivos
  const diffStr = (vL, vE, reverse = false) => {
    if (typeof vL !== "number" || typeof vE !== "number" || vE === 0) return "—";
    const p = ((vL - vE) / vE) * 100;
    const absP = Math.abs(p);
    // Diferencias insignificantes (< 0.05%) = gris neutro
    if (absP < 0.05) {
      return `<span class="text-muted font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 2)}%</span>`;
    }
    // Diferencias significativas: verde = mejor, rojo = peor
    let cls = "text-muted";
    if (reverse) {
      // Para empleo: mayor es mejor
      cls = p > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    } else {
      // Para costo/emisiones: menor es mejor
      cls = p < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    }
    return `<span class="${cls} font-bold font-mono">${p > 0 ? "+" : ""}${fmt(p, 2)}%</span>`;
  };

  const comparisonTable = `
    <div class="border border-line rounded-lg overflow-hidden relative shadow-sm mb-6 bg-surface">
      <div class="bg-surface-alt px-4 py-2 border-b border-line flex justify-between items-center">
        <h5 class="text-[11px] font-bold text-main uppercase tracking-widest">Comparación de Objetivos</h5>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table" style="width:100%;">
          <thead>
            <tr>
              <th class="!text-left !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Objetivo</th>
              <th class="!text-center border-l border-line/50 !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Valor LGP</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Valor ER</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Variación LGP</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">Variación ER</th>
              <th class="!text-center !px-3 !py-2 font-bold uppercase tracking-widest text-[10px]">LGP vs ER</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="!text-left font-bold !px-3 !py-2">Costo</td>
              <td class="!text-center font-mono border-l border-line/50 !px-3 !py-2">${fmt(lgp.propuesto.cost)}</td>
              <td class="!text-center font-mono !px-3 !py-2">${fmt(er.propuesto.cost)}</td>
              <td class="!text-center !px-3 !py-2">${diffStr(lgp.propuesto.cost, base.cost)}</td>
              <td class="!text-center !px-3 !py-2">${diffStr(er.propuesto.cost, base.cost)}</td>
              <td class="!text-center !px-3 !py-2">${diffStr(lgp.propuesto.cost, er.propuesto.cost)}</td>
            </tr>
            <tr>
              <td class="!text-left font-bold !px-3 !py-2">Emisiones</td>
              <td class="!text-center font-mono border-l border-line/50 !px-3 !py-2">${fmt(lgp.propuesto.emissions)}</td>
              <td class="!text-center font-mono !px-3 !py-2">${fmt(er.propuesto.emissions)}</td>
              <td class="!text-center !px-3 !py-2">${diffStr(lgp.propuesto.emissions, base.emissions)}</td>
              <td class="!text-center !px-3 !py-2">${diffStr(er.propuesto.emissions, base.emissions)}</td>
              <td class="!text-center !px-3 !py-2">${diffStr(lgp.propuesto.emissions, er.propuesto.emissions)}</td>
            </tr>
            <tr>
              <td class="!text-left font-bold !px-3 !py-2">Empleo</td>
              <td class="!text-center font-mono border-l border-line/50 !px-3 !py-2">${fmt(lgp.propuesto.employment)}</td>
              <td class="!text-center font-mono !px-3 !py-2">${fmt(er.propuesto.employment)}</td>
              <td class="!text-center !px-3 !py-2">${diffStr(lgp.propuesto.employment, base.employment, true)}</td>
              <td class="!text-center !px-3 !py-2">${diffStr(er.propuesto.employment, base.employment, true)}</td>
              <td class="!text-center !px-3 !py-2">${diffStr(lgp.propuesto.employment, er.propuesto.employment, true)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const gridHtml = `
    ${comparisonTable}
    
    ${_renderCostBreakdownComparison(lgp.propuesto, er.propuesto)}
    
    ${_renderEmissionsBreakdownComparison(lgp.propuesto, er.propuesto)}
    
    ${_renderEmploymentBreakdownComparison(lgp.propuesto, er.propuesto)}
    
    ${_renderProducerVariantsComparison(lgp.propuesto, er.propuesto)}
    
    ${_renderTripsComparison(lgp.propuesto, er.propuesto)}
    
    ${_renderRoutesComparison(lgp.propuesto, er.propuesto)}
  `;

  return `
    <div class="bg-surface border border-line rounded-xl p-6 mb-6 shadow-sm">
      <p class="text-xs font-bold text-muted uppercase tracking-widest text-center mb-2">${scenarioName}</p>
      <h4 class="text-xs font-bold text-muted uppercase tracking-widest mb-3">Parámetros en el Escenario</h4>
      <div class="flex flex-col gap-3 mb-6">
        ${rowsHtml}
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
      <div class="bg-surface px-4 py-3 border-b border-line flex justify-between items-center">
        <h3 class="text-[11px] font-bold text-main uppercase tracking-widest">Referencia de Objetivos Base</h3>
        <button class="text-accent hover:text-main transition-colors p-1" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
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
    CN: "kg/día", CH: "kg/día", CRI: "kg/día", CR: "kg/día",
    DI: "kg/día", DD: "kg/día", CV: "kg/viaje",
    // Rendimientos y Tierra
    RA: "kg/Ha·se semana", RB: "kg/Ha·se semana",
    RC: "kg/Ha·se semana", RD: "kg/Ha·se semana",
    H: "Ha/semana",
    // Costos y Mano de Obra
    CP: "$/kg", CI: "$/kg", CT: "$/km/viaje", CTT: "$/km/viaje",
    CDA: "$/kg", CDF: "$/kg",
    CMO: "$/semana", CD: "$/detallista", CMP: "$/semana",
    CA: "kg/persona", CB: "kg/persona", CC: "kg/persona",
    // Otros
    IT: "kg CO2/km", P: "% daño", PP: "% daño",
    M: "km/semana"
  };

  const lgpRowsStr = rows.map(r => `<tr>
    <td class="font-bold border-r border-line/50 align-middle !px-2 !py-1.5">${r.param}</td>
    <td class="!text-left text-[10px] text-muted leading-tight max-w-[130px] align-middle !px-2 !py-1.5" style="white-space:normal;">${paramUnits[r.param] || "—"}</td>
    <td class="!text-center font-mono border-r border-line/50 align-middle !px-2 !py-1.5">${fmt(r.base_value)}</td>
    <td class="!text-center font-mono align-middle !px-2 !py-1.5 ${_shadowClass(r.lgp_shadow_cost)}">${_fmtShadow(r.lgp_shadow_cost)}</td>
    <td class="!text-center font-mono align-middle !px-2 !py-1.5 ${_shadowClass(r.lgp_shadow_env)}">${_fmtShadow(r.lgp_shadow_env)}</td>
    <td class="!text-center font-mono align-middle !px-2 !py-1.5 ${_shadowClass(r.lgp_shadow_soc)}">${_fmtShadow(r.lgp_shadow_soc)}</td>
    <td class="!text-center font-mono text-xs text-green-600 dark:text-green-400 align-middle !px-2 !py-1.5">${r.allowable_increase_pct != null ? "+" + fmt(r.allowable_increase_pct, 1) + "%" : "—"}</td>
    <td class="!text-center font-mono text-xs text-red-600 dark:text-red-400 border-r border-line/50 align-middle !px-2 !py-1.5">${r.allowable_decrease_pct != null ? "-" + fmt(r.allowable_decrease_pct, 1) + "%" : "—"}</td>
    <td class="!text-center font-mono text-[11px] align-middle !px-2 !py-1.5">${r.min_value != null ? fmt(r.min_value) : "—"}</td>
    <td class="!text-center font-mono text-[11px] align-middle !px-2 !py-1.5">${r.max_value != null ? fmt(r.max_value) : "—"}</td>
  </tr>`).join("");

  const lgpTable = `
    <div class="mb-8 p-1">
      <div class="flex justify-between items-center mb-2 px-1">
        <h3 class="text-xs font-bold text-main uppercase tracking-[0.1em]">
          Programación por Metas Lexicográfica (LGP)
        </h3>
        <button class="text-accent hover:text-main transition-colors p-1" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
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
    <td class="!text-center font-mono align-middle !px-2 !py-1.5 ${_shadowClass(r.er_shadow_soc)}">${_fmtShadow(r.er_shadow_soc)}</td>
    <td class="!text-center font-mono text-xs text-green-600 dark:text-green-400 align-middle !px-2 !py-1.5">${r.allowable_increase_pct != null ? "+" + fmt(r.allowable_increase_pct, 1) + "%" : "—"}</td>
    <td class="!text-center font-mono text-xs text-red-600 dark:text-red-400 border-r border-line/50 align-middle !px-2 !py-1.5">${r.allowable_decrease_pct != null ? "-" + fmt(r.allowable_decrease_pct, 1) + "%" : "—"}</td>
    <td class="!text-center font-mono text-[11px] align-middle !px-2 !py-1.5">${r.min_value != null ? fmt(r.min_value) : "—"}</td>
    <td class="!text-center font-mono text-[11px] align-middle !px-2 !py-1.5">${r.max_value != null ? fmt(r.max_value) : "—"}</td>
  </tr>`).join("");

  const erTable = `
    <div class="mb-4 p-1">
      <div class="flex justify-between items-center mb-2 px-1">
        <h3 class="text-xs font-bold text-main uppercase tracking-[0.1em]">
          Epsilon-Restricción (ER)
        </h3>
        <button class="text-accent hover:text-main transition-colors p-1" onclick="copyTableToClipboard(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </button>
      </div>
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


