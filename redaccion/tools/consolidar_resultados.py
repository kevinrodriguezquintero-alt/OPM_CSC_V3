#!/usr/bin/env python3
"""
Sistema de archivos MAESTROS INDIVIDUALES para resultados de optimización.

Cada tipo de resultado (LGP, ER, OAT, Rangos, Escenarios) tiene su propio
archivo maestro que se actualiza INDEPENDIENTEMENTE. El consolidado final
se genera combinando todos los maestros existentes.

USO:
    python consolidar_resultados.py --help
    python consolidar_resultados.py --dry-run
    python consolidar_resultados.py --execute              # Actualiza todos los maestros
    python consolidar_resultados.py --execute --lgp        # Solo LGP
    python consolidar_resultados.py --execute --er         # Solo ER
    python consolidar_resultados.py --execute --oat-lg     # Solo OAT-LGP
    python consolidar_resultados.py --execute --escenarios  # Todos los escenarios
    python consolidar_resultados.py --execute --escenario boom_demanda  # Solo un escenario
    python consolidar_resultados.py --execute --escenario boom_demanda --escenario crisis_climatica

ARCHIVOS FUENTE (temporales, en redaccion/resultados/):
    - lgp.json           -> Resultados LGP (temporal, se sobrescribe)
    - er.json            -> Resultados ER (temporal, se sobrescribe)
    - oat_lgp.json       -> Análisis OAT LGP (temporal, se sobrescribe)
    - oat_er.json        -> Análisis OAT ER (temporal, se sobrescribe)
    - rangos.json        -> Rangos y precios sombra (temporal, se sobrescribe)
    - escenarios/*.json  -> Escenarios individuales (temporales, se sobrescriben)

ARCHIVOS MAESTROS (protegidos, en redaccion/maestros/):
    - lgp.json           -> Maestro LGP (actualizable individualmente)
    - er.json            -> Maestro ER (actualizable individualmente)
    - oat_lgp.json       -> Maestro OAT-LGP (actualizable individualmente)
    - oat_er.json        -> Maestro OAT-ER (actualizable individualmente)
    - rangos.json        -> Maestro Rangos (actualizable individualmente)
    - esc_*.json         -> Maestros de escenarios individuales (actualizables individualmente)
    - resultados_finales.json -> Consolidado de TODOS los maestros (regenerado automáticamente)

COMPORTAMIENTO CLAVE:
    - Cada maestro se actualiza SOLO si se selecciona explícitamente
    - Los maestros NO seleccionados se PRESERVAN (no se borran)
    - El consolidado final regenera combinando todos los maestros existentes
    - Esto permite actualizar LGP sin perder ER, Rangos, OAT, Escenarios
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

# Configuración (rutas relativas al directorio del script, no al CWD)
_HERE = Path(__file__).resolve().parent
RESULTADOS_DIR = _HERE / "../resultados"      # Archivos temporales individuales (cambian con cada ejecución)
PLANTILLAS_DIR = _HERE / "../plantillas"

# Archivos MAESTROS individuales (actualizables independientemente)
MAESTROS_DIR = _HERE / "../maestros"
MAESTRO_LGP = MAESTROS_DIR / "lgp.json"
MAESTRO_ER = MAESTROS_DIR / "er.json"
MAESTRO_OAT_LGP = MAESTROS_DIR / "oat_lgp.json"
MAESTRO_OAT_ER = MAESTROS_DIR / "oat_er.json"
MAESTRO_RANGOS = MAESTROS_DIR / "rangos.json"
# Nota: Los escenarios tienen maestros individuales: esc_*.json

# Archivo consolidado (solo lectura para análisis, se regenera de maestros)
RESULTADO_FINAL = MAESTROS_DIR / "resultados_finales.json"

# Mapeo: qué campo del JSON reemplaza qué placeholder
MAPEO_PLACEHOLDERS = {
    # Resultados LGP
    "lgp_costo": "lgp_costo",
    "lgp_emisiones": "lgp_emisiones", 
    "lgp_empleo": "lgp_empleo",
    "lgp_d1_plus": "lgp_d1_plus",
    "lgp_d2_plus": "lgp_d2_plus",
    "lgp_d3_minus": "lgp_d3_minus",
    
    # Resultados ER
    "er_costo": "er_costo",
    "er_emisiones": "er_emisiones",
    "er_empleo": "er_empleo",
    
    # Tabla de pagos - individuales
    "resultado_individual_economico_alpha": "resultado_individual_economico_α",
    "resultado_individual_economico_gamma": "resultado_individual_economico_γ",
    "resultado_individual_economico_beta": "resultado_individual_economico_β",
    "resultado_individual_ambiental_alpha": "resultado_individual_ambiental_α",
    "resultado_individual_ambiental_gamma": "resultado_individual_ambiental_γ",
    "resultado_individual_ambiental_beta": "resultado_individual_ambiental_β",
    "resultado_individual_social_alpha": "resultado_individual_social_α",
    "resultado_individual_social_gamma": "resultado_individual_social_γ",
    "resultado_individual_social_beta": "resultado_individual_social_β",
    
    # Aspiraciones
    "aspiracion_costo": "aspiracion_costo",
    "aspiracion_emisiones": "aspiracion_emisiones",
    "aspiracion_empleo": "aspiracion_empleo",

    # Escenarios — resultados LGP y ER por escenario (nombre descriptivo)
    **{
        f"{esc}_{metric}": f"{esc}_{metric}"
        for esc in (
            "boom_demanda", "crecimiento", "expansion",
            "transicion_verde", "regulacion_ambiental",
            "super_eficiencia", "fomento_laboral",
            "crisis_climatica", "huelga_transporte",
        )
        for metric in (
            "lgp_a", "lgp_g", "lgp_b",
            "lgp_a_prop", "lgp_g_prop", "lgp_b_prop",
            "er_a", "er_g", "er_b",
            "er_a_prop", "er_g_prop", "er_b_prop",
            "factible",
        )
    },

    # OAT — elasticidad media absoluta por parámetro (LGP y ER)
    # Parámetros: DI, DD, CA, CB, CV, RC, RA, IT, CT, CTT, CP, CI, CN, CH, CMO, CD, CDA, CDF, P, PP
    **{
        f"oat_{met}_sens_{param}_{metric}": f"oat_{met}_sens_{param}_{metric}"
        for met in ("lgp", "er")
        for param in ("DI", "DD", "CA", "CB", "CV", "RC", "RA", "IT",
                      "CT", "CTT", "CP", "CI", "CN", "CH", "CMO", "CD",
                      "CDA", "CDF", "P", "PP", "CRI", "CR", "RB", "RD", "H")
        for metric in ("alpha", "gamma", "beta", "clase_alpha", "clase_gamma", "clase_beta")
    },
}

PLANTILLAS_AFECTADAS = [
    "obj2_fase2_formulacion.md",
    "obj2_fase3_implementacion.md",
    "obj2_fase4_sensibilidad.md",
    "obj3_fase5_comparativo.md",
]


def cargar_lgp() -> dict:
    """Cargar resultados LGP completos."""
    ruta = RESULTADOS_DIR / "lgp.json"
    if not ruta.exists():
        print(f"[!]  No se encontró {ruta}")
        return {}
    
    with open(ruta, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    objs  = data.get("objectives", {})
    steps = data.get("steps", [])

    step1_cost      = (steps[0].get("objectives") or {}).get("cost")      if len(steps) > 0 else None
    step2_emissions = (steps[1].get("objectives") or {}).get("emissions") if len(steps) > 1 else None
    final_cost      = objs.get("cost")
    final_emissions = objs.get("emissions")

    # Desviaciones positivas respecto a las aspiraciones g₁ (costo) y g₂ (emisiones).
    # Con restricciones de igualdad en los subproblemas 1 y 2, el resultado debe ser ~0.
    # max(0, ...) absorbe ruido numérico de punto flotante.
    d1_plus = round(max(0.0, (final_cost or 0) - (step1_cost or 0)), 6)
    d2_plus = round(max(0.0, (final_emissions or 0) - (step2_emissions or 0)), 6)
    # d3_minus: el subproblema 3 maximiza empleo sujeto a las restricciones previas;
    # el valor alcanzado es el mejor posible bajo esas restricciones → d3⁻ = 0.
    # Para calcular la desviación real se necesitaría β* (óptimo sin restricciones),
    # que sólo está disponible en la payoff table del ER.
    d3_minus = 0.0

    lgp_data = {
        # Placeholders para plantillas
        "lgp_costo":    objs.get("cost"),
        "lgp_emisiones": objs.get("emissions"),
        "lgp_empleo":   objs.get("employment"),
        "lgp_d1_plus":  d1_plus,
        "lgp_d2_plus":  d2_plus,
        "lgp_d3_minus": d3_minus,
        # Datos completos para consulta/análisis
        "lgp_completo": data,
    }
    return lgp_data


def cargar_er(iter_custom: int = None) -> dict:
    """Cargar resultados ER (Epsilon-Constraint) completos.

    Selección del punto de la frontera de Pareto (1-indexed):
      1. Si iter_custom está provisto → usa esa iteración y la persiste en el maestro.
      2. Si no → lee knee_iteration del maestro existente (maestros/er.json).
      3. Si tampoco hay maestro con knee_iteration → falla con mensaje claro.
         Solución: correr con --er --er-iter <N> para registrar la selección.
    """
    ruta = RESULTADOS_DIR / "er.json"
    if not ruta.exists():
        print(f"[!]  No se encontró {ruta}")
        return {}

    with open(ruta, 'r', encoding='utf-8') as f:
        data = json.load(f)

    frontier = data.get("pareto_frontier", [])
    optimal = [p for p in frontier if p.get("status") == "optimal"]

    if not optimal:
        return {}

    # Resolver iteración a usar
    if iter_custom is not None:
        iter_to_use = iter_custom
        print(f"    [ER] Usando iteración seleccionada: {iter_to_use} (se persistirá en maestro)")
    else:
        # Intentar leer del maestro existente
        maestro_er = _cargar_maestro_si_existe(MAESTRO_ER)
        iter_to_use = maestro_er.get("knee_iteration")
        if iter_to_use is None:
            print(
                "[X]  ER: no se conoce el punto de codo.\n"
                "     Ejecuta primero:  python consolidar_resultados.py --execute --er --er-iter <N>\n"
                "     donde <N> es la iteración validada como knee point (ej: 78 de 100)."
            )
            return {}
        print(f"    [ER] Usando knee_iteration={iter_to_use} (leído del maestro)")

    idx = iter_to_use - 1
    if not (0 <= idx < len(optimal)):
        print(f"    [!] Iteración {iter_to_use} fuera de rango (frontera tiene {len(optimal)} puntos óptimos). Abortando ER.")
        return {}

    mid = optimal[idx]

    objs = mid.get("objectives", {})
    
    # Extraer payoff table
    pt = data.get("payoff_table", {})
    
    return {
        # Placeholders para plantillas
        "er_costo": objs.get("cost"),
        "er_emisiones": objs.get("emissions"),
        "er_empleo": objs.get("employment"),
        # Payoff table
        "resultado_individual_economico_alpha": pt.get("min_cost", {}).get("cost"),
        "resultado_individual_economico_gamma": pt.get("min_cost", {}).get("emissions"),
        "resultado_individual_economico_beta": pt.get("min_cost", {}).get("employment"),
        "resultado_individual_ambiental_alpha": pt.get("min_emissions", {}).get("cost"),
        "resultado_individual_ambiental_gamma": pt.get("min_emissions", {}).get("emissions"),
        "resultado_individual_ambiental_beta": pt.get("min_emissions", {}).get("employment"),
        "resultado_individual_social_alpha": pt.get("max_social", {}).get("cost"),
        "resultado_individual_social_gamma": pt.get("max_social", {}).get("emissions"),
        "resultado_individual_social_beta": pt.get("max_social", {}).get("employment"),
        # Aspiraciones (óptimos individuales)
        "aspiracion_costo": pt.get("min_cost", {}).get("cost"),
        "aspiracion_emisiones": pt.get("min_emissions", {}).get("emissions"),
        "aspiracion_empleo": pt.get("max_social", {}).get("employment"),
        # Selección persistida — se guarda en el maestro para reutilizar sin --er-iter
        "knee_iteration": iter_to_use,
        # Datos completos del punto medio para consulta/análisis
        "er_punto_medio_completo": mid,
        "er_frontera_completa": data.get("pareto_frontier", []),
        "er_payoff_table": pt,
    }


def _clasificar_elasticidad(v) -> str:
    """Clasificar elasticidad media absoluta en Alta / Media / Baja."""
    if v is None:
        return "—"
    if v >= 1.0:
        return "Alta"
    if v >= 0.5:
        return "Media"
    return "Baja"


def _cargar_oat_file(filename: str, prefix: str) -> dict:
    """Cargar un archivo OAT y calcular elasticidad media absoluta sobre todas las variaciones (±20%).

    Para cada parámetro se promedian los valores absolutos de elasticidad de TODOS los
    niveles de variación disponibles (p.ej. ±5%, ±10%, ±15%, ±20%) y se clasifica el
    resultado como Alta (≥1.0), Media (≥0.5) o Baja (<0.5).
    """
    ruta = RESULTADOS_DIR / filename
    if not ruta.exists():
        return {}

    with open(ruta, 'r', encoding='utf-8') as f:
        data = json.load(f)

    results = data.get("results", [])
    oat_data = {}

    # 1. Recolectar elasticidades absolutas por parámetro (todas las variaciones)
    param_vals: dict[str, dict[str, list]] = {}
    for r in results:
        param = r.get("param", "")
        if not param:
            continue
        if param not in param_vals:
            param_vals[param] = {"alpha": [], "gamma": [], "beta": []}

        for src_key, dest_key in [("elas_cost", "alpha"), ("elas_env", "gamma"), ("elas_soc", "beta")]:
            v = r.get(src_key)
            if v is not None:
                param_vals[param][dest_key].append(abs(v))

    # 2. Calcular media y clasificación por parámetro
    for param, vals in param_vals.items():
        avg_alpha = sum(vals["alpha"]) / len(vals["alpha"]) if vals["alpha"] else None
        avg_gamma = sum(vals["gamma"]) / len(vals["gamma"]) if vals["gamma"] else None
        avg_beta  = sum(vals["beta"])  / len(vals["beta"])  if vals["beta"]  else None

        oat_data[f"oat_{prefix}_sens_{param}_alpha"]       = round(avg_alpha, 3) if avg_alpha is not None else None
        oat_data[f"oat_{prefix}_sens_{param}_gamma"]       = round(avg_gamma, 3) if avg_gamma is not None else None
        oat_data[f"oat_{prefix}_sens_{param}_beta"]        = round(avg_beta,  3) if avg_beta  is not None else None
        oat_data[f"oat_{prefix}_sens_{param}_clase_alpha"] = _clasificar_elasticidad(avg_alpha)
        oat_data[f"oat_{prefix}_sens_{param}_clase_gamma"] = _clasificar_elasticidad(avg_gamma)
        oat_data[f"oat_{prefix}_sens_{param}_clase_beta"]  = _clasificar_elasticidad(avg_beta)

    # 3. Guardar datos completos para consulta/análisis
    oat_data[f"oat_{prefix}_tabla_completa"]   = results
    oat_data[f"oat_{prefix}_base_objectives"]  = data.get("base_objectives", {})

    return oat_data


def cargar_oat() -> dict:
    """Cargar resultados OAT (One-At-A-Time sensitivity) de LGP y ER."""
    oat_data = {}
    
    # Cargar OAT-LGP
    oat_data.update(_cargar_oat_file("oat_lgp.json", "lgp"))
    
    # Cargar OAT-ER
    oat_data.update(_cargar_oat_file("oat_er.json", "er"))
    
    return oat_data


def cargar_rangos() -> dict:
    """Cargar resultados de rangos (shadow prices) completos."""
    ruta = RESULTADOS_DIR / "rangos.json"
    if not ruta.exists():
        return {}
    
    with open(ruta, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return {
        # Tabla de rangos para placeholders
        "rangos_tabla": data.get("ranges", []),
        # Datos completos para consulta/análisis
        "rangos_completo": data,  # TODO: lgp_base, er_base, ranges
    }


def _extraer_objs_escenario(data: dict) -> tuple[dict, dict, dict, dict]:
    """Extraer base y propuesto de LGP y ER desde un JSON de escenario.

    Soporta dos formatos:
      - "both": { method:"both", lgp:{base,propuesto}, er:{base,propuesto} }
      - legacy:  { method:"lgp"|"er", base:{...}, propuesto:{...} }
    Retorna (lgp_base, lgp_prop, er_base, er_prop) — cada uno puede ser {}.
    """
    method = data.get("method", "lgp")
    if method == "both":
        lgp = data.get("lgp") or {}
        er  = data.get("er")  or {}
        return (
            lgp.get("base") or {},
            lgp.get("propuesto") or {},
            er.get("base") or {},
            er.get("propuesto") or {},
        )
    elif method == "er":
        base = data.get("base") or {}
        prop = data.get("propuesto") or {}
        return {}, {}, base, prop
    else:  # lgp
        base = data.get("base") or {}
        prop = data.get("propuesto") or {}
        return base, prop, {}, {}


def cargar_escenarios() -> dict:
    """Cargar todos los escenarios del directorio resultados/.

    Las claves usan el mismo nombre descriptivo del archivo (boom_demanda, etc.),
    sin ninguna capa de traducción numérica.
    """
    if not RESULTADOS_DIR.exists():
        return {}

    escenarios = {}
    for esc_file in sorted(RESULTADOS_DIR.glob("esc_*.json")):
        try:
            esc_id = esc_file.stem.replace("esc_", "")

            with open(esc_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            lgp_base, lgp_prop, er_base, er_prop = _extraer_objs_escenario(data)
            factible = bool(lgp_prop and lgp_prop.get("cost") is not None)

            escenarios.update({
                f"{esc_id}_lgp_a":      lgp_base.get("cost"),
                f"{esc_id}_lgp_g":      lgp_base.get("emissions"),
                f"{esc_id}_lgp_b":      lgp_base.get("employment"),
                f"{esc_id}_lgp_a_prop": lgp_prop.get("cost") if lgp_prop else None,
                f"{esc_id}_lgp_g_prop": lgp_prop.get("emissions") if lgp_prop else None,
                f"{esc_id}_lgp_b_prop": lgp_prop.get("employment") if lgp_prop else None,
                f"{esc_id}_er_a":       er_base.get("cost") if er_base else None,
                f"{esc_id}_er_g":       er_base.get("emissions") if er_base else None,
                f"{esc_id}_er_b":       er_base.get("employment") if er_base else None,
                f"{esc_id}_er_a_prop":  er_prop.get("cost") if er_prop else None,
                f"{esc_id}_er_g_prop":  er_prop.get("emissions") if er_prop else None,
                f"{esc_id}_er_b_prop":  er_prop.get("employment") if er_prop else None,
                f"{esc_id}_factible":   "Si" if factible else "No",
            })

            escenarios[f"{esc_id}_completo"] = data

        except Exception as e:
            print(f"[!]  Error cargando {esc_file}: {e}")

    return escenarios


def _cargar_maestro_si_existe(ruta: Path) -> dict:
    """Cargar archivo maestro si existe, sino retornar vacío."""
    if ruta.exists():
        try:
            with open(ruta, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[!]  Error cargando maestro {ruta}: {e}")
    return {}


def _guardar_maestro(ruta: Path, datos: dict, nombre: str):
    """Guardar datos en archivo maestro individual."""
    MAESTROS_DIR.mkdir(parents=True, exist_ok=True)
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(datos, f, indent=2, ensure_ascii=False, default=str)
    print(f"    [OK] Maestro {nombre} guardado: {ruta}")


def consolidar_seleccion(incluir_lgp=True, incluir_er=True, incluir_oat=True,
                         incluir_oat_lgp=True, incluir_oat_er=True,
                         incluir_rangos=True, incluir_escenarios=True,
                         escenarios_filtro: list = None,
                         er_iter=None) -> dict:
    """
    Consolidar resultados seleccionados en archivos maestros individuales.
    Cada maestro se actualiza solo si se selecciona, los demás se preservan.
    """
    print("[*] Actualizando archivos maestros individuales...")
    
    # 1. Actualizar maestros individuales según selección
    if incluir_lgp:
        print("    -> Actualizando Maestro LGP...")
        datos_lgp = cargar_lgp()
        if datos_lgp:
            _guardar_maestro(MAESTRO_LGP, datos_lgp, "LGP")
    
    if incluir_er:
        print("    -> Actualizando Maestro ER...")
        datos_er = cargar_er(er_iter)
        if datos_er:
            _guardar_maestro(MAESTRO_ER, datos_er, "ER")
    
    if incluir_oat or incluir_oat_lgp or incluir_oat_er:
        if incluir_oat or incluir_oat_lgp:
            print("    -> Actualizando Maestro OAT-LGP...")
            datos_oat_lgp = _cargar_oat_file("oat_lgp.json", "lgp")
            if datos_oat_lgp:
                # Guardar sin prefijo para maestro individual
                _guardar_maestro(MAESTRO_OAT_LGP, datos_oat_lgp, "OAT-LGP")
        
        if incluir_oat or incluir_oat_er:
            print("    -> Actualizando Maestro OAT-ER...")
            datos_oat_er = _cargar_oat_file("oat_er.json", "er")
            if datos_oat_er:
                _guardar_maestro(MAESTRO_OAT_ER, datos_oat_er, "OAT-ER")
    
    if incluir_rangos:
        print("    -> Actualizando Maestro Rangos...")
        datos_rangos = cargar_rangos()
        if datos_rangos:
            _guardar_maestro(MAESTRO_RANGOS, datos_rangos, "Rangos")
    
    if incluir_escenarios:
        print("    -> Actualizando Maestros de Escenarios individuales...")
        if escenarios_filtro:
            print(f"       Filtro activo: {', '.join(escenarios_filtro)}")
        if RESULTADOS_DIR.exists():
            for esc_file in sorted(RESULTADOS_DIR.glob("esc_*.json")):
                esc_id = esc_file.stem.replace("esc_", "")
                if escenarios_filtro and esc_id not in escenarios_filtro:
                    continue
                try:
                    with open(esc_file, 'r', encoding='utf-8') as f:
                        datos_esc = json.load(f)

                    lgp_base, lgp_prop, er_base, er_prop = _extraer_objs_escenario(datos_esc)
                    factible = bool(lgp_prop and lgp_prop.get("cost") is not None)

                    esc_data = {
                        f"{esc_id}_lgp_a":      lgp_base.get("cost"),
                        f"{esc_id}_lgp_g":      lgp_base.get("emissions"),
                        f"{esc_id}_lgp_b":      lgp_base.get("employment"),
                        f"{esc_id}_lgp_a_prop": lgp_prop.get("cost") if lgp_prop else None,
                        f"{esc_id}_lgp_g_prop": lgp_prop.get("emissions") if lgp_prop else None,
                        f"{esc_id}_lgp_b_prop": lgp_prop.get("employment") if lgp_prop else None,
                        f"{esc_id}_er_a":       er_base.get("cost") if er_base else None,
                        f"{esc_id}_er_g":       er_base.get("emissions") if er_base else None,
                        f"{esc_id}_er_b":       er_base.get("employment") if er_base else None,
                        f"{esc_id}_er_a_prop":  er_prop.get("cost") if er_prop else None,
                        f"{esc_id}_er_g_prop":  er_prop.get("emissions") if er_prop else None,
                        f"{esc_id}_er_b_prop":  er_prop.get("employment") if er_prop else None,
                        f"{esc_id}_factible":   "Si" if factible else "No",
                        f"{esc_id}_completo":   datos_esc,
                    }

                    ruta_maestro = MAESTROS_DIR / f"esc_{esc_id}.json"
                    _guardar_maestro(ruta_maestro, esc_data, esc_id)

                except Exception as e:
                    print(f"[!]  Error procesando {esc_file}: {e}")
    
    # 2. Generar consolidado combinando TODOS los maestros existentes
    print("[*] Generando consolidado desde maestros...")
    resultado = {
        "solver_status": "optimal",
        "consolidado_timestamp": datetime.now().isoformat(),
    }
    
    # Cargar cada maestro existente (incluso si no se actualizó en esta ejecución)
    maestros_cargados = []
    
    # Maestros principales
    for ruta, nombre in [
        (MAESTRO_LGP, "LGP"),
        (MAESTRO_ER, "ER"),
        (MAESTRO_OAT_LGP, "OAT-LGP"),
        (MAESTRO_OAT_ER, "OAT-ER"),
        (MAESTRO_RANGOS, "Rangos"),
    ]:
        datos = _cargar_maestro_si_existe(ruta)
        if datos:
            resultado.update(datos)
            maestros_cargados.append(nombre)
    
    # Maestros de escenarios individuales (patrón esc_*.json, ej: esc_boom_demanda.json)
    for esc_maestro in sorted(MAESTROS_DIR.glob("esc_*.json")):
        datos = _cargar_maestro_si_existe(esc_maestro)
        if datos:
            resultado.update(datos)
            maestros_cargados.append(esc_maestro.stem)
    
    print(f"    Maestros incluidos: {', '.join(maestros_cargados) if maestros_cargados else 'Ninguno'}")
    
    # 3. Guardar consolidado final (regenerado de todos los maestros)
    with open(RESULTADO_FINAL, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\n[OK] Archivos maestros actualizados")
    print(f"     Consolidado final: {RESULTADO_FINAL}")
    print(f"     Total campos combinados: {len(resultado)}")
    
    return resultado


def reemplazar_placeholders(contenido: str, datos: dict) -> tuple[str, list[str]]:
    """Reemplazar placeholders en el contenido."""
    cambios = []
    nuevo_contenido = contenido
    
    for campo_json, placeholder_template in MAPEO_PLACEHOLDERS.items():
        if campo_json in datos and datos[campo_json] is not None:
            valor = datos[campo_json]
            placeholder = f"{{{{DATO:{placeholder_template}}}}}"
            
            if placeholder in nuevo_contenido:
                nuevo_contenido = nuevo_contenido.replace(placeholder, str(valor))
                cambios.append(f"  {placeholder} -> {valor}")
    
    return nuevo_contenido, cambios


def actualizar_plantillas(data: dict, dry_run: bool = True) -> list[str]:
    """Actualizar todas las plantillas."""
    log_general = []
    
    for plantilla_nombre in PLANTILLAS_AFECTADAS:
        ruta = PLANTILLAS_DIR / plantilla_nombre
        if not ruta.exists():
            print(f"[!]  Plantilla no encontrada: {plantilla_nombre}")
            continue
        
        contenido = ruta.read_text(encoding='utf-8')
        nuevo_contenido, cambios = reemplazar_placeholders(contenido, data)
        
        if cambios:
            print(f"\n[F] {plantilla_nombre}:")
            # Solución para error de codificación en consola Windows (charmap)
            for cambio in cambios:
                try:
                    print(cambio)
                except UnicodeEncodeError:
                    print(cambio.encode('ascii', 'replace').decode('ascii'))
            
            log_general.append(f"{plantilla_nombre}:\n" + "\n".join(cambios))
            
            if not dry_run:
                ruta.write_text(nuevo_contenido, encoding='utf-8')
                print(f"   [OK] Archivo actualizado.")
        else:
            print(f"\n[-] {plantilla_nombre}: Sin cambios")
    
    return log_general


def main():
    parser = argparse.ArgumentParser(
        description="Consolida resultados de archivos individuales y actualiza plantillas",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
EJEMPLOS:
    # Consolidar TODO y simular cambios
    python consolidar_resultados.py --dry-run
    
    # Consolidar TODO y aplicar cambios
    python consolidar_resultados.py --execute
    
    # Solo LGP y ER
    python consolidar_resultados.py --execute --lgp --er
    
    # Todos los escenarios
    python consolidar_resultados.py --execute --escenarios

    # Un escenario específico
    python consolidar_resultados.py --execute --escenario boom_demanda

    # Varios escenarios específicos
    python consolidar_resultados.py --execute --escenario boom_demanda --escenario crisis_climatica

    # LGP, OAT y rangos (sin ER ni escenarios)
    python consolidar_resultados.py --execute --lgp --oat --rangos
        """
    )
    parser.add_argument('--dry-run', action='store_true',
                        help='Simular cambios sin modificar archivos')
    parser.add_argument('--execute', action='store_true',
                        help='APLICAR cambios')
    
    # Filtros de selección
    parser.add_argument('--lgp', action='store_true', help='Incluir resultados LGP')
    parser.add_argument('--er', action='store_true', help='Incluir resultados ER')
    parser.add_argument('--oat', action='store_true', help='Incluir resultados OAT (ambos: LGP y ER)')
    parser.add_argument('--oat-lg', dest='oat_lgp', action='store_true', help='Incluir solo OAT-LGP')
    parser.add_argument('--oat-er', dest='oat_er', action='store_true', help='Incluir solo OAT-ER')
    parser.add_argument('--rangos', action='store_true', help='Incluir resultados de rangos')
    parser.add_argument('--escenarios', action='store_true', help='Incluir todos los escenarios')
    parser.add_argument('--escenario', action='append', dest='escenario', metavar='NOMBRE',
                        help='Incluir un escenario específico (repetible). Ej: --escenario boom_demanda')
    parser.add_argument('--er-iter', type=int, help='Índice de iteración para punto medio de ER (1-indexed)')
    
    args = parser.parse_args()
    
    # --escenario individual implica activar incluir_escenarios
    if args.escenario:
        args.escenarios = True

    # Si no se especifica ningún filtro, incluir todo
    ningun_filtro = not (args.lgp or args.er or args.oat or args.oat_lgp or args.oat_er or args.rangos or args.escenarios)
    if ningun_filtro:
        args.lgp = args.er = args.oat = args.oat_lgp = args.oat_er = args.rangos = args.escenarios = True
    
    if not args.dry_run and not args.execute:
        print("[X] Error: Debes especificar --dry-run o --execute")
        parser.print_help()
        sys.exit(1)
    
    # Consolidar resultados según selección
    data = consolidar_seleccion(
        incluir_lgp=args.lgp,
        incluir_er=args.er,
        incluir_oat=args.oat,
        incluir_oat_lgp=args.oat_lgp,
        incluir_oat_er=args.oat_er,
        incluir_rangos=args.rangos,
        incluir_escenarios=args.escenarios,
        escenarios_filtro=args.escenario,
        er_iter=args.er_iter
    )
    
    if not data:
        print("[X] No se encontraron resultados para consolidar")
        sys.exit(1)
    
    # Verificar que hay campos para actualizar
    campos_validos = [k for k, v in data.items() if v is not None and k not in ["solver_status", "consolidado_timestamp"]]
    if not campos_validos:
        print("[X] No hay datos válidos para actualizar plantillas")
        sys.exit(1)
    
    print(f"\n[*] Campos disponibles para actualizar: {len(campos_validos)}")
    
    # Modo dry-run
    if args.dry_run:
        print("\n[>] MODO SIMULACION (--dry-run)")
        print("    Se mostrarian los siguientes cambios:\n")
        actualizar_plantillas(data, dry_run=True)
        print("\n" + "="*60)
        print("[OK] Simulacion completa. No se modifico ningun archivo.")
        print(f"    Para aplicar cambios:")
        print(f"    python consolidar_resultados.py --execute")
        sys.exit(0)
    
    # Modo execute
    if args.execute:
        print("\n[!] MODO EJECUCION (--execute)")
        print("    Se modificaran las plantillas.\n")
        
        confirm = input("¿Estas seguro? Escribe 'yes' para continuar: ")
        if confirm.lower() != 'yes':
            print("[X] Cancelado por el usuario.")
            sys.exit(0)
        
        # Aplicar cambios
        log = actualizar_plantillas(data, dry_run=False)
        
        print("\n" + "="*60)
        print(f"[OK] Actualizacion completa.")


if __name__ == "__main__":
    main()
