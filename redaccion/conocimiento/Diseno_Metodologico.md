# Diseño Metodológico

Con el propósito de alcanzar los objetivos propuestos se plantea una metodología organizada en etapas; comprendiendo que para la toma de decisiones operativas sostenibles de una cadena de abastecimiento frutícola no solo se ven implicados procesos logísticos, sino también decisiones estratégicas que deben balancear intereses económicos, impactos ambientales y condiciones sociales, particularmente en el entorno rural donde predominan pequeños productores. Metodología que se estructura de la revisión de trabajos anteriores, como los realizados por (Arenas Ruiz & Salazar Aguirre, 2018), (Mármol Barriosnuevo & Diaz Sierra, 2024), (Sotelo Cortés, 2017) y (Moreno, 2018), donde se han modelado cadenas agroalimentarias bajo criterios de sostenibilidad.

## Objetivo 1:
**Establecer el modelo multiobjetivo a partir de los aspectos característicos identificados en el caso de estudio de referencia.**

### Fase 1: Revisión bibliográfica y metodológica
En esta fase se pretende realizar una revisión de literatura académica con el objetivo de identificar los métodos de optimización multiobjetivo que han sido aplicados en el contexto agroalimentario, particularmente para la creación de cadenas de suministro sostenibles, y se seleccionarán los criterios comparativos y la técnica más adecuada para el desarrollo del modelo.

**Actividad 1.1: Análisis del caso de estudio**
Se examinarán las variables, restricciones y funciones objetivo del modelo desarrollado por Arenas Ruiz y Salazar Aguirre (2018), con el fin de identificar sus componentes críticos; se documentarán los elementos que pueden ser aprovechados, modificados o descartados.

**Actividad 1.2: Búsqueda y selección de fuentes académicas**
Se realizará una revisión de literatura académica en bases de datos como Scopus, ScienceDirect, Redalyc y Google Scholar, enfocada en estudios que aborden la toma de decisiones operativas en cadenas de abastecimiento sostenibles mediante técnicas de optimización multiobjetivo. La búsqueda incluirá publicaciones entre 2010 y 2025, utilizando palabras clave como multi-objective optimization, sustainable supply chain, programación multiobjetivo y agri-food logistics. Los documentos seleccionados serán filtrados con base en su utilidad metodológica y su aplicación al contexto agroalimentario.

**Actividad 1.3: Matriz analítica de métodos de investigación**
Con el objetivo de contrastar los resultados de la búsqueda, se elaborará una matriz que sintetice las características de cada enfoque identificado: su fundamentación, ventajas, limitaciones, tipo de datos requeridos y resultados alcanzados en los estudios revisados.

**Actividad 1.4: Selección del enfoque de optimización multiobjetivo**
A partir del análisis comparativo realizado en la matriz, se seleccionará el método de optimización multiobjetivo más adecuado para la formulación del modelo propuesto, considerando su aplicabilidad al contexto frutícola, su capacidad para integrar múltiples dimensiones de sostenibilidad y su compatibilidad con herramientas computacionales.

## Objetivo 2:
**Formular un modelo de optimización multiobjetivo para la toma de decisiones operativas sostenibles de una cadena de abastecimiento de pequeños productores frutícolas.**

### Fase 2: Formulación del modelo multiobjetivo
En esta fase se construirá un modelo matemático que integre criterios de sostenibilidad en la toma de decisiones operativas de una cadena frutícola. En base al caso de estudio, se definirán las variables de decisión, las funciones objetivo y las restricciones.

**Actividad 2.1: Definición de variables y parámetros**
En esta actividad se establecerán las variables del modelo, tales como cantidades transportadas entre nodos, contratación de mano de obra, entre otras, y se establecerán los parámetros como capacidades de producción, costos logísticos y emisiones.

**Actividad 2.2: Formulación matemática del modelo**
En el desarrollo de esta actividad se redactarán las ecuaciones correspondientes a las restricciones operativas y las funciones objetivo (minimizar costo total, minimizar emisiones de CO2, maximizar empleo).

### Fase 3: Implementación computacional del modelo
Para evaluar el comportamiento del modelo, como también la capacidad para representar de manera adecuada la dinámica de una cadena de suministros frutícola, se llevará a cabo la implementación del modelo matemático utilizando el lenguaje de programación Python, dada su versatilidad para estructurar modelos de optimización.

**Actividad 3.1: Definición de estructuras (Datos Sintéticos)**
En esta actividad se organizaron los datos que alimentan el modelo mediante estructuras que representan los nodos, sus flujos y parámetros como costos, capacidades, demandas, emisiones, condiciones laborales.

**Actividad 3.2: Programación del modelo en Python**
Se programará el modelo matemático en Python, estableciendo las funciones objetivo (minimización de costos, minimización de emisiones, maximización del empleo) y las restricciones operativas. Para facilitar el ajuste y validación de cada componente del modelo, se construirá en segmentos.

**Actividad 3.3: Ejecución del modelo propuesto**
Para esta actividad se procederá con la ejecución del modelo haciendo uso de los datos estructurados en la actividad anterior.

### Fase 4: Análisis de sensibilidad del modelo
Esta fase busca evaluar la robustez del modelo frente a variaciones en los parámetros clave, permitiendo identificar su estabilidad ante escenarios cambiantes. El análisis de sensibilidad fortalecerá su aplicabilidad en contextos reales donde las condiciones operativas pueden variar.

**Actividad 4.1: Selección de parámetros críticos**
Se identificarán los parámetros que resultan determinantes en el comportamiento del modelo por su influencia en las funciones objetivo y restricciones.

**Actividad 4.2: Ejecución de escenarios de sensibilidad**
Se modificarán sistemáticamente los valores de los parámetros seleccionados, generando escenarios alternativos, con el propósito de observar los efectos en las variables de decisión y en el cumplimiento de los objetivos de sostenibilidad.

**Actividad 4.3: Análisis e interpretación de resultados**
En esta actividad, los resultados serán organizados mediante gráficos de sensibilidad y tablas comparativas para validar la consistencia del modelo.

## Objetivo 3
**Evaluar el desempeño del modelo mediante un análisis comparativo con el caso de estudio de referencia.**

### Fase 5: Evaluación y análisis comparativo del modelo
En esta fase se evaluará el comportamiento del modelo propuesto frente al modelo base por Arenas Ruiz y Salazar Aguirre (2018). El análisis determina si la propuesta actual logra un mejor desempeño en términos de sostenibilidad por medio de una comparación basada en indicadores cuantitativos y criterios previamente definidos.

**Actividad 5.1: Comparación de resultados del modelo propuesto con el modelo base**
Se recopilaron los resultados obtenidos tras la ejecución del modelo propuesto y se contrastaron con los reportados en el modelo base. Esta actividad se desarrollará mediante el uso de tablas comparativas, visualizaciones gráficas y análisis porcentual de variaciones. Además, se incluirá una interpretación de las diferencias observadas, con base en los objetivos de sostenibilidad planteados.

**Actividad 5.2: Evaluación de desempeño por dimensión de sostenibilidad**
Se realizará un análisis específico por dimensión (económica, ambiental y social). Esta actividad permitirá observar si el modelo tiene mayor capacidad de adaptación o balance frente a restricciones específicas (como límites de recursos, incrementos en demanda o disminución de capacidad operativa). Los resultados se organizarán en función de los criterios de desempeño establecidos en la literatura revisada, incluyendo eficiencia de costos, reducción de impactos ambientales y mejora en indicadores sociales.
