"""Shared solver utilities."""
import logging
import os
import tempfile
import contextlib


def _solve(solver, model, capture_log=True):
    """Solve model. Returns (results, log_str)."""
    if not capture_log:
        return solver.solve(model, tee=False), ""

    log_str = ""
    with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.log') as temp_log:
        temp_log_path = temp_log.name
        temp_log.close()  # Close to allow solver to write to it

    try:
        # Try to use solver-native log files (Thread-Safe)
        sname = str(solver.name).lower()
        options = {}
        if "glpk" in sname or "cbc" in sname:
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
        logging.error(f"[_solve] Error capturando log del solver: {e}")
        try:
            res = solver.solve(model, tee=False)
        except Exception as inner:
            logging.error(f"[_solve] Reintento sin log también falló: {inner}")
            res = None
        log_str = f"Error capturando log del solver: {str(e)}"
    finally:
        if os.path.exists(temp_log_path):
            try:
                os.remove(temp_log_path)
            except Exception:
                pass

    return res, log_str
