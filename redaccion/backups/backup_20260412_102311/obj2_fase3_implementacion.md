# 6. Implementación Computacional

> **Dependencias**: `conocimiento/notacion.md`, `conocimiento/normativas.md`, `02-api-model/data/params.py`, `02-api-model/solvers/build_model.py`, `02-api-model/solvers/lgp.py`, `02-api-model/solvers/er.py`

Este capítulo describe la implementación computacional del modelo matemático utilizando Python y la biblioteca Pyomo. Se detalla la estructura de datos, la programación de los modelos LGP y ER, y el proceso de ejecución para obtener resultados comparables.

## 6.1 Definición de Estructuras de Datos

Los datos del caso de estudio se estructuran en base a los valores utilizados en el modelo de referencia de Arenas Ruiz y Salazar Aguirre (2018), adaptados para la implementación computacional en Python. El conjunto de datos abarca 66 variantes de productores individuales, 7 intermediarios y 4 detallistas en la región de Andalucía, Valle del Cauca.

> **⚠️ NOTA IMPORTANTE SOBRE LOS DATOS**: No se tuvo acceso a la base de datos completa utilizada en el paper original. Junto al código AMPL disponible se encontró una porción parcial de los datos. Los **parámetros faltantes fueron completados mediante revisión de literatura** (UPME, DANE, Santos et al., FAO) y estimaciones razonables basadas en el contexto del Valle del Cauca. Por esta razón, **los resultados numéricos de esta implementación no son directamente comparables con los reportados por Arenas & Salazar (2018)** ($32.496.116,50; 524,8 kg CO₂/semana; 179 personas/semana), aunque la estructura del modelo y las formulaciones matemáticas sí son consistentes.

### Datos del caso de estudio

El conjunto de datos parte de los valores utilizados en el modelo de referencia de Arenas Ruiz y Salazar Aguirre (2018), que abarca:

- **Capacidades de producción y despacho** por eslabón de la cadena (productores, intermediarios y detallistas).
- **Demandas semanales** de intermediarios y detallistas, expresadas en toneladas de fruta.
- **Rendimientos por productor y hectárea**, que determinan la oferta disponible en origen.
- **Costos unitarios** de producción, procesamiento, mano de obra y transporte entre nodos.
- **Distancias entre nodos** en kilómetros, utilizadas para el cálculo de costos de transporte y emisiones asociadas.
- **Porcentajes de merma del producto** presentes en los flujos directos e inversos de la cadena.
- **Factor de impacto ambiental IT_j** por tipo de combustible utilizado en el transporte.

### Estructura de datos en Python

Los datos se estructuraron en **diccionarios y matrices indexadas** por los conjuntos I, J, K y U, lo que permite su referenciación directa y sistemática en la programación de las funciones objetivo y restricciones del modelo.

{{TABLA: Resumen de parámetros con sus valores actuales. Fuente: params.py}}

### Construcción de parámetros de transporte y emisiones

{{PLACEHOLDER: Descripción de cómo se construyeron los parámetros de transporte, capacidad vehicular y factor de emisión a partir de fuentes secundarias}}

**Fuentes utilizadas**:

| Parámetro | Fuente | Referencia |
|-----------|--------|-----------|
| Capacidad vehicular | Santos et al. (2019) | {{REFERENCIA:santos2019}} |
| Rango capacidad | DANE (2013) | {{REFERENCIA:dane2013}} |
| Factor emisión | UPME (FECOC) | {{REFERENCIA:upme}} |
| Combustible base | {{PLACEHOLDER}} | {{REFERENCIA:combustible}} |

---

## 6.2 Programación del Modelo en Python

La implementación computacional se desarrolla en Python utilizando la biblioteca Pyomo para el modelado de programación matemática. Esta elección permite mayor flexibilidad y reproducibilidad en comparación con la implementación original del paper (AMPL + GUROBI en plataforma NEOS), facilitando la experimentación con diferentes métodos de optimización multiobjetivo.

### Modelo LGP (Propuesto)

#### Construcción de la Tabla de Pagos

La construcción de la tabla de pagos requiere resolver tres subproblemas de optimización individual, uno por cada función objetivo, manteniendo todas las restricciones operativas (4)-(24) pero optimizando solo una función a la vez. Los resultados de estos subproblemas establecen los niveles de aspiración (g₁, g₂, g₃) para el LGP.

- **Subproblema económico**: minimiza el costo total de la cadena de suministro.
- **Subproblema ambiental**: minimiza las emisiones totales de CO₂.
- **Subproblema social**: maximiza el nivel de empleo generado.

#### Resolución Secuencial LGP

El método LGP resuelve secuencialmente tres subproblemas anidados. El óptimo del nivel n se convierte en restricción para el nivel n+1 mediante variables de desviación (d⁻, d⁺). Esta estructura garantiza que las soluciones posteriores no degraden los objetivos de mayor prioridad ya optimizados.

1. **LGP-1 (prioridad económica)**: minimiza la desviación positiva d₁⁺ respecto a g₁ = α*.
2. **LGP-2 (prioridad ambiental)**: minimiza d₂⁺ respecto a g₂ = γ*, incorporando d₁⁺ ≤ d₁⁺*.
3. **LGP-3 (prioridad social)**: minimiza d₃⁻ respecto a g₃ = β*, incorporando d₁⁺ ≤ d₁⁺* y d₂⁺ ≤ d₂⁺*.

### Modelo ER (Referencia Migrado)

El modelo de ε-restricción (ER) del paper de Arenas & Salazar (2018) fue originalmente implementado en AMPL con solver GUROBI. El paper incluye las formulaciones completas de los tres pilares (económico, ambiental, social), pero el código fuente AMPL al que se tuvo acceso solo implementaba el pilar económico (costos). Esta versión migra el modelo ER completo a Python + Pyomo, incluyendo los tres pilares de sostenibilidad tal como están formulados en el paper.

---

## 6.3 Ejecución y Resultados

### Primera Etapa: Construcción de la Tabla de Pagos

La primera etapa consiste en resolver individualmente cada función objetivo (económica, ambiental, social) para construir la tabla de pagos. Esta tabla muestra los valores de las tres funciones objetivo cuando se optimiza cada una individualmente, permitiendo identificar rangos de compromiso entre objetivos.

*Tabla X. Tabla de pagos del modelo multiobjetivo.*

| | α (Costo) | γ (Emisiones) | β (Empleo) |
|---------|-----------|---------------|-----------|
| Min α | {{DATO:resultado_individual_economico_α}} | {{DATO:resultado_individual_economico_γ}} | {{DATO:resultado_individual_economico_β}} |
| Min γ | {{DATO:resultado_individual_ambiental_α}} | {{DATO:resultado_individual_ambiental_γ}} | {{DATO:resultado_individual_ambiental_β}} |
| Max β | {{DATO:resultado_individual_social_α}} | {{DATO:resultado_individual_social_γ}} | {{DATO:resultado_individual_social_β}} |

Nota. Elaboración propia.

### Segunda Etapa: Resolución del Modelo LGP y ER

La segunda etapa ejecuta en paralelo el modelo LGP (propuesto) y el modelo ER (referencia migrado), utilizando los mismos datos de entrada y niveles de aspiración. Esto permite una comparación directa de resultados bajo condiciones idénticas.

#### Resultados del modelo LGP

| Métrica | Valor |
|---------|-------|
| Costo total (α) | {{DATO:lgp_costo}} |
| Emisiones (γ) | {{DATO:lgp_emisiones}} |
| Empleo (β) | {{DATO:lgp_empleo}} |
| d₁⁺ (desviación costo) | {{DATO:lgp_d1_plus}} |
| d₂⁺ (desviación emisiones) | {{DATO:lgp_d2_plus}} |
| d₃⁻ (desviación empleo) | {{DATO:lgp_d3_minus}} |

#### Resultados del modelo ER

| Métrica | Valor |
|---------|-------|
| Costo total (α) | {{DATO:er_costo}} |
| Emisiones (γ) | {{DATO:er_emisiones}} |
| Empleo (β) | {{DATO:er_empleo}} |

Además de los valores de las funciones objetivo, los resultados incluyen las variables de decisión operativas: flujos de producto (X_{ij}, Y_{jk}), número de viajes (Z_{ij}, ZZ_{jk}), personal contratado (S, SS_j, SSS_k), hectáreas activadas (W_i), y productores seleccionados (B_u).
