# Justificación Técnica del Punto de Equilibrio (Iteración 78)

Este documento detalla el análisis realizado sobre la frontera de Pareto de 100 iteraciones para la selección del "Knee Point" o punto de codo óptimo en el modelo multiobjetivo.

## 1. Resumen de la Frontera de Pareto

Tras ejecutar el método de $\epsilon$-restricción con 100 pasos, se identificaron los siguientes escenarios clave:

| Escenario | Iteración | Costo (Costo) | Emisiones (Env) | Empleo (Soc) | Var. Costo % | Var. Emisiones % |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Dominancia Económica** | 1 | $126,377,407.96 | 1,220.61 | 1,415 | 0.00% | 0.00% |
| **Salto Eficiencia Inicial**| 57 | $126,427,610.75 | 1,152.47 | 1,417 | +0.04% | -5.58% |
| **Punto Dulce (Elegido)** | **78** | **$126,835,796.57** | **1,088.25** | **1,418** | **+0.36%** | **-10.84%** |
| **Dominancia Ambiental** | 100 | $133,022,703.58 | 1,074.24 | 1,478 | +5.25% | -11.99% |

## 2. Racional de Selección: El Método del Codo (Knee Point)

La **Iteración 78** fue seleccionada como el punto de referencia para la tesis debido a que representa el equilibrio más eficiente entre los objetivos económicos, ambientales y sociales.

### A. Máxima Eficiencia Ambiental por Dólar Invertido
En la iteración 78, el modelo logra capturar el **90.4% del potencial total de reducción de emisiones** (una baja del 10.84% frente al máximo teórico de 11.99%). Lo logra con un incremento en el costo de apenas **0.36%**. 

### B. Análisis de Rendimientos Decrecientes
A partir de la iteración 78, la curva de Pareto experimenta un cambio de pendiente drástico:
*   Para pasar de la Iteración 1 a la 78, "compramos" un **10.84% de sostenibilidad** por solo **$458,388**.
*   Para pasar de la Iteración 78 a la 100 y ganar el **1.15% ambiental restante**, la inversión necesaria se dispara a **$6,186,907** adicionales.

Esto demuestra que la Iteración 78 es el límite de la **zona de rentabilidad ambiental**, donde cada dólar invertido produce el máximo impacto positivo antes de que los costos se vuelvan prohibitivos.

### C. Estabilidad Social
Aunque el modelo socialmente óptimo (Iter 100) genera 1,478 empleos, la Iteración 78 mantiene un nivel de empleo estable (1,418) superando el mínimo económico, lo que garantiza que la dimensión social no se vea sacrificada.

## 3. Conclusión para la Tesis
La elección de la **Iteración 78** permite defender una política de Sostenibilidad Proactiva pero Realista. Se demuestra que es posible reducir la huella de carbono en más de un 10% sin comprometer la viabilidad financiera de la cadena de suministro, cumpliendo así con los pilares del Triple Bottom Line (Gente, Planeta, Ganancia).

## 4. Implementación Computacional

Para garantizar la coherencia metodológica en la tesis, el sistema de software ha sido configurado para que la **Iteración 78** actúe como el **Punto de Referencia Fijo (Baseline)**.

- **Fijación de Parámetros**: El sistema carga automáticamente el límite de emisiones ($\epsilon = 1088.25$) desde el archivo maestro.
- **Análisis de Sensibilidad y Escenarios**: Todos los resultados comparativos (OAT y Escenarios) se calculan tomando este punto sostenible como la base del 100%, eliminando discrepancias matemáticas entre los distintos capítulos del documento.
- **Robustez**: Al tratar la Iteración 78 como un resultado determinista similar al LGP, se facilita la comunicación de los hallazgos y la reproducibilidad de los datos por parte de otros investigadores.
