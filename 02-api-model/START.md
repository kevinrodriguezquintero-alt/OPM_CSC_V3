# Iniciar el servidor

```bash
# Con el venv activado
source venv/bin/activate
uvicorn api.main:app --reload --port 8000

# Sin activar el venv
venv/bin/uvicorn api.main:app --reload --port 8000
```

Docs interactivos: http://localhost:8000/docs

---

## Probar endpoints

```bash
# Health check
curl http://localhost:8000/health

# Ver solver activo
curl http://localhost:8000/config/solver

# Cambiar solver
curl -X PUT http://localhost:8000/config/solver \
  -H "Content-Type: application/json" \
  -d '{"solver": "highs"}'

# Ver parámetros actuales
curl http://localhost:8000/params

# Editar un parámetro (ejemplo: cambiar RB)
curl -X PUT http://localhost:8000/params \
  -H "Content-Type: application/json" \
  -d '{"RB": 3000}'

# Restaurar parámetros a valores por defecto
curl -X POST http://localhost:8000/params/reset

# Ejecutar LGP
curl -X POST http://localhost:8000/solve/lgp

# Ejecutar Epsilon-Constraint (5 pasos por defecto)
curl -X POST http://localhost:8000/solve/er \
  -H "Content-Type: application/json" \
  -d '{"steps": 5}'
```

---

## Exportar resultados para plantillas

```bash
# Modo rápido: solo LGP + ER (~30 segundos)
python export_results.py --quick --output ../redaccion/results.json

# Export completo: LGP + ER + OAT + Rangos + 12 Escenarios (~5-10 minutos)
python export_results.py --output ../redaccion/results.json

# Luego actualizar plantillas
cd ../redaccion/tools
python update_results.py ../results.json --dry-run  # Revisar
python update_results.py ../results.json --execute  # Aplicar
```