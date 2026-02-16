from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import date
from Conexiónsql import get_connection

app = FastAPI()

class CriterioBusqueda(BaseModel):
    criterio: str
@app.post("/buscar")
def buscar_miembro(data: CriterioBusqueda):
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                EXEC SP_BUSCAR_MIEMBRO @criterio_busqueda=?
            """, (data.criterio,))

            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            
            if not rows:
                return {"status": "No se encontraron miembros", "resultados": []}
            
            # Convertir cada fila a diccionario
            resultados = [dict(zip(columns, row)) for row in rows]
            
            return {"status": "SUCCESS", "resultados": resultados}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
