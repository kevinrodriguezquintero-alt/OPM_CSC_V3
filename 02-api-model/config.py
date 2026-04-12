import os
from dotenv import load_dotenv
import pyomo.environ as pyo

load_dotenv()


def _get_highs_solver():
    """Configurar HiGHS con opciones de rendimiento para acelerar solves."""
    solver = pyo.SolverFactory("highs")
    # Opciones de rendimiento para acelerar MIP solves
    solver.options["mip_rel_gap"] = 0.01  # 1% gap (default 0.01%)
    solver.options["time_limit"] = 180  # 180 segundos max por solve (3x el timeout HTTP)
    solver.options["threads"] = 4  # Usar 4 cores
    solver.options["mip_heuristic_effort"] = 0.2  # Más esfuerzo en heurísticas
    solver.options["output_flag"] = False  # Reducir logging
    return solver


SOLVERS = {
    "cplex":  lambda: pyo.SolverFactory("cplex", solver_io="nl", executable="cplex"),
    "highs":  lambda: _get_highs_solver(),
    "glpk":   lambda: pyo.SolverFactory("glpk"),
    "cbc":    lambda: pyo.SolverFactory("cbc"),
}


def get_solver(name: str = None):
    if name is None:
        name = os.getenv("SOLVER", "highs").lower()
    name = name.lower()
    if name not in SOLVERS:
        raise ValueError(f"Solver '{name}' no reconocido. Opciones: {list(SOLVERS)}")
    return SOLVERS[name]()
