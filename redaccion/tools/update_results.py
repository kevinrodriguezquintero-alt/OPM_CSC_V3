#!/usr/bin/env python3
"""
Script para actualizar placeholders en plantillas con resultados del solver.

USO:
    python update_results.py --help
    python update_results.py results.json --dry-run
    python update_results.py results.json --execute

PROTECCIONES:
    - Backup automático antes de modificar
    - Validación de que el solver convergió
    - Modo dry-run para revisar cambios sin aplicar
    - Log detallado de modificaciones

AUTOR: Cascade (AI Assistant)
FECHA: 2025-04-12
"""

import argparse
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

# Configuración
PLANTILLAS_DIR = Path("redaccion/plantillas")
BACKUP_DIR = Path("redaccion/backups")
LOG_FILE = Path("redaccion/tools/update_log.txt")

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


def validar_resultados(data: dict) -> bool:
    """Validar que el solver convergió y los datos son coherentes."""
    # Verificar estado del solver
    if data.get("solver_status") != "optimal":
        print("[X] ERROR: El solver no reportó estado óptimo.")
        print(f"   Estado reportado: {data.get('solver_status', 'desconocido')}")
        return False
    
    # Verificar que existen campos mínimos
    campos_requeridos = ["lgp_costo", "lgp_emisiones", "lgp_empleo"]
    faltantes = [c for c in campos_requeridos if c not in data]
    if faltantes:
        print(f"[X] ERROR: Faltan campos requeridos: {faltantes}")
        return False
    
    # Verificar coherencia numérica básica
    if data["lgp_costo"] <= 0:
        print("[X] ERROR: Valor de costo no positivo.")
        return False
    
    print("[OK] Validación exitosa: Resultados coherentes.")
    return True


def reemplazar_placeholders(contenido: str, datos: dict) -> tuple[str, list[str]]:
    """Reemplazar placeholders en el contenido. Retorna nuevo contenido y log de cambios."""
    cambios = []
    nuevo_contenido = contenido
    
    for campo_json, placeholder_template in MAPEO_PLACEHOLDERS.items():
        if campo_json in datos:
            valor = datos[campo_json]
            placeholder = f"{{{{DATO:{placeholder_template}}}}}"
            
            if placeholder in nuevo_contenido:
                nuevo_contenido = nuevo_contenido.replace(placeholder, str(valor))
                cambios.append(f"  {placeholder} → {valor}")
    
    return nuevo_contenido, cambios


def actualizar_plantillas(data: dict, dry_run: bool = True) -> list[str]:
    """Actualizar todas las plantillas. Retorna log de cambios."""
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
            print(f"\n[-] {plantilla_nombre}: Sin cambios (no se encontraron placeholders)")
    
    return log_general


def guardar_log(log: list[str], backup_dir: Path):
    """Guardar registro de cambios."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"\n{'='*60}\n")
        f.write(f"Actualización: {timestamp}\n")
        f.write(f"Backup en: {backup_dir}\n")
        f.write("\n".join(log))
        f.write("\n")


def main():
    parser = argparse.ArgumentParser(
        description="Actualiza plantillas con resultados del solver LGP/ER",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
EJEMPLOS:
    # Simular cambios sin aplicar
    python update_results.py results.json --dry-run
    
    # Ejecutar actualización con backup
    python update_results.py results.json --execute
    
    # Restaurar desde backup
    python update_results.py --restore redaccion/backups/backup_20250412_143022
        """
    )
    
    parser.add_argument('json_file', nargs='?', help='Archivo JSON con resultados del solver')
    parser.add_argument('--dry-run', action='store_true', 
                        help='Simular cambios sin modificar archivos')
    parser.add_argument('--execute', action='store_true',
                        help='APLICAR cambios (crea backup primero)')
    parser.add_argument('--restore', metavar='BACKUP_DIR',
                        help='Restaurar plantillas desde un backup')
    
    args = parser.parse_args()
    
    # Modo restore
    if args.restore:
        backup_path = Path(args.restore)
        if not backup_path.exists():
            print(f"[X] Backup no encontrado: {backup_path}")
            sys.exit(1)
        
        for plantilla in PLANTILLAS_AFECTADAS:
            src = backup_path / plantilla
            dst = PLANTILLAS_DIR / plantilla
            if src.exists():
                shutil.copy2(src, dst)
                print(f"[OK] Restaurado: {plantilla}")
        
        print(f"\n[OK] Restauración completa desde: {backup_path}")
        sys.exit(0)
    
    # Validar argumentos
    if not args.json_file:
        print("[X] Error: Debes especificar el archivo JSON con resultados.")
        parser.print_help()
        sys.exit(1)
    
    if not args.dry_run and not args.execute:
        print("[X] Error: Debes especificar --dry-run o --execute")
        print("   Usa --dry-run primero para revisar qué cambiaría.")
        sys.exit(1)
    
    # Cargar resultados
    json_path = Path(args.json_file)
    if not json_path.exists():
        print(f"[X] Archivo no encontrado: {json_path}")
        sys.exit(1)
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"[*] Cargados resultados desde: {json_path}")
    print(f"   Solver status: {data.get('solver_status', 'desconocido')}")
    
    # Validar
    if not validar_resultados(data):
        print("\n[X] Validación fallida. No se realizarán cambios.")
        print("   Revisa el solver y el archivo JSON.")
        sys.exit(1)
    
    # Modo dry-run
    if args.dry_run:
        print("\n[>] MODO SIMULACIÓN (--dry-run)")
        print("   Se mostrarían los siguientes cambios:\n")
        actualizar_plantillas(data, dry_run=True)
        print("\n" + "="*60)
        print("[OK] Simulación completa. No se modificó ningún archivo.")
        print("   Ejecuta con --execute para aplicar cambios.")
        sys.exit(0)
    
    # Modo execute
    if args.execute:
        print("\n[!]  MODO EJECUCIÓN (--execute)")
        print("   Se modificarán las plantillas.\n")
        
        confirm = input("¿Estás seguro? Escribe 'yes' para continuar: ")
        if confirm.lower() != 'yes':
            print("[X] Cancelado por el usuario.")
            sys.exit(0)
        
        # Crear backup
        backup_dir = crear_backup()
        
        # Aplicar cambios
        log = actualizar_plantillas(data, dry_run=False)
        
        # Guardar log
        guardar_log(log, backup_dir)
        
        print("\n" + "="*60)
        print(f"[OK] Actualización completa.")
        print(f"   Backup guardado en: {backup_dir}")
        print(f"   Log guardado en: {LOG_FILE}")
        print("\n   Si necesitas revertir:")
        print(f"   python update_results.py --restore {backup_dir}")


if __name__ == "__main__":
    main()
