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

# Configuración (rutas relativas desde redaccion/tools/)
RESULTADOS_DIR = Path("../resultados")        # Archivos temporales individuales (cambian con cada ejecución)
PLANTILLAS_DIR = Path("../plantillas")
LOG_FILE = Path("update_log.txt")

# Archivos MAESTROS individuales (actualizables independientemente)
MAESTROS_DIR = Path("../maestros")
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
    
    objs = data.get("objectives", {})
    lgp_data = {
        # Placeholders para plantillas
        "lgp_costo": objs.get("cost"),
        "lgp_emisiones": objs.get("emissions"),
        "lgp_empleo": objs.get("employment"),
        "lgp_d1_plus": 0,
        "lgp_d2_plus": 0,
        "lgp_d3_minus": 0,
        # Datos completos para consulta/análisis
        "lgp_completo": data,  # TODO el JSON de LGP
    }
    return lgp_data


def cargar_er() -> dict:
    """Cargar resultados ER (Epsilon-Constraint) completos del punto medio."""
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
        # Datos completos del punto medio para consulta/análisis
        "er_punto_medio_completo": mid,  # TODO: objectives + variables (X, Y, Z, ZZ, etc.)
        "er_frontera_completa": data.get("pareto_frontier", []),  # Toda la frontera por si se necesita
        "er_payoff_table": pt,  # Payoff table completa
    }


def _cargar_oat_file(filename: str, prefix: str) -> dict:
    """Cargar un archivo OAT específico con prefijo dado."""
    ruta = RESULTADOS_DIR / filename
    if not ruta.exists():
        return {}
    
    with open(ruta, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    results = data.get("results", [])
    oat_data = {}
    
    # 1. Extraer elasticidades para placeholders (solo +10%)
    for r in results:
        param = r.get("param", "")
        change = r.get("change", "")
        
        if change == "+10.0%":
            oat_data[f"oat_{prefix}_sens_{param}_alpha"] = r.get("elas_cost")
            oat_data[f"oat_{prefix}_sens_{param}_gamma"] = r.get("elas_env")
            oat_data[f"oat_{prefix}_sens_{param}_beta"] = r.get("elas_soc")
    
    # 2. Guardar datos completos de OAT para consulta/análisis
    oat_data[f"oat_{prefix}_tabla_completa"] = results  # Todos los parámetros, todos los %
    oat_data[f"oat_{prefix}_base_objectives"] = data.get("base_objectives", {})
    
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
            
            # Extraer ID del escenario del nombre del archivo
            esc_id = esc_file.stem.replace("esc_", "")[:20]
            
            # El JSON tiene: method, base, propuesto
            base = data.get("base", {})
            propuesto = data.get("propuesto", {})
            
            # Placeholders para plantillas
            escenarios.update({
                f"{esc_id}_lgp_a": base.get("cost"),
                f"{esc_id}_lgp_g": base.get("emissions"),
                f"{esc_id}_lgp_b": base.get("employment"),
                f"{esc_id}_lgp_a_prop": propuesto.get("cost") if propuesto else None,
                f"{esc_id}_lgp_g_prop": propuesto.get("emissions") if propuesto else None,
                f"{esc_id}_lgp_b_prop": propuesto.get("employment") if propuesto else None,
                f"{esc_id}_factible": "Si" if propuesto else "No",
            })
            
            # Guardar JSON completo del escenario para consulta/análisis
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
                         incluir_rangos=True, incluir_escenarios=True) -> dict:
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
        datos_er = cargar_er()
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
        esc_dir = RESULTADOS_DIR / "escenarios"
        if esc_dir.exists():
            for esc_file in sorted(esc_dir.glob("esc_*.json")):
                esc_id = esc_file.stem  # esc_base, esc_mejorado, etc.
                try:
                    with open(esc_file, 'r', encoding='utf-8') as f:
                        datos_esc = json.load(f)
                    
                    # Extraer datos base y propuesto
                    base = datos_esc.get("base", {})
                    propuesto = datos_esc.get("propuesto", {})
                    
                    # Datos para maestro individual
                    esc_data = {
                        f"{esc_id}_lgp_a": base.get("cost"),
                        f"{esc_id}_lgp_g": base.get("emissions"),
                        f"{esc_id}_lgp_b": base.get("employment"),
                        f"{esc_id}_lgp_a_prop": propuesto.get("cost") if propuesto else None,
                        f"{esc_id}_lgp_g_prop": propuesto.get("emissions") if propuesto else None,
                        f"{esc_id}_lgp_b_prop": propuesto.get("employment") if propuesto else None,
                        f"{esc_id}_factible": "Si" if propuesto else "No",
                        f"{esc_id}_completo": datos_esc,  # Todo el JSON
                    }
                    
                    # Guardar maestro individual
                    ruta_maestro = MAESTROS_DIR / f"{esc_id}.json"
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
    
    # Maestros de escenarios individuales (patrón esc_*.json)
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
    
    # Solo escenarios
    python consolidar_resultados.py --execute --escenarios
    
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
    parser.add_argument('--escenarios', action='store_true', help='Incluir resultados de escenarios')
    
    args = parser.parse_args()
    
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
        incluir_escenarios=args.escenarios
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
