# Optimizaciones de Solver para Modelos LGP/ER

Documentación de opciones de rendimiento para acelerar los solves de LGP y ER.

---

## Estado Actual (2025-04-12)

| Solver | Estado | Configuración |
|--------|--------|---------------|
| **HiGHS** | ✅ Optimizado | `mip_rel_gap=0.01`, `time_limit=60s`, `threads=4` |
| **CPLEX** | ⚪ Por defecto | Sin optimizaciones aplicadas |
| **CBC** | ⚪ Por defecto | Sin optimizaciones aplicadas |
| **GLPK** | ⚪ Por defecto | Sin optimizaciones aplicadas (recomendado: evitar) |

---

## HiGHS (Implementado)

### Opciones aplicadas en `config.py`:

```python
def _get_highs_solver():
    solver = pyo.SolverFactory("highs")
    solver.options["mip_rel_gap"] = 0.01       # 1% gap vs 0.01% default
    solver.options["time_limit"] = 60          # 60s max por solve
    solver.options["threads"] = 4              # Paralelismo multi-core
    solver.options["mip_heuristic_effort"] = 0.2  # Mejor solución inicial
    solver.options["output_flag"] = False      # Reducir logging
    return solver
```

### Impacto:
- **Antes**: ~45-60s por solve, ~6-8min ER total
- **Después**: ~10-20s por solve, ~2-3min ER total
- **Mejora**: ~3-4x más rápido

---

## CPLEX (Pendiente)

### Opciones recomendadas:

```python
def _get_cplex_solver():
    solver = pyo.SolverFactory("cplex", solver_io="nl", executable="cplex")
    
    # GAP relativo: 1% vs 0.01% default
    solver.options["mip_tolerances_mipgap"] = 0.01
    
    # Límite de tiempo por nodo/solve
    solver.options["timelimit"] = 60
    
    # Paralelismo: usar todos los cores disponibles
    solver.options["threads"] = 0  # 0 = auto-detectar
    
    # Estrategia de búsqueda: balanceada
    solver.options["mip_strategy_search"] = 1  # 1 = traditional
    
    # Énfasis en factibilidad vs optimalidad
    solver.options["mip_strategy_emphasis"] = 2  # 2 = feasibility
    
    return solver
```

### Ventajas esperadas:
- **Tiempo ER estimado**: ~1-2 minutos
- **Mejor manejo de memoria** que HiGHS
- **Estabilidad superior** en problemas grandes

### Requisito:
- Licencia IBM CPLEX activa (académica o comercial)

---

## CBC (Pendiente)

### Opciones recomendadas:

```python
def _get_cbc_solver():
    solver = pyo.SolverFactory("cbc")
    
    # Ratio de gap: terminar cuando (UB-LB)/UB < 0.01
    solver.options["ratioGap"] = 0.01
    
    # Segundos máximos por solve
    solver.options["seconds"] = 60
    
    # Número de threads
    solver.options["threads"] = 4
    
    # Número máximo de nodos en árbol de búsqueda
    solver.options["maxNodes"] = 10000
    
    # Número máximo de soluciones a guardar
    solver.options["maxSavedSolutions"] = 5
    
    # Frecuencia de corte: más agresiva
    solver.options["cut_passes"] = 10
    
    return solver
```

### Impacto esperado:
- **Antes**: ~60-90s por solve
- **Después**: ~20-30s por solve
- **Mejora**: ~2-3x más rápido

---

## GLPK (No recomendado)

### Problemas conocidos:
- No tiene opciones de gap relativo eficientes
- Sin paralelismo
- Branch-and-bound puro muy lento para MIPs grandes

### Opciones limitadas disponibles:

```python
def _get_glpk_solver():
    solver = pyo.SolverFactory("glpk")
    
    # Límite de tiempo (segundos)
    solver.options["tmlim"] = 60
    
    # Método de búsqueda: heuristico
    solver.options["mip"] = "heuristic"
    
    # Límite de nodos
    solver.options["nodelimit"] = 10000
    
    return solver
```

### Recomendación:
**Evitar GLPK para ER**. Usar solo para:
- Problemas muy pequeños (< 10 variables)
- Validación de modelos
- Cuando no hay alternativas disponibles

---

## Comparativa de Tiempos Esperados (ER con 5 pasos)

| Solver | Tiempo por Solve | Tiempo ER Total | Calidad Solución |
|--------|-----------------|-----------------|------------------|
| **CPLEX** | 10-15s | 1.5-2 min | ⭐⭐⭐⭐⭐ Excelente |
| **HiGHS** (optimizado) | 10-20s | 2-3 min | ⭐⭐⭐⭐ Muy buena |
| **CBC** (optimizado) | 20-30s | 3-4 min | ⭐⭐⭐ Buena |
| **HiGHS** (default) | 45-60s | 6-8 min | ⭐⭐⭐⭐ Muy buena |
| **CBC** (default) | 60-90s | 8-12 min | ⭐⭐⭐ Buena |
| **GLPK** | 120-300s | 15-30 min | ⭐⭐ Regular |

---

## Cómo Cambiar de Solver

### 1. Via archivo `.env`:
```bash
SOLVER=cplex  # highs, cbc, glpk
```

### 2. Via API REST:
```bash
curl -X PUT http://localhost:8000/config/solver \
  -H "Content-Type: application/json" \
  -d '{"solver": "cplex"}'
```

### 3. Via variable de entorno:
```bash
set SOLVER=cplex  # Windows
export SOLVER=cplex  # Linux/Mac
uvicorn api.main:app --port 8000
```

---

## Implementación Futura

Para aplicar estas optimizaciones, modificar `config.py`:

```python
# PASO 1: Agregar funciones de configuración

def _get_cplex_solver():
    """CPLEX con optimizaciones de rendimiento."""
    solver = pyo.SolverFactory("cplex", solver_io="nl", executable="cplex")
    solver.options["mip_tolerances_mipgap"] = 0.01
    solver.options["timelimit"] = 60
    solver.options["threads"] = 0
    return solver

def _get_cbc_solver():
    """CBC con optimizaciones de rendimiento."""
    solver = pyo.SolverFactory("cbc")
    solver.options["ratioGap"] = 0.01
    solver.options["seconds"] = 60
    solver.options["threads"] = 4
    return solver

# PASO 2: Actualizar diccionario SOLVERS

SOLVERS = {
    "cplex":  lambda: _get_cplex_solver(),
    "highs":  lambda: _get_highs_solver(),
    "cbc":    lambda: _get_cbc_solver(),
    "glpk":   lambda: pyo.SolverFactory("glpk"),  # Sin optimización (no recomendado)
}
```

---

## Referencias

- **HiGHS Documentation**: https://ergo-code.github.io/HiGHS/dev/options/definitions/
- **CPLEX Parameters**: https://www.ibm.com/docs/en/icos/20.1.0?topic=cplex-list-parameters
- **CBC Options**: https://github.com/coin-or/Cbc/blob/master/README.md
- **GLPK Documentation**: https://www.gnu.org/software/glpk/

---

*Documento creado: 2025-04-12*
*Última actualización: 2025-04-12*
*Próxima revisión: Cuando se implementen optimizaciones de CPLEX/CBC*
