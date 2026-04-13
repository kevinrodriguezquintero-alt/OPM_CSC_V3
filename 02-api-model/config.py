import os
from dotenv import load_dotenv
import pyomo.environ as pyo

load_dotenv()


SOLVERS = {
    "gurobi": lambda: pyo.SolverFactory("gurobi", solver_io="nl", executable="gurobi"),
    "cplex":  lambda: pyo.SolverFactory("cplex", solver_io="nl", executable="cplex"),
    "glpk":   lambda: pyo.SolverFactory("glpk"),
    "cbc":    lambda: pyo.SolverFactory("cbc"),
}


def get_solver(name: str = None):
    if name is None:
        name = os.getenv("SOLVER", "gurobi").lower()
    name = name.lower()
    if name not in SOLVERS:
        raise ValueError(f"Solver '{name}' no reconocido. Opciones: {list(SOLVERS)}")
    return SOLVERS[name]()
