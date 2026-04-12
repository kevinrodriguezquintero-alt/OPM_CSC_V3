# 5. Formulación del Modelo Matemático

> **Dependencias**: `conocimiento/notacion.md`, `conocimiento/paper_referencia.md`, `02-api-model/data/params.py`, `02-api-model/solvers/build_model.py`

Este capítulo presenta la formulación matemática del modelo de optimización multiobjetivo para la toma de decisiones operativas sostenibles en la cadena de suministro citrícola. El modelo integra tres dimensiones —económica, ambiental y social— mediante el enfoque de Programación por Metas Lexicográfica (LGP).

## 5.1 Conjuntos

El modelo se estructura sobre cuatro conjuntos que representan los nodos de la cadena de suministro citrícola:

| Conjunto | Símbolo | Descripción | Cardenalidad |
|----------|---------|-------------|-------------|
| Centro de acopio | I | Agrupación de pequeños productores | \|I\| = {{DATO:params.py:PRODUCTORES}} |
| Intermediarios | J | Centros de acopio y procesamiento | \|J\| = {{DATO:params.py:INTERMEDIARIOS}} |
| Detallistas | K | Puntos de venta final | \|K\| = {{DATO:params.py:DETALLISTAS}} |
| Variantes | U | Productores individuales con variable binaria | \|U\| = {{DATO:params.py:VARIANTES_PRODUCTOR}} |

## 5.2 Variables de Decisión

Las variables de decisión determinan las cantidades a producir, transportar y almacenar, así como los recursos humanos y vehiculares requeridos.

*Tabla X. Variables de decisión del modelo matemático.*

| Variable | Símbolo | Tipo | Índice | Descripción |
|----------|---------|------|--------|-------------|
| Cantidad enviada flujo 1 | X_{ij} | ℝ⁺ | I×J | Cantidad de fruta a enviar del centro de acopio i al intermediario j [Kg/Sem] |
| Cantidad enviada flujo 2 | Y_{jk} | ℝ⁺ | J×K | Cantidad de fruta a enviar del intermediario j al detallista k [Kg/Sem] |
| Viajes flujo 1 | Z_{ij} | ℤ⁺ | I×J | Número de viajes del centro de acopio i al intermediario j [Viajes/Sem] |
| Viajes flujo 2 | ZZ_{jk} | ℤ⁺ | J×K | Número de viajes del intermediario j al detallista k [Viajes/Sem] |
| Hectáreas activadas | W_i | ℝ⁺ | I | Hectáreas activadas en el centro de acopio i [Ha] |
| Personal acopio | S | ℤ⁺ | escalar | Personas requeridas en el centro de acopio [#Pers/Sem] |
| Personal intermediario | SS_j | ℤ⁺ | J | Personas requeridas en el intermediario j [#Pers/Sem] |
| Personal detallista | SSS_k | ℤ⁺ | K | Personas requeridas en el detallista k [#Pers/Sem] |
| Activación productor | B_u | {0,1} | U | Activación del productor u [0/1] |

Nota. Adaptado de Arenas Ruiz y Salazar Aguirre (2018). Elaboración propia.

### Parámetros del Modelo

*Tabla X. Parámetros del modelo matemático.*

{{TABLA: Parámetros organizados por categoría (rendimientos, capacidades de personal, costos, merma y demanda, capacidades operativas, ambiental y distancias). Fuente: conocimiento/notacion.md sección 3}}

Nota. Adaptado de Arenas Ruiz y Salazar Aguirre (2018). Elaboración propia.

---

## 5.3 Funciones Objetivo

### P1: Minimización de Costos Logísticos (α)

La función objetivo económica busca minimizar los costos logísticos totales de la cadena de suministro, integrando los tres eslabones (centro de acopio, intermediarios y detallistas). Esta función contempla nueve componentes de costo que abarcan desde la producción hasta la entrega final.

> Min α = ΣΣ CP_i·X_{ij} + ΣΣ CI_j·X_{ij} + CMP·S + Σ CMO_j·SS_j + Σ CD_k·SSS_k + ΣΣ CT_{ij}·Z_{ij}·DPI_{ij} + ΣΣ CTT_{jk}·ZZ_{jk}·DID_{jk} + ΣΣ CDA_{ij}·P_{ij}·X_{ij} + ΣΣ CDF_{jk}·PP_{jk}·Y_{jk} &nbsp;&nbsp;&nbsp;(1)

**Descripción de los nueve componentes de costo:**

| Término | Descripción | Unidad |
|---------|-------------|--------|
| A: ΣΣ CP_i·X_{ij} | Costo de producción en el centro de acopio | $/semana |
| B: ΣΣ CI_j·X_{ij} | Costo de procesamiento en el intermediario | $/semana |
| C: CMP·S | Costo de mano de obra en el centro de acopio | $/semana |
| D: Σ CMO_j·SS_j | Costo de mano de obra en el intermediario | $/semana |
| E: Σ CD_k·SSS_k | Costo de mano de obra en el detallista | $/semana |
| F: ΣΣ CT_{ij}·Z_{ij}·DPI_{ij} | Costo de transporte flujo 1 (acopio→intermediario) | $/semana |
| G: ΣΣ CTT_{jk}·ZZ_{jk}·DID_{jk} | Costo de transporte flujo 2 (intermediario→detallista) | $/semana |
| H: ΣΣ CDA_{ij}·P_{ij}·X_{ij} | Costo por daño del producto en el flujo 1 | $/semana |
| I: ΣΣ CDF_{jk}·PP_{jk}·Y_{jk} | Costo por daño del producto en el flujo 2 | $/semana |

> **Nota técnica:** El término de transporte sigue la formulación del paper de Arenas & Salazar (2018): `CT·Z·DPI` (costo por km × número de viajes × distancia). El código actual implementa `CT·X` (costo × kg enviado), lo cual es dimensionalmente inconsistente y debe corregirse.

### P2: Minimización de Emisiones (γ)

La función objetivo ambiental minimiza las emisiones de CO₂ generadas por el transporte de la fruta a lo largo de la cadena de suministro. Considera el número de viajes, las distancias recorridas y el factor de emisión específico por tipo de combustible.

> Min γ = ΣΣ Z_{ij}·DPI_{ij}·IT_j + ΣΣ ZZ_{jk}·DID_{jk}·IT_j &nbsp;&nbsp;&nbsp;(2)

**Descripción de los componentes ambientales:**

| Término | Descripción | Unidad |
|---------|-------------|--------|
| A: ΣΣ Z_{ij}·DPI_{ij}·IT_j | Impacto ambiental en el flujo 1 (acopio→intermediario) | Kg CO₂/semana |
| B: ΣΣ ZZ_{jk}·DID_{jk}·IT_j | Impacto ambiental en el flujo 2 (intermediario→detallista) | Kg CO₂/semana |

Donde IT_j representa el factor de emisión [Kg CO₂/km] del combustible utilizado por los vehículos del intermediario j, determinado según los Factores de Emisión de Combustibles Colombianos (FECOC) de la UPME.

### P3: Maximización de Empleo (β)

La función objetivo social maximiza la generación de empleo en los tres eslabones de la cadena de suministro. Esta dimensión introduce el componente social de la sostenibilidad, reconociendo la importancia de la agricultura familiar como generadora de empleo rural.

> Max β = S + Σ SS_j + Σ SSS_k &nbsp;&nbsp;&nbsp;(3)

**Descripción de los componentes sociales:**

| Término | Descripción | Unidad |
|---------|-------------|--------|
| A: S | Número de personas requeridas en el centro de acopio | Personas/semana |
| B: Σ SS_j | Número de personas requeridas en los intermediarios | Personas/semana |
| C: Σ SSS_k | Número de personas requeridas en los detallistas | Personas/semana |

La generación de empleo está directamente vinculada a la cantidad de flujo de producto y la capacidad productiva de la mano de obra en cada entidad, de modo que la cantidad de fruta a enviar es proporcional al número de personas a contratar.

---

## 5.4 Restricciones Clave

El modelo matemático contempla 21 restricciones organizadas en nueve categorías funcionales que garantizan la coherencia operativa de la cadena de suministro: rendimientos y hectáreas, capacidades de los eslabones, demanda, balance de masa, límites de cantidades, número de viajes, asignación de mano de obra, kilometraje máximo, y naturaleza de las variables.

### Balance de masa y Rendimientos

> Σ RA_u·B_u ≤ RB &nbsp;&nbsp;&nbsp;(4)

> Σ B_u·H_u = W &nbsp;&nbsp;&nbsp;(5)

> RC·W ≤ CN &nbsp;&nbsp;&nbsp;(6)

**Restricción (4) — Rendimientos:** Limita la sumatoria de los rendimientos de los productores activados por la variable binaria, asegurando que no se supere un rendimiento máximo global establecido. **Restricción (5) — Balance de hectáreas:** Define que las hectáreas totales activadas deben ser igual a la sumatoria de las hectáreas de los productores que se activan mediante la variable binaria. **Restricción (6) — Capacidad productiva:** Establece que la capacidad productiva total está limitada por el rendimiento máximo por las hectáreas totales activadas.

### Capacidades Vehiculares y de los Eslabones

> Σ X_{ij} ≤ CRI_j; ∀ j ∈ J &nbsp;&nbsp;&nbsp;(7)

> Σ Y_{jk} ≤ CR_k; ∀ k ∈ K &nbsp;&nbsp;&nbsp;(8)

> X_{ij} ≤ CV_j·Z_{ij}; ∀ i ∈ I, j ∈ J &nbsp;&nbsp;&nbsp;(9)

> Y_{jk} ≤ CV_j·ZZ_{jk}; ∀ j ∈ J, k ∈ K &nbsp;&nbsp;&nbsp;(10)

**Restricción (7) — Capacidad recepción intermediario:** La cantidad total recibida por cada intermediario no puede superar su capacidad de almacenamiento y procesamiento. **Restricción (8) — Capacidad recepción detallista:** La cantidad total recibida por cada detallista está limitada por su capacidad de recepción. **Restricción (9) — Capacidad vehicular flujo 1:** La cantidad enviada en el flujo 1 debe respetar la capacidad de carga del vehículo multiplicada por el número de viajes. **Restricción (10) — Capacidad vehicular flujo 2:** Análoga a (9) para el flujo 2 (intermediario→detallista).

### Demanda Mínima

> Σ X_{ij} ≥ DI_j; ∀ j ∈ J &nbsp;&nbsp;&nbsp;(11)

> Σ Y_{jk} ≥ DD_k; ∀ k ∈ K &nbsp;&nbsp;&nbsp;(12)

**Restricción (11) — Demanda intermediario:** Garantiza que la cantidad total enviada a cada intermediario cumpla con su demanda mínima semanal. **Restricción (12) — Demanda detallista:** Asegura que la cantidad total enviada a cada detallista satisfaga su demanda mínima semanal.

### Conservación de Flujo

> Σ Y_{jk} = Σ(X_{ij} − P_{ij}·X_{ij}) − Σ(PP_{jk}·Y_{jk}); ∀ j ∈ J &nbsp;&nbsp;&nbsp;(13)

**Restricción (13) — Balance de masa:** Asegura la conservación del flujo de producto en cada intermediario, considerando la merma (pérdida por daño) en ambos flujos. La cantidad saliente hacia los detallistas debe igualar la cantidad entrante desde los acopios, ajustada por los porcentajes de daño en cada flujo.

### Límites Operativos

> Σ X_{ij} ≤ RC·W; ∀ i ∈ I &nbsp;&nbsp;&nbsp;(14)

> Σ X_{ij} ≥ RD·W; ∀ i ∈ I &nbsp;&nbsp;&nbsp;(15)

**Restricción (14) — Límite máximo de cantidades:** La cantidad total enviada desde cada centro de acopio no puede superar el producto de su rendimiento máximo por las hectáreas activadas. **Restricción (15) — Límite mínimo de cantidades:** La cantidad total enviada desde cada centro de acopio debe ser al menos el producto de su rendimiento mínimo por las hectáreas activadas.

### Programación de Viajes

> Σ Z_{ij} ≤ Σ(X_{ij}/CV_j) + 1; ∀ j ∈ J &nbsp;&nbsp;&nbsp;(16)

> Σ ZZ_{jk} ≤ Σ(Y_{jk}/CV_j) + 1; ∀ j ∈ J &nbsp;&nbsp;&nbsp;(17)

**Restricción (16) — Número de viajes flujo 1:** El número de viajes en el flujo 1 está limitado superiormente por la cantidad enviada dividida por la capacidad vehicular (más uno para redondeo). **Restricción (17) — Número de viajes flujo 2:** Análoga a (16) para el flujo 2.

### Asignación Laboral

> ΣΣ(X_{ij}/CA) = S &nbsp;&nbsp;&nbsp;(18)

> Σ(X_{ij}/CB_j) = SS_j; ∀ j ∈ J &nbsp;&nbsp;&nbsp;(19)

> Σ(Y_{jk}/CC_k) = SSS_k; ∀ k ∈ K &nbsp;&nbsp;&nbsp;(20)

**Restricción (18) — Asignación laboral centro de acopio:** El número de personas requeridas en el centro de acopio se determina dividiendo la cantidad total enviada por la capacidad productiva de la mano de obra. **Restricción (19) — Asignación laboral intermediario:** Análoga a (18) para cada intermediario j. **Restricción (20) — Asignación laboral detallista:** Análoga a (18) para cada detallista k.

### Restricción Ambiental de Kilometraje

> Σ Z_{ij}·DPI_{ij} + Σ ZZ_{jk}·DID_{jk} ≤ M &nbsp;&nbsp;&nbsp;(21)

**Restricción (21) — Kilometraje máximo:** Limita la suma total de kilómetros recorridos en ambos flujos (viajes × distancia) a un valor máximo M, representando una restricción de sostenibilidad ambiental sobre la extensión de la red logística.

### Declaración de Naturaleza de Variables

> X_{ij}, Y_{jk}, W ∈ ℝ⁺ &nbsp;&nbsp;&nbsp;(22)

> B_u ∈ {0, 1} &nbsp;&nbsp;&nbsp;(23)

> Z_{ij}, ZZ_{jk}, S, SS_j, SSS_k ∈ ℤ⁺ &nbsp;&nbsp;&nbsp;(24)

---

## 5.5 Formulación del Enfoque Multiobjetivo LGP

La Programación por Metas Lexicográfica (LGP) se selecciona como método de optimización multiobjetivo por su capacidad de jerarquizar explícitamente los objetivos de sostenibilidad, eliminando la subjetividad en la calibración de parámetros (como los ε en el método de restricción ε-constraint) y garantizando soluciones Pareto-eficientes.

### Estructura formal del LGP

El LGP transforma las funciones objetivo en metas con niveles de aspiración (g₁, g₂, g₃) correspondientes a los óptimos individuales de cada función. Se introducen variables de desviación:
- **d⁻**: Desviación negativa (cantidad por debajo de la meta)
- **d⁺**: Desviación positiva (cantidad por encima de la meta)

La estructura jerárquica establece **P1 (Costo) > P2 (Ambiental) > P3 (Social)**, donde el óptimo de cada nivel se convierte en restricción para el siguiente.

### Subproblema 1 — Prioridad P1: Minimización de costos

> Min d₁⁺
>
> Sujeto a:
>
> [α] + d₁⁻ − d₁⁺ = g₁ &nbsp;&nbsp;&nbsp;(25)
>
> Restricciones (4) a (24)
>
> d₁⁻, d₁⁺ ≥ 0 &nbsp;&nbsp;&nbsp;(26)

El subproblema LGP-1 minimiza la desviación positiva respecto al costo óptimo individual (g₁ = α*). Esta es la prioridad máxima del modelo. La solución óptima (d₁⁺)* se fija como cota para los subproblemas siguientes.

### Subproblema 2 — Prioridad P2: Minimización de emisiones

> Min d₂⁺
>
> Sujeto a:
>
> [γ] + d₂⁻ − d₂⁺ = g₂ &nbsp;&nbsp;&nbsp;(27)
>
> d₁⁺ ≤ d₁⁺* &nbsp;&nbsp;&nbsp;(28)
>
> Restricciones (4) a (24)
>
> d₂⁻, d₂⁺ ≥ 0 &nbsp;&nbsp;&nbsp;(29)

El subproblema LGP-2 minimiza la desviación positiva de emisiones (d₂⁺) respecto a g₂ = γ*, manteniendo la desviación de costo dentro del óptimo alcanzado: d₁⁺ ≤ (d₁⁺)*.

### Subproblema 3 — Prioridad P3: Maximización de empleo

> Min d₃⁻
>
> Sujeto a:
>
> [β] + d₃⁻ − d₃⁺ = g₃ &nbsp;&nbsp;&nbsp;(30)
>
> d₁⁺ ≤ d₁⁺* &nbsp;&nbsp;&nbsp;(31)
>
> d₂⁺ ≤ d₂⁺* &nbsp;&nbsp;&nbsp;(32)
>
> Restricciones (4) a (24)
>
> d₃⁻, d₃⁺ ≥ 0 &nbsp;&nbsp;&nbsp;(33)

El subproblema LGP-3 minimiza la desviación negativa de empleo (d₃⁻) respecto a g₃ = β*, manteniendo simultáneamente: d₁⁺ ≤ (d₁⁺)* y d₂⁺ ≤ (d₂⁺)*. Esta estructura garantiza que la solución final sea Pareto-eficiente: no es posible mejorar ningún objetivo sin degradar otro de mayor prioridad.
