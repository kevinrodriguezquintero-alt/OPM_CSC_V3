# 8. Evaluación Comparativa del Modelo

> **Dependencias**: `conocimiento/notacion.md`, `conocimiento/Diseno_Metodologico.md`, `conocimiento/paper_referencia.md`, `02-api-model/solvers/lgp.py`, `02-api-model/solvers/er.py`, resultados de escenarios

Este capítulo compara el desempeño del modelo propuesto (LGP) con el modelo de referencia (ER), evaluando las diferencias en las decisiones operativas y el balance entre las tres dimensiones de sostenibilidad.

## 8.1 Comparación de Resultados con el Modelo Base

Se recopilaron los resultados obtenidos tras la ejecución del modelo propuesto y se contrastaron con los reportados en el modelo base. Esta actividad se desarrollará mediante el uso de tablas comparativas, visualizaciones gráficas y análisis porcentual de variaciones. Además, se incluirá una interpretación de las diferencias observadas, con base en los objetivos de sostenibilidad planteados.

### Niveles de Aspiración y Valores Alcanzados

La comparación entre el modelo propuesto (LGP) y el modelo de referencia migrado (ER) permite evaluar las diferencias en las decisiones operativas y el desempeño por dimensión de sostenibilidad. Se analizan desviaciones respecto a los niveles de aspiración, desglose de costos, emisiones y generación de empleo.

*Tabla X. Niveles de aspiración y valores alcanzados por cada método.*

| Objetivo | Aspiración (óptimo individual) | LGP (valor alcanzado) | ER (valor alcanzado) | Desviación LGP | Desviación ER |
|----------|-------------------------------|----------------------|---------------------|---------------|--------------|
| α (Costo) | g₁ = α* = {{DATO:aspiracion_costo}} | {{DATO:lgp_costo}} | {{DATO:er_costo}} | {{DATO:lgp_d1_plus}} | {{PLACEHOLDER}} |
| γ (Emisiones) | g₂ = γ* = {{DATO:aspiracion_emisiones}} | {{DATO:lgp_emisiones}} | {{DATO:er_emisiones}} | {{DATO:lgp_d2_plus}} | {{PLACEHOLDER}} |
| β (Empleo) | g₃ = β* = {{DATO:aspiracion_empleo}} | {{DATO:lgp_empleo}} | {{DATO:er_empleo}} | {{DATO:lgp_d3_minus}} | {{PLACEHOLDER}} |

Nota. Elaboración propia.

### Desglose de Costos por Componente

*Tabla X. Desglose de costos logísticos por componente y método.*

| Componente de Costo | LGP | ER | Diferencia (%) |
|---------------------|-----|----|----|
| Producción (ΣΣ CP·X_{ij}) | {{DATO:lgp_costo_produccion}} | {{DATO:er_costo_produccion}} | {{PLACEHOLDER}} |
| Procesamiento (ΣΣ CI_j·X_{ij}) | {{DATO:lgp_costo_procesamiento}} | {{DATO:er_costo_procesamiento}} | {{PLACEHOLDER}} |
| Mano de obra acopio (CMP·S) | {{DATO:lgp_costo_mo_acopio}} | {{DATO:er_costo_mo_acopio}} | {{PLACEHOLDER}} |
| Mano de obra intermediario (Σ CMO_j·SS_j) | {{DATO:lgp_costo_mo_inter}} | {{DATO:er_costo_mo_inter}} | {{PLACEHOLDER}} |
| Mano de obra detallista (Σ CD_k·SSS_k) | {{DATO:lgp_costo_mo_detall}} | {{DATO:er_costo_mo_detall}} | {{PLACEHOLDER}} |
| Transporte flujo 1 | {{DATO:lgp_costo_transp1}} | {{DATO:er_costo_transp1}} | {{PLACEHOLDER}} |
| Transporte flujo 2 | {{DATO:lgp_costo_transp2}} | {{DATO:er_costo_transp2}} | {{PLACEHOLDER}} |
| Daño flujo 1 | {{DATO:lgp_costo_dano1}} | {{DATO:er_costo_dano1}} | {{PLACEHOLDER}} |
| Daño flujo 2 | {{DATO:lgp_costo_dano2}} | {{DATO:er_costo_dano2}} | {{PLACEHOLDER}} |
| **Total** | {{DATO:lgp_costo}} | {{DATO:er_costo}} | {{PLACEHOLDER}} |

Nota. Elaboración propia.

### Desglose de Emisiones

*Tabla X. Emisiones de CO₂ por flujo de transporte.*

| Flujo | LGP | ER | Diferencia (%) |
|-------|-----|----|----|
| Flujo 1 (I→J) | {{DATO:lgp_emisiones_f1}} | {{DATO:er_emisiones_f1}} | {{PLACEHOLDER}} |
| Flujo 2 (J→K) | {{DATO:lgp_emisiones_f2}} | {{DATO:er_emisiones_f2}} | {{PLACEHOLDER}} |
| **Total** | {{DATO:lgp_emisiones}} | {{DATO:er_emisiones}} | {{PLACEHOLDER}} |

Nota. Elaboración propia.

### Desglose de Empleo

*Tabla X. Generación de empleo por eslabón.*

| Eslabón | LGP | ER | Diferencia |
|---------|-----|----|----|
| Centro de acopio (S) | {{DATO:lgp_empleo_acopio}} | {{DATO:er_empleo_acopio}} | {{PLACEHOLDER}} |
| Intermediarios (Σ SS_j) | {{DATO:lgp_empleo_inter}} | {{DATO:er_empleo_inter}} | {{PLACEHOLDER}} |
| Detallistas (Σ SSS_k) | {{DATO:lgp_empleo_detall}} | {{DATO:er_empleo_detall}} | {{PLACEHOLDER}} |
| **Total** | {{DATO:lgp_empleo}} | {{DATO:er_empleo}} | {{PLACEHOLDER}} |

Nota. Elaboración propia.

### Comparación con el Modelo de Referencia (Arenas & Salazar, 2018)

La comparación con el modelo de referencia original (Arenas & Salazar, 2018) permite validar la implementación y evaluar mejoras introducidas por la completitud de los pilares ambiental y social. El paper original reportaba: Costo $32.496.116,50, Emisiones 524,8 kg CO₂/semana, Empleo 179 personas/semana.

| Métrica | Paper (ER original) | ER (Python) | LGP (Python) |
|---------|-------------------|------------|-------------|
| Costo total | {{DATO:paper_costo}} | {{DATO:er_costo}} | {{DATO:lgp_costo}} |
| Emisiones | {{DATO:paper_emisiones}} | {{DATO:er_emisiones}} | {{DATO:lgp_emisiones}} |
| Empleo | {{DATO:paper_empleo}} | {{DATO:er_empleo}} | {{DATO:lgp_empleo}} |

### Análisis de Decisiones Operativas

#### Configuración de rutas

El análisis de configuración de rutas revela diferencias en la asignación de flujos entre LGP y ER. Mientras ER prioriza exclusivamente la minimización de costos, LGP permite rutas ligeramente más costosas si preservan mejor el equilibrio ambiental y social.

#### Productores activos

La selección de productores activos difiere entre métodos. LGP tiende a activar más productores para distribuir el empleo, mientras ER concentra la producción en los productores más eficientes económicamente.

#### Asignación de flujos

{{TABLA: Flujos X_{ij} y Y_{jk} significativos para cada método}}

---

## 8.2 Evaluación por Dimensión de Sostenibilidad

Se realizará un análisis específico por dimensión (económica, ambiental y social). Esta actividad permitirá observar si el modelo tiene mayor capacidad de adaptación o balance frente a restricciones específicas (como límites de recursos, incrementos en demanda o disminución de capacidad operativa). Los resultados se organizarán en función de los criterios de desempeño establecidos en la literatura revisada, incluyendo eficiencia de costos, reducción de impactos ambientales y mejora en indicadores sociales.

### Dimensión Económica

El desempeño económico del modelo propuesto se evalúa comparando el costo total alcanzado con el óptimo individual (α*). La desviación d₁⁺ representa el costo de oportunidad de satisfacer las metas ambiental y social.

- **Eficiencia de costos**: {{PLACEHOLDER}}
- **Estructura de costos**: {{PLACEHOLDER}}
- **Sensibilidad económica ante escenarios**: {{PLACEHOLDER}}

### Dimensión Ambiental

El desempeño ambiental se mide por las emisiones totales de CO₂ generadas por el transporte. LGP permite un leve incremento respecto al óptimo ambiental (γ*) para preservar la meta económica prioritaria.

- **Reducción de impactos ambientales**: {{PLACEHOLDER}}
- **Emisiones por flujo**: {{PLACEHOLDER}}
- **Sensibilidad ambiental ante escenarios**: {{PLACEHOLDER}}

### Dimensión Social

El desempeño social evalúa la generación de empleo en los tres eslabones. LGP prioriza la estabilidad social, permitiendo contratar personal adicional incluso cuando ER lo optimiza fuera.

- **Mejora en indicadores sociales**: {{PLACEHOLDER}}
- **Generación de empleo por eslabón**: {{PLACEHOLDER}}
- **Sensibilidad social ante escenarios**: {{PLACEHOLDER}}

### Balance Inter-dimensional

El modelo LGP logra un balance superior entre las tres dimensiones de sostenibilidad mediante la jerarquización explícita de prioridades. Mientras ER optimiza costo sin contemplaciones, LGP permite compensaciones controladas: un ligero incremento de costo puede generar beneficios ambientales y sociales significativos.

### Discusión: Ventajas y Limitaciones

#### Ventajas del LGP

Las ventajas del LGP incluyen: (1) **Jerarquía explícita**: los objetivos se ordenan según prioridades claras (P1>P2>P3); (2) **No-degradación**: una vez optimizado un nivel, las soluciones posteriores no lo empeoran; (3) **Pareto-eficiencia**: la solución final es eficiente en el sentido de Pareto, sin dominación posible.

#### Ventajas del ER

El método ER presenta ventajas en la exploración sistemática de la frontera de Pareto mediante variación de ε, permitiendo visualizar trade-offs completos. Sin embargo, requiere calibración subjetiva de parámetros ε y no garantiza jerarquía explícita entre objetivos.

#### El "Efecto Deriva"

El 'Efecto Deriva' describe cómo LGP permite que el costo aumente marginalmente para preservar empleo. Por ejemplo, en el escenario 'Boom Demanda', LGP prefiere contratar un operario extra (+$23.055) para satisfacer la meta social, mientras ER lo descarta para minimizar costo puro. Esta diferencia refleja la filosofía de sostenibilidad integral vs. optimización económica pura.

### Capacidad de Adaptación por Contexto

La capacidad de adaptación varía por contexto: LGP es superior en escenarios que priorizan estabilidad social y sostenibilidad (Boom Demanda, Fomento Laboral). ER es preferible cuando el costo es la única métrica relevante. En escenarios de crisis (Crisis Climática, Huelga Transporte), ambos métodos convergen en priorizar viabilidad económica.

*Tabla X. Desempeño relativo por escenario y dimensión.*

| Escenario | Económica (LGP vs ER) | Ambiental (LGP vs ER) | Social (LGP vs ER) | Método preferido |
|-----------|----------------------|----------------------|-------------------|-----------------|
| Boom Demanda | {{PLACEHOLDER}} | {{PLACEHOLDER}} | {{PLACEHOLDER}} | {{PLACEHOLDER}} |
| Transición Verde | {{PLACEHOLDER}} | {{PLACEHOLDER}} | {{PLACEHOLDER}} | {{PLACEHOLDER}} |
| Crisis Climática | {{PLACEHOLDER}} | {{PLACEHOLDER}} | {{PLACEHOLDER}} | {{PLACEHOLDER}} |
| Súper Eficiencia | {{PLACEHOLDER}} | {{PLACEHOLDER}} | {{PLACEHOLDER}} | {{PLACEHOLDER}} |
| Huelga Transporte | {{PLACEHOLDER}} | {{PLACEHOLDER}} | {{PLACEHOLDER}} | {{PLACEHOLDER}} |

Nota. Elaboración propia.
