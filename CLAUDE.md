# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-objective supply chain optimization web application for the citrus industry (thesis project). Balances three conflicting objectives: cost minimization, CO2 emissions reduction, and employment maximization using Lexicographic Goal Programming (LGP) and Epsilon-Constraint (ER) methods implemented in Pyomo.

## Starting the Application

```powershell
# Windows (PowerShell) - starts API on port 8000 and frontend on port 3000
./start.ps1
```

```bash
# Linux/Mac
./start.sh
```

Manual startup (requires venv activated):
```bash
# Backend
cd 02-api-model && uvicorn api.main:app --reload --port 8000

# Frontend (separate terminal)
cd 03-web-model && python -m http.server 3000
```

Access points:
- Dashboard: http://localhost:3000
- API Swagger: http://localhost:8000/docs

## One-time Setup

```powershell
python -m venv 02-api-model/venv
./02-api-model/venv/Scripts/Activate.ps1
pip install -r 02-api-model/requirements.txt
```

Solver config via `/02-api-model/.env` (copy from `.env.example`):
```
SOLVER=highs   # options: gurobi, highs, cplex, glpk, cbc
```

## Architecture

### Backend (`02-api-model/`)

```
api/main.py          → FastAPI app, CORS enabled, imports 3 routers
api/state.py         → AppState singleton (in-memory params + active solver)
api/routers/
  config.py          → GET/POST /config/solver
  params.py          → GET/PUT/POST /params (CRUD + reset)
  solve.py           → POST /solve/{lgp,er,sensitivity,robustness,scenarios}
solvers/
  build_model.py     → Pyomo ConcreteModel builder (sets, vars, constraints, objectives)
  lgp.py             → Lexicographic Goal Programming (3-level: Cost > Emissions > Employment)
  er.py              → Epsilon-Constraint (Pareto frontier, configurable steps)
data/params.py       → Single source of truth for all model parameters (40+ scalars/dicts)
config.py            → Solver factory (reads SOLVER env var)
```

**Data flow:** `data/params.py` → `AppState` → `build_model.py` → `lgp.py`/`er.py` → results saved to `redaccion/resultados/*.json`

**Model sets:** I (producers), J (intermediaries), K (retailers), U (producer variants)  
**Decision variables:** X, Y (flows), Z, ZZ (trips), W (production), S, SS, SSS (labor), B (binary)

### Frontend (`03-web-model/`)

Vanilla JS with no framework. Three modules:
- `js/app.js` — Tab switching, form handling, event wiring for all 7 tabs
- `js/api.js` — REST wrappers; `BASE_URL` hardcoded to `http://localhost:8000`
- `js/render.js` — Results tables, Chart.js charts, clipboard helpers, `es-CO` locale formatting

Single-page `index.html` (2000+ lines). TailwindCSS 4 loaded from browser CDN.

### Thesis Documentation (`redaccion/`)

```
redaccion/resultados/    → Raw JSON from solver (auto-saved by solve.py)
redaccion/maestros/      → Consolidated master files (populated by consolidar_resultados.py)
redaccion/plantillas/    → 4 thesis chapter templates with {{DATO:...}} placeholders
redaccion/conocimiento/  → Reference documents (notation, methodology, scenarios)
redaccion/tools/consolidar_resultados.py  → Maps solver results into thesis templates
```

Run after solver to sync results into thesis templates:
```bash
python redaccion/tools/consolidar_resultados.py --lgp --er --oat --rangos
# --dry-run flag available for preview
```

## Key Development Patterns

- **Adding/modifying parameters:** Edit `data/params.py` → `PARAM_SCHEMA` dict defines type (`scalar`, `list`, `dict_1d`, `dict_2d`) and default values. The API serializes/deserializes from this schema.
- **Adding API endpoints:** Add to the relevant router in `api/routers/`, then wire frontend calls in `api.js` and rendering in `render.js`.
- **Solver results:** `solve.py` auto-saves JSON to `redaccion/resultados/` on each successful solve. Run `consolidar_resultados.py` to propagate into thesis templates.
- **MANIFEST.md sync rule:** When changing solver logic, model formulation, or parameter definitions, check `redaccion/MANIFEST.md` for which thesis templates are affected and update placeholders accordingly.

## Pending Work

See `PENDIENTES.md` for active tasks:
1. Granular per-scenario enable/disable flags in the Escenarios tab
2. OAT data mapping to thesis templates via `consolidar_resultados.py`
