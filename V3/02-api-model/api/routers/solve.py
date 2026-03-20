import copy
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from api.state import app_state
from solvers.lgp import run_lgp
from solvers.er import run_er

router = APIRouter(prefix="/solve", tags=["solve"])


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
    "CHI": "capacidad de despacho del intermediario",
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
    if param in ("CH", "CHI", "CN", "CR", "CA", "CB", "CV", "RB", "RA", "RC", "H") and pct < 0:
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
    try:
        result = run_lgp(
            params_obj=app_state.get_params_object(),
            solver_name=app_state.solver_name,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return result


class ERRequest(BaseModel):
    steps: int = Field(default=5, ge=2, le=50, description="Number of epsilon iterations")


@router.post("/er")
def solve_er(body: ERRequest = ERRequest()):
    """Run Epsilon-Constraint Method and return Pareto frontier JSON."""
    try:
        result = run_er(
            params_obj=app_state.get_params_object(),
            solver_name=app_state.solver_name,
            steps=body.steps,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return result


def _run_and_extract(solver_name: str, steps: int) -> dict | None:
    """Run LGP or ER and return a unified objectives dict, or None if infeasible."""
    res = run_lgp(app_state.get_params_object(), solver_name)
    if res.get("status") == "optimal":
        return res["objectives"]
    return None


def _run_er_and_extract(solver_name: str, steps: int) -> dict | None:
    """Run ER and return objectives from the middle point of the Pareto frontier."""
    res = run_er(app_state.get_params_object(), solver_name, steps)
    frontier = [p for p in res.get("pareto_frontier", []) if p.get("status") == "optimal"]
    if not frontier:
        return None
    mid = frontier[len(frontier) // 2]
    return mid.get("objectives")


class SensitivityRequest(BaseModel):
    params_to_test: List[str]
    percentages: List[float] = [10.0, -10.0]
    method: str = "lgp"
    steps: int = Field(default=5, ge=2, le=20)


@router.post("/sensitivity")
def solve_sensitivity(body: SensitivityRequest):
    """One-At-A-Time sensitivity analysis: perturb each param ±%, run LGP or ER, compute elasticities."""
    if body.method not in ("lgp", "er"):
        raise HTTPException(status_code=422, detail="method must be 'lgp' or 'er'")

    def _solve() -> dict | None:
        if body.method == "er":
            return _run_er_and_extract(app_state.solver_name, body.steps)
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

    valid_cost = [r for r in results if r.get("elas_cost") is not None]
    valid_env  = [r for r in results if r.get("elas_env")  is not None]
    valid_soc  = [r for r in results if r.get("elas_soc")  is not None]
    top_cost = sorted(valid_cost, key=lambda x: abs(x["elas_cost"]), reverse=True)[:5]
    top_env  = sorted(valid_env,  key=lambda x: abs(x["elas_env"]),  reverse=True)[:5]
    top_soc  = sorted(valid_soc,  key=lambda x: abs(x["elas_soc"]),  reverse=True)[:5]

    return {
        "base_objectives": base_objs,
        "results": results,
        "top_cost": top_cost,
        "top_env": top_env,
        "top_soc": top_soc,
    }
