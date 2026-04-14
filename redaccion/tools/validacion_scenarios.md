# Validación de Scenario Presets vs Rangos

## Resumen Ejecutivo

| Escenario | Estado | Parámetros con Problemas |
|-----------|--------|-------------------------|
| boom_demanda | ✅ Válido (LGP+ER) | Ninguno — CV:+25% bien dentro de +100% |
| crecimiento | ✅ Válido | Ninguno |
| expansion | ⚠️ Revisar | CRI: 20% cerca del límite 24% |
| transicion_verde | ✅ Válido | Ninguno |
| regulacion_ambiental | ✅ Válido | Ninguno |
| super_eficiencia | ⚠️ Revisar | CA/CB/CC: 60% altos pero dentro |
| fomento_laboral | ⚠️ Revisar | CA/CB/CC: 80% muy altos |
| crisis_climatica | ⚠️ Revisar | H: -40% cerca del límite -79.7% |
| huelga_transporte | ⚠️ Revisar | CT/CTT: 45% altos, CV: -35% cerca de -98.2% |

## Matriz de Validación Detallada

### Eje 1: Contexto Macroeconómico y Demanda

#### boom_demanda
| Parámetro | Variación | Límite Aumento | Límite Disminución | Estado |
|-----------|-----------|----------------|-------------------|--------|
| DI | +9% | 34.4% | 99% | ✅ Válido |
| DD | +9% | 38.3% | 99% | ✅ Válido |
| CV | +25% | 100% | 98.2% | ✅ Válido |

**Nota (2026-04-14):** Preset rediseñado de {DI:9, DD:9, CN:15, CH:15} → {DI:9, DD:9, CV:25}. CN/CH causaban infactibilidad Gurobi. CV+25% reduce viajes, emisiones=1016.79 < ε=1088.25, factible LGP+ER. Resultado: costo $138.11M, emisiones 1016.79 kg CO₂, empleo 1545.

#### crecimiento
| Parámetro | Variación | Límite Aumento | Límite Disminución | Estado |
|-----------|-----------|----------------|-------------------|--------|
| DI | +12% | 34.4% | 99% | ✅ Válido |
| DD | +15% | 38.3% | 99% | ✅ Válido |
| H | +30% | 100% | 79.7% | ✅ Válido |
| RA | -5% | 100% | 99% | ✅ Válido |

### Eje 2: Estrategia Corporativa

#### expansion
| Parámetro | Variación | Límite Aumento | Límite Disminución | Estado |
|-----------|-----------|----------------|-------------------|--------|
| H | +50% | 100% | 79.7% | ✅ Válido |
| CA | +25% | 100% | 99% | ✅ Válido |
| CB | +25% | 100% | 99% | ✅ Válido |
| CC | +25% | 100% | 99% | ✅ Válido |
| CRI | +20% | 100% | **24%** | ⚠️ 83% del límite |
| CR | +20% | 100% | 27.8% | ⚠️ 72% del límite |

### Eje 3: Sostenibilidad y Viabilidad Verde

#### transicion_verde
| Parámetro | Variación | Límite Aumento | Límite Disminución | Estado |
|-----------|-----------|----------------|-------------------|--------|
| IT | -25% | 100% | 99% | ✅ Válido |
| CV | +30% | 100% | 98.2% | ✅ Válido |
| CI | +12% | 100% | 99% | ✅ Válido |
| CT | +10% | 100% | 99% | ✅ Válido |
| CTT | +10% | 100% | 99% | ✅ Válido |

#### regulacion_ambiental
| Parámetro | Variación | Límite Aumento | Límite Disminución | Estado |
|-----------|-----------|----------------|-------------------|--------|
| IT | -15% | 100% | 99% | ✅ Válido |
| P | -10% | 100% | 99% | ✅ Válido |
| PP | -10% | 100% | 99% | ✅ Válido |
| CI | +8% | 100% | 99% | ✅ Válido |
| CDA | +5% | 100% | 99% | ✅ Válido |
| CDF | +5% | 100% | 99% | ✅ Válido |

### Eje 4: Impacto Social y Automatización

#### super_eficiencia
| Parámetro | Variación | Límite Aumento | Límite Disminución | Estado |
|-----------|-----------|----------------|-------------------|--------|
| CA | +60% | 100% | 99% | ⚠️ Alto pero válido |
| CB | +60% | 100% | 99% | ⚠️ Alto pero válido |
| CC | +60% | 100% | 99% | ⚠️ Alto pero válido |
| CMO | -20% | 100% | 99% | ✅ Válido |
| CD | -20% | 100% | 99% | ✅ Válido |
| CMP | -20% | 100% | 99% | ✅ Válido |
| CP | +8% | 100% | 99% | ✅ Válido |

#### fomento_laboral
| Parámetro | Variación | Límite Aumento | Límite Disminución | Estado |
|-----------|-----------|----------------|-------------------|--------|
| CA | +80% | 100% | 99% | ⚠️ Muy alto |
| CB | +80% | 100% | 99% | ⚠️ Muy alto |
| CC | +80% | 100% | 99% | ⚠️ Muy alto |
| CMO | +40% | 100% | 99% | ✅ Válido |
| CD | +40% | 100% | 99% | ✅ Válido |
| CMP | +40% | 100% | 99% | ✅ Válido |

### Eje 5: Vulnerabilidad y Límites

#### crisis_climatica
| Parámetro | Variación | Límite Aumento | Límite Disminución | Estado |
|-----------|-----------|----------------|-------------------|--------|
| H | -40% | 100% | **79.7%** | ⚠️ 50% del límite |
| RA | -25% | 100% | 99% | ✅ Válido |
| RC | -20% | 100% | **79.7%** | ⚠️ 25% del límite |
| RD | -30% | 100% | 99% | ✅ Válido |
| CP | +18% | 100% | 99% | ✅ Válido |
| P | +15% | 100% | 99% | ✅ Válido |
| PP | +10% | 100% | 99% | ✅ Válido |

#### huelga_transporte
| Parámetro | Variación | Límite Aumento | Límite Disminución | Estado |
|-----------|-----------|----------------|-------------------|--------|
| CV | -35% | 100% | **98.2%** | ⚠️ 36% del límite |
| CT | +45% | 100% | 99% | ⚠️ Alto |
| CTT | +45% | 100% | 99% | ⚠️ Alto |
| CRI | -10% | 100% | **24%** | ⚠️ 42% del límite |
| CR | -10% | 100% | 27.8% | ⚠️ 36% del límite |
| IT | +20% | 100% | 99% | ✅ Válido |

## Recomendaciones

### Parámetros Críticos (requieren atención)
1. **CRI**: Límite de disminución solo 24% - muy restrictivo
2. **CR**: Límite de disminución solo 27.8% - restrictivo
3. **CN**: Límite de disminución 54.9% - moderadamente restrictivo
4. **CH**: Límite de disminución 55.7% - moderadamente restrictivo
5. **RC**: Límite de disminución 79.7% - crisis_climatica usa -20%
6. **H**: Límite de disminución 79.7% - crisis_climatica usa -40%

### Escenarios que Necesitan Ajuste
- **expansion**: CRI +20% está cerca del límite de disminución (24%)
- **huelga_transporte**: Múltiples parámetros cercanos a límites
- **fomento_laboral**: CA/CB/CC a 80% son variaciones muy agresivas

## Rangos de Todos los Parámetros

| Parámetro | Límite + | Límite - | Mín Valor | Máx Valor |
|-----------|----------|----------|-----------|-----------|
| DI | 34.4% | 99% | 167.8 | 22,552 |
| DD | 38.3% | 99% | 131.0 | 18,117 |
| CP | 100% | 99% | 5.51 | 1,102 |
| CI | 100% | 99% | 1.19 | 237 |
| CT | 100% | 99% | 0.0075 | 1.51 |
| CTT | 100% | 99% | 0.20 | 40.95 |
| CDA | 100% | 99% | 6.25 | 1,249 |
| CDF | 100% | 99% | 15.71 | 3,142 |
| CMO | 100% | 99% | 5,644 | 1,128,828 |
| CD | 100% | 99% | 4,900 | 980,000 |
| CMP | 100% | 99% | 500 | 100,000 |
| IT | 100% | 99% | 0.0058 | 1.15 |
| P | 100% | 99% | 0.0004 | 0.076 |
| PP | 100% | 99% | 0.0007 | 0.146 |
| RB | 100% | 99% | 25.85 | 5,170 |
| RA | 100% | 99% | 1.03 | 206 |
| RC | 100% | 79.7% | 152.25 | 1,500 |
| RD | 100% | 99% | 1.0 | 200 |
| CA | 100% | 99% | 0.4 | 80 |
| CB | 100% | 99% | 0.22 | 43.7 |
| CC | 100% | 99% | 1.23 | 245 |
| CN | 100% | 54.9% | 17,149 | 76,050 |
| CH | 100% | 55.7% | 16,845 | 76,050 |
| CRI | 100% | 24% | 24,928 | 65,600 |
| CR | 100% | 27.8% | 18,844 | 52,200 |
| CV | 100% | 98.2% | 51.43 | 5,714 |
| H | 100% | 79.7% | 22.72 | 223.8 |
