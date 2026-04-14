# Definición de Escenarios de Análisis

> **Ubicación**: `redaccion/conocimiento/definicion_escenarios.md`  
> **Dependencias**: `conocimiento/notacion.md`, `conocimiento/Diseno_Metodologico.md`, `03-web-model/js/app.js` (SCENARIO_PRESETS), `02-api-model/data/params.py`  
> **Plantillas vinculadas**: `obj2_fase4_sensibilidad.md`, `obj3_fase5_comparativo.md`

## Propósito

Este documento establece el marco formal para la definición, clasificación y construcción de escenarios de análisis de sensibilidad estratégica. Los escenarios permiten evaluar la robustez del modelo ante perturbaciones realistas en parámetros críticos, comparando el desempeño de LGP vs ER bajo diferentes contextos operativos.

## Estructura de Clasificación

Los escenarios se organizan en **5 ejes temáticos** que cubren los contextos operativos relevantes para la cadena de suministro de cítricos:

| Eje | Contexto | Objetivo de Análisis |
|-----|----------|---------------------|
| 1 | Macroeconómico y Demanda | Evaluar respuesta ante fluctuaciones de mercado |
| 2 | Estrategia Corporativa | Medir capacidad de expansión y crecimiento |
| 3 | Sostenibilidad y Viabilidad Verde | Cuantificar trade-offs ambientales |
| 4 | Impacto Social y Automatización | Analizar dilema eficiencia vs. empleo |
| 5 | Vulnerabilidad y Límites | Identificar puntos de quiebre del sistema |

## Escenarios Actuales (Implementados)

### Implementación en Código

**Archivo**: `@/03-web-model/js/app.js:643-662`

```javascript
const SCENARIO_PRESETS = {
  // Eje 1: Contexto Macroeconómico y Demanda
  // Rangos clave: DI (+34.4%), DD (+38.3%), CV (+/-variable)
  // CV+25%: flota más grande compensa emisiones del aumento de demanda → factible LGP+ER
  boom_demanda: {
    DI: 9,     // +9% demanda intermediarios — ajustado por restricción entera cap_perI/cap_perJ
    DD: 9,     // +9% demanda detallistas   — +8% causaba infactibilidad MIP (ver historial)
    CV: 25     // +25% capacidad vehicular  — reduce viajes en j=5 (4→3) y j=6 (6→5); mantiene emisiones < ε
  },
  crecimiento: {
    DI: 12,    // +12% demanda intermediarios
    DD: 15,    // +15% demanda detallistas
    H: 25,     // +25% hectáreas — ajustado desde +30% (ver historial)
    RA: -5     // -5% rendimiento por estrés de expansión agrícola
  },

  // Eje 2: Estrategia Corporativa (Expansión de capacidad)
  expansion: {
    H: 50,     // +50% hectáreas (expansión agrícola significativa)
    CA: 25,    // +25% productividad acopio (automatización parcial)
    CB: 25,    // +25% productividad intermediarios
    CC: 25,    // +25% productividad detallistas
    CRI: 15,   // +15% capacidad recepción intermediarios — ajustado desde +20%
    CR: 15     // +15% capacidad recepción detallistas     — ajustado desde +20%
  },

  // Eje 3: Sostenibilidad y Viabilidad Verde
  transicion_verde: {
    IT: -25,   // -25% factor emisión (flota más limpia)
    CV: 30,    // +30% capacidad vehicular (camiones más grandes, menos viajes)
    CI: 12,    // +12% costo procesamiento (inversión en tecnología limpia)
    CT: 10,    // +10% costo transporte (combustible alternativo)
    CTT: 10    // +10% costo transporte secundario
  },
  regulacion_ambiental: {
    IT: -15,   // -15% emisiones (cumplimiento normativo mínimo)
    P: -10,    // -10% daño (mejores prácticas de manejo)
    PP: -10,   // -10% daño secundario
    CI: 8,     // +8% costos de cumplimiento
    CDA: 5,    // +5% costos por nuevos estándares
    CDF: 5     // +5% costos por nuevos estándares
  },

  // Eje 4: Impacto Social y Automatización
  // NOTA: LGP-only. Automatización extrema altera estructura logística → emisiones > ε fijo
  super_eficiencia: {
    CA: 60,    // +60% productividad acopio (alta automatización)
    CB: 60,    // +60% productividad intermediarios
    CC: 60,    // +60% productividad detallistas
    CMO: -20,  // -20% costo mano de obra (menos personal)
    CD: -20,   // -20% costo mano de obra detallistas
    CMP: -20,  // -20% costo mano de obra acopio
    CP: 8      // +8% costo producción (inversión tecnológica)
  },
  // NOTA: LGP-only. Trade-off social extremo empuja emisiones > ε fijo
  fomento_laboral: {
    CA: 70,    // +70% productividad — ajustado desde +80% (ver historial)
    CB: 70,    // +70% productividad intermediarios
    CC: 70,    // +70% productividad detallistas
    CMO: 40,   // +40% costo mano de obra (mejores salarios)
    CD: 40,    // +40% costo mano de obra detallistas
    CMP: 40    // +40% costo mano de obra acopio
  },

  // Eje 5: Vulnerabilidad y Límites
  crisis_climatica: {
    H: -35,    // -35% hectáreas — ajustado desde -40% (ver historial)
    RA: -25,   // -25% rendimiento por estrés climático
    RC: -15,   // -15% rendimiento máximo — ajustado desde -20%
    RD: -25,   // -25% rendimiento mínimo — ajustado desde -30%
    CP: 15,    // +15% costo producción  — ajustado desde +18%
    P: 12,     // +12% daño (fruta más susceptible) — ajustado desde +15%
    PP: 8      // +8% daño secundario — ajustado desde +10%
  },
  // NOTA: LGP-only. Disrupción logística aumenta emisiones > ε fijo
  huelga_transporte: {
    CV: -30,   // -30% capacidad vehicular — ajustado desde -35%
    CT: 30,    // +30% costo transporte   — ajustado desde +45%
    CTT: 30,   // +30% costo transporte secundario — ajustado desde +45%
    CRI: -5,   // -5% capacidad recepción — ajustado desde -10%
    CR: -5,    // -5% capacidad recepción detallistas — ajustado desde -10%
    IT: 10     // +10% emisiones — ajustado desde +20%
  },

  // Escenarios adicionales pendientes de implementar
  // restriccion_operativa: { CA: -20, CB: -20, CC: -20, CN: -15, CH: -15 },
  // adversas: { DI: -20, DD: -25, H: -25 },
  // critica: { DI: 25, H: -25, CV: -15, RA: -20, CP: 25 }
};
```

### Mapeo UI ↔ Código

| Nombre UI | Clave JS | Parámetros Modificados | Eje |
|-----------|----------|----------------------|-----|
| **Condiciones Base** | `base` | Ninguno (comparación LGP vs ER base) | — |
| **Boom Demanda** | `boom_demanda` | DI +9%, DD +9%, CV +25% | 1 |
| **Crecimiento** | `crecimiento` | DI +12%, DD +15%, H +25%, RA -5% | 1 |
| **Expansión** | `expansion` | H +50%, CA/CB/CC +25%, CRI/CR +15% | 2 |
| **Transición Verde** | `transicion_verde` | IT -25%, CV +30%, CI +12%, CT/CTT +10% | 3 |
| **Regulación Ambiental** | `regulacion_ambiental` | IT -15%, P/PP -10%, CI +8%, CDA/CDF +5% | 3 |
| **Súper Eficiencia Integral** | `super_eficiencia` | CA/CB/CC +60%, CMO/CD/CMP -20%, CP +8% | 4 |
| **Fomento Laboral Socioeconómico** | `fomento_laboral` | CA/CB/CC +70%, CMO/CD/CMP +40% | 4 |
| **Crisis Climática** | `crisis_climatica` | H -35%, RA -25%, RC -15%, RD -25%, CP +15%, P +12%, PP +8% | 5 |
| **Huelga Transporte** | `huelga_transporte` | CV -30%, CT/CTT +30%, CRI/CR -5%, IT +10% | 5 |

### Descripción Detallada por Escenario

#### Eje 1: Contexto Macroeconómico y Demanda

**Boom Demanda**
- **Variaciones**: `DI +9%`, `DD +9%`, `CV +25%`
- **Interpretación**: Escenario de presión moderada-alta de demanda combinado con mejora de flota logística. El aumento de demanda (+9%) se compensa con vehículos de mayor capacidad (+25%), reduciendo el número de viajes necesarios y manteniendo las emisiones totales por debajo del ε fijo. Único escenario de demanda creciente factible tanto en LGP como en ER.
- **Hipótesis**: La mejora de flota (CV +25%) reduce viajes en los nodos más intensivos (j=5: 4→3 viajes, j=6: 6→5 viajes), compensando el aumento de emisiones por mayor demanda. Emisiones resultantes (1016.79 kg CO₂) permanecen por debajo de ε=1088.25.
- **Indicadores Clave**: Número de viajes Z/ZZ, emisiones totales vs ε, costos marginales de demanda, LGP=ER (epsilon no activo).
- **Resultado observado**: LGP y ER convergen a solución idéntica (costo: $138.11M, emisiones: 1016.79 kg CO₂, empleo: 1545) — el ε no es restrictivo porque CV+25% reduce emisiones a 1016.79 < 1088.25.
- **Nota técnica (aritmética entera)**: El valor +9% fue seleccionado por factibilidad del MIP entero. Los valores +8% o inferiores generan infactibilidad por restricciones de aritmética entera (`cap_perI`: X_total = S·CA, `cap_perJ`: X[j] = SS[j]·CB[j]): el mínimo X_total factible no es múltiplo de CA=40 para esos valores. Versiones con CN/CH en lugar de CV resultaron infactibles con Gurobi ("infeasible; 44 simplex iterations; 1 branching node").
- **Nota técnica (bug utils.py)**: El preset anterior {DI:9, DD:9, CN:15, CH:15} mostraba LGP `propuesto: null` debido a un bug en `_solve()`: el bloque try/except tenía un fallback que propagaba RuntimeError al solver. Corregido 2026-04-14 eliminando el fallback innecesario (`capture_log=False` ahora llama directamente `solver.solve(model, tee=False)`).

**Crecimiento**
- **Variaciones**: `DI +12%`, `DD +15%`, `H +25%`, `RA -5%`
- **Interpretación**: Expansión moderada aumentando hectáreas cultivables (+25%) mientras se enfrenta ligera disminución de rendimiento (-5%) por estrés de expansión agrícola. Diferente a "Expansión" porque aquí crece la oferta agrícola, no la productividad.
- **Hipótesis**: El aumento de hectáreas compensa el ligero descenso en rendimiento por unidad.
- **Indicadores Clave**: Volumen total producido, empleo generado en campo, factibilidad agrícola.
- **Basado en rangos**: H permite +100% aumento y -79.7% disminución (según `rangos.json`), validando el rango de ±25%.
- **Nota**: Escenario LGP-only documentado. H +25% aumenta emisiones por encima de ε fijo (1088.25 kg CO₂), haciendo ER infactible. Esto es intencional: mide el costo del compromiso ambiental inflexible ante expansión agrícola.

#### Eje 2: Estrategia Corporativa

**Expansión**
- **Variaciones**: `H +50%`, `CA/CB/CC +25%`, `CRI/CR +20%`
- **Interpretación**: Crecimiento empresarial estructural: expansión agrícola significativa (H +50%), mejora en productividad laboral (+25%), e incremento en capacidades de recepción (+20%). Inversión integral en tecnología, capacitación e infraestructura.
- **Hipótesis**: La cadena puede escalar eficientemente con inversión coordinada en todos los eslabones.
- **Indicadores Clave**: Economías de escala, costo unitario, eficiencia por kg procesado, aprovechamiento de capacidad instalada.
- **Basado en rangos**: H permite hasta +100% aumento (según `rangos.json`), validando el escenario.

#### Eje 3: Sostenibilidad y Viabilidad Verde

**Transición Verde**
- **Variaciones**: `IT -25%`, `CV +30%`, `CI +12%`, `CT/CTT +10%`
- **Interpretación**: Inversión en tecnología limpia: flota de vehículos más eficiente (-25% emisiones, +30% capacidad por vehículo), procesamiento verde (+12% costo), combustibles alternativos (+10% costo transporte). Menos viajes por mayor capacidad vehicular.
- **Hipótesis**: El sobrecosto operativo es compensado por reducción de emisiones y consolidación de carga (menos viajes).
- **Indicadores Clave**: Emisiones totales, costo por tonelada, número de viajes, brecha LGP vs ER en dimensión ambiental.
- **Parámetros críticos**: IT y CV son los drivers ambientales principales.

**Regulación Ambiental**
- **Variaciones**: `IT -15%`, `P/PP -10%`, `CI +8%`, `CDA/CDF +5%`
- **Interpretación**: Cumplimiento normativo ambiental: reducción de emisiones (-15%), mejores prácticas de manejo (-10% daño), pero con costos de cumplimiento (+8% procesamiento, +5% estándares de calidad).
- **Hipótesis**: La regulación impulsa innovación sin comprometer la viabilidad económica significativamente.
- **Indicadores Clave**: Costo de cumplimiento, reducción de desperdicio (P, PP), elasticidad costo-emisión.
- **Diferencia con Transición Verde**: Aquí el foco es cumplimiento normativo (reducción de daño), no tecnología de transporte.

#### Eje 4: Impacto Social y Automatización

**Súper Eficiencia Integral**
- **Variaciones**: `CA/CB/CC +60%`, `CMO/CD/CMP -20%`, `CP +8%`
- **Interpretación**: Automatización avanzada: productividad laboral aumenta 60% (menos personal necesario), costos de mano de obra caen 20%, pero requiere inversión en tecnología productiva (+8% CP). Trade-off eficiencia vs. empleo.
- **Hipótesis**: El "Costo del Objetivo Social" (pérdida de empleos) es cuantificable y LGP priorizará preservar empleo.
- **Indicadores Clave**: Empleo total generado (β), costo total (α), productividad por persona, diferencia LGP vs ER en dimensión social.
- **Trade-off central**: Eficiencia económica vs. generación de empleo.

**Fomento Laboral Socioeconómico**
- **Variaciones**: `CA/CB/CC +80%`, `CMO/CD/CMP +40%`
- **Interpretación**: Política de inclusión laboral: se mantiene alta intensidad de personal (productividad +80% con mismo personal = más personal por unidad), salarios mejorados (+40% costos laborales). Eficiencia sacrificada por objetivo social.
- **Hipótesis**: LGP priorizará empleo sobre costo; ER minimizará costos sacrificando empleo (demostrando "Efecto Deriva").
- **Indicadores Clave**: Diferencia LGP vs ER en empleo (β), "Efecto Deriva" de costo (cuánto aumenta α en LGP vs ER para preservar β).
- **Diferencia con Súper Eficiencia**: Aquí aumentan costos laborales para mantener empleo; allí se reducen costos con menos personal.

#### Eje 5: Vulnerabilidad y Límites

**Crisis Climática**
- **Variaciones**: `H -40%`, `RA -25%`, `RC -20%`, `RD -30%`, `CP +18%`, `P +15%`, `PP +10%`
- **Interpretación**: Evento climático extremo: pérdida de hectáreas productivas (-40%), reducción de rendimientos (-25% RA, -20% RC, -30% RD), aumento de costos de producción (+18% por riego/control de plagas), y mayor daño post-cosecha (+15% P, +10% PP) por fruta más susceptible.
- **Hipótesis**: El sistema puede adaptarse a choque de oferta severo mediante redistribución de flujos y activación de variantes de productor más resilientes.
- **Indicadores Clave**: Factibilidad (¿el modelo sigue teniendo solución?), redistribución de flujos X_ij, costos marginales, quiebre de oferta vs. demanda.
- **Basado en rangos**: H permite -79.7% disminución (según `rangos.json`), validando el rango de -40%.

**Huelga Transporte**
- **Variaciones**: `CV -35%`, `CT/CTT +45%`, `CRI/CR -10%`, `IT +20%`
- **Interpretación**: Disrupción logística: capacidad vehicular reducida (-35%), tarifas de contingencia (+45%), capacidades de recepción afectadas (-10% por acumulación), y rutas subóptimas aumentando emisiones (+20% IT por más viajes).
- **Hipótesis**: La cadena es resilientemente financiera (absorbe costos) pero ambientalmente frágil (más viajes = más emisiones).
- **Indicadores Clave**: Número de viajes totales, emisiones por kg transportado, costo de contingencia, brecha entre LGP (prioriza empleo) vs ER (prioriza costo).
- **Trade-off**: Más viajes con vehículos pequeños mantienen el flujo pero aumentan emisiones y costos.

## Guía para Crear Nuevos Escenarios

### Principios de Diseño

1. **Coherencia temática**: Todo escenario debe pertenecer a un eje claro.
2. **Variaciones realistas**: Los porcentajes deben reflejar rangos históricamente observables.
3. **No redundancia**: Evitar escenarios que sean combinaciones triviales de otros.
4. **Medibilidad**: Debe existir al menos un indicador claro de éxito/fracaso.

### Parámetros Modificables

```python
# Lista de 27 parámetros disponibles para escenarios (SENSITIVITY_PARAMS en app.js)
PARAMS_ESCENARIO = [
    # Demanda (2)
    "DI",   # Demanda intermediarios j (Kg/día)
    "DD",   # Demanda detallistas k (Kg/día)
    
    # Costos operativos (11)
    "CP",   # Costo producción productor i ($/Kg)
    "CI",   # Costo procesamiento intermediario j ($/Kg)
    "CT",   # Costo transporte productor→intermediario ($/km/viaje)
    "CTT",  # Costo transporte intermediario→detallista ($/km/viaje)
    "CDA",  # Costo por daño productor→intermediario ($/Kg)
    "CDF",  # Costo por daño intermediario→detallista ($/Kg)
    "CMO",  # Costo mano de obra intermediario j ($/semana)
    "CD",   # Costo mano de obra detallista k ($)
    "CMP",  # Costo mano de obra centro de acopio ($/semana)
    
    # Ambiental (3)
    "IT",   # Factor emisión CO₂ por vehículo j (Kg CO₂/Km)
    "P",    # Porcentaje daño productor→intermediario (%)
    "PP",   # Porcentaje daño intermediario→detallista (%)
    
    # Productividad laboral (3)
    "CA",   # Capacidad productiva centro de acopio (Kg/persona)
    "CB",   # Capacidad productiva intermediario j (Kg/persona)
    "CC",   # Capacidad productiva detallista k (Kg/persona)
    
    # Capacidad física (6)
    "CN",   # Capacidad producción productor i (Kg/día)
    "CH",   # Capacidad despacho productor i (Kg/día)
    "CRI",  # Capacidad recepción intermediario j (Kg/día)
    "CR",   # Capacidad recepción detallista k (Kg/día)
    "CV",   # Capacidad vehicular intermediario j (Kg/viaje)
    
    # Rendimiento agrícola (4)
    "RB",   # Rendimiento máximo cultivo base (Kg/Ha/semana)
    "RA",   # Rendimiento por variante de productor u (Kg/Ha/semana)
    "RC",   # Rendimiento máximo cultivo base por productor i (Kg/Ha/semana)
    "RD",   # Rendimiento mínimo cultivo base por productor i (Kg/Ha/semana)
    
    # Recursos (1)
    "H",    # Hectáreas por variante de productor u (Ha)
]
```

### Proceso de Creación

1. **Definir hipótesis**: ¿Qué se quiere probar? ¿Qué trade-off se explora?
2. **Seleccionar parámetros**: ¿Qué variables se ven afectadas por este contexto?
3. **Justificar magnitudes**: ¿Por qué esos porcentajes? Referenciar literatura o datos históricos.
4. **Implementar en código**: Agregar entrada a `SCENARIO_PRESETS` en `app.js`.
5. **Documentar en plantilla**: Actualizar tabla de escenarios en `obj2_fase4_sensibilidad.md`.
6. **Ejecutar y validar**: Verificar factibilidad y coherencia de resultados.

### Plantilla para Nuevo Escenario

```javascript
// En app.js, dentro de SCENARIO_PRESETS
nombre_escenario: {
    // Parámetro: variación_porcentual
    PARAM1: XX,   // Justificación: {{REFERENCIA:fuente}}
    PARAM2: YY,   // Justificación: {{REFERENCIA:fuente}}
},
```

En plantilla markdown:

```markdown
| **Nombre Escenario** | PARAM1 ±XX%, PARAM2 ±YY% | {{PLACEHOLDER: Interpretación operativa}} |
```

## Integración con Objetivos de la Tesis

### Objetivo 3: Comparación LGP vs ER

Los escenarios alimentan directamente la **Actividad 3.1** (Comparación de Resultados) del Objetivo 3. Para cada escenario se debe documentar:

- {{DATO:escenario_lgp_alpha}} vs {{DATO:escenario_er_alpha}}
- {{DATO:escenario_lgp_gamma}} vs {{DATO:escenario_er_gamma}}
- {{DATO:escenario_lgp_beta}} vs {{DATO:escenario_er_beta}}
- {{PLACEHOLDER:Método preferido y justificación}}

### Fase 4: Análisis de Sensibilidad

Los escenarios son la **Actividad 4.3** (Análisis de Escenarios). Cada escenario se ejecuta como una simulación multivariable que perturba simultáneamente múltiples parámetros dentro de los rangos admisibles determinados por el análisis de rangos (Actividad 4.2).

## Referencias y Fuentes de Variaciones

- **Demanda ±15-35%**: Variaciones estacionales citrícolas en Colombia ({{REFERENCIA:DANE}})
- **Productividad ±50-100%**: Rangos de automatización reportados en Santos et al. (2019)
- **Emisiones -30%**: Meta de reducción sector transporte UPME ({{REFERENCIA:UPME}})
- **Crisis climática -35%**: Impacto Fenómeno El Niño en rendimientos agrícolas ({{REFERENCIA:FEDEARROZ}})
- **Huelga transporte +50%**: Incremento histórico costos logística durante paros ({{REFERENCIA:CCS}})

## Pendientes y Mejoras

- [ ] {{VALIDAR:Implementar escenarios adicionales en SCENARIO_PRESETS: restriccion_operativa, adversas, critica}}
- [ ] {{VALIDAR:Actualizar UI dropdown en index.html con nuevos parámetros de escenarios}}
- [ ] {{PLACEHOLDER:Revisar magnitudes de variaciones con análisis de rangos completo (actualmente solo H tiene rangos calculados)}}
- [ ] {{PLACEHOLDER:Agregar escenarios de "Recuperación Post-Crisis" con variaciones positivas tras eventos adversos}}
- [ ] {{PLACEHOLDER:Documentar resultados de validación de cada escenario en maestros/esc_*.json}}

## Notas de Sincronización

- **Código fuente**: `@/03-web-model/js/app.js:265-271` (SENSITIVITY_PARAMS) y `app.js:643-700` (SCENARIO_PRESETS) — mantener sincronizado con esta definición.
- **UI Dropdown**: `@/03-web-model/index.html` — orden debe coincidir con ejes temáticos y opciones deben reflejar escenarios actualizados.
- **Resultados**: Los archivos `redaccion/maestros/esc_*.json` deben seguir la nomenclatura de claves JS (`boom_demanda`, `transicion_verde`, etc.).
- **Análisis de rangos**: `@/redaccion/maestros/rangos.json` — actualizar con nuevos parámetros críticos para validar magnitudes de escenarios.

## Historial de Cambios de Escenarios

| Fecha | Escenario | Cambio | Justificación |
|-------|-----------|--------|---------------|
| 2026-04-13 | Todos | Reconstrucción completa de SCENARIO_PRESETS | Incorporar 27 parámetros disponibles, eliminar inconsistencias, basar magnitudes en rangos.json |
| 2026-04-13 | boom_demanda | Agregados CN, CH | Permitir evaluar respuesta de capacidad productiva ante demanda creciente |
| 2026-04-13 | crecimiento | Agregado H +30%, RA -5% | Diferenciar de Expansión (foco agrícola vs. productividad) |
| 2026-04-13 | expansion | Agregados CRI, CR | Completar expansión de capacidad en todos los eslabones |
| 2026-04-13 | crisis_climatica | Agregados H, RD, P, PP | Completar impacto climático: tierras, rendimiento mínimo, daño post-cosecha |
| 2026-04-13 | huelga_transporte | Agregados CRI, CR, IT | Incluir efectos secundarios de acumulación y rutas subóptimas |
| 2026-04-14 | boom_demanda | DI+DD: 20%/25% → 8%/8% | Primera reducción para evitar infactibilidad estructural (demanda > capacidad) |
| 2026-04-14 | crecimiento | H: +30% → +25% | Reducción para factibilidad LGP bajo restricciones de producción |
| 2026-04-14 | expansion | CRI/CR: +20% → +15% | Ajuste conservador para garantizar factibilidad LGP+ER |
| 2026-04-14 | fomento_laboral | CA/CB/CC: +80% → +70% | Reducción para factibilidad LGP; ER sigue infactible (trade-off social, documentado) |
| 2026-04-14 | crisis_climatica | H:-40%→-35%, RC:-20%→-15%, RD:-30%→-25%, CP:+18→+15, P:+15→+12, PP:+10→+8 | Valores moderados que garantizan factibilidad LGP+ER |
| 2026-04-14 | huelga_transporte | CV:-35→-30, CT/CTT:+45→+30, CRI/CR:-10→-5, IT:+20→+10 | Reducción para factibilidad LGP; ER infactible por disrupción logística (documentado) |
| 2026-04-14 | boom_demanda | DI+DD: 8% → 9% | Diagnóstico de infactibilidad por aritmética entera: DI+8% genera X_total_min≡21(mod 40) y el ajuste requerido (459 kg extra a j=5) viola restricciones en cadena. DI+9% requiere solo +23 kg (delta=1 a j=3), aritméticamente trivial para el solver. |
| 2026-04-14 | boom_demanda | CN/CH +15% → CV +25% | Rediseño: CN/CH generaban infactibilidad Gurobi ("44 simplex iterations; 1 branching node"). CV+25% reduce viajes j=5 (4→3) y j=6 (6→5); emisiones resultantes 1016.79 < ε=1088.25 → factible LGP+ER. Además corregido bug en utils.py: `_solve()` propagaba RuntimeError en LGP (ER no usaba `_solve`, por eso ER funcionaba). |
