#!/usr/bin/env python3
"""
Exporta resultados completos de LGP/ER/OAT/Rangos/Escenarios a JSON.

USO:
    # Con servidor corriendo en localhost:8000
    python export_results.py
    
    # Especificar URL diferente
    python export_results.py --url http://localhost:8000
    
    # Solo LGP y ER (rápido)
    python export_results.py --quick
    
    # Guardar en ruta específica
    python export_results.py --output ../redaccion/results.json

Este script es NO intrusivo: no modifica el código de la API ni los solvers.
Simplemente consume la API como cliente y consolida resultados.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError:
    print("[X] Error: requests no está instalado.")
    print("   Instala con: pip install requests")
    sys.exit(1)


# Parámetros por defecto para análisis de sensibilidad
DEFAULT_SENSITIVITY_PARAMS = ["DI", "DD", "CA", "CB", "CV", "RC", "IT", "CT"]
DEFAULT_PERCENTAGES = [10.0, -10.0]

# 12 Escenarios predefinidos (según plantilla obj2_fase4_sensibilidad.md)
ESCENARIOS = {
    "esc1_boom": {"DI": 20, "DD": 20, "CN": 10},  # Boom Demanda
    "esc2_crecimiento": {"DI": 10, "DD": 10},  # Crecimiento moderado
    "esc3_restriccion": {"CH": -10, "CRI": -10, "CR": -10},  # Restricción Operativa
    "esc4_expansion": {"CN": 20, "CH": 15, "CRI": 15},  # Expansión capacidad
    "esc5_regulacion": {"IT": -30, "M": -20},  # Regulación Ambiental
    "esc6_transicion": {"IT": -50, "CA": 10},  # Transición Verde
    "esc7_eficiencia": {"CA": 20, "CB": 20, "RC": 15},  # Súper Eficiencia
    "esc8_fomento": {"CMO": -20, "CD": -20},  # Fomento Laboral
    "esc9_crisis": {"RC": -30, "RA": -20},  # Crisis Climática
    "esc10_huelga": {"CT": 50, "CTT": 50},  # Huelga Transporte
    "esc11_adversas": {"DI": -15, "DD": -15, "CT": 30},  # Condiciones Adversas
    "esc12_critica": {"RC": -40, "IT": 40, "DI": -20},  # Situación Crítica
}


def check_server(url: str) -> bool:
    """Verificar que el servidor está corriendo."""
    try:
        r = requests.get(f"{url}/health", timeout=5)
        return r.status_code == 200
    except Exception:
        return False


def run_lgp(base_url: str) -> dict | None:
    """Ejecutar LGP y extraer métricas."""
    try:
        r = requests.post(f"{base_url}/solve/lgp", timeout=240)  # Aumentado de 60 a 240 seg
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[!]  LGP falló: {e}")
        return None


def run_er(base_url: str, steps: int = 5) -> dict | None:
    """Ejecutar Epsilon-Constraint y extraer métricas."""
    try:
        r = requests.post(
            f"{base_url}/solve/er",
            json={"steps": steps},
            timeout=600  # Aumentado de 120 a 600 segundos (~10 min)
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[!]  ER falló: {e}")
        return None


def run_sensitivity(base_url: str, params: list[str], percentages: list[float], method: str = "lgp") -> dict | None:
    """Ejecutar análisis OAT de sensibilidad."""
    try:
        r = requests.post(
            f"{base_url}/solve/sensitivity",
            json={
                "params_to_test": params,
                "percentages": percentages,
                "method": method,
                "steps": 5,
                "er_pilar": "middle"
            },
            timeout=300  # Puede tardar
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[!]  Sensibilidad {method} falló: {e}")
        return None


def run_ranges(base_url: str, params: list[str] | None = None) -> dict | None:
    """Ejecutar análisis de rangos (shadow prices)."""
    try:
        body = {}
        if params:
            body["params"] = params
        r = requests.post(
            f"{base_url}/solve/sensitivity-ranges",
            json=body,
            timeout=300
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[!]  Rangos falló: {e}")
        return None


def run_scenario(base_url: str, scenario_params: dict, method: str = "both") -> dict | None:
    """Ejecutar un escenario específico."""
    try:
        r = requests.post(
            f"{base_url}/solve/scenarios",
            json={
                "params_to_test": scenario_params,
                "method": method,
                "steps": 5,
                "er_pilar": "middle"
            },
            timeout=120
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return None


def extract_payoff_table(er_result: dict) -> dict:
    """Extraer payoff table de resultado ER."""
    pt = er_result.get("payoff_table", {})
    
    # Mapear a formato esperado por plantillas
    return {
        "min_cost_alpha": pt.get("min_cost", {}).get("cost"),
        "min_cost_gamma": pt.get("min_cost", {}).get("emissions"),
        "min_cost_beta": pt.get("min_cost", {}).get("employment"),
        "min_emissions_alpha": pt.get("min_emissions", {}).get("cost"),
        "min_emissions_gamma": pt.get("min_emissions", {}).get("emissions"),
        "min_emissions_beta": pt.get("min_emissions", {}).get("employment"),
        "max_social_alpha": pt.get("max_social", {}).get("cost"),
        "max_social_gamma": pt.get("max_social", {}).get("emissions"),
        "max_social_beta": pt.get("max_social", {}).get("employment"),
    }


def extract_lgp_metrics(lgp_result: dict) -> dict:
    """Extraer métricas LGP en formato plano."""
    objs = lgp_result.get("objectives", {})
    return {
        "lgp_costo": objs.get("cost"),
        "lgp_emisiones": objs.get("emissions"),
        "lgp_empleo": objs.get("employment"),
        "lgp_d1_plus": 0,  # LGP no calcula desviaciones explícitamente
        "lgp_d2_plus": 0,
        "lgp_d3_minus": 0,
    }


def extract_er_metrics(er_result: dict) -> dict:
    """Extraer métricas ER (punto medio de frontera) en formato plano."""
    frontier = er_result.get("pareto_frontier", [])
    optimal = [p for p in frontier if p.get("status") == "optimal"]
    
    if not optimal:
        return {
            "er_costo": None,
            "er_emisiones": None,
            "er_empleo": None,
        }
    
    # Tomar punto medio de la frontera de Pareto
    mid = optimal[len(optimal) // 2]
    objs = mid.get("objectives", {})
    
    return {
        "er_costo": objs.get("cost"),
        "er_emisiones": objs.get("emissions"),
        "er_empleo": objs.get("employment"),
    }


def extract_oat_sensitivities(sens_result: dict) -> dict:
    """Extraer elasticidades OAT en formato plano para plantillas."""
    results = sens_result.get("results", [])
    
    # Mapeo de parámetro a elasticidades
    oat_data = {}
    for r in results:
        param = r.get("param", "")
        change = r.get("change", "")
        
        # Solo tomar +10% para simplificar (o el que exista)
        if change == "+10.0%":
            oat_data[f"oat_sens_{param}_alpha"] = r.get("elas_cost")
            oat_data[f"oat_sens_{param}_gamma"] = r.get("elas_env")
            oat_data[f"oat_sens_{param}_beta"] = r.get("elas_soc")
    
    return oat_data


def extract_ranges(ranges_result: dict) -> list[dict]:
    """Extraer rangos en formato de tabla para plantillas."""
    lgp_ranges = ranges_result.get("lgp_ranges", [])
    er_ranges = ranges_result.get("er_ranges", [])
    
    # Combinar ambos métodos
    combined = []
    for i, lgp in enumerate(lgp_ranges):
        er = er_ranges[i] if i < len(er_ranges) else {}
        combined.append({
            "param": lgp.get("param"),
            "rango_inf_lgp": lgp.get("range", {}).get("lower"),
            "rango_sup_lgp": lgp.get("range", {}).get("upper"),
            "shadow_cost_lgp": lgp.get("shadow", {}).get("cost"),
            "rango_inf_er": er.get("range", {}).get("lower"),
            "rango_sup_er": er.get("range", {}).get("upper"),
            "shadow_cost_er": er.get("shadow", {}).get("cost"),
        })
    
    return combined


def extract_scenario_results(scenario_results: dict) -> dict:
    """Extraer resultados de escenario en formato plano."""
    esc_id = scenario_results.get("esc_id", "")
    lgp = scenario_results.get("lgp", {})
    er = scenario_results.get("er", {})
    
    lgp_base = lgp.get("base", {}) if isinstance(lgp, dict) else {}
    lgp_prop = lgp.get("propuesto", {}) if isinstance(lgp, dict) else {}
    er_base = er.get("base", {}) if isinstance(er, dict) else {}
    er_prop = er.get("propuesto", {}) if isinstance(er, dict) else {}
    
    return {
        f"{esc_id}_lgp_a_base": lgp_base.get("cost"),
        f"{esc_id}_lgp_g_base": lgp_base.get("emissions"),
        f"{esc_id}_lgp_b_base": lgp_base.get("employment"),
        f"{esc_id}_lgp_a_prop": lgp_prop.get("cost") if lgp_prop else None,
        f"{esc_id}_lgp_g_prop": lgp_prop.get("emissions") if lgp_prop else None,
        f"{esc_id}_lgp_b_prop": lgp_prop.get("employment") if lgp_prop else None,
        f"{esc_id}_er_a_base": er_base.get("cost"),
        f"{esc_id}_er_g_base": er_base.get("emissions"),
        f"{esc_id}_er_b_base": er_base.get("employment"),
        f"{esc_id}_er_a_prop": er_prop.get("cost") if er_prop else None,
        f"{esc_id}_er_g_prop": er_prop.get("emissions") if er_prop else None,
        f"{esc_id}_er_b_prop": er_prop.get("employment") if er_prop else None,
        f"{esc_id}_factible": "Sí" if (lgp_prop and er_prop) else "No",
    }


def main():
    parser = argparse.ArgumentParser(
        description="Exporta resultados de optimización a JSON para plantillas",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
EJEMPLOS:
    # Export completo (todos los análisis)
    python export_results.py
    
    # Solo LGP y ER (rápido, ~30 segundos)
    python export_results.py --quick
    
    # Exportar a redaccion/ (para update_results.py)
    python export_results.py --output ../redaccion/results.json
        """
    )
    parser.add_argument("--url", default="http://localhost:8000",
                        help="URL base de la API (default: http://localhost:8000)")
    parser.add_argument("--output", default="results.json",
                        help="Ruta del archivo JSON de salida (default: results.json)")
    parser.add_argument("--quick", action="store_true",
                        help="Solo LGP y ER, sin sensibilidad ni escenarios")
    parser.add_argument("--er-steps", type=int, default=5,
                        help="Pasos para Epsilon-Constraint (default: 5)")
    
    args = parser.parse_args()
    
    # Verificar servidor
    print(f"[*] Verificando conexión a {args.url}...")
    if not check_server(args.url):
        print(f"[X] No se pudo conectar al servidor en {args.url}")
        print("   Asegúrate de que el servidor esté corriendo:")
        print("   uvicorn api.main:app --port 8000")
        sys.exit(1)
    print("[OK] Servidor conectado")
    
    # Acumular resultados
    all_results = {
        "solver_status": "optimal",
        "export_timestamp": None,
    }
    
    print("\n[*] Ejecutando LGP...")
    lgp = run_lgp(args.url)
    if lgp:
        all_results.update(extract_lgp_metrics(lgp))
        print("[OK] LGP completado")
    else:
        print("[X] LGP falló - abortando")
        sys.exit(1)
    
    print("\n[*] Ejecutando Epsilon-Constraint...")
    er = run_er(args.url, steps=args.er_steps)
    if er:
        all_results.update(extract_er_metrics(er))
        all_results.update(extract_payoff_table(er))
        print("[OK] ER completado")
    else:
        print("[!] ER falló - continuando con datos parciales")
    
    if not args.quick:
        print("\n[*] Ejecutando análisis de sensibilidad OAT (LGP)...")
        sens_lgp = run_sensitivity(args.url, DEFAULT_SENSITIVITY_PARAMS, DEFAULT_PERCENTAGES, "lgp")
        if sens_lgp:
            all_results.update(extract_oat_sensitivities(sens_lgp))
            all_results["oat_lgp_results"] = sens_lgp.get("results", [])
            print("[OK] OAT LGP completado")
        
        print("\n[*] Ejecutando análisis de sensibilidad OAT (ER)...")
        sens_er = run_sensitivity(args.url, DEFAULT_SENSITIVITY_PARAMS, DEFAULT_PERCENTAGES, "er")
        if sens_er:
            all_results["oat_er_results"] = sens_er.get("results", [])
            print("[OK] OAT ER completado")
        
        print("\n[*] Ejecutando análisis de rangos...")
        ranges = run_ranges(args.url)
        if ranges:
            all_results["ranges_table"] = extract_ranges(ranges)
            print("[OK] Rangos completado")
        
        print("\n[*] Ejecutando 12 escenarios...")
        for esc_id, esc_params in ESCENARIOS.items():
            print(f"   -> {esc_id}...", end=" ")
            esc_result = run_scenario(args.url, esc_params, "both")
            if esc_result:
                esc_result["esc_id"] = esc_id
                all_results.update(extract_scenario_results(esc_result))
                print("[OK]")
            else:
                print("[!]")
        print("[OK] Escenarios completados")
    
    # Guardar JSON
    output_path = Path(args.output)
    all_results["export_timestamp"] = str(Path().stat().st_mtime if hasattr(Path(), 'stat') else "")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\n[OK] Exportación completa: {output_path.absolute()}")
    print(f"   Total de campos exportados: {len(all_results)}")
    
    if not args.quick:
        print("\n[>] Próximo paso:")
        print(f"   cd redaccion/tools")
        print(f"   python update_results.py {output_path} --dry-run")


if __name__ == "__main__":
    main()
