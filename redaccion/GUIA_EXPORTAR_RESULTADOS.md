# Workflow: Actualizar Resultados en Plantillas

Guía paso a paso para exportar resultados de los modelos LGP/ER y poblar las plantillas de redacción.

**Nuevo flujo (recomendado):** Ejecutar desde interfaz web → consolidar archivos → actualizar plantillas.

---

## Pre-requisitos

- Servidor API corriendo en `localhost:8000`
- Entorno virtual activado
- Dependencias instaladas (ver `02-api-model/requirements.txt`)

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

## Estado de Archivos (Actualización API)

**Última actualización: 2025-04-13**

| Archivo | Estado | Transporte Total | Notas |
|---------|--------|------------------|-------|
| `resultados/esc_base.json` | ✅ **Actualizado API** | $917.65 | Fórmula corregida (CT·Z·DPI) |
| `resultados/lgp.json` | ✅ **Actualizado API** | — | Fórmula corregida |
| `resultados/er.json` | ✅ **Actualizado API** | — | Fórmula corregida |
| `resultados/rangos.json` | ✅ **Actualizado API** | — | Shadow prices desde endpoint Rangos |
| `maestros/oat_lgp.json` | ✅ **Actualizado API** | — | Generado desde endpoint OAT |
| `maestros/oat_er.json` | ✅ **Actualizado API** | — | Generado desde endpoint OAT |

---

## Paso 2: Ejecutar Modelos desde Interfaz Web

Abre http://localhost:3000 en tu navegador.

**Ejecuta en este orden:**

### 2a. LGP (Lexicographic Goal Programming) — ✅ YA ACTUALIZADO
- ~~Ve a la sección "Solver" o "LGP"~~
- ~~Haz clic en "Ejecutar LGP"~~
- **Archivo:** `redaccion/resultados/lgp.json` — **Actualizado con fórmula corregida**

### 2b. ER (Epsilon-Constraint) — ✅ YA ACTUALIZADO
- ~~Ve a la sección "ER" o "Pareto"~~
- ~~Configura pasos (recomendado: 5)~~
- ~~Haz clic en "Ejecutar ER"~~
- **Archivo:** `redaccion/resultados/er.json` — **Actualizado con fórmula corregida**

### 2c. Escenario Base — ✅ YA ACTUALIZADO
- ~~Ve a la sección "Escenarios"~~
- ~~Ejecuta escenario base~~
- **Archivo:** `redaccion/resultados/esc_base.json` — **Actualizado con fórmula corregida**

### 2d. Rangos (Shadow Prices) — ⏳ PENDIENTE
- Ve a la sección "Rangos"
- Haz clic en "Analizar Rangos"
- **Archivo a generar:** `redaccion/resultados/rangos.json`

### 2e. OAT (One-At-A-Time Sensitivity) — ⏳ PENDIENTE
- Ve a la sección "Sensibilidad" o "OAT"
- Selecciona parámetros a analizar
- Haz clic en "Ejecutar OAT"
- **Archivos a generar:** `redaccion/resultados/oat_lgp.json`, `redaccion/resultados/oat_er.json`
- **Nota:** El guardado es **automático** — cada simulación se persiste en el archivo al completarse. Si se interrumpe el análisis, los resultados parciales quedan guardados y la próxima corrida solo ejecuta las simulaciones faltantes.
- **Nota:** Este análisis toma más tiempo (~3-5 min)

### 2f. Escenarios personalizados (opcional)
- Ve a la sección "Escenarios"
- Configura cada escenario
- Ejecuta uno por uno
- **Archivos generados:** `redaccion/resultados/esc_*.json` (raíz, no subdirectorio)

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
- `resultados/oat_lgp.json` - Análisis de sensibilidad OAT (LGP)
- `resultados/oat_er.json` - Análisis de sensibilidad OAT (ER)
- `resultados/rangos.json` - Rangos y precios sombra
- `resultados/esc_*.json` - Escenarios individuales (en raíz de resultados/)
- `resultados/backups/` - Backups automáticos con timestamp (máx. 3 por archivo)

---

## Paso 4: Consolidar Resultados

### 4a. Simular cambios (dry-run)
```bash
cd redaccion/tools
python consolidar_resultados.py --dry-run
```

Este script:
1. Lee todos los archivos JSON individuales de la carpeta `resultados/`.
2. Consolida la información en memoria.
3. Muestra qué cambios aplicaría a las plantillas `{{DATO:...}}`.

### 4b. Aplicar cambios reales
```bash
python consolidar_resultados.py --execute
```

Escribe `yes` cuando lo solicite.

### 4c. Seleccionar qué resultados consolidar (opcional)

Si solo quieres actualizar ciertos análisis:

```bash
# Solo actualizar LGP (ER, Rangos, etc. se preservan)
python consolidar_resultados.py --execute --lgp

# Solo actualizar ER (LGP, Rangos, etc. se preservan)
python consolidar_resultados.py --execute --er

# Solo actualizar OAT-LGP
python consolidar_resultados.py --execute --oat-lg

# Solo actualizar OAT-ER
python consolidar_resultados.py --execute --oat-er

# Actualizar OAT de ambos modelos
python consolidar_resultados.py --execute --oat

# Solo actualizar Rangos
python consolidar_resultados.py --execute --rangos

# Solo actualizar Escenarios
python consolidar_resultados.py --execute --escenarios

# Actualizar LGP y ER (Rangos, OAT, etc. se preservan)
python consolidar_resultados.py --execute --lgp --er

# Actualizar todo desde cero (reemplaza todos los maestros)
python consolidar_resultados.py --execute
```

**Comportamiento con Maestros Individuales:**
- Solo se actualizan los maestros que **seleccionas explícitamente**
- Los maestros **NO seleccionados se preservan** (no se borran)
- El consolidado `resultados_finales.json` se regenera combinando **todos** los maestros existentes
- Esto permite actualizar LGP sin perder ER, Rangos, OAT, etc.

**Ejemplo práctico:**
```bash
# 1. Primera vez: consolidar todo
python consolidar_resultados.py --execute
# → Crea maestros: lgp.json, er.json, rangos.json, oat_lgp.json, etc.

# 2. Más tarde: solo actualizar LGP con nuevos datos
python consolidar_resultados.py --execute --lgp
# → Actualiza solo maestro/lgp.json
# → Preserva: maestros/er.json, maestros/rangos.json, etc.
# → Regenera resultados_finales.json combinando todos
```

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

### Ver logs de cambios
```bash
cat redaccion/tools/update_log.txt
```

---

## Estructura de Archivos Relevantes

```
02-api-model/
├── api/routers/solve.py   # Endpoints de análisis (guardan automáticamente)
├── config.py              # Configuración de solvers
└── ...

redaccion/
├── resultados/            # Archivos individuales (se sobrescriben con cada ejecución)
│   ├── lgp.json           #    → Resultado LGP
│   ├── er.json            #    → Resultado ER
│   ├── oat_lgp.json       #    → OAT LGP (guardado automático incremental)
│   ├── oat_er.json        #    → OAT ER (guardado automático incremental)
│   ├── rangos.json        #    → Rangos y precios sombra
│   ├── esc_*.json         #    → Escenarios individuales (en raíz, no en subdirectorio)
│   └── backups/           #    → Backups automáticos con timestamp (máx. 3 por archivo)
│       └── *.bak
│
├── maestros/              # [PROTEGIDO] Archivos maestros individuales
│   ├── lgp.json           #    ← Maestro LGP (actualizable individualmente)
│   ├── er.json            #    ← Maestro ER (actualizable individualmente)
│   ├── oat_lgp.json       #    ← Maestro OAT-LGP (actualizable individualmente)
│   ├── rangos.json        #    ← Maestro Rangos (actualizable individualmente)
│   ├── esc_base.json      #    ← Maestro Escenario Base
│   ├── esc_boom_demanda.json  # ← Maestros de escenarios (uno por ID)
│   ├── esc_*.json         #    ← (10 escenarios en total)
│   └── resultados_finales.json  # ← Consolidado de TODOS los maestros (regenerado automáticamente)
│
├── plantillas/            # Documentos de la tesis
│   ├── obj2_fase2_formulacion.md
│   ├── obj2_fase3_implementacion.md
│   ├── obj2_fase4_sensibilidad.md
│   └── obj3_fase5_comparativo.md
│
└── tools/
    ├── consolidar_resultados.py  # Script principal
    └── update_log.txt
```

**Sistema de Maestros Individuales:**
- Cada tipo de resultado tiene su **propio archivo maestro** independiente
- Los maestros se **actualizan individualmente** según lo que selecciones
- Los maestros **NO seleccionados se preservan** (no se borran)
- El archivo `resultados_finales.json` es un **consolidado regenerado** de todos los maestros existentes
- Para consultar/analizar un resultado específico, usa su maestro individual (ej: `maestros/lgp.json`)
- Para análisis global, usa `maestros/resultados_finales.json`

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
- Revisar los logs detallados en `redaccion/tools/update_log.txt`
- Ver logs en consola durante exportación

### Placeholders no reemplazados
- Verificar que el nombre del placeholder coincide con el mapeo en `consolidar_resultados.py`
- Revisar el diccionario `MAPEO_PLACEHOLDERS` en `consolidar_resultados.py`

---

## Notas

- **Modo dry-run:** Úsalo siempre primero para revisar qué cambiaría
- **Idempotencia:** Puedes ejecutar el flujo múltiples veces; siempre reemplazará con los últimos valores
- **Persistencia automática:** Los resultados se guardan automáticamente al ejecutar desde la web
- **Flexibilidad:** Puedes ejecutar solo los análisis que necesites (LGP, ER, OAT, etc.)

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

*Última actualización: 2026-04-15*
*Flujo web implementado: 2026-04-12*
*Sistema de maestros individuales: 2026-04-13*
*Corrección fórmula transporte (CT·Z·DPI): 2026-04-13*
*Persistencia incremental OAT + backups automáticos Rangos/Escenarios: 2026-04-15*
