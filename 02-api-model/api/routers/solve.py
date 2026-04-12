import copy
import sys
import io
from typing import List
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from api.state import app_state
from solvers.lgp import run_lgp
from solvers.er import run_er

router = APIRouter(prefix="/solve", tags=["solve"])

# Directorio para guardar resultados automáticamente (relativo a 02-api-model, sube a raíz del proyecto)
RESULTADOS_DIR = Path("../redaccion/resultados")


def _ensure_stdout_safety():
    """Emergency fix for 'I/O operation on closed file' errors caused by thread-unsafe redirection."""
    try:
        sys.stdout.write("")
    except (ValueError, AttributeError):
        # Restore sys.stdout to the original system stdout if it's corrupted/closed
        sys.stdout = sys.__stdout__ if sys.__stdout__ else io.StringIO()


# ── Sensitivity helpers ──────────────────────────────────────────────────────

def _perturb_param(base_data: dict, param_name: str, percentage: float) -> dict:
    new_data = copy.deepcopy(base_data)
    multiplier = 1.0 + (percentage / 100.0)
    val = new_data[param_name]
    if isinstance(val, (int, float)):
        new_data[param_name] = val * multiplier
    elif isinstance(val, dict):
        for k in val:
            new_data[param_name][k] = val[k] * multiplier
    elif isinstance(val, list) and len(val) > 0 and isinstance(val[0], dict):
        for item in new_data[param_name]:
            item["value"] = item["value"] * multiplier
    else:
        raise ValueError(f"Unsupported parameter structure for {param_name}")
    return new_data


def _calculate_elasticity(base_obj, new_obj, pct):
    if pct == 0 or new_obj is None or base_obj is None or base_obj == 0:
        return None
    return ((new_obj - base_obj) / base_obj) / (pct / 100.0)


_PARAM_LABEL = {
    "CH":  "capacidad de despacho del productor",
    "CRI": "capacidad de recepción/despacho del intermediario",  # CRI según paper
    "CN":  "capacidad de producción del productor",
    "CR":  "capacidad de recepción del detallista",
    "CA":  "capacidad laboral del intermediario",
    "CB":  "capacidad laboral del detallista",
    "CV":  "capacidad del vehículo",
    "DI":  "demanda mínima del intermediario",
    "DD":  "demanda mínima del detallista",
    "RB":  "rendimiento máximo total",
    "RA":  "rendimiento por variante de productor",
    "RC":  "rendimiento máximo del cultivo base",
    "RD":  "rendimiento mínimo del cultivo base",
    "H":   "hectáreas por variante de productor",
    "CP":  "costo de producción",
    "CI":  "costo de procesamiento",
    "CT":  "costo de transporte P→I",
    "CTT": "costo de transporte I→D",
    "CDA": "costo por daño P→I",
    "CDF": "costo por daño I→D",
    "CMO": "costo de mano de obra (intermediario)",
    "CD":  "costo de mano de obra (detallista)",
    "IT":  "factor de impacto ambiental",
    "P":   "porcentaje de daño P→I",
    "PP":  "porcentaje de daño I→D",
}

def _infeasibility_hint(param: str, pct: float) -> str:
    label = _PARAM_LABEL.get(param, param)
    direction = "reducción" if pct < 0 else "aumento"
    # Supply/capacity params reduced → demand can't be met
    if param in ("CH", "CRI", "CN", "CR", "CA", "CB", "CV", "RB", "RA", "RC", "H") and pct < 0:  # CHI→CRI
        return f"La {direction} de {label} deja oferta insuficiente para cubrir la demanda"
    # Demand increased → supply can't cover
    if param in ("DI", "DD") and pct > 0:
        return f"El {direction} de {label} supera la capacidad de oferta disponible"
    # Yield floor raised → infeasible production
    if param == "RD" and pct > 0:
        return f"El {direction} del rendimiento mínimo hace inviable el plan de producción"
    article = "La" if pct < 0 else "El"
    return f"{article} {direction} de {label} genera un escenario sin solución factible"


@router.post("/lgp")
def solve_lgp():
    """Run Lexicographic Goal Programming and return structured JSON results."""
    _ensure_stdout_safety()
    try:
        result = run_lgp(
            params_obj=app_state.get_params_object(),
            solver_name=app_state.solver_name,
        )
        # Guardar automáticamente en archivo
        try:
            RESULTADOS_DIR.mkdir(parents=True, exist_ok=True)
            with open(RESULTADOS_DIR / "lgp.json", 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False, default=str)
        except Exception:
            pass  # No fallar si no se puede guardar archivo
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return result


class ERRequest(BaseModel):
    steps: int = Field(default=5, ge=2, le=50, description="Number of epsilon iterations")


@router.post("/er")
def solve_er(body: ERRequest = ERRequest()):
    """Run Epsilon-Constraint Method and return Pareto frontier JSON."""
    _ensure_stdout_safety()
    try:
        result = run_er(
            params_obj=app_state.get_params_object(),
            solver_name=app_state.solver_name,
            steps=body.steps,
        )
        # Guardar automáticamente en archivo
        try:
            RESULTADOS_DIR.mkdir(parents=True, exist_ok=True)
            with open(RESULTADOS_DIR / "er.json", 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False, default=str)
        except Exception:
            pass
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return result


def _extract_operational_metrics(variables: dict) -> dict:
    if not variables:
        return {}
    
    # 1. Personal
    pers_acopio = sum(item["value"] for item in variables.get("S", []))
    pers_int = sum(item["value"] for item in variables.get("SS", []))
    pers_det = sum(item["value"] for item in variables.get("SSS", []))
    
    # 2. Viajes - Z (P→I) y ZZ (I→D) separados, ordenados por valor descendente
    z_list = variables.get("Z", [])
    zz_list = variables.get("ZZ", [])
    
    trips_z = []
    trips_zz = []
    for item in z_list:
        if item["value"] > 0.01:
            trips_z.append({"trip": f"Z[{item['i']}→{item['j']}]", "value": item["value"]})
    for item in zz_list:
        if item["value"] > 0.01:
            trips_zz.append({"trip": f"ZZ[{item['j']}→{item['k']}]", "value": item["value"]})
    
    # Ordenar por valor descendente
    trips_z = sorted(trips_z, key=lambda x: x["value"], reverse=True)
    trips_zz = sorted(trips_zz, key=lambda x: x["value"], reverse=True)
    
    viajes_pi = sum(item["value"] for item in z_list)
    viajes_id = sum(item["value"] for item in zz_list)
    
    # 3. Flujos
    x_list = variables.get("X", [])
    y_list = variables.get("Y", [])
    flujo_p_i = sum(item["value"] for item in x_list)
    flujo_i_d = sum(item["value"] for item in y_list)
    
    # 4. Todos los Intermediarios (by incoming flow X) - ordenados por flujo
    int_flows = {}
    for item in x_list:
        j = item["j"]
        int_flows[j] = int_flows.get(j, 0) + item["value"]
    # Todos los intermediarios con flujo > 0, ordenados por flujo descendente
    all_inters = sorted(
        [(k, v) for k, v in int_flows.items() if v > 0.01],
        key=lambda kv: kv[1], reverse=True
    )
    # String legacy para compatibilidad
    top_ints_str = ", ".join([f"{k} ({v:,.0f} kg)" for k, v in all_inters[:3]]) if all_inters else "Ninguno"
    # Lista estructurada para tabla
    inters_list = [{"id": k, "flow": v} for k, v in all_inters]
    
    # 5. Todas las Rutas Activas - X (P→I) primero, luego Y (I→D), cada uno ordenado por flujo descendente
    routes_x = []
    routes_y = []
    for item in x_list:
        if item["value"] > 0.01:  # Solo rutas con flujo significativo
            routes_x.append({"route": f"X[{item['i']}→{item['j']}]", "flow": item["value"]})
    for item in y_list:
        if item["value"] > 0.01:  # Solo rutas con flujo significativo
            routes_y.append({"route": f"Y[{item['j']}→{item['k']}]", "flow": item["value"]})
    
    # Ordenar cada grupo por flujo descendente
    routes_x = sorted(routes_x, key=lambda x: x["flow"], reverse=True)
    routes_y = sorted(routes_y, key=lambda x: x["flow"], reverse=True)
    
    # Lista combinada para compatibilidad legacy
    all_routes = routes_x + routes_y
    all_routes_str = "; ".join([f"{r['route']} ({r['flow']:,.0f} kg)" for r in all_routes]) if all_routes else "Ninguna"
    
    return {
        "pers_int": pers_int,
        "pers_det": pers_det,
        "viajes_totales": viajes_pi + viajes_id,
        "flujo_pi": flujo_p_i,
        "flujo_id": flujo_i_d,
        "top_intermediarios": top_ints_str,
        "inters_list": inters_list,  # Lista estructurada de intermediarios
        "all_rutas": all_routes_str,
        "routes_list": all_routes,  # Lista estructurada para tabla
        "trips_list": trips_z + trips_zz  # Lista estructurada de viajes (Z primero, luego ZZ)
    }


def _extract_cost_breakdown_from_vars(variables: dict, params, actual_total: float) -> dict:
    """Calculate cost breakdown from variables to match ER/LGP results."""
    x_list = variables.get("X", [])
    y_list = variables.get("Y", [])
    s_list = variables.get("S", [])
    ss_list = variables.get("SS", [])
    sss_list = variables.get("SSS", [])
    z_list = variables.get("Z", [])
    zz_list = variables.get("ZZ", [])
    w_list = variables.get("W", [])
    
    # Build lookup dicts
    x_flow = {(item["i"], item["j"]): item["value"] for item in x_list}
    y_flow = {(item["j"], item["k"]): item["value"] for item in y_list}
    s_val = sum(item["value"] for item in s_list)
    ss_dict = {item["j"]: item["value"] for item in ss_list}
    sss_dict = {item["k"]: item["value"] for item in sss_list}
    z_dict = {(item["i"], item["j"]): item["value"] for item in z_list}
    zz_dict = {(item["j"], item["k"]): item["value"] for item in zz_list}
    w_dict = {item["i"]: item["value"] for item in w_list}
    
    # Get param values
    CP = getattr(params, 'CP', {})
    CI = getattr(params, 'CI', {})
    CMO = getattr(params, 'CMO', {})
    CT = getattr(params, 'CT', {})
    CTT = getattr(params, 'CTT', {})
    CD = getattr(params, 'CD', {})
    CDA = getattr(params, 'CDA', {})
    CDF = getattr(params, 'CDF', {})
    P = getattr(params, 'P', {})
    PP = getattr(params, 'PP', {})
    DPI = getattr(params, 'DPI', {})
    DID = getattr(params, 'DID', {})
    IT = getattr(params, 'IT', {})
    
    producers = getattr(params, 'PRODUCTORES', [])
    intermediaries = getattr(params, 'INTERMEDIARIOS', [])
    retailers = getattr(params, 'DETALLISTAS', [])
    
    cost_production = sum(CP.get(i, 0) * x_flow.get((i, j), 0) for i in producers for j in intermediaries)
    cost_intermediation = sum(CI.get(j, 0) * x_flow.get((i, j), 0) for i in producers for j in intermediaries)
    
    CMP = getattr(params, 'CMP', 0)
    cost_labor_acopio = CMP * s_val
    cost_labor_int = sum(CMO.get(j, 0) * ss_dict.get(j, 0) for j in intermediaries)
    cost_labor_det = sum(CD.get(k, 0) * sss_dict.get(k, 0) for k in retailers)
    
    cost_transport_pi = sum(CT.get((i, j), 0) * x_flow.get((i, j), 0) for i in producers for j in intermediaries)
    cost_transport_id = sum(CTT.get((j, k), 0) * y_flow.get((j, k), 0) for j in intermediaries for k in retailers)
    cost_damage_pi = sum(CDA.get((i, j), 0) * P.get((i, j), 0) * x_flow.get((i, j), 0) for i in producers for j in intermediaries)
    cost_damage_id = sum(CDF.get((j, k), 0) * PP.get((j, k), 0) * y_flow.get((j, k), 0) for j in intermediaries for k in retailers)
    
    total_transport = cost_transport_pi + cost_transport_id
    total_damage = cost_damage_pi + cost_damage_id
    total_labor = cost_labor_acopio + cost_labor_int + cost_labor_det
    
    calculated_total = cost_production + cost_intermediation + total_labor + total_transport + total_damage
    
    # Normalize to match actual total if there's a difference
    if calculated_total > 0 and abs(calculated_total - actual_total) > 0.01:
        factor = actual_total / calculated_total
        cost_production *= factor
        cost_intermediation *= factor
        cost_labor_acopio *= factor
        cost_labor_int *= factor
        cost_labor_det *= factor
        cost_transport_pi *= factor
        cost_transport_id *= factor
        cost_damage_pi *= factor
        cost_damage_id *= factor
        total_transport = cost_transport_pi + cost_transport_id
        total_damage = cost_damage_pi + cost_damage_id

    # En caso de normalizacion (asegura actualizar el labor_total)
    if calculated_total > 0 and abs(calculated_total - actual_total) > 0.01:
        total_labor = cost_labor_acopio + cost_labor_int + cost_labor_det
        
    return {
        "production": round(cost_production, 2),
        "intermediation": round(cost_intermediation, 2),
        "labor_acopio": round(cost_labor_acopio, 2),
        "labor_intermediario": round(cost_labor_int, 2),
        "labor_detallista": round(cost_labor_det, 2),
        "labor_total": round(total_labor, 2),
        "transport_pi": round(cost_transport_pi, 2),
        "transport_id": round(cost_transport_id, 2),
        "transport_total": round(total_transport, 2),
        "damage_pi": round(cost_damage_pi, 2),
        "damage_id": round(cost_damage_id, 2),
        "damage_total": round(total_damage, 2),
        "total": round(actual_total, 2)
    }


def _extract_emissions_breakdown(variables: dict, params) -> dict:
    """Extract detailed emissions breakdown by transport segment."""
    z_list = variables.get("Z", [])
    zz_list = variables.get("ZZ", [])
    
    # Build lookup dicts
    z_dict = {(item["i"], item["j"]): item["value"] for item in z_list}
    zz_dict = {(item["j"], item["k"]): item["value"] for item in zz_list}
    
    # Get param values
    DPI = getattr(params, 'DPI', {})
    DID = getattr(params, 'DID', {})
    IT = getattr(params, 'IT', {})
    
    # Emissions from P→I transport: Z[i,j] * DPI[i,j] * IT[j]
    emissions_pi = sum(
        z_dict.get((i, j), 0) * DPI.get((i, j), 0) * IT.get(j, 0)
        for i in getattr(params, 'PRODUCTORES', [])
        for j in getattr(params, 'INTERMEDIARIOS', [])
    )
    
    # Emissions from I→D transport: ZZ[j,k] * DID[j,k] * IT[j]
    emissions_id = sum(
        zz_dict.get((j, k), 0) * DID.get((j, k), 0) * IT.get(j, 0)
        for j in getattr(params, 'INTERMEDIARIOS', [])
        for k in getattr(params, 'DETALLISTAS', [])
    )
    
    return {
        "transport_pi": round(emissions_pi, 2),
        "transport_id": round(emissions_id, 2),
        "total": round(emissions_pi + emissions_id, 2)
    }


def _extract_employment_breakdown(variables: dict) -> dict:
    """Extract detailed employment breakdown by type and location."""
    s_list = variables.get("S", [])
    ss_list = variables.get("SS", [])
    sss_list = variables.get("SSS", [])
    
    # Personal intermediarios - lista detallada por ubicación
    inters_detail = []
    for item in ss_list:
        if item["value"] > 0.01:
            inters_detail.append({"location": item["j"], "value": item["value"]})
    inters_detail = sorted(inters_detail, key=lambda x: x["value"], reverse=True)
    
    # Personal detallistas - lista detallada por ubicación
    detallistas_detail = []
    for item in sss_list:
        if item["value"] > 0.01:
            detallistas_detail.append({"location": item["k"], "value": item["value"]})
    detallistas_detail = sorted(detallistas_detail, key=lambda x: x["value"], reverse=True)
    
    pers_acopio = sum(item["value"] for item in s_list)
    pers_int = sum(item["value"] for item in ss_list)
    pers_det = sum(item["value"] for item in sss_list)
    
    return {
        "acopio": round(pers_acopio, 0),
        "intermediarios": round(pers_int, 0),
        "detallistas": round(pers_det, 0),
        "total": round(pers_acopio + pers_int + pers_det, 0),
        "intermediarios_detail": inters_detail,  # Desglose por ubicación
        "detallistas_detail": detallistas_detail     # Desglose por ubicación
    }


def _extract_producer_variants(variables: dict, params) -> dict:
    """Extract active producer variants and hectares breakdown."""
    b_list = variables.get("B", [])
    w_list = variables.get("W", [])
    
    # Variantes activas
    active_variants = []
    for item in b_list:
        if item.get("value", 0) > 0.5:
            active_variants.append(item["u"])
    
    # Hectareas por productor
    hectares_by_producer = {}
    for item in w_list:
        hectares_by_producer[item["i"]] = item["value"]
    
    # Obtener H (hectareas por variante) de params
    H = getattr(params, 'H', {})
    
    # Desglose de hectareas por variante activa
    hectares_breakdown = []
    total_hectares = 0
    for variant in active_variants:
        ha = H.get(variant, 0)
        hectares_breakdown.append({
            "variant": variant,
            "hectares": ha,
            "yield_kg_ha": getattr(params, 'RA', {}).get(variant, 0)
        })
        total_hectares += ha
    
    # Ordenar por hectareas descendente
    hectares_breakdown = sorted(hectares_breakdown, key=lambda x: x["hectares"], reverse=True)
    
    return {
        "active_variants": active_variants,
        "total_variants": len(active_variants),
        "hectares_by_producer": hectares_by_producer,
        "hectares_breakdown": hectares_breakdown,
        "total_hectares": round(total_hectares, 2)
    }

def _run_and_extract(solver_name: str, steps: int) -> dict | None:
    """Run LGP and return a unified objectives dict, or None if infeasible."""
    params = app_state.get_params_object()
    from solvers.lgp import run_lgp
    
    res = run_lgp(params, solver_name, capture_log=False)
    if res.get("status") == "optimal":
        objs = res["objectives"]
        vars_dict = res.get("variables", {})
        objs["metrics"] = _extract_operational_metrics(vars_dict)
        objs["cost_breakdown"] = _extract_cost_breakdown_from_vars(vars_dict, params, objs["cost"])
        objs["emissions_breakdown"] = _extract_emissions_breakdown(vars_dict, params)
        objs["employment_breakdown"] = _extract_employment_breakdown(vars_dict)
        objs["producer_variants"] = _extract_producer_variants(vars_dict, params)
        return objs
    return None


# Nota: Función _calculate_cost_breakdown_from_vars eliminada - ahora usamos _extract_cost_breakdown_from_vars


def _run_er_and_extract(solver_name: str, steps: int, pilar: str = "middle") -> dict | None:
    """Run ER and return objectives from a specific point of the Pareto frontier or a pilar."""
    # If a specific pilar is requested, we only need to solve once for that objective
    params = app_state.get_params_object()
    from config import get_solver
    from solvers.build_model import build_model, extract_variables, _solver_status
    import pyomo.environ as pyo

    def _get_objs_and_metrics(m, vars_dict=None):
        objs = {
            "cost": pyo.value(m.Obj_Cost),
            "emissions": pyo.value(m.Obj_Env),
            "employment": pyo.value(m.Obj_Social),
        }
        if vars_dict is None:
            vars_dict = extract_variables(m)
        objs["metrics"] = _extract_operational_metrics(vars_dict)
        objs["cost_breakdown"] = _extract_cost_breakdown_from_vars(vars_dict, params, objs["cost"])
        objs["emissions_breakdown"] = _extract_emissions_breakdown(vars_dict, params)
        objs["employment_breakdown"] = _extract_employment_breakdown(vars_dict)
        objs["producer_variants"] = _extract_producer_variants(vars_dict, params)
        return objs

    if pilar in ("cost", "emissions", "employment"):
        model = pyo.ConcreteModel()
        build_model(model, params)
        solver = get_solver(solver_name)
        if pilar == "cost":
            model.obj = pyo.Objective(expr=model.Obj_Cost, sense=pyo.minimize)
        elif pilar == "emissions":
            model.obj = pyo.Objective(expr=model.Obj_Env, sense=pyo.minimize)
        else:
            model.obj = pyo.Objective(expr=model.Obj_Social, sense=pyo.maximize)
        
        res = solver.solve(model, tee=False)
        if _solver_status(res) == "optimal":
            return _get_objs_and_metrics(model)
        return None

    # Default: Run ER and take middle point
    res = run_er(params, solver_name, steps, capture_log=False)
    frontier = [p for p in res.get("pareto_frontier", []) if p.get("status") == "optimal"]
    if not frontier:
        return None
    mid = frontier[len(frontier) // 2]
    
    objs = mid.get("objectives", {})
    mid_vars = mid.get("variables", {})
    objs["metrics"] = _extract_operational_metrics(mid_vars)
    objs["cost_breakdown"] = _extract_cost_breakdown_from_vars(mid_vars, params, objs.get("cost", 0))
    objs["emissions_breakdown"] = _extract_emissions_breakdown(mid_vars, params)
    objs["employment_breakdown"] = _extract_employment_breakdown(mid_vars)
    objs["producer_variants"] = _extract_producer_variants(mid_vars, params)
    return objs


class SensitivityRequest(BaseModel):
    params_to_test: List[str]
    percentages: List[float] = [10.0, -10.0]
    method: str = "lgp"
    steps: int = Field(default=5, ge=2, le=20)
    er_pilar: str = "middle"


@router.post("/sensitivity")
def solve_sensitivity(body: SensitivityRequest):
    """One-At-A-Time sensitivity analysis: perturb each param ±%, run LGP or ER, compute elasticities."""
    _ensure_stdout_safety()
    if body.method not in ("lgp", "er"):
        raise HTTPException(status_code=422, detail="method must be 'lgp' or 'er'")

    def _solve() -> dict | None:
        if body.method == "er":
            return _run_er_and_extract(app_state.solver_name, body.steps, body.er_pilar)
        return _run_and_extract(app_state.solver_name, body.steps)

    base_data = copy.deepcopy(app_state.params)
    try:
        base_objs = _solve()
        if base_objs is None:
            raise HTTPException(status_code=422, detail="Base model not optimal")

        results = []
        for param in body.params_to_test:
            if param not in app_state.params:
                continue
            for pct in body.percentages:
                try:
                    new_data = _perturb_param(base_data, param, pct)
                    app_state.params = new_data
                    new_objs = _solve()
                    results.append({
                        "param": param,
                        "change": f"{pct:+.1f}%",
                        "obj_cost": new_objs["cost"] if new_objs else None,
                        "obj_env": new_objs["emissions"] if new_objs else None,
                        "obj_soc": new_objs["employment"] if new_objs else None,
                        "elas_cost": _calculate_elasticity(base_objs["cost"], new_objs["cost"] if new_objs else None, pct),
                        "elas_env": _calculate_elasticity(base_objs["emissions"], new_objs["emissions"] if new_objs else None, pct),
                        "elas_soc": _calculate_elasticity(base_objs["employment"], new_objs["employment"] if new_objs else None, pct),
                    })
                except HTTPException:
                    raise
                except Exception:
                    results.append({
                        "param": param,
                        "change": f"{pct:+.1f}%",
                        "error": _infeasibility_hint(param, pct),
                    })
    finally:
        app_state.params = base_data

    valid_cost = [r for r in results if r.get("elas_cost") is not None and abs(r["elas_cost"]) > 0]
    valid_env  = [r for r in results if r.get("elas_env")  is not None and abs(r["elas_env"]) > 0]
    valid_soc  = [r for r in results if r.get("elas_soc")  is not None and abs(r["elas_soc"]) > 0]
    top_cost = sorted(valid_cost, key=lambda x: abs(x["elas_cost"]), reverse=True)
    top_env  = sorted(valid_env,  key=lambda x: abs(x["elas_env"]),  reverse=True)
    top_soc  = sorted(valid_soc,  key=lambda x: abs(x["elas_soc"]),  reverse=True)

    result = {
        "base_objectives": base_objs,
        "results": results,
        "top_cost": top_cost,
        "top_env": top_env,
        "top_soc": top_soc,
    }
    # Guardar automáticamente
    try:
        RESULTADOS_DIR.mkdir(parents=True, exist_ok=True)
        with open(RESULTADOS_DIR / "oat.json", 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False, default=str)
    except Exception:
        pass
    return result


class ScenariosRequest(BaseModel):
    params_to_test: dict[str, float]  # { "param_name": percentage }
    method: str = "lgp"
    steps: int = Field(default=5, ge=2, le=20)
    er_pilar: str = "middle"
    escenario_id: str | None = None  # ID opcional para nombre de archivo (ej: "esc1_boom")


def _perturb_in_place(data: dict, param_name: str, percentage: float):
    multiplier = 1.0 + (percentage / 100.0)
    if param_name not in data:
        return
    val = data[param_name]
    if isinstance(val, (int, float)):
        data[param_name] = val * multiplier
    elif isinstance(val, dict):
        for k in val:
            if isinstance(val[k], (int, float)):
               val[k] = val[k] * multiplier
    elif isinstance(val, list) and len(val) > 0 and isinstance(val[0], dict):
        for item in data[param_name]:
            if "value" in item and isinstance(item["value"], (int, float)):
                item["value"] = item["value"] * multiplier


@router.post("/scenarios")
def solve_scenarios(body: ScenariosRequest):
    """
    Multivariable Scenario Analysis (Manual Sign Control).
    Perturbs selected params using EXACT user-provided signs (Propuesto) and their inverse (Inverso).
    If method=='both', returns comparison of LGP vs ER.
    """
    if body.method not in ("lgp", "er", "both"):
        raise HTTPException(status_code=422, detail="method must be 'lgp', 'er' or 'both'")

    def _safe_solve(meth: str) -> dict | None:
        try:
            if meth == "er":
                return _run_er_and_extract(app_state.solver_name, body.steps, body.er_pilar)
            return _run_and_extract(app_state.solver_name, body.steps)
        except Exception:
            return None

    base_data = copy.deepcopy(app_state.params)
    
    def _run_full_scenario(meth: str):
        # Reset to base to compute base objs for this method
        app_state.params = copy.deepcopy(base_data)
        b_objs = _safe_solve(meth)
        if b_objs is None: return None

        # Proposed
        p_data = copy.deepcopy(base_data)
        for p, pct in body.params_to_test.items():
            _perturb_in_place(p_data, p, pct)
        app_state.params = p_data
        p_objs = _safe_solve(meth)

        return {"base": b_objs, "propuesto": p_objs}

    try:
        if body.method == "both":
            lgp_res = _run_full_scenario("lgp")
            er_res = _run_full_scenario("er")
            return {
                "method": "both",
                "lgp": lgp_res,
                "er": er_res,
                "params_modified": body.params_to_test
            }
        else:
            res = _run_full_scenario(body.method)
            if res is None:
                raise HTTPException(status_code=422, detail="Model could not be solved")
            
            result = {
                "method": body.method,
                **res,
                "params_modified": body.params_to_test
            }
    finally:
        app_state.params = base_data
    
    # Guardar automáticamente (escenarios tienen nombres dinámicos o ID personalizado)
    try:
        RESULTADOS_DIR.mkdir(parents=True, exist_ok=True)
        # Usar escenario_id si se proporciona, sino generar desde parámetros
        if body.escenario_id:
            filename = f"esc_{body.escenario_id}.json"
        else:
            # Crear nombre de archivo basado en parámetros modificados
            esc_key = "_".join([f"{k}_{v}" for k, v in body.params_to_test.items()])
            esc_key = esc_key.replace(".", "_")[:50]  # Limitar longitud
            filename = f"esc_{esc_key}.json"
        with open(RESULTADOS_DIR / "escenarios" / filename, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False, default=str)
    except Exception:
        pass
    return result



# ── Sensitivity Ranges (Shadow Prices + Allowable Ranges) ────────────────

RANGE_PARAMS_DEFAULT = ["CA", "CB", "CN", "RA", "RC", "CV", "DI", "DD", "IT"]


def _quick_feasible(solver_name: str, epsilon: float = None) -> dict | None:
    """Minimize cost only (1 solve). Optionally constrained by epsilon emissions. Returns objectives dict or None."""
    import pyomo.environ as pyo
    from config import get_solver
    from solvers.build_model import build_model, _solver_status

    model = pyo.ConcreteModel()
    build_model(model, app_state.get_params_object())
    
    # Add epsilon constraint if provided (Compromise target)
    if epsilon is not None:
        model.Cons_Epsilon_Range = pyo.Constraint(expr=model.Obj_Env <= epsilon + 1e-5)
        
    model.obj = pyo.Objective(expr=model.Obj_Cost, sense=pyo.minimize)
    solver = get_solver(solver_name)
    res = solver.solve(model, tee=False)
    if _solver_status(res) == "optimal":
        return {
            "cost": pyo.value(model.Obj_Cost),
            "emissions": pyo.value(model.Obj_Env),
            "employment": pyo.value(model.Obj_Social),
        }
    return None


def _shadow_prices_for(base_data, param, base_objs, method, solver_name, delta=1.0, epsilon=None):
    """Compute shadow prices using centered finite difference at ±delta%."""
    results = {}
    for sign, label in [(+1, "plus"), (-1, "minus")]:
        pct = sign * delta
        try:
            new_data = _perturb_param(base_data, param, pct)
            app_state.params = new_data
            # Use quick solve (1 step) instead of full LGP for shadow prices (much faster)
            objs = _quick_feasible(solver_name)
        except Exception:
            objs = None
            
        results[label] = objs

    app_state.params = base_data

    # Calcular el cambio total en unidades físicas
    multiplier = delta / 100.0
    total_delta_units = 0
    val = base_data[param]
    if isinstance(val, (int, float)):
        total_delta_units = abs(val * multiplier)
    elif isinstance(val, dict):
        total_delta_units = sum(abs(v * multiplier) for v in val.values() if isinstance(v, (int, float)))
    elif isinstance(val, list) and len(val) > 0 and isinstance(val[0], dict):
        total_delta_units = sum(abs(item["value"] * multiplier) for item in val if isinstance(item.get("value"), (int, float)))

    p, m = results["plus"], results["minus"]
    if p is None or m is None or total_delta_units == 0:
        return {"cost": None, "emissions": None, "employment": None}
    
    # SP = Delta_Obj / (Total_Delta_Units * 2)  -- *2 porque es diferencia centrada (+delta% menos -delta%)
    denom = 2 * total_delta_units
    return {
        "cost":       (p["cost"] - m["cost"]) / denom,
        "emissions":  (p["emissions"] - m["emissions"]) / denom,
        "employment": (p["employment"] - m["employment"]) / denom,
    }


def _find_max_feasible(base_data, param, direction, solver_name, epsilon=None):
    """Find max perturbation % before infeasibility using binary search (1% precision). direction: +1 or -1."""
    low = 0.0
    high = 100.0 if direction > 0 else 99.0  # Max search bound
    best_ok = 0.0

    # Verificar primero si el límite máximo es factible para ahorrar iteraciones
    try:
        app_state.params = _perturb_param(base_data, param, direction * high)
        objs = _quick_feasible(solver_name, epsilon=epsilon)
        if objs is not None:
            app_state.params = base_data
            return high
    except Exception:
        pass

    # Búsqueda binaria (bisección) para encontrar el límite exacto
    tolerance = 1.0  # Precisión de 1%
    while (high - low) > tolerance:
        mid = (low + high) / 2.0
        try:
            app_state.params = _perturb_param(base_data, param, direction * mid)
            objs = _quick_feasible(solver_name, epsilon=epsilon)
            if objs is not None:
                low = mid
                best_ok = mid
            else:
                high = mid
        except Exception:
            high = mid
            
    app_state.params = base_data
    return round(best_ok, 1)


def _param_summary_value(params, name):
    """Representative value for display. SUM for additive metrics, MEAN for intensive ones."""
    val = params[name]
    additive_params = ["CN", "CH", "CRI", "CR", "DI", "DD", "H", "CMO", "CD"]  # CHI→CRI
    
    def _extract_nums(v):
        if isinstance(v, (int, float)): return [v]
        if isinstance(v, dict): return [x for x in v.values() if isinstance(x, (int, float))]
        if isinstance(v, list) and len(v)>0 and isinstance(v[0], dict):
            return [x.get("value") for x in v if isinstance(x.get("value"), (int, float))]
        return []

    nums = _extract_nums(val)
    if not nums: return None
    
    if name in additive_params:
        return round(sum(nums), 2)
    else:
        return round(sum(nums) / len(nums), 4)


class RangesRequest(BaseModel):
    params: List[str] = RANGE_PARAMS_DEFAULT


@router.post("/sensitivity-ranges")
def solve_sensitivity_ranges(body: RangesRequest = RangesRequest()):
    """
    Compute shadow prices (LGP vs ER) and allowable ranges for key params.
    Shadow prices use ±1% centered finite difference.
    Ranges use step-based feasibility checks.
    """
    base_data = copy.deepcopy(app_state.params)
    solver = app_state.solver_name

    try:
        lgp_base = _run_and_extract(solver, 5)

        # Shadow prices — ER (Compromise point)
        # Find target epsilon from a standard 5-step ER run
        target_epsilon = None
        full_er = run_er(app_state.get_params_object(), solver, steps=5, capture_log=False)
        frontier = [p for p in full_er.get("pareto_frontier", []) if p.get("status") == "optimal"]
        if frontier:
            mid = frontier[len(frontier)//2]
            target_epsilon = mid["objectives"]["emissions"]

        er_base = _quick_feasible(solver, epsilon=target_epsilon)

        if lgp_base is None and er_base is None:
            raise HTTPException(status_code=422, detail="Modelo base infactible")

        rows = []
        for param in body.params:
            if param not in base_data:
                continue

            entry = {
                "param": param,
                "label": _PARAM_LABEL.get(param, param),
                "base_value": _param_summary_value(base_data, param),
            }

            # Shadow prices — LGP
            if lgp_base:
                sp = _shadow_prices_for(base_data, param, lgp_base, "lgp", solver)
                entry["lgp_shadow_cost"] = sp["cost"]
                entry["lgp_shadow_env"] = sp["emissions"]
                entry["lgp_shadow_soc"] = sp["employment"]
            else:
                entry["lgp_shadow_cost"] = entry["lgp_shadow_env"] = entry["lgp_shadow_soc"] = None

            # Shadow prices — ER (Compromise / Fixed Epsilon)
            if er_base:
                sp = _shadow_prices_for(base_data, param, er_base, "er", solver, epsilon=target_epsilon)
                entry["er_shadow_cost"] = sp["cost"]
                entry["er_shadow_env"] = sp["emissions"]
                entry["er_shadow_soc"] = sp["employment"]
            else:
                entry["er_shadow_cost"] = entry["er_shadow_env"] = entry["er_shadow_soc"] = None

            # Allowable ranges (Physical feasibility buffer — No epsilon constraint)
            ai = _find_max_feasible(base_data, param, +1, solver, epsilon=None)
            ad = _find_max_feasible(base_data, param, -1, solver, epsilon=None)
            bv = entry["base_value"]

            entry["allowable_increase_pct"] = ai
            entry["allowable_decrease_pct"] = ad
            entry["min_value"] = round(bv * (1 - ad / 100), 4) if bv and ad else None
            entry["max_value"] = round(bv * (1 + ai / 100), 4) if bv and ai else None

            rows.append(entry)

        result = {"lgp_base": lgp_base, "er_base": er_base, "ranges": rows}
        
        # Guardar automáticamente
        try:
            RESULTADOS_DIR.mkdir(parents=True, exist_ok=True)
            with open(RESULTADOS_DIR / "rangos.json", 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False, default=str)
        except Exception:
            pass
        
        return result
    finally:
        app_state.params = base_data
