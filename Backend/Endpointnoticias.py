# Endpointnoticias.py - VERSIÓN FINAL CORREGIDA
from fastapi import FastAPI, HTTPException, Query
from typing import Optional
import pyodbc
from Conexiónsql import get_connection

# -------------------------------
# INSTANCIA DE FASTAPI
# -------------------------------
app = FastAPI(title="API de Noticias - CGPVP2", version="1.0")

# -------------------------------
# FUNCIONES AUXILIARES PARA SP
# -------------------------------
def execute_sp(sp_name: str, params: dict = {}, fetch_one: bool = False, fetch_all: bool = True):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Construir parámetros para pyodbc
        param_list = ", ".join([f"@{k} = ?" for k in params.keys()])
        sql = f"EXEC {sp_name} {param_list}" if param_list else f"EXEC {sp_name}"
        cursor.execute(sql, tuple(params.values()))
        
        if fetch_one:
            row = cursor.fetchone()
            if row and cursor.description:
                return dict(zip([column[0] for column in cursor.description], row))
            return None
        elif fetch_all:
            if cursor.description:
                columns = [column[0] for column in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
            return []
        else:
            return None
    except Exception as e:
        print(f"❌ Error en execute_sp({sp_name}): {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()

# -------------------------------
# ENDPOINTS
# -------------------------------

# SP1: LISTAR PUBLICACIONES CON FILTROS
@app.get("/")  # ✅ Cambiado a "/" para evitar el redirect 307
def listar_publicaciones(
    pagina: int = Query(1, ge=1),
    cantidad_por_pagina: int = Query(9, ge=1, le=100),
    solo_destacadas: int = Query(0, ge=0, le=1),
    solo_activas: int = Query(1, ge=0, le=1),
    busqueda: Optional[str] = Query(None),
    ordenar_por: str = Query("reciente")
):
    """
    Lista publicaciones con filtros.
    - pagina: Número de página (default: 1)
    - cantidad_por_pagina: Cantidad por página (default: 9)
    - solo_destacadas: 0=todas, 1=solo destacadas
    - solo_activas: 0=todas, 1=solo activas
    - busqueda: término de búsqueda opcional
    - ordenar_por: "reciente" o "antiguas"
    """
    try:
        params = {
            "Pagina": pagina,
            "CantidadPorPagina": cantidad_por_pagina,
            "SoloDestacadas": solo_destacadas,
            "SoloActivas": solo_activas,
            "busqueda": busqueda if busqueda else "",
            "ordenar_por": ordenar_por
        }
        
        publicaciones = execute_sp("SP_LISTAR_PUBLICACIONES_CON_FILTROS", params)
        
        # Intentar obtener el total (segundo SELECT del SP)
        total = len(publicaciones)  # Fallback
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                "EXEC SP_LISTAR_PUBLICACIONES_CON_FILTROS @Pagina = ?, @CantidadPorPagina = ?, @SoloDestacadas = ?, @SoloActivas = ?, @busqueda = ?, @ordenar_por = ?",
                pagina, cantidad_por_pagina, solo_destacadas, solo_activas, busqueda if busqueda else "", ordenar_por
            )
            cursor.nextset()
            total_row = cursor.fetchone()
            if total_row:
                total = total_row[0]
            cursor.close()
            conn.close()
        except:
            pass  # Si falla, usar el len() como fallback
        
        return {"total": total, "publicaciones": publicaciones}
        
    except Exception as e:
        print(f"❌ Error en listar_publicaciones: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SP2: OBTENER PUBLICACIÓN DESTACADA
@app.get("/destacada")
def obtener_publicacion_destacada():
    """
    Obtiene la publicación marcada como destacada.
    """
    try:
        resultado = execute_sp("SP_OBTENER_PUBLICACION_DESTACADA")
        return resultado if resultado else []
    except Exception as e:
        print(f"❌ Error en obtener_publicacion_destacada: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SP4: PUBLICACIONES RECIENTES
@app.get("/recientes")
def obtener_publicaciones_recientes(cantidad: int = Query(5, ge=1, le=50)):
    """
    Obtiene las últimas N publicaciones.
    - cantidad: Número de publicaciones a obtener (default: 5, max: 50)
    """
    try:
        resultado = execute_sp("SP_OBTENER_PUBLICACIONES_RECIENTES", {"cantidad": cantidad})
        return resultado if resultado else []
    except Exception as e:
        print(f"❌ Error en obtener_publicaciones_recientes: {str(e)}")
        # Retornar lista vacía en lugar de error para no romper el frontend
        return []

# SP8: BUSCAR PUBLICACIONES
@app.get("/buscar")
def buscar_publicaciones(termino_busqueda: str = Query(..., min_length=1)):
    """
    Busca publicaciones por término.
    - termino_busqueda: Texto a buscar (mínimo 1 caracter)
    """
    try:
        resultado = execute_sp("SP_BUSCAR_PUBLICACIONES", {"termino_busqueda": termino_busqueda})
        return resultado if resultado else []
    except Exception as e:
        print(f"❌ Error en buscar_publicaciones: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SP3: OBTENER PUBLICACIÓN POR ID
@app.get("/{idpublicacion}")
def obtener_publicacion_por_id(idpublicacion: str):
    """
    Obtiene una publicación específica por su ID.
    """
    try:
        pub = execute_sp("SP_OBTENER_PUBLICACION_POR_ID", {"idpublicacion": idpublicacion}, fetch_one=True)
        if not pub:
            raise HTTPException(status_code=404, detail="Publicación no encontrada")
        return pub
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error en obtener_publicacion_por_id: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SP5: MARCAR/DESMARCAR PUBLICACIÓN DESTACADA
@app.post("/{idpublicacion}/destacada")
def marcar_publicacion_destacada(idpublicacion: str, destacada: int = Query(..., ge=0, le=1)):
    """
    Marca o desmarca una publicación como destacada.
    - idpublicacion: ID de la publicación
    - destacada: 0=desmarcar, 1=marcar
    """
    try:
        return execute_sp("SP_MARCAR_PUBLICACION_DESTACADA", {"idpublicacion": idpublicacion, "destacada": destacada})
    except Exception as e:
        print(f"❌ Error en marcar_publicacion_destacada: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SP6: ACTIVAR/DESACTIVAR PUBLICACIÓN
@app.post("/{idpublicacion}/activar")
def activar_desactivar_publicacion(idpublicacion: str, activa: int = Query(..., ge=0, le=1)):
    """
    Activa o desactiva una publicación.
    - idpublicacion: ID de la publicación
    - activa: 0=desactivar, 1=activar
    """
    try:
        return execute_sp("SP_ACTIVAR_DESACTIVAR_PUBLICACION", {"idpublicacion": idpublicacion, "activa": activa})
    except Exception as e:
        print(f"❌ Error en activar_desactivar_publicacion: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SP7: ELIMINAR PUBLICACIÓN (soft delete)
@app.delete("/{idpublicacion}")
def eliminar_publicacion(idpublicacion: str):
    """
    Elimina una publicación (soft delete).
    """
    try:
        return execute_sp("SP_ELIMINAR_PUBLICACION", {"idpublicacion": idpublicacion})
    except Exception as e:
        print(f"❌ Error en eliminar_publicacion: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SP9: ACTUALIZAR PUBLICACIÓN MANUAL
@app.put("/{idpublicacion}")
def actualizar_publicacion_manual(
    idpublicacion: str,
    titulo: str,
    contenido: str,
    foto: Optional[str] = None,
    fecha: Optional[str] = None,
    destacada: int = 0
):
    """
    Actualiza una publicación existente.
    """
    try:
        params = {
            "idpublicacion": idpublicacion,
            "titulo": titulo,
            "contenido": contenido,
            "foto": foto,
            "fecha": fecha,
            "destacada": destacada
        }
        return execute_sp("SP_ACTUALIZAR_PUBLICACION_MANUAL", params)
    except Exception as e:
        print(f"❌ Error en actualizar_publicacion_manual: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SP10: CREAR PUBLICACIÓN MANUAL
@app.post("/crear")  # ✅ Cambiado a /crear para evitar conflictos
def crear_publicacion_manual(
    titulo: str,
    contenido: str,
    foto: Optional[str] = None,
    fecha: Optional[str] = None,
    destacada: int = 0
):
    """
    Crea una nueva publicación manual.
    """
    try:
        params = {
            "titulo": titulo,
            "contenido": contenido,
            "foto": foto,
            "fecha": fecha,
            "destacada": destacada
        }
        return execute_sp("SP_CREAR_PUBLICACION_MANUAL", params)
    except Exception as e:
        print(f"❌ Error en crear_publicacion_manual: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SP11: ESTADÍSTICAS DE PUBLICACIONES
@app.get("/estadisticas")
def estadisticas_publicaciones():
    """
    Obtiene estadísticas generales de publicaciones.
    """
    try:
        resultado = execute_sp("SP_ESTADISTICAS_PUBLICACIONES")
        return resultado if resultado else []
    except Exception as e:
        print(f"❌ Error en estadisticas_publicaciones: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SP12: PUBLICACIONES POR RANGO DE FECHAS
@app.get("/rango")
def publicaciones_por_rango(fecha_inicio: str, fecha_fin: str):
    """
    Obtiene publicaciones en un rango de fechas.
    - fecha_inicio: Fecha inicial (formato: YYYY-MM-DD)
    - fecha_fin: Fecha final (formato: YYYY-MM-DD)
    """
    try:
        return execute_sp("SP_OBTENER_PUBLICACIONES_POR_FECHAS", {"fecha_inicio": fecha_inicio, "fecha_fin": fecha_fin})
    except Exception as e:
        print(f"❌ Error en publicaciones_por_rango: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SP13: CONTAR PUBLICACIONES POR ORIGEN
@app.get("/origen")
def contar_publicaciones_por_origen():
    """
    Cuenta publicaciones por origen (Facebook/Manual).
    """
    try:
        return execute_sp("SP_CONTAR_PUBLICACIONES_POR_ORIGEN")
    except Exception as e:
        print(f"❌ Error en contar_publicaciones_por_origen: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SP14: PUBLICACIONES POR MES
@app.get("/por_mes")
def publicaciones_por_mes(anio: Optional[int] = None):
    """
    Obtiene publicaciones agrupadas por mes.
    - anio: Año a filtrar (opcional)
    """
    try:
        return execute_sp("SP_PUBLICACIONES_POR_MES", {"anio": anio})
    except Exception as e:
        print(f"❌ Error en publicaciones_por_mes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SP15: SINCRONIZAR PUBLICACIÓN DESDE FACEBOOK
@app.post("/facebook/sincronizar")
def sincronizar_publicacion_facebook(
    idpublicacion: str,
    titulo: str,
    contenido: str,
    foto: str,
    fecha: str
):
    """
    Sincroniza una publicación desde Facebook.
    """
    try:
        params = {
            "idpublicacion": idpublicacion,
            "titulo": titulo,
            "contenido": contenido,
            "foto": foto,
            "fecha": fecha
        }
        return execute_sp("SP_SINCRONIZAR_PUBLICACION_FACEBOOK", params)
    except Exception as e:
        print(f"❌ Error en sincronizar_publicacion_facebook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===============================
# ENDPOINT DE HEALTH CHECK
# ===============================
@app.get("/health")
def health_check():
    """
    Verifica que el servicio de noticias esté funcionando.
    """
    return {
        "status": "healthy",
        "service": "noticias",
        "version": "1.0"
    }