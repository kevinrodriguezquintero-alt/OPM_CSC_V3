# 7. Análisis de Sensibilidad

> **Dependencias**: `conocimiento/notacion.md`, `conocimiento/Diseno_Metodologico.md`, `02-api-model/data/params.py`, `02-api-model/solvers/lgp.py`, `02-api-model/solvers/er.py`

Este capítulo evalúa la robustez del modelo ante variaciones en parámetros críticos, identificando los factores de mayor impacto en las decisiones operativas y los trade-offs entre las dimensiones de sostenibilidad.

## 7.1 Parámetros Dominantes

El análisis de sensibilidad evalúa la robustez del modelo ante variaciones en los parámetros críticos, identificando cuáles tienen mayor impacto en las funciones objetivo y en las decisiones operativas. Esta actividad permite comprender el comportamiento del sistema bajo diferentes escenarios y detectar cuellos de botella.

Se identificarán los parámetros que resultan determinantes en el comportamiento del modelo por su influencia en las funciones objetivo y restricciones.

### Criterios de selección

Los parámetros críticos se seleccionan según tres criterios: (1) elasticidad respecto a las funciones objetivo, (2) impacto en la factibilidad del modelo, y (3) proximidad a límites operativos identificados en el análisis de rangos.

### Parámetros seleccionados

*Tabla X. Parámetros críticos identificados para el análisis de sensibilidad.*

| Categoría | Parámetro | Sensibilidad en α | Sensibilidad en γ | Sensibilidad en β | Justificación |
|-----------|-----------|-------------------|-------------------|-------------------|---------------|
| Demanda | DI_j | {{DATO:oat_sens_DI_alpha}} | {{DATO:oat_sens_DI_gamma}} | {{DATO:oat_sens_DI_beta}} | {{PLACEHOLDER}} |
| Demanda | DD_k | {{DATO:oat_sens_DD_alpha}} | {{DATO:oat_sens_DD_gamma}} | {{DATO:oat_sens_DD_beta}} | {{PLACEHOLDER}} |
| Productividad | CA, CB | {{DATO:oat_sens_CA_alpha}} | {{DATO:oat_sens_CA_gamma}} | {{DATO:oat_sens_CA_beta}} | {{PLACEHOLDER}} |
| Capacidad vehicular | CV_j | {{DATO:oat_sens_CV_alpha}} | {{DATO:oat_sens_CV_gamma}} | {{DATO:oat_sens_CV_beta}} | {{PLACEHOLDER}} |
| Rendimiento | RC_i, RA_u | {{DATO:oat_sens_RC_alpha}} | {{DATO:oat_sens_RC_gamma}} | {{DATO:oat_sens_RC_beta}} | {{PLACEHOLDER}} |
| Emisión | IT_j | {{DATO:oat_sens_IT_alpha}} | {{DATO:oat_sens_IT_gamma}} | {{DATO:oat_sens_IT_beta}} | {{PLACEHOLDER}} |
| Transporte | CT, CTT | {{DATO:oat_sens_CT_alpha}} | {{DATO:oat_sens_CT_gamma}} | {{DATO:oat_sens_CT_beta}} | {{PLACEHOLDER}} |

Nota. Elaboración propia.

---

### Criterios de Selección de Parámetros Críticos

Los parámetros críticos se seleccionan según tres criterios: (1) elasticidad respecto a las funciones objetivo, (2) impacto en la factibilidad del modelo, y (3) proximidad a límites operativos identificados en el análisis de rangos.

### Parámetros de Mayor Impacto

*Tabla X. Parámetros críticos identificados para el análisis de sensibilidad.*

| Categoría | Parámetro | Sensibilidad en α | Sensibilidad en γ | Sensibilidad en β | Justificación |
|-----------|-----------|-------------------|-------------------|-------------------|---------------|
| Demanda | DI_j | {{DATO:oat_sens_DI_alpha}} | {{DATO:oat_sens_DI_gamma}} | {{DATO:oat_sens_DI_beta}} | Factor de mayor impacto. Un aumento del 10% eleva costos en 10.2%. |
| Productividad | CA, CB | {{DATO:oat_sens_CA_alpha}} | {{DATO:oat_sens_CA_gamma}} | {{DATO:oat_sens_CA_beta}} | Mejor palanca de eficiencia; reduce costos sin afectar servicio. |
| Mano de Obra vs Transporte | CMO, CT | Alta | Media | Alta | El sistema es más sensible a costos de personal que a combustible. |

Nota. Elaboración propia.

---

## 7.2 Análisis de Escenarios

Se modificarán sistemáticamente los valores de los parámetros seleccionados, generando escenarios alternativos, con el propósito de observar los efectos en las variables de decisión y en el cumplimiento de los objetivos de sostenibilidad.

### Análisis OAT (One-At-a-Time)

{{PLACEHOLDER: Descripción del método OAT — variación individual de cada parámetro manteniendo los demás constantes}}

*Tabla X. Resultados del análisis OAT para variaciones de ±10%, ±20%, ±30%.*

| Parámetro | Variación | α (LGP) | γ (LGP) | β (LGP) | α (ER) | γ (ER) | β (ER) |
|-----------|-----------|---------|---------|---------|--------|--------|--------|
| {{DATO:param_base}} | +10% | {{DATO:oat_result}} | {{DATO:oat_result}} | {{DATO:oat_result}} | {{DATO:oat_result}} | {{DATO:oat_result}} | {{DATO:oat_result}} |
| {{DATO:param_base}} | -10% | {{DATO:oat_result}} | {{DATO:oat_result}} | {{DATO:oat_result}} | {{DATO:oat_result}} | {{DATO:oat_result}} | {{DATO:oat_result}} |
| ... | ... | ... | ... | ... | ... | ... | ... |

Nota. Elaboración propia.

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

*Tabla X. Resultados de los 12 escenarios para LGP y ER.*

| # | Escenario | LGP α | LGP γ | LGP β | ER α | ER γ | ER β | Δ Costo (%) | Factible |
|---|-----------|-------|-------|-------|------|------|------|-------------|----------|
| 1 | Boom Demanda | {{DATO:esc1_lgp_a}} | {{DATO:esc1_lgp_g}} | {{DATO:esc1_lgp_b}} | {{DATO:esc1_er_a}} | {{DATO:esc1_er_g}} | {{DATO:esc1_er_b}} | {{PLACEHOLDER}} | {{DATO:esc1_factible}} |
| 2 | Crecimiento | {{DATO:esc2_lgp_a}} | {{DATO:esc2_lgp_g}} | {{DATO:esc2_lgp_b}} | {{DATO:esc2_er_a}} | {{DATO:esc2_er_g}} | {{DATO:esc2_er_b}} | {{PLACEHOLDER}} | {{DATO:esc2_factible}} |
| 3 | Restricción Op. | {{DATO:esc3_lgp_a}} | {{DATO:esc3_lgp_g}} | {{DATO:esc3_lgp_b}} | {{DATO:esc3_er_a}} | {{DATO:esc3_er_g}} | {{DATO:esc3_er_b}} | {{PLACEHOLDER}} | {{DATO:esc3_factible}} |
| 4 | Expansión | {{DATO:esc4_lgp_a}} | {{DATO:esc4_lgp_g}} | {{DATO:esc4_lgp_b}} | {{DATO:esc4_er_a}} | {{DATO:esc4_er_g}} | {{DATO:esc4_er_b}} | {{PLACEHOLDER}} | {{DATO:esc4_factible}} |
| 5 | Regulación Amb. | {{DATO:esc5_lgp_a}} | {{DATO:esc5_lgp_g}} | {{DATO:esc5_lgp_b}} | {{DATO:esc5_er_a}} | {{DATO:esc5_er_g}} | {{DATO:esc5_er_b}} | {{PLACEHOLDER}} | {{DATO:esc5_factible}} |
| 6 | Transición Verde | {{DATO:esc6_lgp_a}} | {{DATO:esc6_lgp_g}} | {{DATO:esc6_lgp_b}} | {{DATO:esc6_er_a}} | {{DATO:esc6_er_g}} | {{DATO:esc6_er_b}} | {{PLACEHOLDER}} | {{DATO:esc6_factible}} |
| 7 | Súper Eficiencia | {{DATO:esc7_lgp_a}} | {{DATO:esc7_lgp_g}} | {{DATO:esc7_lgp_b}} | {{DATO:esc7_er_a}} | {{DATO:esc7_er_g}} | {{DATO:esc7_er_b}} | {{PLACEHOLDER}} | {{DATO:esc7_factible}} |
| 8 | Fomento Laboral | {{DATO:esc8_lgp_a}} | {{DATO:esc8_lgp_g}} | {{DATO:esc8_lgp_b}} | {{DATO:esc8_er_a}} | {{DATO:esc8_er_g}} | {{DATO:esc8_er_b}} | {{PLACEHOLDER}} | {{DATO:esc8_factible}} |
| 9 | Crisis Climática | {{DATO:esc9_lgp_a}} | {{DATO:esc9_lgp_g}} | {{DATO:esc9_lgp_b}} | {{DATO:esc9_er_a}} | {{DATO:esc9_er_g}} | {{DATO:esc9_er_b}} | {{PLACEHOLDER}} | {{DATO:esc9_factible}} |
| 10 | Huelga Transp. | {{DATO:esc10_lgp_a}} | {{DATO:esc10_lgp_g}} | {{DATO:esc10_lgp_b}} | {{DATO:esc10_er_a}} | {{DATO:esc10_er_g}} | {{DATO:esc10_er_b}} | {{PLACEHOLDER}} | {{DATO:esc10_factible}} |
| 11 | Adversas | {{DATO:esc11_lgp_a}} | {{DATO:esc11_lgp_g}} | {{DATO:esc11_lgp_b}} | {{DATO:esc11_er_a}} | {{DATO:esc11_er_g}} | {{DATO:esc11_er_b}} | {{PLACEHOLDER}} | {{DATO:esc11_factible}} |
| 12 | Crítica | {{DATO:esc12_lgp_a}} | {{DATO:esc12_lgp_g}} | {{DATO:esc12_lgp_b}} | {{DATO:esc12_er_a}} | {{DATO:esc12_er_g}} | {{DATO:esc12_er_b}} | {{PLACEHOLDER}} | {{DATO:esc12_factible}} |

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
