# Metodología de Análisis de Sostenibilidad y Sensibilidad (LGP & ER)

Esta documentación detalla la implementación técnica y metodológica de los análisis de **Sensibilidad (OAT)**, **Rangos** y **Escenarios** en el sistema, asegurando la máxima coherencia para la redacción de la tesis.

---

## 1. El Concepto de "Punto Fijo" (Baseline Maestro)

Para garantizar que todos los análisis comparativos partan de una base inamovible y coherente con el capítulo de resultados principales, el sistema utiliza un esquema de **Punto Fijo**.

- **Modo Maestro**: En lugar de recalcular el escenario base (0% de cambio) en cada petición, el sistema carga los resultados directamente desde los archivos maestros de resultados consolidados.
- **Beneficios**:
    - **Coherencia**: Los valores base siempre coinciden al centavo con los reportados en la tesis.
    - **Rendimiento**: Se reduce el tiempo de espera en el Dashboard de segundos a milisegundos.

## 2. Funcionamiento por Método

### Método LGP (Lexicographic Goal Programming)
- **Base**: Se carga desde `maestros/lgp.json`.
- **Análisis (OAT/Escenarios)**: Ante cualquier cambio en parámetros, el sistema vuelve a ejecutar la **secuencia completa de 3 pasos** (Costo → Emisiones → Empleo). Esto asegura que la jerarquía de prioridades se respete bajo las nuevas condiciones.

### Método ER (Epsilon-Constraint)
- **Base / Referencia**: Se utiliza la **Iteración 78** (Knee Point), cargada desde `maestros/er.json`.
- **Análisis (OAT/Escenarios)**: El sistema realiza un **único proceso de optimización** (Minimizar Costo) fijando el nivel de emisiones al valor de la Iteración 78 (`1088.25 kg`). Esto permite evaluar la sensibilidad del "Escenario Sostenible" elegido.

## 3. Guía de Interpretación de Resultados

| Análisis | Propósito | Aplicación en la Tesis |
| :--- | :--- | :--- |
| **OAT (Efecto Local)** | Evaluar la sensibilidad de una única variable (ej. Diesel). | Identificación de los "drivers" de costo y emisiones. |
| **Escenarios (Efecto Global)** | Evaluar el impacto de cambios combinados (ej. Escenario de Crisis). | Análisis de resiliencia de la cadena de suministro. |
| **Rangos (Estabilidad)** | Determinar hasta qué punto los parámetros pueden cambiar sin variar la base tecnológica. | Validación de la robustez de la solución óptima. |

---

> [!NOTE]
> **Nota de Implementación**: Esta lógica está centralizada en `api/routers/solve.py`. Cada vez que realices una consolidación de resultados mediante el script de herramientas, los maestros se actualizarán y los análisis secundarios reflejarán automáticamente los nuevos puntos base.
