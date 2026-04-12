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
| CT_{ij} | `m.CT[i,j]` | dict(I×J) | Costo transporte productor i → intermediario j | $/Kg |
| CTT_{jk} | `m.CTT[j,k]` | dict(J×K) | Costo transporte intermediario j → detallista k | $/Kg |
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
| CHI_j | `m.CHI[j]` | dict(J) | Capacidad de despacho intermediario j | Kg |
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
| Económica | α | P1 | Min α = ΣΣ CP·X_{ij} + ΣΣ CI_j·X_{ij} + CMP·S + Σ CMO_j·SS_j + Σ CD_k·SSS_k + ΣΣ CT_{ij}·X_{ij} + ΣΣ CTT_{jk}·Y_{jk} + ΣΣ CDA_{ij}·P_{ij}·X_{ij} + ΣΣ CDF_{jk}·PP_{jk}·Y_{jk} |
| Ambiental | γ | P2 | Min γ = ΣΣ Z_{ij}·DPI_{ij}·IT_j + ΣΣ ZZ_{jk}·DID_{jk}·IT_j |
| Social | β | P3 | Max β = S + Σ SS_j + Σ SSS_k |

> **NOTA PENDIENTE**: La expresión de transporte en α usa `CT·X` en el código actual.
> Verificar contra el paper si debe ser `CT·Z·DPI` (costo por viaje×distancia).
> Esto afecta la ecuación (1) y la coherencia con la función ambiental γ.

---

## 5. Restricciones (Resumen)

| # | Nombre | Código | Categoría |
|---|--------|--------|-----------|
| 4 | Rendimientos | `var_bina` | Producción |
| 5 | Balance hectáreas | `suma_w` | Producción |
| 6 | Cap. producción | `cap_pro` | Producción |
| 7 | Despacho productor | `cap_desI` | Capacidad |
| 8 | Despacho intermediario | `cap_desJ` | Capacidad |
| 9 | Recepción detallista | `cap_rec` | Capacidad |
| 10 | Cap. vehículo flujo 1 | `cap_veh` | Transporte |
| 11 | Cap. vehículo flujo 2 | `cap_vehh` | Transporte |
| 12 | Demanda intermediario | `cap_demI` | Demanda |
| 13 | Demanda detallista | `cap_demD` | Demanda |
| 14 | Balance de masa | `cap_balce` | Balance |
| 15 | Límite max transporte | `cap_opemax` | Cantidades |
| 16 | Límite min transporte | `cap_opemin` | Cantidades |
| 17 | Viajes flujo 1 | `cap_opeB` | Viajes |
| 18 | Viajes flujo 2 | `cap_opeC` | Viajes |
| 19 | Personal acopio | `cap_perI` | Personal |
| 20 | Personal intermediario | `cap_perJ` | Personal |
| 21 | Personal detallista | `cap_perD` | Personal |
| 22 | Kilometraje máximo | `cap_km` | Ambiental |
