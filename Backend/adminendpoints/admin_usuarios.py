from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from Conexiónsql import get_connection   # tu función de conexión

app = FastAPI()

def ejecutar_sp(nombre_sp: str, params: tuple = ()):
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            placeholders = ",".join(["?"] * len(params))
            sql = f"EXEC {nombre_sp} {placeholders}" if params else f"EXEC {nombre_sp}"
            cursor.execute(sql, params)

            if cursor.description:
                columnas = [col[0] for col in cursor.description]
                return [dict(zip(columnas, fila)) for fila in cursor.fetchall()]
            else:
                conn.commit()
                return [{"status": "SUCCESS"}]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/postulantes")
def listar_postulantes(
    busqueda: Optional[str] = None,
    departamento: Optional[str] = None,
    solo_pendientes: bool = False,
    pagina: int = 1,
    por_pagina: int = 10
):
    data = ejecutar_sp("SP_GU_LISTAR_POSTULANTES",
        (busqueda, departamento, int(solo_pendientes), pagina, por_pagina))

    total = ejecutar_sp("SP_GU_CONTAR_POSTULANTES",
        (busqueda, departamento, int(solo_pendientes)))

    return {
        "status": "SUCCESS",
        "total": total[0]["total"] if total else 0,
        "data": data
    }
@app.get("/postulantes/{id_postulante}")
def detalle_postulante(id_postulante: int):
    data = ejecutar_sp("SP_GU_DETALLE_POSTULANTE", (id_postulante,))
    if not data:
        raise HTTPException(status_code=404, detail="Postulante no encontrado")
    return {"status": "SUCCESS", "data": data[0]}
@app.get("/miembros")
def listar_miembros(
    busqueda: Optional[str] = None,
    estado: Optional[str] = None,
    rango: Optional[str] = None,
    departamento: Optional[str] = None,
    pagina: int = 1,
    por_pagina: int = 10
):
    # 🔥 Convertir "" a None
    busqueda = busqueda or None
    estado = estado or None
    rango = rango or None
    departamento = departamento or None

    data = ejecutar_sp(
        "SP_GU_LISTAR_MIEMBROS",
        (busqueda, estado, rango, departamento, pagina, por_pagina)
    )

    total = ejecutar_sp(
        "SP_GU_CONTAR_MIEMBROS",
        (busqueda, estado, rango, departamento)
    )

    return {
        "status": "SUCCESS",
        "total": total[0]["total"] if total else 0,
        "data": data
    }

@app.get("/miembros/{id_miembro}")
def detalle_miembro(id_miembro: int):
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("EXEC SP_GU_DETALLE_MIEMBRO ?", (id_miembro,))

            # Result set 1 — datos del miembro
            cols1 = [c[0] for c in cursor.description]
            miembro = dict(zip(cols1, cursor.fetchone()))

            # Result set 2 — cursos
            cursor.nextset()
            cursos = [dict(zip([c[0] for c in cursor.description], row)) for row in cursor.fetchall()]

            # Result set 3 — eventos
            cursor.nextset()
            eventos = [dict(zip([c[0] for c in cursor.description], row)) for row in cursor.fetchall()]

        return {
            "status": "SUCCESS",
            "miembro": miembro,
            "cursos": cursos,
            "eventos": eventos
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CambioEstado(BaseModel):
    id_miembro: int
    nuevo_estado: str
    motivo: str
    admin_id: int

@app.put("/miembros/estado")
def cambiar_estado(body: CambioEstado):
    return ejecutar_sp("SP_GU_CAMBIAR_ESTADO_MIEMBRO",
        (body.id_miembro, body.nuevo_estado, body.motivo, body.admin_id))[0]

class CambioRango(BaseModel):
    id_miembro: int
    nuevo_rango: str
    motivo: Optional[str] = None
    admin_id: int

@app.put("/miembros/rango")
def cambiar_rango(body: CambioRango):
    return ejecutar_sp("SP_GU_CAMBIAR_RANGO_MIEMBRO",
        (body.id_miembro, body.nuevo_rango, body.motivo, body.admin_id))[0]
@app.get("/miembros/{id_miembro}/historial")
def historial_miembro(id_miembro: int):
    data = ejecutar_sp("SP_GU_HISTORIAL_MIEMBRO", (id_miembro,))
    return {"status": "SUCCESS", "data": data}
@app.get("/miembros/exportar/csv")
def exportar_miembros(
    estado: Optional[str] = None,
    rango: Optional[str] = None,
    departamento: Optional[str] = None
):
    data = ejecutar_sp("SP_GU_EXPORTAR_MIEMBROS", (estado, rango, departamento))
    return {"status": "SUCCESS", "total": len(data), "data": data}
@app.get("/postulantes")
def listar_postulantes(
    busqueda: Optional[str] = None,
    departamento: Optional[str] = None,
    solo_pendientes: bool = False,
    pagina: int = 1,
    por_pagina: int = 10
):
    data = ejecutar_sp("SP_GU_LISTAR_POSTULANTES",
        (busqueda, departamento, int(solo_pendientes), pagina, por_pagina))

    total = ejecutar_sp("SP_GU_CONTAR_POSTULANTES",
        (busqueda, departamento, int(solo_pendientes)))

    return {
        "status": "SUCCESS",
        "total": total[0]["total"] if total else 0,
        "data": data
    }

@app.get("/postulantes/{id_postulante}")
def detalle_postulante(id_postulante: int):
    data = ejecutar_sp("SP_GU_DETALLE_POSTULANTE", (id_postulante,))
    if not data:
        raise HTTPException(status_code=404, detail="Postulante no encontrado")
    return {"status": "SUCCESS", "data": data[0]}


# ══════════════════════════════════════════════════════════════════
# MIEMBROS — CREAR
# ══════════════════════════════════════════════════════════════════

class NuevoMiembro(BaseModel):
    nombre: str
    apellido: str
    dni: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    fecha_nacimiento: Optional[str] = None   # formato: YYYY-MM-DD
    genero: Optional[str] = None
    departamento: Optional[str] = None
    distrito: Optional[str] = None
    direccion: Optional[str] = None
    profesion: Optional[str] = None
    jefatura: Optional[str] = ""
    rango: Optional[str] = "Aspirante"
    estado: Optional[str] = "Activo"
    admin_id: int

@app.post("/miembros")
def crear_miembro(body: NuevoMiembro):
    resultado = ejecutar_sp("SP_GU_CREAR_MIEMBRO", (
        body.nombre,
        body.apellido,
        body.dni,
        body.email,
        body.telefono,
        body.fecha_nacimiento,
        body.genero,
        body.departamento,
        body.distrito,
        body.direccion,
        body.profesion,
        body.rango,
        body.jefatura,
        body.estado,
        body.admin_id,
    ))

    if not resultado:
        raise HTTPException(status_code=500, detail="Sin respuesta del servidor")

    res = resultado[0]

    # El SP retorna status ERROR cuando hay validaciones
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=400, detail=res.get("mensaje", "Error al crear el miembro"))

    return {
        "status": "SUCCESS",
        "mensaje": res.get("mensaje"),
        "id_miembro": res.get("id_miembro"),
        "legajo": res.get("legajo"),
    }


# ══════════════════════════════════════════════════════════════════
# MIEMBROS — LISTAR, DETALLE, ESTADO, RANGO, HISTORIAL, EXPORTAR
# ══════════════════════════════════════════════════════════════════

@app.get("/miembros")
def listar_miembros(
    busqueda: Optional[str] = None,
    estado: Optional[str] = None,
    rango: Optional[str] = None,
    departamento: Optional[str] = None,
    pagina: int = 1,
    por_pagina: int = 10
):
    busqueda     = busqueda     or None
    estado       = estado       or None
    rango        = rango        or None
    departamento = departamento or None

    data = ejecutar_sp(
        "SP_GU_LISTAR_MIEMBROS",
        (busqueda, estado, rango, departamento, pagina, por_pagina)
    )
    total = ejecutar_sp(
        "SP_GU_CONTAR_MIEMBROS",
        (busqueda, estado, rango, departamento)
    )

    return {
        "status": "SUCCESS",
        "total": total[0]["total"] if total else 0,
        "data": data
    }

@app.get("/miembros/exportar/csv")
def exportar_miembros(
    estado: Optional[str] = None,
    rango: Optional[str] = None,
    departamento: Optional[str] = None
):
    data = ejecutar_sp("SP_GU_EXPORTAR_MIEMBROS", (estado, rango, departamento))
    return {"status": "SUCCESS", "total": len(data), "data": data}

@app.get("/miembros/{id_miembro}/historial")
def historial_miembro(id_miembro: int):
    data = ejecutar_sp("SP_GU_HISTORIAL_MIEMBRO", (id_miembro,))
    return {"status": "SUCCESS", "data": data}

@app.get("/miembros/{id_miembro}")
def detalle_miembro(id_miembro: int):
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("EXEC SP_GU_DETALLE_MIEMBRO ?", (id_miembro,))

            # Result set 1 — datos del miembro
            cols1 = [c[0] for c in cursor.description]
            miembro = dict(zip(cols1, cursor.fetchone()))

            # Result set 2 — cursos
            cursor.nextset()
            cursos = [dict(zip([c[0] for c in cursor.description], row)) for row in cursor.fetchall()]

            # Result set 3 — eventos
            cursor.nextset()
            eventos = [dict(zip([c[0] for c in cursor.description], row)) for row in cursor.fetchall()]

        return {
            "status": "SUCCESS",
            "miembro": miembro,
            "cursos": cursos,
            "eventos": eventos
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── EDITAR MIEMBRO COMPLETO ───────────────────────────────────────
class EditarMiembro(BaseModel):
    id_miembro:       int
    nombre:           str
    apellido:         str
    dni:              str
    email:            Optional[str] = None
    telefono:         Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    genero:           str
    departamento:     Optional[str] = None
    distrito:         Optional[str] = None
    direccion:        Optional[str] = None
    profesion:        Optional[str] = None
    rango:            str
    jefatura:         str
    estado:           str
    admin_id:         int

@app.put("/miembros/{id_miembro}")
def editar_miembro(id_miembro: int, body: EditarMiembro):
    resultado = ejecutar_sp("SP_GU_EDITAR_MIEMBRO", (
        id_miembro,
        body.nombre,
        body.apellido,
        body.dni,
        body.email,
        body.telefono,
        body.fecha_nacimiento,
        body.genero,
        body.departamento,
        body.distrito,
        body.direccion,
        body.profesion,
        body.rango,
        body.jefatura,
        body.estado,
        body.admin_id,
    ))

    if not resultado:
        raise HTTPException(status_code=500, detail="Sin respuesta del servidor")

    res = resultado[0]
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=400, detail=res.get("mensaje", "Error al editar el miembro"))

    return {
        "status": "SUCCESS",
        "mensaje": res.get("mensaje"),
        "id_miembro": res.get("id_miembro"),
    }


class CambioEstado(BaseModel):
    id_miembro: int
    nuevo_estado: str
    motivo: str
    admin_id: int

@app.put("/miembros/estado")
def cambiar_estado(body: CambioEstado):
    return ejecutar_sp("SP_GU_CAMBIAR_ESTADO_MIEMBRO",
        (body.id_miembro, body.nuevo_estado, body.motivo, body.admin_id))[0]


class CambioRango(BaseModel):
    id_miembro: int
    nuevo_rango: str
    motivo: Optional[str] = None
    admin_id: int

@app.put("/miembros/rango")
def cambiar_rango(body: CambioRango):
    return ejecutar_sp("SP_GU_CAMBIAR_RANGO_MIEMBRO",
        (body.id_miembro, body.nuevo_rango, body.motivo, body.admin_id))[0]

class EliminarMiembroFisico(BaseModel):
    confirmacion: bool


@app.delete("/miembros/{id_miembro}/eliminar-fisico")
def eliminar_miembro_fisico(id_miembro: int, body: EliminarMiembroFisico):
    
    if not body.confirmacion:
        raise HTTPException(
            status_code=400,
            detail="Debe confirmar explícitamente la eliminación física"
        )

    resultado = ejecutar_sp(
        "sp_EliminarMiembroFisico",
        (id_miembro, int(body.confirmacion))
    )

    if not resultado:
        raise HTTPException(
            status_code=404,
            detail="El miembro no existe o no fue eliminado"
        )

    return {
        "status": "SUCCESS",
        "data": resultado[0]
    }