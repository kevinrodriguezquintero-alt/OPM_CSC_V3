# Paper de Referencia — Arenas & Salazar (2018)

> **Fuente**: Arenas Ruiz, M. A., & Salazar Aguirre, L. T. (2018). *Diseño de una cadena de abastecimiento frutícola con un enfoque de sostenibilidad*. Universidad del Valle.
> **Rol**: Modelo de referencia contra el cual se compara el modelo propuesto (LGP).
> **Estado**: completado con formulaciones extraídas del PDF
> **⚠️ Nota sobre datos**: El paper reporta resultados numéricos ($32.496.116,50; 524,8 kg CO₂/semana; 179 personas/semana) pero la base de datos completa no estuvo disponible. Los parámetros de la implementación Python fueron completados con literatura secundaria (UPME, DANE, Santos et al., 2019), por lo que los resultados numéricos no son directamente comparables, aunque la estructura matemática sí lo es.

---

## 1. Estructura del Modelo de Referencia

### 1.1 Método de Optimización
- **Método**: ε-restricción (ε-constraint)
- **Función principal**: Minimización de costos (α)
- **Restricciones ε**: Emisiones (γ) y empleo (β) como cotas
- **Implementación**: AMPL + GUROBI (plataforma NEOS)

### 1.2 Caso de Estudio
- **Producto**: Cítricos (limones)
- **Región**: Andalucía, Valle del Cauca
- **Estructura**: 66 productores → 1 centro de acopio → 7 intermediarios → 4 detallistas

---

## 2. Formulaciones Matemáticas del Paper

### 2.1 Función Objetivo Económica (α)

**Ecuación (1) del paper:**

$$
\alpha_{\min} = (A + B + C + D + E + F + G + H + I)
$$

**Términos de la función económica (Tabla 10 del paper):**

| Término | Formulación | Descripción |
|---------|-------------|-------------|
| A | $\sum_{i=1}^{1}\sum_{j=1}^{7} CP \cdot X_{ij}$ | Costo de producción en el centro de acopio |
| B | $\sum_{i=1}^{1}\sum_{j=1}^{7} CI_j \cdot X_{ij}$ | Costo de procesamiento en el intermediario |
| C | $CMP \cdot S$ | Costo de mano de obra en el centro de acopio |
| D | $\sum_{j=1}^{7} CMO_j \cdot SS_j$ | Costo de mano de obra en el intermediario |
| E | $\sum_{k=1}^{4} CD_k \cdot SSS_k$ | Costo de mano de obra en el detallista |
| F | $\sum_{i=1}^{1}\sum_{j=1}^{7} CT \cdot Z_{ij} \cdot DPI_{ij}$ | Costo de transporte en el flujo 1 |
| G | $\sum_{j=1}^{7}\sum_{k=1}^{4} CT \cdot ZZ_{jk} \cdot DID_{jk}$ | Costo de transporte en el flujo 2 |
| H | $\sum_{i=1}^{1}\sum_{j=1}^{7} CDA_{ij} \cdot P_{ij} \cdot X_{ij}$ | Costo por daño del producto en el flujo 1 |
| I | $\sum_{j=1}^{7}\sum_{k=1}^{4} CDF_{jk} \cdot PP_{jk} \cdot Y_{jk}$ | Costo por daño del producto en el flujo 2 |

> **OBSERVACIÓN CRÍTICA**: El paper usa `CT·Z·DPI` (costo × viajes × distancia) para transporte, NO `CT·X` (costo × kg). ~~El código actual usa `CT·X` lo cual es dimensionalmente incorrecto según el paper.~~ **✅ CORREGIDO**: El código ahora usa `CT·Z·DPI` y `CTT·ZZ·DID` consistente con el paper.

> **DIVERGENCIA DOCUMENTADA**: El paper usa el **mismo parámetro CT** para ambos flujos (F y G). Sin embargo, en nuestra implementación se mantienen separados como **CT** (flujo 1: acopio→intermediario) y **CTT** (flujo 2: intermediario→detallista) porque representan estructuras de costo diferentes que no pueden unificarse en un valor único (diferentes distancias, vehículos, y condiciones logísticas por etapa). Esto es una extensión válida del modelo base.

---

### 2.2 Función Objetivo Ambiental (γ)

**Ecuación (3) del paper:**

$$
\gamma_{\min} = (A + B)
$$

**Términos de la función ambiental (Tabla 12 del paper):**

| Término | Formulación | Descripción |
|---------|-------------|-------------|
| A | $\sum_{i=1}^{1}\sum_{j=1}^{7} Z_{ij} \cdot DPI_{ij} \cdot IT_j$ | Impacto ambiental en el flujo 1 |
| B | $\sum_{j=1}^{7}\sum_{k=1}^{4} ZZ_{jk} \cdot DID_{jk} \cdot IT_j$ | Impacto ambiental en el flujo 2 |

---

### 2.3 Función Objetivo Social (β)

**Ecuación (2) del paper:**

$$
\beta_{\max} = (A + B + C)
$$

**Términos de la función social (Tabla 11 del paper):**

| Término | Formulación | Descripción |
|---------|-------------|-------------|
| A | $S$ | Número de personas requeridas en el centro de acopio |
| B | $\sum_{j=1}^{7} SS_j$ | Número de personas requeridas en el intermediario |
| C | $\sum_{k=1}^{4} SSS_k$ | Número de personas requeridas en el detallista |

---

## 3. Restricciones del Paper

| # | Nombre | Ecuación del Paper | Coincide con código |
|---|--------|-------------------|-------------------|
| 1 | De rendimientos | $\sum_{u=1}^{66} RA_u \cdot B_u \le RB_u$ | ✅ `var_bina_rule` |
| 2 | Balance de hectáreas | $\sum_{u=1}^{66} B_u \cdot H_u = W$ | ✅ `suma_w_rule` |
| 3 | Capacidad productiva | $RC \cdot W \le CN$ | ✅ `cap_pro_rule` |
| 4 | Capacidad recepción intermediario | $\sum X_{ij} \le CRI_j; \forall j \in J$ | ✅ `cap_desJ_rule` |
| 5 | Capacidad recepción detallista | $\sum Y_{jk} \le CR_k; \forall k \in K$ | ✅ `cap_rec_rule` |
| 6 | Capacidad vehículo flujo 1 | $X_{ij} \le CV_j \cdot Z_{ij}; \forall i \in I, j \in J$ | ✅ `cap_veh_rule` |
| 7 | Capacidad vehículo flujo 2 | $Y_{jk} \le CV_j \cdot ZZ_{jk}; \forall j \in J, k \in K$ | ✅ `cap_vehh_rule` |
| 8 | Demanda intermediario | $\sum X_{ij} \ge DI_j; \forall j \in J$ | ✅ `cap_demI_rule` |
| 9 | Demanda detallista | $\sum Y_{jk} \ge DD_k; \forall k \in K$ | ✅ `cap_demD_rule` |
| 10 | Balance de masa | $\sum Y_{jk} = \sum(X_{ij} - P_{ij} \cdot X_{ij}) - \sum(PP_{jk} \cdot Y_{jk}); \forall j \in J$ | ✅ `cap_balce_rule` |
| 11 | Límite máximo cantidades | $\sum X_{ij} \le RC \cdot W; \forall i \in I$ | ✅ `cap_opemax_rule` |
| 12 | Límite mínimo cantidades | $\sum X_{ij} \ge RD \cdot W; \forall i \in I$ | ✅ `cap_opemin_rule` |
| 13 | Número de viajes flujo 1 | $\sum Z_{ij} \le \sum(X_{ij}/CV_j) + 1; \forall j \in J$ | ✅ `cap_opeB_rule` |
| 14 | Número de viajes flujo 2 | $\sum ZZ_{jk} \le \sum(Y_{jk}/CV_j) + 1; \forall j \in J$ | ✅ `cap_opeC_rule` |
| 15 | Personas centro acopio | $\sum\sum(X_{ij}/CA) = S$ | ✅ `cap_perI_rule` |
| 16 | Personas intermediario | $\sum(X_{ij}/CB_j) = SS_j; \forall j \in J$ | ✅ `cap_perJ_rule` |
| 17 | Personas detallista | $\sum(Y_{jk}/CC_k) = SSS_k; \forall k \in K$ | ✅ `cap_perD_rule` |
| 18 | Variables continuas | $X_{ij}, Y_{jk}, W \in \mathbb{R}^+$ | ✅ Declaración en código |
| 19 | Variables binarias | $B_u \in \{0,1\}$ | ✅ Declaración en código |
| 20 | Variables enteras | $Z_{ij}, ZZ_{jk}, S, SS_j, SSS_k \in \mathbb{N}$ | ✅ Declaración en código |
| 21 | Kilometraje máximo | $\sum Z_{ij} \cdot DPI_{ij} + \sum ZZ_{jk} \cdot DID_{jk} \le M; \forall j \in J$ | ✅ `cap_km_rule` |

---

## 4. Diferencias Clave Paper vs. Modelo Propuesto

| Aspecto | Paper (ER) | Modelo Propuesto (LGP) |
|---------|-----------|----------------------|
| Método | ε-constraint | Lexicographic Goal Programming |
| Prioridades | Sin jerarquía | P1→P2→P3 (Costo→Emisiones→Empleo) |
| Implementación | AMPL + GUROBI (NEOS) | Python + Pyomo + HiGHS |
| Transporte costo | `CT·Z·DPI` (costo × viajes × distancia) | `CT·X` (costo × kg) ❌ **INCORRECTO** |
| Epsilon social | 179 personas/semana | {{DATO:lgp_d3_minus}} |
| Epsilon ambiental | 524,8 kg CO₂/semana | {{DATO:lgp_d2_plus}} |

---

## 5. Resultados Reportados en el Paper

| Métrica | Valor Paper (ER) | Valor Modelo (LGP) | Valor Modelo (ER) |
|---------|-----------------|-------------------|------------------|
| Costo total (α) | $37.865.073,50 (individual) → $32.496.116,50 (multi-objetivo) | {{DATO:lgp_costo}} | {{DATO:er_costo}} |
| Emisiones (γ) | 524 kg CO₂/semana (individual) → 524,8 kg CO₂/semana (multi-objetivo) | {{DATO:lgp_emisiones}} | {{DATO:er_emisiones}} |
| Empleo (β) | 242 personas/semana (individual) → 179 personas/semana (multi-objetivo) | {{DATO:lgp_empleo}} | {{DATO:er_empleo}} |

**Matriz de pagos del paper (Tabla 22):**

| FO Económica | FO Social | FO Ambiental |
|--------------|-----------|---------------|
| $37.865.073,50 | 179 personas | 586,78725 kg CO₂ |
| $42.835.663,00 | 242 personas | 586,78725 kg CO₂ |
| $37.865.073,50 | 242 personas | 524 kg CO₂ |

> **Nota**: Los valores de épsilon seleccionados fueron ES = 179 personas/semana y EA = 524,8 kg CO₂/semana.
