# MANIFEST — Esquema Modular de Redacción

> Este archivo es el **índice maestro** del sistema de redacción.
> El agente (Cascade) lo lee al inicio de cada sesión para saber:
> qué secciones existen, su estado, sus dependencias, y qué requiere actualización.

---

## 1. Estado de Plantillas

### Estructura Formal de la Tesis (Flujo Orgánico)

| Capítulo | Plantilla | Contenido | Estado | Progreso |
|----------|-----------|-----------|--------|----------|
| 5. Formulación del Modelo | `obj2_fase2_formulacion.md` | Conjuntos, variables, FOs, restricciones, LGP | completada | 100% |
| 6. Implementación Computacional | `obj2_fase3_implementacion.md` | Python, Pyomo, ejecución LGP/ER | completada | 100% |
| 7. Análisis de Sensibilidad | `obj2_fase4_sensibilidad.md` | OAT, rangos, 12 escenarios, hallazgos | completada | 100% |
| 8. Evaluación Comparativa | `obj3_fase5_comparativo.md` | LGP vs ER, Efecto Deriva, conclusiones | completada | 100% |

**Estados posibles:** `vacía` → `borrador` → `revisión` → `completada`

### Mapeo: Diseño Metodológico → Estructura de Tesis por Objetivos

| Objetivo (Diseño Metodológico) | Estructura de Tesis | Plantilla(s) Asignada(s) |
|-------------------------------|---------------------|-------------------------|
| **Obj 1** — Establecer modelo a partir del caso de referencia | **Objetivo 1** (Antecedentes + Metodología + Resultados) | `paper_referencia.md` + `Diseno_Metodologico.md` (Fase 1) |
| **Obj 2 — Fase 2** (Formulación) | **Objetivo 2** — Antecedentes | `paper_referencia.md` + `notacion.md` |
| **Obj 2 — Fase 2** (Formulación) + **Fase 3** (Implementación) | **Objetivo 2** — Metodología | `obj2_fase2_formulacion.md` + `obj2_fase3_implementacion.md` |
| **Obj 2 — Fase 4** (Sensibilidad) | **Objetivo 2** — Resultados | `obj2_fase4_sensibilidad.md` |
| **Obj 3 — Fase 5** (Evaluación) | **Objetivo 3** (Antecedentes + Metodología + Resultados) | `obj3_fase5_comparativo.md` |

> **Nota:** La tesis se organiza por **objetivos específicos**, no por capítulos tradicionales. Cada objetivo tiene: Antecedentes → Metodología → Resultados. Las plantillas cubren la Metodología y Resultados de los Objetivos 2 y 3.

---

## 2. Base de Conocimiento

| Documento | Contenido | Estado |
|-----------|-----------|--------|
| `notacion.md` | Nomenclatura matemática del modelo (conjuntos, variables, parámetros) | pre-llenado |
| `Diseno_Metodologico.md` | Diseño metodológico oficial (3 objetivos, 5 fases, actividades) | completo |
| `paper_referencia.md` | Formulaciones del paper de Arenas & Salazar (2018) | completo |
| `borrador_referencia.md` | **Guía de distribución de contenidos** — Caps 1-4 + Tabla de contenido completa | referencia |
| `normativas.md` | Normativas y fuentes secundarias (UPME, DANE, referencias metodológicas) | parcial |
| `guia_estilo.md` | Normas de redacción académica, formato, citas | parcial |

**Estados posibles:** `pendiente` → `parcial` → `completo`

---

## 3. Mapa de Dependencias

Qué archivo del código afecta qué plantillas cuando cambia:

| Archivo Código | Plantillas Afectadas | Qué Actualizar |
|----------------|---------------------|----------------|
| `02-api-model/data/params.py` | obj2_fase2, obj2_fase3, obj2_fase4 | Valores paramétricos, tablas de parámetros, parámetros críticos |
| `02-api-model/solvers/build_model.py` | obj2_fase2, obj2_fase3 | Ecuaciones, restricciones, expresiones |
| `02-api-model/solvers/lgp.py` | obj2_fase3, obj2_fase4, obj3_fase5 | Resultados LGP, desviaciones, sensibilidad |
| `02-api-model/solvers/er.py` | obj2_fase3, obj2_fase4, obj3_fase5 | Resultados ER, frontera de Pareto, sensibilidad |
| `02-api-model/api/state.py` | obj2_fase3 | Estructura de datos API |

---

## 4. Reglas de Sincronización

1. **Cambio en `params.py`**: Verificar si valores en tablas de plantillas coinciden. Si no, proponer actualización.
2. **Cambio en `build_model.py`**: Verificar si ecuaciones/restricciones en plantillas coinciden. Si no, proponer actualización.
3. **Nuevos resultados del solver**: Si se ejecuta un escenario nuevo, proponer sección de resultados.
4. **Cambio en conocimiento/**: Si se actualiza un documento base, verificar coherencia con plantillas ya redactadas.

---

## 5. Convenciones de Placeholders

En las plantillas se usan estos marcadores:

| Marcador | Significado |
|----------|-------------|
| `{{PLACEHOLDER:descripción}}` | Contenido que el agente debe generar |
| `{{DATO:fuente}}` | Valor que viene directamente del código/datos |
| `{{REFERENCIA:clave}}` | Cita bibliográfica que debe insertarse |
| `{{TABLA:descripción}}` | Tabla que debe generarse desde datos |
| `{{VALIDAR:condición}}` | Punto que requiere verificación contra el código |

---

## 6. Historial de Cambios

| Fecha | Plantilla | Cambio |
|-------|-----------|--------|
| 2026-04-12 | — | Creación del esquema modular |
