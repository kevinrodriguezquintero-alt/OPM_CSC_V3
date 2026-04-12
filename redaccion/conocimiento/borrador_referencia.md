# Borrador de Referencia — Estructura Narrativa de la Tesis

> **Estado**: Referencia estática — Guía de distribución de contenidos
> **Origen**: `docs/Borrador Actual.md`
> **Uso**: Contexto narrativo y argumentativo. No es plantilla editable por ahora.
> **Nota**: Este contenido podrá migrarse a plantillas formales (caps 1-4) en una fase posterior si se requiere.

---

## Tabla de Contenido del Documento

| Sección | Título | Ubicación en Esquema Modular | Tipo de Contenido |
|---------|--------|---------------------------|-------------------|
| — | **Resumen** | `borrador_referencia.md` | Síntesis del trabajo |
| — | **Introducción** | `borrador_referencia.md` | Contexto general |
| — | **Problema del trabajo de grado** | `borrador_referencia.md` | Análisis de problemática |
| — | **Planteamiento del problema** | `borrador_referencia.md` | Definición específica |
| — | **Objetivos** | `borrador_referencia.md` | Marco orientador |
| — | — Objetivo General | `borrador_referencia.md` | Propósito global |
| — | — Objetivos Específicos | `borrador_referencia.md` | Metas concretas |
| **5** | **Desarrollo de los objetivos** | Ver subsecciones abajo | Núcleo del trabajo |
| **5.1** | **Objetivo 1:** Establecer el modelo multiobjetivo a partir de los aspectos característicos identificados en el caso de estudio de referencia. | `conocimiento/paper_referencia.md` + `borrador_referencia.md` | Análisis del caso base |
| | — Antecedentes relevantes | `conocimiento/paper_referencia.md` | Formulaciones Arenas & Salazar |
| | — Metodología | `conocimiento/Diseno_Metodologico.md` (Fase 1) | Revisión bibliográfica |
| | — Resultados | `conocimiento/paper_referencia.md` | Tablas de pagos del paper |
| **5.2** | **Objetivo 2:** Formular un modelo de optimización multiobjetivo para la toma de decisiones operativas sostenibles de una cadena de abastecimiento de pequeños productores frutícolas. | `plantillas/obj2_fase*.md` | **NÚCLEO TÉCNICO** |
| | — Antecedentes relevantes | `conocimiento/paper_referencia.md` + `conocimiento/notacion.md` | Modelo de referencia |
| | — Metodología | `plantillas/obj2_fase2_formulacion.md` + `plantillas/obj2_fase3_implementacion.md` | Formulación e implementación LGP |
| | — Resultados | `plantillas/obj2_fase4_sensibilidad.md` | Análisis de sensibilidad |
| **5.3** | **Objetivo 3:** Evaluar el desempeño del modelo mediante un análisis comparativo con el caso de estudio de referencia. | `plantillas/obj3_fase5_comparativo.md` | **EVALUACIÓN** |
| | — Antecedentes relevantes | `conocimiento/paper_referencia.md` | Comparación con paper |
| | — Metodología | `plantillas/obj2_fase2_formulacion.md` (sección LGP) | Justificación método |
| | — Resultados | `plantillas/obj3_fase5_comparativo.md` | Comparación LGP vs ER |
| — | **Conclusiones** | `borrador_referencia.md` (resumen) | Cierre del trabajo |
| — | **Bibliografía** | `conocimiento/normativas.md` | Fuentes consultadas |

> **Nota sobre flujo:** El documento sigue una estructura por **objetivos específicos**. El Objetivo 2 (formulación + implementación + sensibilidad) y el Objetivo 3 (evaluación comparativa) son el núcleo técnico actualizable mediante el esquema modular. Los objetivos son el hilo conductor que organiza el contenido técnico.

---

## 1. Resumen / Introducción

Este trabajo desarrolla un modelo matemático de optimización multiobjetivo para la toma de decisiones operativas sostenibles en la cadena de suministro citrícola de pequeños productores en Andalucía, Valle del Cauca. El modelo busca equilibrar tres dimensiones:
- **Económica:** Minimización de costos logísticos globales.
- **Ambiental:** Minimización de emisiones de CO2 asociadas al transporte.
- **Social:** Maximización de la generación de empleo en la cadena.

Se utiliza la **Programación por Metas Lexicográfica (LGP)** como alternativa al método de $\epsilon$-constraint utilizado en estudios previos, permitiendo una jerarquización clara de objetivos y garantizando soluciones Pareto eficientes.

---

## 2. Definición del Problema

La cadena citrícola en el Valle del Cauca (70% pequeños productores) enfrenta altos costos logísticos (hasta 19% del precio final), una huella ambiental significativa por transporte informal y una generación de empleo rural frágil. El problema central es que las optimizaciones en una sola dimensión suelen deteriorar las otras, requiriendo un enfoque integrado.

---

## 3. Objetivos

### 3.1 Objetivo General
Proponer un modelo de optimización multiobjetivo para el análisis del efecto en las decisiones operativas sostenibles de una cadena de abastecimiento citrícola de pequeños productores.

### 3.2 Objetivos Específicos
1. Establecer el modelo multiobjetivo a partir de los aspectos característicos del caso de estudio de referencia.
2. Formular un modelo de optimización multiobjetivo para la toma de decisiones operativas sostenibles.
3. Evaluar el desempeño del modelo mediante un análisis comparativo con el caso de estudio de referencia.

---

## 4. Metodología y Selección del Método

Se selecciona la **Programación por Metas Lexicográfica (LGP)** debido a:
- Eliminación de parámetros de calibración subjetivos (como los $\epsilon$).
- Garantía de eficiencia de Pareto (evita puntos dominados).
- Jerarquía explícita: **P1 (Costo) > P2 (Ambiental) > P3 (Social)**.

---

## 5-8. Ver Plantillas Correspondientes

Los capítulos técnicos (5-8) están en las plantillas del esquema modular:
- **Cap 5**: `plantillas/obj2_fase2_formulacion.md`
- **Cap 6**: `plantillas/obj2_fase3_implementacion.md`
- **Cap 7**: `plantillas/obj2_fase4_sensibilidad.md`
- **Cap 8**: `plantillas/obj3_fase5_comparativo.md`

---

## Conclusiones (del borrador)

- El sistema muestra holgura en la producción agrícola pero saturación en la red de distribución.
- La **LGP** es superior para gestionar el "espacio de compromiso" entre objetivos, alineándose con las necesidades de pequeños productores que priorizan estabilidad social sobre el ahorro económico marginal.
- Las decisiones cambian drásticamente bajo presión máxima dependiendo de si la prioridad es el costo puro o la responsabilidad social/ambiental.

---

## Información de Contexto

**Autores:** Kevin Andres Rodriguez Quintero, Lesly Damaris Escobar Martínez  
**Director:** Diego Leon Peña Orozco  
**Institución:** Universidad del Valle, Facultad de Ingeniería, Escuela de Ingeniería Industrial  
**Año:** 2026
