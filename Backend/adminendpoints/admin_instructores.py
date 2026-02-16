# adminendpoints/admin_instructores.py
"""
Endpoints del Panel Admin — INSTRUCTORES
CRUD completo + asignación a cursos/eventos
SP usados: SP_REGISTRAR_INSTRUCTOR, SP_ACTUALIZAR_INSTRUCTOR, SP_INS_*
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from Conexiónsql import get_connection

app = FastAPI()


def _sp(nombre: str, params: tuple = ()):
    """Función helper para SPs simples sin fotos"""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            placeholders = ",".join(["?"] * len(params))
            sql = f"EXEC {nombre} {placeholders}" if params else f"EXEC {nombre}"
            cursor.execute(sql, params)
            if cursor.description:
                cols = [c[0] for c in cursor.description]
                return [dict(zip(cols, row)) for row in cursor.fetchall()]
            conn.commit()
            return [{"status": "SUCCESS"}]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------
# Función ESPECIAL para SP con fotos (parámetros largos)
# ---------------------------
def ejecutar_sp_con_foto(sp_nombre: str, params: dict):
    """
    Ejecuta SP usando parámetros nombrados para evitar truncamiento de strings largos.
    params debe ser un diccionario: {'@param1': valor1, '@param2': valor2, ...}
    """
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            
            # Construir el comando SQL con parámetros nombrados
            param_names = list(params.keys())
            param_placeholders = ", ".join([f"{name}=?" for name in param_names])
            sql = f"EXEC {sp_nombre} {param_placeholders}"
            
            # Ejecutar con los valores en el mismo orden
            valores = [params[name] for name in param_names]
            
            print(f"\n{'='*80}")
            print(f"🔍 Ejecutando: {sp_nombre}")
            print(f"SQL: {sql}")
            for name, valor in params.items():
                if 'foto' in name.lower() and valor:
                    print(f"  {name}: {valor[:50]}... ({len(valor)} chars)")
                else:
                    print(f"  {name}: {valor}")
            print(f"{'='*80}\n")
            
            cursor.execute(sql, valores)
            
            if cursor.description:
                columns = [col[0] for col in cursor.description]
                rows = cursor.fetchall()
                resultados = [dict(zip(columns, row)) for row in rows]
                return resultados
            else:
                conn.commit()
                return [{"status": "SUCCESS", "mensaje": "SP ejecutado correctamente"}]

    except Exception as e:
        print(f"❌ ERROR: {str(e)}\n")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================
# GET /  — listar instructores con filtros
# =============================================
@app.get("/", tags=["Admin - Instructores"])
def listar_instructores(
    busqueda: Optional[str] = None,
    especialidad: Optional[str] = None,
    estado: Optional[str] = None,
):
    rows = _sp("SP_INS_LISTAR", (busqueda, especialidad, estado))
    return {"status": "SUCCESS", "total": len(rows), "data": rows}


# =============================================
# GET /{id}  — ficha + cursos y eventos asignados
# =============================================
@app.get("/{id_instructor}", tags=["Admin - Instructores"])
def detalle_instructor(id_instructor: int):
    """
    Devuelve 3 result sets: datos del instructor, cursos asignados, eventos asignados.
    El SP retorna los 3 y aquí los separamos para que el frontend los consuma fácil.
    """
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("EXEC SP_INS_DETALLE ?", (id_instructor,))

            # Result set 1: datos del instructor
            if not cursor.description:
                raise HTTPException(status_code=404, detail="Instructor no encontrado")
            cols = [c[0] for c in cursor.description]
            instructor = [dict(zip(cols, r)) for r in cursor.fetchall()]
            if not instructor:
                raise HTTPException(status_code=404, detail="Instructor no encontrado")

            # Result set 2: cursos
            cursor.nextset()
            cols2 = [c[0] for c in cursor.description] if cursor.description else []
            cursos = [dict(zip(cols2, r)) for r in cursor.fetchall()] if cols2 else []

            # Result set 3: eventos
            cursor.nextset()
            cols3 = [c[0] for c in cursor.description] if cursor.description else []
            eventos = [dict(zip(cols3, r)) for r in cursor.fetchall()] if cols3 else []

            return {
                "status": "SUCCESS",
                "data": instructor[0],
                "cursos": cursos,
                "eventos": eventos,
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================
# POST /  — REGISTRAR NUEVO INSTRUCTOR
# =============================================
class InstructorCrear(BaseModel):
    nombre_completo: str
    especialidad: str
    rango: Optional[str] = None
    experiencia_anios: int = 0
    certificaciones: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    foto: Optional[str] = None
    bio: Optional[str] = None
    admin_id: int

@app.post("/", tags=["Admin - Instructores"])
def registrar_instructor(instructor: InstructorCrear):
    """
    ✅ Usa SP_REGISTRAR_INSTRUCTOR con parámetros nombrados
    para manejar correctamente el Base64 de la foto
    """
    params = {
        '@nombre_completo': instructor.nombre_completo,
        '@especialidad': instructor.especialidad,
        '@rango': instructor.rango,
        '@experiencia_anios': instructor.experiencia_anios,
        '@certificaciones': instructor.certificaciones,
        '@email': instructor.email,
        '@telefono': instructor.telefono,
        '@foto': instructor.foto,
        '@bio': instructor.bio,
        '@admin_id': instructor.admin_id
    }
    
    resultados = ejecutar_sp_con_foto("SP_REGISTRAR_INSTRUCTOR", params)
    return resultados[0] if resultados else {"status": "SUCCESS"}


# =============================================
# PUT /  — ACTUALIZAR INSTRUCTOR
# =============================================
class InstructorActualizar(BaseModel):
    id_instructor: int
    nombre_completo: str
    especialidad: str
    rango: Optional[str] = None
    experiencia_anios: int = 0
    certificaciones: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    foto: Optional[str] = None
    bio: Optional[str] = None
    estado: str = "Activo"
    admin_id: int

@app.put("/", tags=["Admin - Instructores"])
def actualizar_instructor(instr: InstructorActualizar):
    """
    ✅ Usa SP_ACTUALIZAR_INSTRUCTOR con parámetros nombrados
    para manejar correctamente el Base64 de la foto
    """
    params = {
        '@id_instructor': instr.id_instructor,
        '@nombre_completo': instr.nombre_completo,
        '@especialidad': instr.especialidad,
        '@rango': instr.rango,
        '@experiencia_anios': instr.experiencia_anios,
        '@certificaciones': instr.certificaciones,
        '@email': instr.email,
        '@telefono': instr.telefono,
        '@foto': instr.foto,
        '@bio': instr.bio,
        '@estado': instr.estado,
        '@admin_id': instr.admin_id
    }
    
    resultados = ejecutar_sp_con_foto("SP_ACTUALIZAR_INSTRUCTOR", params)
    return resultados[0] if resultados else {"status": "SUCCESS"}


# =============================================
# DELETE /  — baja (soft delete si tiene cursos activos)
# =============================================
class EliminarInstructor(BaseModel):
    id_instructor: int
    admin_id: int

@app.delete("/", tags=["Admin - Instructores"])
def eliminar_instructor(body: EliminarInstructor):
    rows = _sp("SP_INS_ELIMINAR", (body.id_instructor, body.admin_id))
    return rows[0] if rows else {"status": "SUCCESS"}


# =============================================
# POST /asignar-curso  — asignar instructor a un curso
# =============================================
class AsignarCurso(BaseModel):
    id_curso: int
    id_instructor: int
    admin_id: int

@app.post("/asignar-curso", tags=["Admin - Instructores"])
def asignar_a_curso(body: AsignarCurso):
    rows = _sp("SP_ASIGNAR_INSTRUCTOR_A_CURSO", (
        body.id_curso, body.id_instructor, body.admin_id,
    ))
    return rows[0] if rows else {"status": "SUCCESS"}


# =============================================
# POST /asignar-evento  — asignar instructor a un evento
# =============================================
class AsignarEvento(BaseModel):
    id_evento: int
    id_instructor: int
    admin_id: int

@app.post("/asignar-evento", tags=["Admin - Instructores"])
def asignar_a_evento(body: AsignarEvento):
    rows = _sp("SP_ASIGNAR_INSTRUCTOR_A_EVENTO", (
        body.id_evento, body.id_instructor, body.admin_id,
    ))
    return rows[0] if rows else {"status": "SUCCESS"}