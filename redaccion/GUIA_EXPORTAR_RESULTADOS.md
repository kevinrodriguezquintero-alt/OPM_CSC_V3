# Workflow: Actualizar Resultados en Plantillas

Guía paso a paso para exportar resultados de los modelos LGP/ER y poblar las plantillas de redacción.

**Nuevo flujo (recomendado):** Ejecutar desde interfaz web → consolidar archivos → actualizar plantillas.

---

## Pre-requisitos

- Servidor API corriendo en `localhost:8000`
- Entorno virtual activado
- Dependencias instaladas (`requests` incluido)

---

## Paso 1: Iniciar Servidor

```bash
# Terminal 1 - mantener corriendo
cd 02-api-model
venv\Scripts\activate  # Windows
uvicorn api.main:app --port 8000
```

Verificar: http://localhost:8000/health debe responder `{"status": "ok"}`

Interfaz web: http://localhost:3000

---

## Paso 2: Ejecutar Modelos desde Interfaz Web

Abre http://localhost:3000 en tu navegador.

**Ejecuta en este orden:**

### 2a. LGP (Lexicographic Goal Programming)
- Ve a la sección "Solver" o "LGP"
- Haz clic en "Ejecutar LGP"
- Espera resultados
- **Archivo generado:** `redaccion/resultados/lgp.json`

### 2b. ER (Epsilon-Constraint)
- Ve a la sección "ER" o "Pareto"
- Configura pasos (recomendado: 5)
- Haz clic en "Ejecutar ER"
- **Archivo generado:** `redaccion/resultados/er.json`

### 2c. OAT (One-At-A-Time Sensitivity)
- Ve a la sección "Sensibilidad" o "OAT"
- Selecciona parámetros a analizar
- Haz clic en "Ejecutar OAT"
- **Archivo generado:** `redaccion/resultados/oat.json`

### 2d. Rangos (Shadow Prices)
- Ve a la sección "Rangos"
- Haz clic en "Analizar Rangos"
- **Archivo generado:** `redaccion/resultados/rangos.json`

### 2e. Escenarios (opcional)
- Ve a la sección "Escenarios"
- Configura cada escenario
- Ejecuta uno por uno
- **Archivos generados:** `redaccion/resultados/escenarios/esc_*.json`

---

## Paso 3: Verificar Archivos Generados

```bash
cd redaccion

# Listar archivos de resultados
dir resultados\*.json /b  # Windows
ls resultados/*.json     # Linux/Mac

# Verificar contenido LGP
type resultados\lgp.json | findstr "costo"
```

Archivos esperados:
- `resultados/lgp.json` - Resultados LGP
- `resultados/er.json` - Resultados Epsilon-Constraint
- `resultados/oat.json` - Análisis de sensibilidad OAT
- `resultados/rangos.json` - Rangos y precios sombra
- `resultados/escenarios/*.json` - Escenarios individuales

---

## Paso 4: Consolidar Resultados

### 4a. Simular cambios (dry-run)
```bash
cd redaccion/tools
python consolidar_resultados.py --dry-run
```

Este script:
1. Lee todos los archivos JSON individuales
2. Consolida en `results_consolidado.json`
3. Muestra qué cambios aplicaría

### 4b. Aplicar cambios reales
```bash
python consolidar_resultados.py --execute
```

Escribe `yes` cuando lo solicite.

**Backup automático:** Se crea en `redaccion/backups/backup_YYYYMMDD_HHMMSS/`

---

## Paso 5: Verificar Plantillas

```bash
cd ../plantillas

# Buscar valor reemplazado (ejemplo)
findstr "1234567" obj2_fase3_implementacion.md  # Windows
grep "1234567" obj2_fase3_implementacion.md    # Linux/Mac
```

Los placeholders `{{DATO:xxx}}` deben haber sido reemplazados por valores.

---

## Comandos de Emergencia

### Restaurar desde backup
```bash
cd redaccion/tools
python update_results.py --restore ../backups/backup_20250412_143022
```

### Ver logs de cambios
```bash
cat redaccion/tools/update_log.txt
```

---

## Estructura de Archivos Relevantes

```
02-api-model/
├── api/routers/solve.py   # Endpoints de análisis (guardan automáticamente)
├── config.py              # Configuración de solvers (HiGHS optimizado)
└── ...

redaccion/
├── resultados/            # Archivos generados automáticamente desde web
│   ├── lgp.json
│   ├── er.json
│   ├── oat.json
│   ├── rangos.json
│   └── escenarios/
│       └── esc_*.json
├── results_consolidado.json  # Generado por consolidar_resultados.py
├── plantillas/
│   ├── obj2_fase2_formulacion.md
│   ├── obj2_fase3_implementacion.md
│   ├── obj2_fase4_sensibilidad.md
│   └── obj3_fase5_comparativo.md
├── backups/               # Auto-generado
└── tools/
    ├── consolidar_resultados.py  # Script principal para actualizar plantillas
    └── update_log.txt
```

---

## Cuándo usar cada análisis

| Análisis | Descripción | Tiempo estimado |
|----------|-------------|-----------------|
| **LGP** | Resultados principales para plantillas | ~1-3 min |
| **ER** | Frontera de Pareto (costo vs emisiones) | ~2-5 min |
| **OAT** | Sensibilidad One-At-A-Time | ~3-5 min |
| **Rangos** | Shadow prices y límites de parámetros | ~2-3 min |
| **Escenarios** | Análisis de escenarios individuales | ~1-2 min cada uno |

**Nota:** Puedes ejecutar solo los análisis que necesites. No es necesario correr todos.

---

## Solución de Problemas

### "No se pudo conectar al servidor"
```bash
# Verificar si está corriendo
curl http://localhost:8000/health
# Si falla, iniciar servidor (ver Paso 1)
```

### "LGP falló" o "ER falló"
```bash
# Verificar parámetros actuales
curl http://localhost:8000/params

# Restaurar valores por defecto si es necesario
curl -X POST http://localhost:8000/params/reset
```

### "Faltan campos en el JSON"
- Algunos análisis pueden fallar por infeasibilidad
- Revisar `results.json` manualmente
- Ver logs en consola durante exportación

### Placeholders no reemplazados
- Verificar que el nombre del placeholder coincide con el mapeo en `update_results.py`
- Revisar líneas del archivo `MAPEO_PLACEHOLDERS` en `update_results.py`

---

## Problemas Conocidos y Soluciones (Prueba 2025-04-12)

### 1. Error de codificación Unicode en Windows
**Síntoma:** `UnicodeEncodeError: 'charmap' codec can't encode character...`

**Causa:** Emojis (✅ ❌ ⚠️ 📊) no compatibles con consola Windows CP1252.

**Solución aplicada:** Reemplazados por notación ASCII:
- `[OK]` en lugar de ✅
- `[X]` en lugar de ❌
- `[!]` en lugar de ⚠️
- `[*]` en lugar de 📊
- `[F]` en lugar de 📝
- `[-]` en lugar de ⚪
- `[>]` en lugar de 🔍

### 2. ER (Epsilon-Constraint) timeout
**Síntoma:** `Read timed out. (read timeout=120)`

**Causa:** 5 pasos de Pareto frontier toman más de 120 segundos.

**Soluciones:**
- Usar `--quick` para omitir ER (solo LGP)
- Reducir pasos: `--er-steps 3`
- Aumentar timeout editando `export_results.py` (línea 83: `timeout=120` → `timeout=300`)

### 3. Rutas relativas en comandos
**Síntoma:** `can't open file ... No such file or directory`

**Causa:** Ejecutar comandos desde directorio incorrecto.

**Solución:** Siempre usar rutas absolutas o ejecutar desde raíz del proyecto:
```bash
cd c:\Users\kevin\OneDrive\Escritorio\V3
python 02-api-model/venv/Scripts/python.exe redaccion/tools/update_results.py redaccion/results.json --dry-run
```

### 4. Plantillas sin cambios detectados
**Síntoma:** `Sin cambios (no se encontraron placeholders)`

**Causa:** El placeholder en la plantilla no coincide con el nombre en `MAPEO_PLACEHOLDERS`.

**Ejemplo encontrado:**
- Plantilla espera: `{{DATO:resultado_individual_economico_α}}`
- JSON tiene: `min_cost_alpha` (falta mapeo o el placeholder usa formato diferente)

**Solución:** Verificar que `MAPEO_PLACEHOLDERS` en `update_results.py` incluya todas las claves necesarias.

---

## Notas

- **Backup automático:** Siempre se crea antes de modificar plantillas
- **Modo dry-run:** Úsalo siempre primero para revisar qué cambiaría
- **Idempotencia:** Puedes ejecutar el flujo múltiples veces; siempre reemplazará con los últimos valores
- **Persistencia automática:** Los resultados se guardan automáticamente al ejecutar desde la web
- **Flexibilidad:** Puedes ejecutar solo los análisis que necesites (LGP, ER, OAT, etc.)

---

### 5. ER (Epsilon-Constraint) muy lento o timeout
**Síntoma:** Cada solve toma 45-60+ segundos, ER completo tarda >6 minutos.

**Causa:** HiGHS busca optimalidad estricta (0.01% gap) sin límite de tiempo.

**Solución aplicada:** Configurar HiGHS en `config.py`:
```python
solver.options["mip_rel_gap"] = 0.01  # Aceptar 1% gap (vs 0.01% default)
solver.options["time_limit"] = 180    # Máx 180 seg por solve
solver.options["threads"] = 4         # Paralelismo
solver.options["output_flag"] = False  # Menos logging
```

**Resultado:** Tiempo esperado ahora ~2-3 minutos para ER completo.

---

### 6. Archivos no se generan automáticamente
**Síntoma:** No aparecen archivos en `redaccion/resultados/`.

**Causa:** La API no tiene permisos de escritura o el directorio no existe.

**Solución:** 
```bash
mkdir redaccion\resultados\escenarios  # Crear directorios manualmente
```

Verificar que el servidor tenga permisos de escritura en esa ruta.

---

*Última actualización: 2025-04-12*
*Flujo web implementado: 2025-04-12*
