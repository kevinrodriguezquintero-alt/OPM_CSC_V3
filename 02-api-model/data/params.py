# Sets
PRODUCTORES = [1]
INTERMEDIARIOS = [1, 2, 3, 4, 5, 6, 7]
DETALLISTAS = [1, 2, 3, 4]
VARIANTES_PRODUCTOR = list(range(1, 11))

# RB: Rendimiento maximo (Kg/Ha) semana
RB = 2585.02

# RA: Rendimiento para cada productor u (Kg/Ha) semana
RA = {1: 6.25, 2: 10.74, 3: 18, 4: 25.78, 5: 35.54, 6: 60, 7: 82.03, 8: 117.18, 9: 225, 10: 450}

# RC: Rendimiento maximo del cultivo base (Kg/Ha) semana
RC = {1: 750}

# RD: Rendimiento minimo del cultivo base (Kg/Ha) semana
RD = {1: 100}

# CA: Capacidad productiva de una persona (Kg/persona) en centro de acopio
# Valor basado en actividades típicas: recepción, pesaje, selección básica, carga
# Referencia: menor que procesamiento en intermediarios (17-30), mayor que recepción en detallistas (100-140)
CA = 40

# CB: Capacidad productiva de una persona (Kg/persona) en intermediario j
CB = {1: 20, 2: 25, 3: 23, 4: 18, 5: 17, 6: 20, 7: 30}

# CC: Capacidad productiva de una persona (Kg/persona) en detallista k
CC = {1: 130, 2: 140, 3: 120, 4: 100}

# CP: Costo de producción en el productor i ($/Kg)
CP = {1: 551}

# CMP: Costo de mano de obra en el centro de acopio ($/semana)
CMP = 50000

# CI: Costo de procesamiento del intermediario j ($/Kg)
CI = {1: 100, 2: 80, 3: 70, 4: 120, 5: 170, 6: 200, 7: 90}

# CT: Costo de transporte productor i -> intermediario j ($/km/viaje)
# Recalculado: costo por km * distancia DPI / (para luego usar CT * Z * DPI en el modelo)
# Valores base de costo por km desde el paper/contexto del caso de estudio
CT = {(1, 1): 0.278, (1, 2): 0.386, (1, 3): 0.130, (1, 4): 0.042, (1, 5): 0.175, (1, 6): 0.413, (1, 7): 3.846}

# CTT: Costo de transporte intermediario j -> detallista k ($/km/viaje)
# Recalculado: costo por km * distancia DID / (para luego usar CTT * ZZ * DID en el modelo)
CTT = {
    (1, 1): 3.894,  (1, 2): 334.731, (1, 3): 2.000,  (1, 4): 3.929,
    (2, 1): 0.000,  (2, 2): 17.308,  (2, 3): 19.565, (2, 4): 6.757,
    (3, 1): 0.466,  (3, 2): 0.754,   (3, 3): 1.528,  (3, 4): 0.138,
    (4, 1): 0.910,  (4, 2): 106.340, (4, 3): 9.231,  (4, 4): 17.308,
    (5, 1): 1.141,  (5, 2): 16.000,  (5, 3): 23.125, (5, 4): 3.551,
    (6, 1): 0.260,  (6, 2): 0.163,   (6, 3): 0.135,  (6, 4): 0.452,
    (7, 1): 1.020,  (7, 2): 0.312,   (7, 3): 1.976,  (7, 4): 0.275,
}

# CD: Costo de mano de obra en detallista k
CD = {1: 60000, 2: 130000, 3: 200000, 4: 100000}

# CDA: Costo por daño productor i -> intermediario j ($/Kg)
CDA = {(1, 1): 675.73, (1, 2): 685.71, (1, 3): 650.43, (1, 4): 650.43, (1, 5): 600, (1, 6): 610, (1, 7): 500}

# CDF: Costo por daño intermediario j -> detallista k ($/Kg)
CDF = {
    (1, 1): 1715.3,  (1, 2): 1733.03, (1, 3): 1700, (1, 4): 1800,
    (2, 1): 1446,    (2, 2): 1491,    (2, 3): 1400, (2, 4): 1440,
    (3, 1): 1379.7,  (3, 2): 1399.17, (3, 3): 1300, (3, 4): 1200,
    (4, 1): 1879.7,  (4, 2): 1899.17, (4, 3): 1900, (4, 4): 1990,
    (5, 1): 1900,    (5, 2): 1910,    (5, 3): 1880, (5, 4): 1800,
    (6, 1): 1500,    (6, 2): 1450,    (6, 3): 1370, (6, 4): 1510,
    (7, 1): 1200,    (7, 2): 1220,    (7, 3): 1280, (7, 4): 1290,
}

# P: Porcentaje (%) de daño productor i -> intermediario j
P = {(1, 1): 0.02, (1, 2): 0.03, (1, 3): 0.05, (1, 4): 0.08, (1, 5): 0.01, (1, 6): 0.03, (1, 7): 0.045}

# PP: Porcentaje (%) de daño intermediario j -> detallista k
PP = {
    (1, 1): 0.08, (1, 2): 0.07, (1, 3): 0.09, (1, 4): 0.08,
    (2, 1): 0.07, (2, 2): 0.05, (2, 3): 0.06, (2, 4): 0.01,
    (3, 1): 0.12, (3, 2): 0.09, (3, 3): 0.08, (3, 4): 0.1,
    (4, 1): 0.18, (4, 2): 0.03, (4, 3): 0.12, (4, 4): 0.1,
    (5, 1): 0.06, (5, 2): 0.06, (5, 3): 0.05, (5, 4): 0.04,
    (6, 1): 0.02, (6, 2): 0.03, (6, 3): 0.04, (6, 4): 0.05,
    (7, 1): 0.11, (7, 2): 0.07, (7, 3): 0.08, (7, 4): 0.1,
}

# CN: Capacidad de producción en el productor i (Kg/día)
CN = {1: 38025}

# CH: Capacidad de despacho en el productor i (Kg/día)
CH = {1: 38025}

# CRI: Capacidad de recepción/despacho en el intermediario j (Kg/día)
# Según paper Arenas & Salazar (2018): CRI_j
CRI = {1: 5000, 2: 2000, 3: 800, 4: 7000, 5: 6000, 6: 9000, 7: 3000}

# CR: Capacidad de recepción en el detallista k (Kg/día)
CR = {1: 3000, 2: 10000, 3: 2000, 4: 11100}

# DI: Demanda en el intermediario j (Kg/día)
DI = {1: 1100, 2: 850, 3: 700, 4: 4500, 5: 3000, 6: 5340, 7: 1290}

# DD: Demanda en el detallista k (Kg/día)
DD = {1: 1300, 2: 2800, 3: 1000, 4: 8000}

# CV: Capacidad del vehiculo en el intermediario j (Kg/viaje)
CV = {1: 7000, 2: 4500, 3: 1000, 4: 4500, 5: 1000, 6: 1000, 7: 1000}

# CMO: Costo de mano de obra en el intermediario j ($/semana)
CMO = {1: 130207, 2: 100000, 3: 50000, 4: 130207, 5: 60000, 6: 80000, 7: 14000}

# H: numero de hectareas (Ha) semana para cada productor u
H = {1: 3.2, 2: 25.6, 3: 10, 4: 6.4, 5: 38.4, 6: 0.5, 7: 6.4, 8: 6.4, 9: 5, 10: 10}

# Environmental parameters (placeholders — replace with real empirical data)
# DPI: Distancia/Impacto Productor -> Intermediario (i, j)
DPI = {
    (1, 1): 107.0, 
    (1, 2): 103.0, 
    (1, 3): 34.1, 
    (1, 4): 105.0, 
    (1, 5): 100.0, 
    (1, 6): 48.4,  
    (1, 7): 10.4
}

# DID: Distancia/Impacto Intermediario -> Detallista (j, k)
DID = {
    (1, 1): 17.8, (1, 2): 0.26, (1, 3): 6.0,   (1, 4): 5.6,
    (2, 1): 16.6, (2, 2): 2.6,  (2, 3): 4.6,   (2, 4): 7.4,
    (3, 1): 72.4, (3, 2): 70.5, (3, 3): 65.5,  (3, 4): 72.5,
    (4, 1): 37.1, (4, 2): 0.5,  (4, 3): 6.5,   (4, 4): 5.2,
    (5, 1): 18.4, (5, 2): 5.0,  (5, 3): 1.6,   (5, 4): 10.7,
    (6, 1): 154.0,(6, 2): 153.0,(6, 3): 148.0, (6, 4): 155.0,
    (7, 1): 98.0, (7, 2): 96.1, (7, 3): 91.1,  (7, 4): 98.2
}

# IT: Factor de Emisión (Kg CO2/Km) - Depende de CV (Capacidad del Vehículo)
# CV < 3000   => 0.4716 (C2 liviano)
# CV < 5000   => 0.5714 (C2 mediano)
# CV < 10000  => 0.9984 (Camión 2 ejes)
IT = {
    1: 0.9984,  # CV: 7000
    2: 0.5714,  # CV: 4500
    3: 0.4716,  # CV: 1000
    4: 0.5714,  # CV: 4500
    5: 0.4716,  # CV: 1000
    6: 0.4716,  # CV: 1000
    7: 0.4716,  # CV: 1000
}

# M: Límite máximo de kilómetros recorridos (km/semana)
# Valor conservador basado en suma de distancias con múltiplo de seguridad
M = 100000
