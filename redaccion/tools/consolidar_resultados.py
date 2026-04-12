#!/usr/bin/env python3
"""
Consolida resultados de archivos individuales (LGP, ER, OAT, Rangos, Escenarios)
y genera JSON unificado para update_results.py.

USO:
    python consolidar_resultados.py --help
    python consolidar_resultados.py --dry-run
    python consolidar_resultados.py --execute

ARCHIVOS FUENTE (en redaccion/resultados/):
    - lgp.json           -> Resultados LGP
    - er.json            -> Resultados Epsilon-Constraint
    - oat.json           -> Análisis OAT de sensibilidad
    - rangos.json        -> Rangos y precios sombra
    - escenarios/*.json  -> Resultados de escenarios individuales

SALIDA:
    - redaccion/results_consolidado.json (para update_results.py)
"""

import argparse
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

# Configuración
RESULTADOS_DIR = Path("redaccion/resultados")
PLANTILLAS_DIR = Path("redaccion/plantillas")
BACKUP_DIR = Path("redaccion/backups")
LOG_FILE = Path("redaccion/tools/update_log.txt")
OUTPUT_JSON = Path("redaccion/results_consolidado.json")

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
}

PLANTILLAS_AFECTADAS = [
    "obj2_fase2_formulacion.md",
    "obj2_fase3_implementacion.md",
    "obj2_fase4_sensibilidad.md",
    "obj3_fase5_comparativo.md",
]


def cargar_lgp() -> dict:
    """Cargar resultados LGP."""
    ruta = RESULTADOS_DIR / "lgp.json"
    if not ruta.exists():
        print(f"[!]  No se encontró {ruta}")
        return {}
    
    with open(ruta, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    objs = data.get("objectives", {})
    return {
        "lgp_costo": objs.get("cost"),
        "lgp_emisiones": objs.get("emissions"),
        "lgp_empleo": objs.get("employment"),
        "lgp_d1_plus": 0,  # LGP no calcula desviaciones explícitamente
        "lgp_d2_plus": 0,
        "lgp_d3_minus": 0,
    }


def cargar_er() -> dict:
    """Cargar resultados ER (Epsilon-Constraint)."""
    ruta = RESULTADOS_DIR / "er.json"
    if not ruta.exists():
        print(f"[!]  No se encontró {ruta}")
        return {}
    
    with open(ruta, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Extraer punto medio de frontera de Pareto
    frontier = data.get("pareto_frontier", [])
    optimal = [p for p in frontier if p.get("status") == "optimal"]
    
    if not optimal:
        return {}
    
    mid = optimal[len(optimal) // 2]
    objs = mid.get("objectives", {})
    
    # Extraer payoff table
    pt = data.get("payoff_table", {})
    
    return {
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
    }


def cargar_oat() -> dict:
    """Cargar resultados OAT (One-At-A-Time sensitivity)."""
    ruta = RESULTADOS_DIR / "oat.json"
    if not ruta.exists():
        return {}
    
    with open(ruta, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    results = data.get("results", [])
    oat_data = {}
    
    for r in results:
        param = r.get("param", "")
        change = r.get("change", "")
        
        # Solo tomar +10% para simplificar
        if change == "+10.0%":
            oat_data[f"oat_sens_{param}_alpha"] = r.get("elas_cost")
            oat_data[f"oat_sens_{param}_gamma"] = r.get("elas_env")
            oat_data[f"oat_sens_{param}_beta"] = r.get("elas_soc")
    
    return oat_data


def cargar_rangos() -> list:
    """Cargar resultados de rangos (shadow prices)."""
    ruta = RESULTADOS_DIR / "rangos.json"
    if not ruta.exists():
        return []
    
    with open(ruta, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return data.get("ranges", [])


def cargar_escenarios() -> dict:
    """Cargar todos los escenarios del directorio escenarios/."""
    esc_dir = RESULTADOS_DIR / "escenarios"
    if not esc_dir.exists():
        return {}
    
    escenarios = {}
    for esc_file in sorted(esc_dir.glob("esc_*.json")):
        try:
            with open(esc_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Extraer número de escenario del nombre del archivo
            esc_id = esc_file.stem.replace("esc_", "")[:20]  # Limitar longitud
            
            lgp = data.get("lgp", {})
            er = data.get("er", {})
            
            lgp_base = lgp.get("base", {}) if isinstance(lgp, dict) else {}
            lgp_prop = lgp.get("propuesto", {}) if isinstance(lgp, dict) else {}
            er_base = er.get("base", {}) if isinstance(er, dict) else {}
            er_prop = er.get("propuesto", {}) if isinstance(er, dict) else {}
            
            escenarios.update({
                f"{esc_id}_lgp_a": lgp_base.get("cost"),
                f"{esc_id}_lgp_g": lgp_base.get("emissions"),
                f"{esc_id}_lgp_b": lgp_base.get("employment"),
                f"{esc_id}_lgp_a_prop": lgp_prop.get("cost") if lgp_prop else None,
                f"{esc_id}_lgp_g_prop": lgp_prop.get("emissions") if lgp_prop else None,
                f"{esc_id}_lgp_b_prop": lgp_prop.get("employment") if lgp_prop else None,
                f"{esc_id}_er_a": er_base.get("cost"),
                f"{esc_id}_er_g": er_base.get("emissions"),
                f"{esc_id}_er_b": er_base.get("employment"),
                f"{esc_id}_er_a_prop": er_prop.get("cost") if er_prop else None,
                f"{esc_id}_er_g_prop": er_prop.get("emissions") if er_prop else None,
                f"{esc_id}_er_b_prop": er_prop.get("employment") if er_prop else None,
                f"{esc_id}_factible": "Si" if (lgp_prop and er_prop) else "No",
            })
        except Exception as e:
            print(f"[!]  Error cargando {esc_file}: {e}")
    
    return escenarios


def consolidar_todos() -> dict:
    """Consolidar todos los resultados en un solo diccionario."""
    print("[*] Consolidando resultados...")
    
    resultado = {
        "solver_status": "optimal",
        "consolidado_timestamp": datetime.now().isoformat(),
    }
    
    # Cargar cada componente
    print("    -> LGP...")
    resultado.update(cargar_lgp())
    
    print("    -> ER...")
    resultado.update(cargar_er())
    
    print("    -> OAT...")
    resultado.update(cargar_oat())
    
    print("    -> Rangos...")
    rangos = cargar_rangos()
    if rangos:
        resultado["rangos_tabla"] = rangos
    
    print("    -> Escenarios...")
    escenarios = cargar_escenarios()
    resultado.update(escenarios)
    
    # Guardar JSON consolidado
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"[OK] Resultados consolidados en: {OUTPUT_JSON}")
    print(f"     Total campos: {len(resultado)}")
    
    return resultado


def crear_backup():
    """Crear backup de todas las plantillas antes de modificar."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_subdir = BACKUP_DIR / f"backup_{timestamp}"
    backup_subdir.mkdir(parents=True, exist_ok=True)
    
    for plantilla in PLANTILLAS_AFECTADAS:
        src = PLANTILLAS_DIR / plantilla
        if src.exists():
            shutil.copy2(src, backup_subdir / plantilla)
    
    print(f"[OK] Backup creado en: {backup_subdir}")
    return backup_subdir


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
            print("\n".join(cambios))
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
    # Consolidar y simular cambios
    python consolidar_resultados.py --dry-run
    
    # Consolidar y aplicar cambios
    python consolidar_resultados.py --execute
        """
    )
    parser.add_argument('--dry-run', action='store_true',
                        help='Simular cambios sin modificar archivos')
    parser.add_argument('--execute', action='store_true',
                        help='APLICAR cambios (crea backup primero)')
    
    args = parser.parse_args()
    
    if not args.dry_run and not args.execute:
        print("[X] Error: Debes especificar --dry-run o --execute")
        parser.print_help()
        sys.exit(1)
    
    # Consolidar resultados
    data = consolidar_todos()
    
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
        
        # Crear backup
        backup_dir = crear_backup()
        
        # Aplicar cambios
        log = actualizar_plantillas(data, dry_run=False)
        
        print("\n" + "="*60)
        print(f"[OK] Actualizacion completa.")
        print(f"    Backup guardado en: {backup_dir}")


if __name__ == "__main__":
    main()
