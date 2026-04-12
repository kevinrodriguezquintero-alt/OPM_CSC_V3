"""Lexicographic Goal Programming solver."""
import pyomo.environ as pyo
from config import get_solver
from solvers.build_model import build_model, extract_variables, _solver_status

import os
import tempfile
import contextlib

def _solve(solver, model, capture_log=True):
    """Solve model. Returns (results, log_str)."""
    if not capture_log:
        try:
            return solver.solve(model, tee=False), ""
        except Exception:
            return solver.solve(model), "" # Hard fallback
            
    log_str = ""
    with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.log') as temp_log:
        temp_log_path = temp_log.name
        temp_log.close() # Close to allow solver to write to it
        
    try:
        # Try to use solver-native log files (Thread-Safe)
        sname = str(solver.name).lower()
        options = {}
        if "highs" in sname:
            options = {"log_file": temp_log_path}
        elif "glpk" in sname or "cbc" in sname:
            options = {"log": temp_log_path}
            
        if options:
            res = solver.solve(model, options=options, tee=False)
        else:
            # Fallback for solvers without easy log_file option
            with open(temp_log_path, 'w', encoding='utf-8') as f:
                with contextlib.redirect_stdout(f):
                    res = solver.solve(model, tee=True)
                
        if os.path.exists(temp_log_path):
            with open(temp_log_path, 'r', encoding='utf-8', errors='ignore') as f:
                log_str = f.read()
    except Exception as e:
        try:
            res = solver.solve(model, tee=False)
        except:
            res = None
        log_str = f"Error capturando log del solver: {str(e)}"
    finally:
        if os.path.exists(temp_log_path):
            try:
                os.remove(temp_log_path)
            except:
                pass
                
    return res, log_str


def run_lgp(params_obj, solver_name: str, capture_log: bool = True) -> dict:
    """
    Run Lexicographic Goal Programming.

    Priority order: Cost → Emissions → Employment (maximize)

    Parameters
    ----------
    params_obj  : namespace with all model parameters
    solver_name : solver identifier string

    Returns
    -------
    dict with keys: method, solver, status, steps, objectives, variables, logs
    """
    solver = get_solver(solver_name)

    model = pyo.ConcreteModel()
    build_model(model, params_obj)

    steps = []

    def _objs():
        return {
            "cost":       pyo.value(model.Obj_Cost),
            "emissions":  pyo.value(model.Obj_Env),
            "employment": pyo.value(model.Obj_Social),
        }

    # ── STEP 1: Minimize Cost ──────────────────────────────────────────────
    model.objective = pyo.Objective(expr=model.Obj_Cost, sense=pyo.minimize)
    res, log1 = _solve(solver, model, capture_log)
    status1 = _solver_status(res)

    step1 = {"step": 1, "priority": "Costo", "status": status1, "objectives": _objs(), "log": log1}
    steps.append(step1)

    if status1 != "optimal":
        return _error_response(solver_name, steps, "infeasible_step1")

    val_cost = pyo.value(model.Obj_Cost)
    model.cons_priority1 = pyo.Constraint(expr=model.Obj_Cost == val_cost)

    # ── STEP 2: Minimize Emissions ─────────────────────────────────────────
    model.del_component(model.objective)
    model.objective = pyo.Objective(expr=model.Obj_Env, sense=pyo.minimize)
    res, log2 = _solve(solver, model, capture_log)
    status2 = _solver_status(res)

    step2 = {"step": 2, "priority": "Emisiones", "status": status2, "objectives": _objs(), "log": log2}
    steps.append(step2)

    if status2 != "optimal":
        return _error_response(solver_name, steps, "infeasible_step2")

    val_env = pyo.value(model.Obj_Env)
    model.cons_priority2 = pyo.Constraint(expr=model.Obj_Env == val_env)

    # ── STEP 3: Maximize Employment ────────────────────────────────────────
    model.del_component(model.objective)
    model.objective = pyo.Objective(expr=model.Obj_Social, sense=pyo.maximize)
    res, log3 = _solve(solver, model, capture_log)
    status3 = _solver_status(res)

    final_objs = _objs()
    step3 = {"step": 3, "priority": "Social", "status": status3, "objectives": final_objs, "log": log3}
    steps.append(step3)

    return {
        "method":     "lgp",
        "solver":     solver_name,
        "status":     status3,
        "steps":      steps,
        "objectives": final_objs,
        "variables":  extract_variables(model),
    }


def _error_response(solver_name, steps, status):
    return {
        "method":     "lgp",
        "solver":     solver_name,
        "status":     status,
        "steps":      steps,
        "objectives": None,
        "variables":  None,
    }
