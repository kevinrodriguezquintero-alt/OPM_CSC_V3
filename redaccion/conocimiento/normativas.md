# Normativas y Fuentes Secundarias Referenciadas

> **Estado**: parcial — completado con referencias del diseño metodológico y fuentes secundarias del modelo
> Cada normativa debe incluir: referencia completa, qué parámetro sustenta, y cómo se usa.

---

## 1. Factor de Emisión (IT_j)

| Fuente | Referencia | Uso en Modelo |
|--------|-----------|---------------|
| UPME (FECOC) | Unidad de Planeación Minero Energética (s.f.). *Factores de emisión de combustibles colombianos (FECOC)*. https://docs.upme.gov.co/DemandayEficiencia/Doc_Hemeroteca/FECOC%2B2-1.pdf | Parámetro IT_j (Kg CO₂/km) según tipo de vehículo y combustible diésel |

**Categorías vehiculares usadas**:
- CV < 3.000 kg → IT = 0,4716 (C2 liviano)
- CV < 5.000 kg → IT = 0,5714 (C2 mediano)
- CV < 10.000 kg → IT = 0,9984 (Camión 2 ejes)

---

## 2. Capacidad Vehicular (CV_j)

| Fuente | Referencia | Uso en Modelo |
|--------|-----------|---------------|
| Santos et al. (2019) | Santos, D., Rodríguez Ramírez, A., Tribín, J. P., Gómez, A., & Rodríguez Fazzone, M. (2019). *Sistemas de abastecimiento agroalimentario del departamento de Nariño: Informe departamental*. FAO & Gobernación de Nariño. ISBN 978-958-521-52-6-9 | Tipología de vehículos "turbo" para transporte agroalimentario rural |
| DANE (2013) | Departamento Administrativo Nacional de Estadística (DANE). (2013). *Comportamiento del abastecimiento de alimentos en los diferentes mercados*. https://www.dane.gov.co/files/investigaciones/agropecuario/sipsa/bol_abas_1quincena_mar13.pdf | Rango de capacidad: 2-12 toneladas para carga liviana |

---

## 3. Capacidades de Personal (CA, CB, CC)

| Parámetro | Valor | Descripción | Justificación |
|-----------|-------|-------------|---------------|
| CA | 40 Kg/persona | Capacidad centro de acopio | Basado en actividades típicas: recepción, pesaje, selección básica, carga. Valor intermedio entre procesamiento en intermediarios (17-30) y recepción en detallistas (100-140) |
| CB_j | [20, 25, 23, 18, 17, 20, 30] Kg/persona | Capacidad intermediarios | Valores específicos por intermediario según complejidad de procesamiento |
| CC_k | [130, 140, 120, 100] Kg/persona | Capacidad detallistas | Mayor capacidad por actividades de recepción/display sin procesamiento intensivo |

> **📌 Nota**: El valor de CA fue corregido de 22.43 (promedio erróneo de CB) a 40 Kg/persona en abril 2025 para reflejar adecuadamente la capacidad productiva de un centro de acopio típico en cadena de limones.

---

## 4. Empleo y Contexto Social

| Fuente | Referencia | Uso en Modelo |
|--------|-----------|---------------|
| Salcedo & Guzmán (2014) | Salcedo, S., & Guzmán, L. (2014). *Agricultura familiar en América Latina y el Caribe: Recomendaciones de política*. FAO. | Justificación del componente social (empleo rural) |

---

## 5. Referencias del Diseño Metodológico (Revisión Bibliográfica)

Las siguientes referencias son citadas en el diseño metodológico como parte de la revisión bibliográfica sobre métodos de optimización multiobjetivo en cadenas agroalimentarias:

| Fuente | Referencia | Uso en Tesis |
|--------|-----------|-------------|
| Arenas & Salazar (2018) | Arenas Ruiz, M. A., & Salazar Aguirre, L. T. (2018). *Diseño de una cadena de abastecimiento frutícola con un enfoque de sostenibilidad*. Universidad del Valle. | Modelo referente (caso de estudio base) |
| Mármol & Díaz (2024) | Mármol Barriosnuevo, C., & Diaz Sierra, L. (2024). [Título pendiente]. | Revisión bibliográfica — optimización sostenible |
| Sotelo (2017) | Sotelo Cortés, A. (2017). [Título pendiente]. | Revisión bibliográfica — cadenas agroalimentarias |
| Moreno (2018) | Moreno, J. (2018). [Título pendiente]. | Revisión bibliográfica — metodología |

> **📌 NOTA**: Las siguientes referencias serán completadas por el usuario mediante Zotero al generar el documento final:
> - Mármol & Díaz (2024): Título y datos completos pendientes
> - Sotelo (2017): Título y datos completos pendientes  
> - Moreno (2018): Título y datos completos pendientes
> 
> El esquema modular mantiene los identificadores temporales para facilitar la búsqueda en Zotero.

---

## 6. Normativas Pendientes de Documentar

> Agregar aquí cualquier otra normativa, resolución, decreto o fuente oficial que se referencie en la tesis.
> Incluir: referencia completa, qué parámetro o decisión sustenta, y cómo se vincula con el modelo.

- {{PLACEHOLDER}}
- {{PLACEHOLDER}}
