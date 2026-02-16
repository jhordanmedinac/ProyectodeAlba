# adminendpoints/admin_noticias.py
"""
Endpoints del Panel Admin — NOTICIAS / PUBLICACIONES
CRUD de publicaciones (creadas desde admin o sincronizadas desde Facebook)
Tabla: publicaciones
SP usados: SP_NOT_LISTAR, SP_NOT_CONTAR, SP_NOT_DETALLE, SP_NOT_CREAR,
           SP_NOT_EDITAR, SP_NOT_TOGGLE_DESTACADA, SP_NOT_TOGGLE_ACTIVA,
           SP_NOT_ELIMINAR, SP_NOT_ESTADISTICAS
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from Conexiónsql import get_connection

router = APIRouter()


def _sp(nombre: str, params: tuple = ()):
    """Helper para ejecutar stored procedures"""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            placeholders = ",".join(["?"] * len(params))
            sql = f"EXEC {nombre} {placeholders}" if params else f"EXEC {nombre}"
            cursor.execute(sql, params)
            
            # Capturar todos los resultsets
            results = []
            if cursor.description:
                cols = [c[0] for c in cursor.description]
                results = [dict(zip(cols, row)) for row in cursor.fetchall()]
            
            conn.commit()
            return results if results else [{"status": "SUCCESS"}]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================
# MODELOS PYDANTIC
# =============================================
class PublicacionCrear(BaseModel):
    contenido: str              # El frontend envía solo contenido
    foto: Optional[str] = None  # URL de la imagen
    fecha: Optional[str] = None # Formato: 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:MM:SS'
    destacada: bool = False
    admin_id: int               # ID del administrador que crea la publicación

class PublicacionEditar(BaseModel):
    idpublicacion: str
    contenido: str
    foto: Optional[str] = None
    fecha: Optional[str] = None
    destacada: bool = False
    admin_id: int

class ToggleDestacada(BaseModel):
    idpublicacion: str

class ToggleActiva(BaseModel):
    idpublicacion: str

class EliminarPublicacion(BaseModel):
    idpublicacion: str


# =============================================
# GET /listar — Listar publicaciones con filtros y paginación
# SP: SP_NOT_LISTAR
# =============================================
@router.get("/listar", tags=["Admin - Noticias"])
def listar_publicaciones(
    busqueda: Optional[str] = None,
    creado_por: Optional[str] = None,  # 'Facebook' | 'Admin'
    solo_activas: bool = True,
    solo_destacadas: bool = False,
    desde: Optional[str] = None,       # Formato: 'YYYY-MM-DD'
    hasta: Optional[str] = None,       # Formato: 'YYYY-MM-DD'
    pagina: int = 1,
    por_pagina: int = 10
):
    """
    Listar publicaciones con filtros avanzados y paginación.
    
    Parámetros:
    - busqueda: Buscar en título o contenido
    - creado_por: Filtrar por origen ('Facebook' o 'Admin')
    - solo_activas: Mostrar solo publicaciones activas (default: True)
    - solo_destacadas: Mostrar solo destacadas (default: False)
    - desde: Fecha inicio (formato: YYYY-MM-DD)
    - hasta: Fecha fin (formato: YYYY-MM-DD)
    - pagina: Número de página (default: 1)
    - por_pagina: Registros por página (default: 10)
    """
    try:
        # Ejecutar SP_NOT_LISTAR
        rows = _sp("SP_NOT_LISTAR", (
            busqueda,
            creado_por,
            int(solo_activas),
            int(solo_destacadas),
            desde,
            hasta,
            pagina,
            por_pagina
        ))
        
        # Ejecutar SP_NOT_CONTAR para obtener el total
        total_rows = _sp("SP_NOT_CONTAR", (
            busqueda,
            creado_por,
            int(solo_activas),
            int(solo_destacadas),
            desde,
            hasta
        ))
        
        total = total_rows[0].get('total', 0) if total_rows else 0
        total_paginas = (total + por_pagina - 1) // por_pagina  # Redondeo hacia arriba
        
        return {
            "status": "SUCCESS",
            "data": rows,
            "pagination": {
                "pagina_actual": pagina,
                "por_pagina": por_pagina,
                "total_registros": total,
                "total_paginas": total_paginas,
                "tiene_siguiente": pagina < total_paginas,
                "tiene_anterior": pagina > 1
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar publicaciones: {str(e)}")


# =============================================
# GET /detalle/{idpublicacion} — Ver publicación completa
# SP: SP_NOT_DETALLE
# =============================================
@router.get("/detalle/{idpublicacion}", tags=["Admin - Noticias"])
def detalle_publicacion(idpublicacion: str):
    """
    Obtener los detalles completos de una publicación.
    """
    try:
        rows = _sp("SP_NOT_DETALLE", (idpublicacion,))
        
        if not rows:
            raise HTTPException(status_code=404, detail="Publicación no encontrada")
        
        return {
            "status": "SUCCESS",
            "data": rows[0]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener detalle: {str(e)}")


# =============================================
# POST /crear — Crear publicación manual
# SP: SP_NOT_CREAR
# =============================================
@router.post("/crear", tags=["Admin - Noticias"])
def crear_publicacion(body: PublicacionCrear):
    """
    Crear una nueva publicación desde el panel de administración.
    
    IMPORTANTE: El frontend solo envía 'contenido', el título se genera
    automáticamente (primeros 200 caracteres del contenido).
    """
    try:
        # Generar título desde el contenido (primeros 200 chars)
        titulo = body.contenido[:200] if len(body.contenido) > 200 else body.contenido
        
        # Parsear fecha si viene como string
        fecha = None
        if body.fecha:
            try:
                # Intentar parsear diferentes formatos
                if 'T' in body.fecha:
                    fecha = datetime.fromisoformat(body.fecha.replace('Z', '+00:00'))
                else:
                    fecha = datetime.strptime(body.fecha, '%Y-%m-%d')
            except:
                fecha = None  # Si falla, el SP usará SYSUTCDATETIME()
        
        # Ejecutar SP_NOT_CREAR
        result = _sp("SP_NOT_CREAR", (
            titulo,                     # @titulo (generado desde contenido)
            body.contenido,             # @contenido
            body.foto,                  # @foto
            fecha,                      # @fecha (NULL = ahora)
            int(body.destacada),        # @destacada
            body.admin_id               # @admin_id
        ))
        
        if result and result[0].get('status') == 'ERROR':
            raise HTTPException(status_code=400, detail=result[0].get('mensaje', 'Error al crear publicación'))
        
        return {
            "status": "SUCCESS",
            "mensaje": result[0].get('mensaje', 'Publicación creada correctamente'),
            "idpublicacion": result[0].get('idpublicacion')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear publicación: {str(e)}")


# =============================================
# PUT /editar — Editar publicación existente
# SP: SP_NOT_EDITAR
# =============================================
@router.put("/editar", tags=["Admin - Noticias"])
def editar_publicacion(body: PublicacionEditar):
    """
    Editar una publicación existente (solo las creadas desde Admin).
    
    IMPORTANTE: El frontend solo envía 'contenido', el título se genera
    automáticamente (primeros 200 caracteres del contenido).
    """
    try:
        # Generar título desde el contenido (primeros 200 chars)
        titulo = body.contenido[:200] if len(body.contenido) > 200 else body.contenido
        
        # Parsear fecha si viene como string
        fecha = None
        if body.fecha:
            try:
                if 'T' in body.fecha:
                    fecha = datetime.fromisoformat(body.fecha.replace('Z', '+00:00'))
                else:
                    fecha = datetime.strptime(body.fecha, '%Y-%m-%d')
            except:
                fecha = None  # Si falla, el SP mantiene la fecha original
        
        # Ejecutar SP_NOT_EDITAR
        result = _sp("SP_NOT_EDITAR", (
            body.idpublicacion,         # @idpublicacion
            titulo,                     # @titulo (generado desde contenido)
            body.contenido,             # @contenido
            body.foto,                  # @foto
            fecha,                      # @fecha (NULL = mantener actual)
            int(body.destacada),        # @destacada
            body.admin_id               # @admin_id
        ))
        
        if result and result[0].get('status') == 'ERROR':
            raise HTTPException(status_code=400, detail=result[0].get('mensaje', 'Error al editar publicación'))
        
        return {
            "status": "SUCCESS",
            "mensaje": result[0].get('mensaje', 'Publicación actualizada correctamente')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al editar publicación: {str(e)}")


# =============================================
# PUT /toggle-destacada — Marcar/desmarcar como destacada
# SP: SP_NOT_TOGGLE_DESTACADA
# =============================================
@router.put("/toggle-destacada", tags=["Admin - Noticias"])
def toggle_destacada(body: ToggleDestacada):
    """
    Alternar el estado de destacada de una publicación.
    Si está destacada, la quita. Si no lo está, la marca como destacada.
    """
    try:
        result = _sp("SP_NOT_TOGGLE_DESTACADA", (body.idpublicacion,))
        
        if result and result[0].get('status') == 'ERROR':
            raise HTTPException(status_code=400, detail=result[0].get('mensaje', 'Error al cambiar destacada'))
        
        return {
            "status": "SUCCESS",
            "mensaje": result[0].get('mensaje', 'Estado de destacada actualizado')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al cambiar destacada: {str(e)}")


# =============================================
# PUT /toggle-activa — Activar/desactivar publicación
# SP: SP_NOT_TOGGLE_ACTIVA
# =============================================
@router.put("/toggle-activa", tags=["Admin - Noticias"])
def toggle_activa(body: ToggleActiva):
    """
    Alternar el estado activo de una publicación (archivar/activar).
    Si está activa, la desactiva. Si está desactivada, la activa.
    """
    try:
        result = _sp("SP_NOT_TOGGLE_ACTIVA", (body.idpublicacion,))
        
        if result and result[0].get('status') == 'ERROR':
            raise HTTPException(status_code=400, detail=result[0].get('mensaje', 'Error al cambiar estado'))
        
        return {
            "status": "SUCCESS",
            "mensaje": result[0].get('mensaje', 'Estado actualizado')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al cambiar estado: {str(e)}")


# =============================================
# DELETE /eliminar — Eliminar publicación definitivamente
# SP: SP_NOT_ELIMINAR
# =============================================
@router.delete("/eliminar", tags=["Admin - Noticias"])
def eliminar_publicacion(body: EliminarPublicacion):
    """
    Eliminar definitivamente una publicación de la base de datos.
    PRECAUCIÓN: Esta acción no se puede deshacer.
    """
    try:
        result = _sp("SP_NOT_ELIMINAR", (body.idpublicacion,))
        
        if result and result[0].get('status') == 'ERROR':
            raise HTTPException(status_code=400, detail=result[0].get('mensaje', 'Error al eliminar publicación'))
        
        return {
            "status": "SUCCESS",
            "mensaje": result[0].get('mensaje', 'Publicación eliminada definitivamente')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar publicación: {str(e)}")


# =============================================
# GET /estadisticas — Obtener estadísticas del módulo
# SP: SP_NOT_ESTADISTICAS
# =============================================
@router.get("/estadisticas", tags=["Admin - Noticias"])
def estadisticas_noticias():
    """
    Obtener estadísticas generales del módulo de noticias para el dashboard.
    
    Retorna:
    - Total de publicaciones
    - Activas vs Archivadas
    - Destacadas
    - Publicaciones por origen (Facebook vs Admin)
    - Publicaciones este mes
    - Última publicación
    """
    try:
        result = _sp("SP_NOT_ESTADISTICAS")
        
        if not result:
            return {
                "status": "SUCCESS",
                "data": {
                    "total_publicaciones": 0,
                    "activas": 0,
                    "archivadas": 0,
                    "destacadas": 0,
                    "desde_facebook": 0,
                    "desde_admin": 0,
                    "este_mes": 0,
                    "ultima_publicacion": None
                }
            }
        
        return {
            "status": "SUCCESS",
            "data": result[0]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas: {str(e)}")


# =============================================
# NOTAS DE USO
# =============================================
"""
ENDPOINTS DISPONIBLES:

1. GET  /listar
   - Listar publicaciones con filtros y paginación
   - Parámetros: busqueda, creado_por, solo_activas, solo_destacadas, desde, hasta, pagina, por_pagina

2. GET  /detalle/{idpublicacion}
   - Obtener detalles completos de una publicación

3. POST /crear
   - Crear nueva publicación
   - Body: { contenido, foto?, fecha?, destacada, admin_id }
   - NOTA: El título se genera automáticamente del contenido

4. PUT  /editar
   - Editar publicación existente
   - Body: { idpublicacion, contenido, foto?, fecha?, destacada, admin_id }
   - NOTA: El título se genera automáticamente del contenido

5. PUT  /toggle-destacada
   - Marcar/desmarcar como destacada
   - Body: { idpublicacion }

6. PUT  /toggle-activa
   - Activar/desactivar publicación
   - Body: { idpublicacion }

7. DELETE /eliminar
   - Eliminar definitivamente
   - Body: { idpublicacion }

8. GET  /estadisticas
   - Obtener estadísticas para el dashboard

EJEMPLOS DE USO:

# Crear publicación:
POST /crear
{
    "contenido": "El CGPVP participó en el simulacro nacional...",
    "foto": "https://ejemplo.com/imagen.jpg",
    "fecha": "2025-02-14",
    "destacada": true,
    "admin_id": 1
}

# Listar con filtros:
GET /listar?busqueda=simulacro&creado_por=Admin&pagina=1&por_pagina=10

# Toggle destacada:
PUT /toggle-destacada
{
    "idpublicacion": "admin_20250214153045_5829"
}
"""