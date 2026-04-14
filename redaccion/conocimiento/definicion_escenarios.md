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
  boom_demanda: { 
    DI: 20,    // +20% demanda intermediarios (dentro de rangos admisibles CRI)
    DD: 25,    // +25% demanda detallistas (dentro de rangos admisibles CR)
    CN: 15,    // +15% capacidad producción para satisfacer demanda
    CH: 15     // +15% capacidad despacho para satisfacer demanda
  },
  crecimiento: { 
    DI: 12,    // +12% demanda intermediarios
    DD: 15,    // +15% demanda detallistas  
    H: 30,     // +30% hectáreas (dentro de allowable_increase 100% según rangos.json)
    RA: -5     // -5% rendimiento por estrés de expansión agrícola
  },
  
  // Eje 2: Estrategia Corporativa (Expansión de capacidad)
  expansion: { 
    H: 50,      // +50% hectáreas (expansión agrícola significativa)
    CA: 25,     // +25% productividad acopio (automatización parcial)
    CB: 25,     // +25% productividad intermediarios
    CC: 25,     // +25% productividad detallistas
    CRI: 20,    // +20% capacidad recepción intermediarios
    CR: 20      // +20% capacidad recepción detallistas
  },
  
  // Eje 3: Sostenibilidad y Viabilidad Verde
  transicion_verde: { 
    IT: -25,    // -25% factor emisión (flota más limpia)
    CV: 30,     // +30% capacidad vehicular (camiones más grandes, menos viajes)
    CI: 12,     // +12% costo procesamiento (inversión en tecnología limpia)
    CT: 10,     // +10% costo transporte (combustible alternativo)
    CTT: 10     // +10% costo transporte secundario
  },
  regulacion_ambiental: { 
    IT: -15,    // -15% emisiones (cumplimiento normativo mínimo)
    P: -10,     // -10% daño (mejores prácticas de manejo)
    PP: -10,    // -10% daño secundario
    CI: 8,      // +8% costos de cumplimiento
    CDA: 5,     // +5% costos por nuevos estándares
    CDF: 5      // +5% costos por nuevos estándares
  },
  
  // Eje 4: Impacto Social y Automatización
  super_eficiencia: { 
    CA: 60,     // +60% productividad acopio (alta automatización)
    CB: 60,     // +60% productividad intermediarios
    CC: 60,     // +60% productividad detallistas
    CMO: -20,   // -20% costo mano de obra (menos personal)
    CD: -20,    // -20% costo mano de obra detallistas
    CMP: -20,   // -20% costo mano de obra acopio
    CP: 8       // +8% costo producción (inversión tecnológica)
  },
  fomento_laboral: { 
    CA: 80,     // +80% productividad (duplicar capacidad con mismo personal)
    CB: 80,     // +80% productividad intermediarios
    CC: 80,     // +80% productividad detallistas
    CMO: 40,    // +40% costo mano de obra (mejores salarios)
    CD: 40,     // +40% costo mano de obra detallistas
    CMP: 40     // +40% costo mano de obra acopio
  },
  
  // Eje 5: Vulnerabilidad y Límites
  crisis_climatica: { 
    H: -40,     // -40% hectáreas (pérdida de tierras productivas)
    RA: -25,    // -25% rendimiento por estrés climático
    RC: -20,    // -20% rendimiento máximo
    RD: -30,    // -30% rendimiento mínimo (suelos degradados)
    CP: 18,     // +18% costo producción (riego, control de plagas)
    P: 15,      // +15% daño (fruta más susceptible)
    PP: 10      // +10% daño secundario
  },
  huelga_transporte: { 
    CV: -35,    // -35% capacidad vehicular (flora reducida)
    CT: 45,     // +45% costo transporte (tarifas de contingencia)
    CTT: 45,    // +45% costo transporte secundario
    CRI: -10,   // -10% capacidad recepción (acumulación)
    CR: -10,    // -10% capacidad recepción detallistas
    IT: 20      // +20% emisiones (rutas subóptimas, más viajes)
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
| **Boom Demanda** | `boom_demanda` | DI +20%, DD +25%, CN/CH +15% | 1 |
| **Crecimiento** | `crecimiento` | DI +12%, DD +15%, H +30%, RA -5% | 1 |
| **Expansión** | `expansion` | H +50%, CA/CB/CC +25%, CRI/CR +20% | 2 |
| **Transición Verde** | `transicion_verde` | IT -25%, CV +30%, CI +12%, CT/CTT +10% | 3 |
| **Regulación Ambiental** | `regulacion_ambiental` | IT -15%, P/PP -10%, CI +8%, CDA/CDF +5% | 3 |
| **Súper Eficiencia Integral** | `super_eficiencia` | CA/CB/CC +60%, CMO/CD/CMP -20%, CP +8% | 4 |
| **Fomento Laboral Socioeconómico** | `fomento_laboral` | CA/CB/CC +80%, CMO/CD/CMP +40% | 4 |
| **Crisis Climática** | `crisis_climatica` | H -40%, RA -25%, RC -20%, RD -30%, CP +18%, P/PP +15/+10% | 5 |
| **Huelga Transporte** | `huelga_transporte` | CV -35%, CT/CTT +45%, CRI/CR -10%, IT +20% | 5 |

### Descripción Detallada por Escenario

#### Eje 1: Contexto Macroeconómico y Demanda

**Boom Demanda**
- **Variaciones**: `DI +20%`, `DD +25%`, `CN +15%`, `CH +15%`
- **Interpretación**: Escenario de alta presión de demanda que prueba los límites de capacidad de la cadena. Representa crecimiento sostenido del mercado citrícola. Se incluye expansión de capacidad productiva (CN, CH) para evaluar si la cadena puede responder sin violar restricciones.
- **Hipótesis**: Con inversión en capacidad productiva (+15%), el sistema puede satisfacer demanda creciente sin saturar intermediarios.
- **Indicadores Clave**: Saturación de CRI/CR, costos marginales, elasticidad del costo respecto a demanda.
- **Basado en rangos**: H permite +100% aumento (según `rangos.json`), dando margen para expansión agrícola si se requiere.

**Crecimiento**
- **Variaciones**: `DI +12%`, `DD +15%`, `H +30%`, `RA -5%`
- **Interpretación**: Expansión moderada aumentando hectáreas cultivables (+30%) mientras se enfrenta ligera disminución de rendimiento (-5%) por estrés de expansión agrícola. Diferente a "Expansión" porque aquí crece la oferta agrícola, no la productividad.
- **Hipótesis**: El aumento de hectáreas compensa el ligero descenso en rendimiento por unidad.
- **Indicadores Clave**: Volumen total producido, empleo generado en campo, factibilidad agrícola.
- **Basado en rangos**: H permite +100% aumento y -79.7% disminución (según `rangos.json`), validando el rango de ±30%.

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

| Fecha | Cambio | Justificación |
|-------|--------|---------------|
| 2026-04-13 | Reconstrucción completa de SCENARIO_PRESETS | Incorporar 27 parámetros disponibles, eliminar inconsistencias, basar magnitudes en rangos.json |
| 2026-04-13 | Boom Demanda: agregados CN, CH | Permitir evaluar respuesta de capacidad productiva ante demanda creciente |
| 2026-04-13 | Crecimiento: agregado H +30%, RA -5% | Diferenciar de Expansión (foco agrícola vs. productividad) |
| 2026-04-13 | Expansión: agregados CRI, CR | Completar expansión de capacidad en todos los eslabones |
| 2026-04-13 | Crisis Climática: agregados H, RD, P, PP | Completar impacto climático: tierras, rendimiento mínimo, daño post-cosecha |
| 2026-04-13 | Huelga Transporte: agregados CRI, CR, IT | Incluir efectos secundarios de acumulación y rutas subóptimas |
