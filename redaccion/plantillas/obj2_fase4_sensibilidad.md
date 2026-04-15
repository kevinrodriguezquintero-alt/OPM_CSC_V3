# 7. Análisis de Sensibilidad

> **Dependencias**: `conocimiento/notacion.md`, `conocimiento/Diseno_Metodologico.md`, `02-api-model/data/params.py`, `02-api-model/solvers/lgp.py`, `02-api-model/solvers/er.py`

Este capítulo evalúa la robustez del modelo ante variaciones en parámetros críticos, identificando los factores de mayor impacto en las decisiones operativas y los trade-offs entre las dimensiones de sostenibilidad.

## 7.1 Parámetros Dominantes

El análisis de sensibilidad evalúa la robustez del modelo ante variaciones en los parámetros críticos, identificando cuáles tienen mayor impacto en las funciones objetivo y en las decisiones operativas. Esta actividad permite comprender el comportamiento del sistema bajo diferentes contextos y detectar cuellos de botella estructurales.

Se aplicó el método OAT (*One-At-a-Time*), variando cada parámetro de forma individual en el rango ±20% (en intervalos de ±5%, ±10%, ±15%, ±20%), manteniendo los demás constantes. Para cada parámetro se reporta la **elasticidad media absoluta** (promedio del valor absoluto de la elasticidad sobre todas las variaciones del rango) respecto a cada función objetivo, y se clasifica su nivel de sensibilidad como **Alta** (|ε̄| ≥ 1,0), **Media** (0,5 ≤ |ε̄| < 1,0) o **Baja** (|ε̄| < 0,5). El análisis se ejecutó independientemente para el modelo LGP y el modelo ER.

Los parámetros críticos se seleccionan según tres criterios: (1) elasticidad respecto a las funciones objetivo, (2) impacto en la factibilidad del modelo, y (3) proximidad a límites operativos identificados en el análisis de rangos.

### Análisis OAT — Modelo LGP

*Tabla X. Sensibilidad OAT bajo LGP: elasticidad media absoluta (rango ±20%).*

| Categoría | Parámetro | ε̄_α | Clase α | ε̄_γ | Clase γ | ε̄_β | Clase β |
|-----------|-----------|------|---------|------|---------|------|---------|
| Demanda | $DI_j$ | 0.952 | Media | 1.365 | Alta | 0.956 | Media |
| Demanda | $DD_k$ | 0.036 | Baja | 0.036 | Baja | 0.026 | Baja |
| Productividad | $CA$ | 0.175 | Baja | 0.91 | Media | 0.32 | Baja |
| Productividad | $CB_j$ | 1.305 | Alta | 0.565 | Media | 1.77 | Alta |
| Capacidad vehicular | $CV_j$ | 0.004 | Baja | 1.382 | Alta | 0.005 | Baja |
| Rendimiento | $RC_i$ | 0.0 | Baja | 0.002 | Baja | 0.0 | Baja |
| Rendimiento | $RA_u$ | 0.0 | Baja | 0.0 | Baja | 0.0 | Baja |
| Ambiental | $IT_j$ | 0.0 | Baja | 1.0 | Alta | 0.0 | Baja |
| Transporte | $CT_{ij}$ | 0.0 | Baja | 0.0 | Baja | 0.0 | Baja |
| Transporte | $CTT_{jk}$ | 0.0 | Baja | 0.005 | Baja | 0.0 | Baja |
| Costo producción | $CP_i$ | 0.073 | Baja | 0.006 | Baja | 0.0 | Baja |
| Costo procesamiento | $CI_j$ | 0.02 | Baja | 0.0 | Baja | 0.0 | Baja |

*Nota.* ε̄ = elasticidad media absoluta sobre el rango ±20%. Elaboración propia.

---

### Análisis OAT — Modelo ER

*Tabla X. Sensibilidad OAT bajo ER (punto sostenible, Iteración 78): elasticidad media absoluta (rango ±20%).*

| Categoría | Parámetro | ε̄_α | Clase α | ε̄_γ | Clase γ | ε̄_β | Clase β |
|-----------|-----------|------|---------|------|---------|------|---------|
| Demanda | $DI_j$ | 0.946 | Media | 0.843 | Media | 0.914 | Media |
| Demanda | $DD_k$ | 0.049 | Baja | 0.035 | Baja | 0.045 | Baja |
| Productividad | $CA$ | 0.184 | Baja | 0.078 | Baja | 0.315 | Baja |
| Productividad | $CB_j$ | {{DATO:oat_er_sens_CB_alpha}} | — | {{DATO:oat_er_sens_CB_gamma}} | — | {{DATO:oat_er_sens_CB_beta}} | — |
| Capacidad vehicular | $CV_j$ | 0.059 | Baja | 0.88 | Media | 0.031 | Baja |
| Rendimiento | $RC_i$ | 0.0 | Baja | 0.0 | Baja | 0.0 | Baja |
| Rendimiento | $RA_u$ | 0.0 | Baja | 0.0 | Baja | 0.0 | Baja |
| Ambiental | $IT_j$ | 0.065 | Baja | 0.412 | Baja | 0.033 | Baja |
| Transporte | $CT_{ij}$ | 0.0 | Baja | 0.0 | Baja | 0.0 | Baja |
| Transporte | $CTT_{jk}$ | 0.0 | Baja | 0.0 | Baja | 0.0 | Baja |
| Costo producción | $CP_i$ | 0.073 | Baja | 0.0 | Baja | 0.0 | Baja |
| Costo procesamiento | $CI_j$ | 0.019 | Baja | 0.0 | Baja | 0.0 | Baja |

*Nota.* ε̄ = elasticidad media absoluta sobre el rango ±20%. Referencia: Iteración 78 (knee point) de la frontera de Pareto, ε = 1.088,25 kg CO₂. Elaboración propia.

---

## 7.2 Análisis de Escenarios

Se modificarán sistemáticamente los valores de los parámetros seleccionados, generando escenarios alternativos, con el propósito de observar los efectos en las variables de decisión y en el cumplimiento de los objetivos de sostenibilidad.

### Análisis de Rangos de Factibilidad

{{PLACEHOLDER: Descripción del análisis de rangos — límites máximos admisibles de variación antes de infactibilidad}}

*Tabla X. Rangos admisibles de variación por parámetro.*

| Parámetro | Rango Inferior | Rango Superior | Precio Sombra | Unidad |
|-----------|---------------|---------------|---------------|--------|
| {{DATO:param}} | {{DATO:rango_inf}} | {{DATO:rango_sup}} | {{DATO:precio_sombra}} | {{PLACEHOLDER}} |
| ... | ... | ... | ... | ... |

Nota. Elaboración propia.

### Escenarios de Estrés Estratégicos

Los escenarios combinan múltiples parámetros críticos identificados en OAT, dentro de los límites admisibles determinados por el análisis de Rangos, agrupados por contextos operativos realistas.

#### Eje 1: Contexto Macroeconómico y Demanda

| Escenario | Variaciones | Interpretación Operativa |
|-----------|------------|-------------------------|
| **Boom Demanda** | DI +14,5%, DD +35% | Escenario de alta presión de demanda que prueba los límites de capacidad de la cadena. Representa un crecimiento sostenido del mercado citrícola. |
| **Crecimiento** | DI +15%, CA/CB -10% | Expansión moderada con ligera disminución de productividad laboral. |
| **Restricción Operativa** | CA/CB/CN -20% | Contracción de capacidad operativa por factores externos (escasez de mano de obra o infraestructura). |
| **Adversas** | DI/DD -15% | Caída en la demanda del mercado por factores estacionales o económicos. |

#### Eje 2: Estrategia Corporativa

| Escenario | Variaciones | Interpretación Operativa |
|-----------|------------|-------------------------|
| **Expansión** | DI +14%, CA/CB +20% | Crecimiento empresarial con mejora en productividad y capacidad. |

#### Eje 3: Sostenibilidad y Viabilidad Verde

| Escenario | Variaciones | Interpretación Operativa |
|-----------|------------|-------------------------|
| **Transición Verde** | CI/CT +15%, IT -30%, CV +25% | Inversión en tecnología limpia que reduce emisiones pero aumenta costos operativos. |
| **Regulación Ambiental** | DI +10%, IT +20%, CV +20% | Escenario de cumplimiento normativo con vehículos más eficientes pero demanda creciente. |

#### Eje 4: Impacto Social y Automatización

| Escenario | Variaciones | Interpretación Operativa |
|-----------|------------|-------------------------|
| **Súper Eficiencia** | CA/CB +50%, CP +10% | Automatización extrema que duplica la productividad laboral pero reduce generación de empleo. |
| **Fomento Laboral** | CA/CB +100% | Política de empleo que duplica la intensidad laboral, sacrificando eficiencia por inclusión social. |

#### Eje 5: Vulnerabilidad y Límites

| Escenario | Variaciones | Interpretación Operativa |
|-----------|------------|-------------------------|
| **Crisis Climática** | RC -35%, RA -40%, CP +20% | Evento climático extremo que reduce rendimientos agrícolas y aumenta costos de producción. |
| **Huelga Transporte** | CV -40%, CT/CTT +50% | Disrupción logística que reduce capacidad vehicular y aumenta costos de transporte. |
| **Crítica** | DI +25%, DD +30%, RC -15%, CV -10% | Escenario perfecto de tormenta: alta demanda con reducción simultánea de oferta y capacidad logística. |

---

## 7.3 Hallazgos Clave

En esta actividad, los resultados serán organizados mediante gráficos de sensibilidad y tablas comparativas para validar la consistencia del modelo.

### Resultados Comparativos LGP vs ER

*Tabla X. Resultados de los 9 escenarios para LGP y ER.*

| # | Escenario | LGP α | LGP γ | LGP β | ER α | ER γ | ER β | Factible |
|---|-----------|-------|-------|-------|------|------|------|----------|
| 1 | Boom Demanda | 126377407.96215127 | 1220.60924 | 1415.0 | 126835796.57196534 | 1088.24672 | 1418.0 | Si |
| 2 | Crecimiento | 126377407.96215127 | 1220.60924 | 1415.0 | 126835796.57196534 | 1088.24672 | 1418.0 | Si |
| 3 | Expansión | 126377407.96215127 | 1220.60924 | 1415.0 | 126835796.57196534 | 1088.24672 | 1418.0 | Si |
| 4 | Transición Verde | 126377407.96215127 | 1220.60924 | 1415.0 | 126835796.57196534 | 1088.24672 | 1418.0 | Si |
| 5 | Regulación Ambiental | 126377407.96215127 | 1220.60924 | 1415.0 | 126835796.57196534 | 1088.24672 | 1418.0 | Si |
| 6 | Súper Eficiencia | 126377407.96215127 | 1220.60924 | 1415.0 | 126835796.57196534 | 1088.24672 | 1418.0 | Si |
| 7 | Fomento Laboral | 126377407.96215127 | 1220.60924 | 1415.0 | 126835796.57196534 | 1088.24672 | 1418.0 | Si |
| 8 | Crisis Climática | 126377407.96215127 | 1220.60924 | 1415.0 | 126835796.57196534 | 1088.24672 | 1418.0 | Si |
| 9 | Huelga Transporte | 126377407.96215127 | 1220.60924 | 1415.0 | 126835796.57196534 | 1088.24672 | 1418.0 | Si |

Nota. Elaboración propia.

### Análisis de Escenarios Clave

#### Boom de Demanda — El "Efecto Deriva"

{{PLACEHOLDER: Análisis detallado de cómo LGP y ER divergen bajo presión de demanda extrema}}

#### Transición Verde — Sostenibilidad Autofinanciada

{{PLACEHOLDER: Análisis de cómo la consolidación de carga absorbe los sobrecostos de tecnología verde}}

#### Crisis Climática — El Límite Físico

{{PLACEHOLDER: Análisis de infactibilidad y la naturaleza "biótica" de la cadena}}

#### Súper Eficiencia — El Dilema de la Automatización

{{PLACEHOLDER: Análisis del "Costo del Objetivo Social" y la pérdida de empleos}}

#### Huelga de Transporte — Resiliencia Sistémica

{{PLACEHOLDER: Análisis de robustez financiera vs. fragilidad ambiental}}

### Trade-offs entre Pilares de Sostenibilidad

*Tabla X. Trade-offs cuantificados por escenario.*

| Escenario | Trade-off | Decisión Gerencial Implicada |
|-----------|----------|------------------------------|
| Transición Verde | Inversión +15% en infraestructura vs. -30% emisiones | {{PLACEHOLDER}} |
| Fomento Laboral | +100% intensidad laboral vs. eficiencia reducida | {{PLACEHOLDER}} |
| Súper Eficiencia | Costos menores vs. pérdida de empleos | {{PLACEHOLDER}} |
| Huelga Transporte | Costos controlados vs. emisiones descontroladas | {{PLACEHOLDER}} |

Nota. Elaboración propia.

### Identificación de Cuellos de Botella

{{PLACEHOLDER: Análisis de parámetros críticos, sinergias negativas y puntos de quiebre}}

| Tipo de Hallazgo | Descripción | Ejemplo |
|-----------------|-------------|---------|
| Parámetro crítico | {{PLACEHOLDER}} | {{PLACEHOLDER}} |
| Sinergia negativa | {{PLACEHOLDER}} | {{PLACEHOLDER}} |
| Punto de quiebre | {{PLACEHOLDER}} | {{PLACEHOLDER}} |
