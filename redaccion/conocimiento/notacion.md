# Nomenclatura Matemática del Modelo

> Fuente: `02-api-model/data/params.py` y `02-api-model/solvers/build_model.py`
> Este documento define la notación canónica. Toda redacción debe usar estos símbolos.

---

## 1. Conjuntos

| Símbolo | Código | Descripción | Cardenalidad |
|---------|--------|-------------|-------------|
| I | `model.I` | Centro(s) de acopio (productores) | \|I\| = 1 |
| J | `model.J` | Intermediarios | \|J\| = 7 |
| K | `model.K` | Detallistas | \|K\| = 4 |
| U | `model.U` | Variantes de productor (binarias) | \|U\| = 10 |

---

## 2. Variables de Decisión

| Símbolo | Código | Tipo | Índice | Descripción |
|---------|--------|------|--------|-------------|
| X_{ij} | `m.X[i,j]` | ℝ⁺ | I×J | Cantidad enviada de productor i a intermediario j (Kg) |
| Y_{jk} | `m.Y[j,k]` | ℝ⁺ | J×K | Cantidad enviada de intermediario j a detallista k (Kg) |
| Z_{ij} | `m.Z[i,j]` | ℤ⁺ | I×J | Número de viajes de productor i a intermediario j |
| ZZ_{jk} | `m.ZZ[j,k]` | ℤ⁺ | J×K | Número de viajes de intermediario j a detallista k |
| W_i | `m.W[i]` | ℝ⁺ | I | Hectáreas activadas por productor i |
| S | `m.S` | ℤ⁺ | escalar | Personal en centro de acopio |
| SS_j | `m.SS[j]` | ℤ⁺ | J | Personal en intermediario j |
| SSS_k | `m.SSS[k]` | ℤ⁺ | K | Personal en detallista k |
| B_u | `m.B[u]` | {0,1} | U | Variable binaria de activación de productor u |

---

## 3. Parámetros

### 3.1 Rendimientos y Hectáreas

| Símbolo | Código | Tipo | Descripción | Unidades |
|---------|--------|------|-------------|----------|
| RB | `m.RB` | escalar | Rendimiento máximo global | Kg/Ha/semana |
| RA_u | `m.RA[u]` | dict(U) | Rendimiento por variante u | Kg/Ha/semana |
| RC_i | `m.RC[i]` | dict(I) | Rendimiento máximo cultivo i | Kg/Ha/semana |
| RD_i | `m.RD[i]` | dict(I) | Rendimiento mínimo cultivo i | Kg/Ha/semana |
| H_u | `m.H[u]` | dict(U) | Hectáreas por variante u | Ha |

### 3.2 Capacidades de Personal

| Símbolo | Código | Tipo | Descripción | Unidades |
|---------|--------|------|-------------|----------|
| CA | `m.CA` | escalar | Capacidad productiva persona en centro de acopio | Kg/persona |
| CB_j | `m.CB[j]` | dict(J) | Capacidad productiva persona en intermediario j | Kg/persona |
| CC_k | `m.CC[k]` | dict(K) | Capacidad productiva persona en detallista k | Kg/persona |

### 3.3 Costos

| Símbolo | Código | Tipo | Descripción | Unidades |
|---------|--------|------|-------------|----------|
| CP_i | `m.CP[i]` | dict(I) | Costo de producción en productor i | $/Kg |
| CMP | `m.CMP` | escalar | Costo mano de obra centro de acopio | $/semana |
| CI_j | `m.CI[j]` | dict(J) | Costo procesamiento intermediario j | $/Kg |
| CMO_j | `m.CMO[j]` | dict(J) | Costo mano de obra intermediario j | $/semana |
| CD_k | `m.CD[k]` | dict(K) | Costo mano de obra detallista k | $/semana |
| CT_{ij} | `m.CT[i,j]` | dict(I×J) | Costo transporte productor i → intermediario j (flujo 1) | **$/km/viaje** |
| CTT_{jk} | `m.CTT[j,k]` | dict(J×K) | Costo transporte intermediario j → detallista k (flujo 2) | **$/km/viaje** |

> **Nota de divergencia con el paper**: Arenas & Salazar (2018) usan el mismo parámetro CT para ambos flujos. En nuestra implementación se mantienen separados como CT (flujo 1) y CTT (flujo 2) porque representan estructuras de costo diferentes que no pueden unificarse en un valor único (diferentes distancias, vehículos, y condiciones logísticas por etapa).
| CDA_{ij} | `m.CDA[i,j]` | dict(I×J) | Costo por daño producto en flujo 1 | $/Kg |
| CDF_{jk} | `m.CDF[j,k]` | dict(J×K) | Costo por daño producto en flujo 2 | $/Kg |

### 3.4 Merma y Demanda

| Símbolo | Código | Tipo | Descripción | Unidades |
|---------|--------|------|-------------|----------|
| P_{ij} | `m.P[i,j]` | dict(I×J) | Porcentaje de daño en flujo 1 (i→j) | adimensional |
| PP_{jk} | `m.PP[j,k]` | dict(J×K) | Porcentaje de daño en flujo 2 (j→k) | adimensional |
| DI_j | `m.DI[j]` | dict(J) | Demanda intermediario j | Kg |
| DD_k | `m.DD[k]` | dict(K) | Demanda detallista k | Kg |

### 3.5 Capacidades Operativas

| Símbolo | Código | Tipo | Descripción | Unidades |
|---------|--------|------|-------------|----------|
| CN_i | `m.CN[i]` | dict(I) | Capacidad de producción productor i | Kg |
| CH_i | `m.CH[i]` | dict(I) | Capacidad de despacho productor i | Kg |
| **CRI_j** | `m.CRI[j]` | dict(J) | **Capacidad de recepción/despacho intermediario j** | Kg |
| CR_k | `m.CR[k]` | dict(K) | Capacidad de recepción detallista k | Kg |
| CV_j | `m.CV[j]` | dict(J) | Capacidad del vehículo en intermediario j | Kg/viaje |

### 3.6 Ambiental y Distancias

| Símbolo | Código | Tipo | Descripción | Unidades |
|---------|--------|------|-------------|----------|
| DPI_{ij} | `m.DPI[i,j]` | dict(I×J) | Distancia productor i → intermediario j | km |
| DID_{jk} | `m.DID[j,k]` | dict(J×K) | Distancia intermediario j → detallista k | km |
| IT_j | `m.IT[j]` | dict(J) | Factor de emisión CO₂ del intermediario j | Kg CO₂/km |
| M | `m.M` | escalar | Límite máximo de kilómetros recorridos | km/semana |

---

## 4. Funciones Objetivo

| Nombre | Símbolo | Prioridad LGP | Expresión |
|--------|---------|---------------|-----------|
| Económica | α | P1 | Min α = ΣΣ CP·X_{ij} + ΣΣ CI_j·X_{ij} + CMP·S + Σ CMO_j·SS_j + Σ CD_k·SSS_k + **ΣΣ CT_{ij}·Z_{ij}·DPI_{ij}** + **ΣΣ CTT_{jk}·ZZ_{jk}·DID_{jk}** + ΣΣ CDA_{ij}·P_{ij}·X_{ij} + ΣΣ CDF_{jk}·PP_{jk}·Y_{jk} |
| Ambiental | γ | P2 | Min γ = ΣΣ Z_{ij}·DPI_{ij}·IT_j + ΣΣ ZZ_{jk}·DID_{jk}·IT_j |
| Social | β | P3 | Max β = S + Σ SS_j + Σ SSS_k |

> **✅ CORREGIDO**: La expresión de transporte en α ahora usa `CT·Z·DPI` y `CTT·ZZ·DID` (costo por km/viaje × viajes × distancia), coherente con el paper Arenas & Salazar (2018) y dimensionalmente consistente con la función ambiental γ.

---

## 5. Restricciones (Resumen)

| # | Nombre | Código | Categoría | Expresión |
|---|--------|--------|-----------|-----------|
| 4 | Rendimientos | `var_bina` | Producción | Σ RA_u·B_u ≤ RB |
| 5 | Balance hectáreas | `suma_w` | Producción | Σ B_u·H_u = W_i |
| 6 | Cap. producción | `cap_pro` | Producción | RC_i·W_i ≤ CN_i |
| 7 | Despacho productor | `cap_desI` | Capacidad | Σ X_{ij} ≤ CH_i |
| 8 | **Recepción intermediario** | `cap_desJ` | Capacidad | Σ Y_{jk} ≤ **CRI_j** |
| 9 | Recepción detallista | `cap_rec` | Capacidad | Σ Y_{jk} ≤ CR_k |
| 10 | Cap. vehículo flujo 1 | `cap_veh` | Transporte | X_{ij} ≤ CV_j·Z_{ij} |
| 11 | Cap. vehículo flujo 2 | `cap_vehh` | Transporte | Y_{jk} ≤ CV_j·ZZ_{jk} |
| 12 | Demanda intermediario | `cap_demI` | Demanda | Σ X_{ij} ≥ DI_j |
| 13 | Demanda detallista | `cap_demD` | Demanda | Σ Y_{jk} ≥ DD_k |
| 14 | Balance de masa | `cap_balce` | Balance | Σ Y_{jk} = Σ X_{ij}·(1-P_{ij}) - Σ PP_{jk}·Y_{jk} |
| 15 | Límite max cantidad | `cap_opemax` | Cantidades | Σ X_{ij} ≤ RC_i·W_i |
| 16 | Límite min cantidad | `cap_opemin` | Cantidades | Σ X_{ij} ≥ RD_i·W_i |
| 17 | Viajes flujo 1 | `cap_opeB` | Viajes | Σ Z_{ij} ≤ Σ (X_{ij}/CV_j) + 1 |
| 18 | Viajes flujo 2 | `cap_opeC` | Viajes | Σ ZZ_{jk} ≤ Σ (Y_{jk}/CV_j) + 1 |
| 19 | Personal acopio | `cap_perI` | Personal | ΣΣ X_{ij} = S·CA |
| 20 | Personal intermediario | `cap_perJ` | Personal | Σ X_{ij} = SS_j·CB_j |
| 21 | Personal detallista | `cap_perD` | Personal | Σ Y_{jk} = SSS_k·CC_k |
| 22 | Kilometraje máximo | `cap_km` | Ambiental | Σ Z_{ij}·DPI_{ij} + Σ ZZ_{jk}·DID_{jk} ≤ M |
| **23** | **Naturaleza variables** | — | Declaración | X_{ij}, Y_{jk}, W_i ∈ ℝ⁺ |
| **24** | **Naturaleza enteras** | — | Declaración | Z_{ij}, ZZ_{jk}, S, SS_j, SSS_k ∈ ℤ⁺ |
| **25** | **Naturaleza binaria** | — | Declaración | B_u ∈ {0, 1} |
