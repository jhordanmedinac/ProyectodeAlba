-- =============================================
-- STORED PROCEDURES - NOTICIAS/PUBLICACIONES
-- Cuerpo General de Paramédicos Voluntarios del Perú
-- Sistema de Gestión de Noticias y Contenido
-- =============================================

USE DB_CGPVP2;
GO

-- =============================================
-- SP1: LISTAR PUBLICACIONES PAGINADO (CON FILTROS)
-- Descripción: Obtener publicaciones con paginación y filtros
-- Uso en: Grid de noticias en la web
-- =============================================
CREATE OR ALTER PROCEDURE SP_LISTAR_PUBLICACIONES_CON_FILTROS
    @Pagina INT = 1,
    @CantidadPorPagina INT = 9,
    @SoloDestacadas BIT = 0,
    @SoloActivas BIT = 1,
    @busqueda NVARCHAR(200) = NULL,
    @ordenar_por NVARCHAR(20) = 'reciente' -- 'reciente', 'antiguo', 'destacadas'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@Pagina - 1) * @CantidadPorPagina;

    -- Consulta principal con paginación
    SELECT 
        p.idpublicacion,
        p.titulo,
        p.contenido,
        p.foto,
        p.fecha,
        p.creado_por,
        p.destacada,
        p.fecha_creacion,
        p.activa,
        
        -- Información adicional
        LEN(p.contenido) AS longitud_contenido,
        CASE 
            WHEN LEN(p.contenido) > 200 THEN LEFT(p.contenido, 200) + '...'
            ELSE p.contenido
        END AS resumen,
        
        -- Formato de fecha amigable
        FORMAT(p.fecha, 'dd ''de'' MMMM, yyyy', 'es-ES') AS fecha_formateada,
        DATEDIFF(DAY, p.fecha, GETDATE()) AS dias_desde_publicacion
        
    FROM publicaciones p
    WHERE 
        (@SoloActivas = 0 OR p.activa = 1)
        AND (@SoloDestacadas = 0 OR p.destacada = 1)
        AND (
            @busqueda IS NULL 
            OR p.titulo LIKE '%' + @busqueda + '%'
            OR p.contenido LIKE '%' + @busqueda + '%'
        )
    ORDER BY 
        CASE WHEN @ordenar_por = 'destacadas' THEN p.destacada END DESC,
        CASE WHEN @ordenar_por = 'reciente' THEN p.fecha END DESC,
        CASE WHEN @ordenar_por = 'antiguo' THEN p.fecha END ASC
    OFFSET @Offset ROWS 
    FETCH NEXT @CantidadPorPagina ROWS ONLY;
    
    -- Contador total de registros (para paginación)
    SELECT COUNT(*) AS total_registros
    FROM publicaciones p
    WHERE 
        (@SoloActivas = 0 OR p.activa = 1)
        AND (@SoloDestacadas = 0 OR p.destacada = 1)
        AND (
            @busqueda IS NULL 
            OR p.titulo LIKE '%' + @busqueda + '%'
            OR p.contenido LIKE '%' + @busqueda + '%'
        );
END
GO

-- =============================================
-- SP2: OBTENER PUBLICACIÓN DESTACADA
-- Descripción: Obtener la publicación más reciente marcada como destacada
-- Uso en: Hero section de noticias
-- =============================================
CREATE OR ALTER PROCEDURE SP_OBTENER_PUBLICACION_DESTACADA
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1
        p.idpublicacion,
        p.titulo,
        p.contenido,
        p.foto,
        p.fecha,
        p.creado_por,
        p.destacada,
        FORMAT(p.fecha, 'dd ''de'' MMMM, yyyy', 'es-ES') AS fecha_formateada,
        DATEDIFF(DAY, p.fecha, GETDATE()) AS dias_desde_publicacion
    FROM publicaciones p
    WHERE p.activa = 1 AND p.destacada = 1
    ORDER BY p.fecha DESC;
END
GO

-- =============================================
-- SP3: OBTENER PUBLICACIÓN POR ID
-- Descripción: Detalle completo de una publicación
-- Uso en: Vista detallada de noticia
-- =============================================
CREATE OR ALTER PROCEDURE SP_OBTENER_PUBLICACION_POR_ID
    @idpublicacion NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        p.idpublicacion,
        p.titulo,
        p.contenido,
        p.foto,
        p.fecha,
        p.creado_por,
        p.destacada,
        p.fecha_creacion,
        p.activa,
        FORMAT(p.fecha, 'dd ''de'' MMMM, yyyy', 'es-ES') AS fecha_formateada,
        DATEDIFF(DAY, p.fecha, GETDATE()) AS dias_desde_publicacion,
        LEN(p.contenido) AS longitud_contenido
    FROM publicaciones p
    WHERE p.idpublicacion = @idpublicacion;
END
GO

-- =============================================
-- SP4: OBTENER PUBLICACIONES RECIENTES
-- Descripción: Últimas publicaciones (para sidebar)
-- =============================================
CREATE OR ALTER PROCEDURE SP_OBTENER_PUBLICACIONES_RECIENTES
    @cantidad INT = 3  -- ✅ Cambiado de 5 a 3
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@cantidad)
        p.idpublicacion,
        p.titulo,
        p.foto,
        p.fecha,
        p.contenido,  -- ✅ Agregado contenido completo
        FORMAT(p.fecha, 'dd ''de'' MMMM, yyyy', 'es-ES') AS fecha_formateada,
        DATEDIFF(DAY, p.fecha, GETDATE()) AS dias_desde_publicacion,
        -- Resumen corto
        CASE 
            WHEN LEN(p.contenido) > 100 THEN LEFT(p.contenido, 100) + '...'
            ELSE p.contenido
        END AS resumen_corto
    FROM publicaciones p
    WHERE p.activa = 1
    ORDER BY p.fecha DESC;
END
GO


-- =============================================
-- SP5: MARCAR/DESMARCAR COMO DESTACADA
-- Descripción: Cambiar estado de destacada de una publicación
-- =============================================
CREATE OR ALTER PROCEDURE SP_MARCAR_PUBLICACION_DESTACADA
    @idpublicacion NVARCHAR(100),
    @destacada BIT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la publicación existe
        IF NOT EXISTS (SELECT 1 FROM publicaciones WHERE idpublicacion = @idpublicacion)
        BEGIN
            THROW 50300, 'La publicación no existe', 1;
        END
        
        -- Si se marca como destacada, quitar destacado de las demás (solo una destacada a la vez)
        IF @destacada = 1
        BEGIN
            UPDATE publicaciones
            SET destacada = 0
            WHERE idpublicacion != @idpublicacion;
        END
        
        -- Actualizar la publicación
        UPDATE publicaciones
        SET destacada = @destacada
        WHERE idpublicacion = @idpublicacion;
        
        COMMIT TRANSACTION;
        
        SELECT 'SUCCESS' AS status, 'Publicación actualizada exitosamente' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS error_message;
    END CATCH
END
GO

-- =============================================
-- SP6: ACTIVAR/DESACTIVAR PUBLICACIÓN
-- Descripción: Cambiar estado activo de una publicación
-- =============================================
CREATE OR ALTER PROCEDURE SP_ACTIVAR_DESACTIVAR_PUBLICACION
    @idpublicacion NVARCHAR(100),
    @activa BIT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        IF NOT EXISTS (SELECT 1 FROM publicaciones WHERE idpublicacion = @idpublicacion)
        BEGIN
            THROW 50300, 'La publicación no existe', 1;
        END
        
        UPDATE publicaciones
        SET activa = @activa
        WHERE idpublicacion = @idpublicacion;
        
        COMMIT TRANSACTION;
        
        SELECT 'SUCCESS' AS status, 
               CASE WHEN @activa = 1 THEN 'Publicación activada' ELSE 'Publicación desactivada' END AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS error_message;
    END CATCH
END
GO

-- =============================================
-- SP7: ELIMINAR PUBLICACIÓN (SOFT DELETE)
-- Descripción: Marcar publicación como inactiva
-- =============================================
CREATE OR ALTER PROCEDURE SP_ELIMINAR_PUBLICACION
    @idpublicacion NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        IF NOT EXISTS (SELECT 1 FROM publicaciones WHERE idpublicacion = @idpublicacion)
        BEGIN
            THROW 50300, 'La publicación no existe', 1;
        END
        
        -- Soft delete: marcar como inactiva
        UPDATE publicaciones
        SET activa = 0,
            destacada = 0
        WHERE idpublicacion = @idpublicacion;
        
        COMMIT TRANSACTION;
        
        SELECT 'SUCCESS' AS status, 'Publicación eliminada exitosamente' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS error_message;
    END CATCH
END
GO

-- =============================================
-- SP8: BUSCAR PUBLICACIONES
-- Descripción: Búsqueda en tiempo real
-- =============================================
CREATE OR ALTER PROCEDURE SP_BUSCAR_PUBLICACIONES
    @termino_busqueda NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 10
        p.idpublicacion,
        p.titulo,
        p.foto,
        p.fecha,
        FORMAT(p.fecha, 'dd ''de'' MMMM, yyyy', 'es-ES') AS fecha_formateada,
        CASE 
            WHEN LEN(p.contenido) > 150 THEN LEFT(p.contenido, 150) + '...'
            ELSE p.contenido
        END AS resumen
    FROM publicaciones p
    WHERE 
        p.activa = 1
        AND (
            p.titulo LIKE '%' + @termino_busqueda + '%'
            OR p.contenido LIKE '%' + @termino_busqueda + '%'
        )
    ORDER BY 
        CASE 
            WHEN p.titulo LIKE @termino_busqueda + '%' THEN 1
            WHEN p.titulo LIKE '%' + @termino_busqueda + '%' THEN 2
            ELSE 3
        END,
        p.fecha DESC;
END
GO

-- =============================================
-- SP9: ACTUALIZAR PUBLICACIÓN (Admin Manual)
-- Descripción: Modificar una publicación creada manualmente
-- =============================================
CREATE OR ALTER PROCEDURE SP_ACTUALIZAR_PUBLICACION_MANUAL
    @idpublicacion NVARCHAR(100),
    @titulo NVARCHAR(200),
    @contenido NVARCHAR(MAX),
    @foto NVARCHAR(MAX) = NULL,
    @fecha DATETIME2 = NULL,
    @destacada BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        IF NOT EXISTS (SELECT 1 FROM publicaciones WHERE idpublicacion = @idpublicacion)
        BEGIN
            THROW 50300, 'La publicación no existe', 1;
        END
        
        -- Verificar que sea una publicación del Admin (no de Facebook)
        IF EXISTS (SELECT 1 FROM publicaciones WHERE idpublicacion = @idpublicacion AND creado_por = 'Facebook')
        BEGIN
            THROW 50301, 'No se pueden editar publicaciones sincronizadas de Facebook', 1;
        END
        
        -- Si no se proporciona fecha, usar la actual
        IF @fecha IS NULL
            SET @fecha = SYSUTCDATETIME();
        
        -- Si se marca como destacada, quitar otras destacadas
        IF @destacada = 1
        BEGIN
            UPDATE publicaciones
            SET destacada = 0
            WHERE idpublicacion != @idpublicacion;
        END
        
        UPDATE publicaciones
        SET titulo = @titulo,
            contenido = @contenido,
            foto = @foto,
            fecha = @fecha,
            destacada = @destacada
        WHERE idpublicacion = @idpublicacion;
        
        COMMIT TRANSACTION;
        
        SELECT 'SUCCESS' AS status, 'Publicación actualizada exitosamente' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        SELECT 
            'ERROR' AS status,
            ERROR_NUMBER() AS error_number,
            ERROR_MESSAGE() AS error_message;
    END CATCH
END
GO

-- =============================================
-- SP10: CREAR PUBLICACIÓN MANUAL
-- Descripción: Crear una nueva publicación desde el panel de administración
-- =============================================
CREATE OR ALTER PROCEDURE SP_CREAR_PUBLICACION_MANUAL
    @titulo NVARCHAR(200),
    @contenido NVARCHAR(MAX),
    @foto NVARCHAR(MAX) = NULL,
    @fecha DATETIME2 = NULL,
    @destacada BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Si no se proporciona fecha, usar la actual
        IF @fecha IS NULL
            SET @fecha = SYSUTCDATETIME();
        
        -- Generar ID único para la publicación
        DECLARE @idpublicacion NVARCHAR(100);
        SET @idpublicacion = 'PUB_' + FORMAT(GETDATE(), 'yyyyMMddHHmmss') + '_' + CAST(NEWID() AS NVARCHAR(36));
        
        -- Si se marca como destacada, quitar otras destacadas
        IF @destacada = 1
        BEGIN
            UPDATE publicaciones
            SET destacada = 0;
        END
        
        INSERT INTO publicaciones 
        (idpublicacion, titulo, contenido, foto, fecha, creado_por, destacada, activa)
        VALUES 
        (@idpublicacion, @titulo, @contenido, @foto, @fecha, 'Admin', @destacada, 1);
        
        COMMIT TRANSACTION;
        
        SELECT 'SUCCESS' AS status, @idpublicacion AS idpublicacion, 'Publicación creada exitosamente' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS error_message;
    END CATCH
END
GO

-- =============================================
-- SP11: ESTADÍSTICAS DE PUBLICACIONES
-- Descripción: Métricas para el dashboard
-- =============================================
CREATE OR ALTER PROCEDURE SP_ESTADISTICAS_PUBLICACIONES
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        (SELECT COUNT(*) FROM publicaciones) AS total_publicaciones,
        (SELECT COUNT(*) FROM publicaciones WHERE activa = 1) AS publicaciones_activas,
        (SELECT COUNT(*) FROM publicaciones WHERE activa = 0) AS publicaciones_inactivas,
        (SELECT COUNT(*) FROM publicaciones WHERE destacada = 1) AS publicaciones_destacadas,
        (SELECT COUNT(*) FROM publicaciones WHERE creado_por = 'Facebook') AS publicaciones_facebook,
        (SELECT COUNT(*) FROM publicaciones WHERE creado_por = 'Admin') AS publicaciones_admin,
        
        -- Publicaciones del mes actual
        (SELECT COUNT(*) FROM publicaciones 
         WHERE MONTH(fecha) = MONTH(GETDATE()) AND YEAR(fecha) = YEAR(GETDATE())) AS publicaciones_este_mes,
        
        -- Publicaciones de la semana actual
        (SELECT COUNT(*) FROM publicaciones 
         WHERE fecha >= DATEADD(DAY, -7, GETDATE())) AS publicaciones_esta_semana,
        
        -- Promedio de publicaciones por mes
        (SELECT AVG(cantidad) FROM (
            SELECT COUNT(*) AS cantidad
            FROM publicaciones
            GROUP BY YEAR(fecha), MONTH(fecha)
        ) AS subquery) AS promedio_publicaciones_mes;
END
GO

-- =============================================
-- SP12: OBTENER PUBLICACIONES POR RANGO DE FECHAS
-- Descripción: Filtrar publicaciones por período
-- =============================================
CREATE OR ALTER PROCEDURE SP_OBTENER_PUBLICACIONES_POR_FECHAS
    @fecha_inicio DATE,
    @fecha_fin DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        p.idpublicacion,
        p.titulo,
        p.contenido,
        p.foto,
        p.fecha,
        p.creado_por,
        p.destacada,
        p.activa,
        FORMAT(p.fecha, 'dd ''de'' MMMM, yyyy', 'es-ES') AS fecha_formateada
    FROM publicaciones p
    WHERE p.fecha BETWEEN @fecha_inicio AND @fecha_fin
    ORDER BY p.fecha DESC;
END
GO

-- =============================================
-- SP13: CONTAR PUBLICACIONES POR ORIGEN
-- Descripción: Estadísticas de origen de publicaciones
-- =============================================
CREATE OR ALTER PROCEDURE SP_CONTAR_PUBLICACIONES_POR_ORIGEN
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        creado_por,
        COUNT(*) AS cantidad,
        COUNT(CASE WHEN activa = 1 THEN 1 END) AS activas,
        COUNT(CASE WHEN destacada = 1 THEN 1 END) AS destacadas,
        MIN(fecha) AS primera_publicacion,
        MAX(fecha) AS ultima_publicacion
    FROM publicaciones
    GROUP BY creado_por
    ORDER BY cantidad DESC;
END
GO

-- =============================================
-- SP14: PUBLICACIONES POR MES (PARA GRÁFICOS)
-- Descripción: Datos para gráfico de líneas de publicaciones
-- =============================================
CREATE OR ALTER PROCEDURE SP_PUBLICACIONES_POR_MES
    @anio INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Si no se proporciona año, usar el actual
    IF @anio IS NULL
        SET @anio = YEAR(GETDATE());
    
    SELECT 
        MONTH(fecha) AS mes,
        DATENAME(MONTH, fecha) AS nombre_mes,
        COUNT(*) AS cantidad,
        COUNT(CASE WHEN creado_por = 'Facebook' THEN 1 END) AS cantidad_facebook,
        COUNT(CASE WHEN creado_por = 'Admin' THEN 1 END) AS cantidad_admin
    FROM publicaciones
    WHERE YEAR(fecha) = @anio
    GROUP BY MONTH(fecha), DATENAME(MONTH, fecha)
    ORDER BY MONTH(fecha);
END
GO

-- =============================================
-- SP15: SINCRONIZAR PUBLICACIÓN DESDE FACEBOOK
-- Descripción: Ya existe (SP_INSERTAR_ACTUALIZAR_PUBLICACION) pero lo mejoramos
-- =============================================
CREATE OR ALTER PROCEDURE SP_SINCRONIZAR_PUBLICACION_FACEBOOK
    @idpublicacion NVARCHAR(100),
    @titulo NVARCHAR(200),
    @contenido NVARCHAR(MAX),
    @foto NVARCHAR(MAX),
    @fecha DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        IF EXISTS (SELECT 1 FROM publicaciones WHERE idpublicacion = @idpublicacion)
        BEGIN
            -- Actualizar solo si fue creada por Facebook
            UPDATE publicaciones 
            SET titulo = @titulo,
                contenido = @contenido, 
                foto = @foto,
                fecha = @fecha
            WHERE idpublicacion = @idpublicacion 
              AND creado_por = 'Facebook';
            
            SELECT 'UPDATED' AS status, @idpublicacion AS idpublicacion;
        END
        ELSE
        BEGIN
            -- Insertar nueva publicación de Facebook
            INSERT INTO publicaciones 
            (idpublicacion, titulo, contenido, foto, fecha, creado_por, destacada, activa) 
            VALUES 
            (@idpublicacion, @titulo, @contenido, @foto, @fecha, 'Facebook', 0, 1);
            
            SELECT 'INSERTED' AS status, @idpublicacion AS idpublicacion;
        END
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS error_message;
    END CATCH
END
GO

PRINT '========================================';
PRINT 'STORED PROCEDURES DE NOTICIAS';
PRINT 'CREADOS EXITOSAMENTE';
PRINT '========================================';
PRINT '';
PRINT 'Total de SPs creados: 15';
PRINT '';
PRINT 'SP1:  SP_LISTAR_PUBLICACIONES_CON_FILTROS';
PRINT 'SP2:  SP_OBTENER_PUBLICACION_DESTACADA';
PRINT 'SP3:  SP_OBTENER_PUBLICACION_POR_ID';
PRINT 'SP4:  SP_OBTENER_PUBLICACIONES_RECIENTES';
PRINT 'SP5:  SP_MARCAR_PUBLICACION_DESTACADA';
PRINT 'SP6:  SP_ACTIVAR_DESACTIVAR_PUBLICACION';
PRINT 'SP7:  SP_ELIMINAR_PUBLICACION';
PRINT 'SP8:  SP_BUSCAR_PUBLICACIONES';
PRINT 'SP9:  SP_ACTUALIZAR_PUBLICACION_MANUAL';
PRINT 'SP10: SP_CREAR_PUBLICACION_MANUAL';
PRINT 'SP11: SP_ESTADISTICAS_PUBLICACIONES';
PRINT 'SP12: SP_OBTENER_PUBLICACIONES_POR_FECHAS';
PRINT 'SP13: SP_CONTAR_PUBLICACIONES_POR_ORIGEN';
PRINT 'SP14: SP_PUBLICACIONES_POR_MES';
PRINT 'SP15: SP_SINCRONIZAR_PUBLICACION_FACEBOOK';
PRINT '========================================';
GO
CREATE or ALTER PROCEDURE SP_INSERTAR_ACTUALIZAR_PUBLICACION
    @idpublicacion VARCHAR(255),
    @titulo NVARCHAR(MAX),
    @contenido NVARCHAR(MAX),
    @foto NVARCHAR(MAX),
    @fecha DATETIME,
    @creado_por VARCHAR(50)
AS
BEGIN
    -- 1. Verificamos si el ID ya existe en la tabla
    IF NOT EXISTS (SELECT 1 FROM publicaciones WHERE idpublicacion = @idpublicacion)
    BEGIN
        -- 2. Si no existe, lo insertamos normal
        INSERT INTO publicaciones (idpublicacion, titulo, contenido, foto, fecha, creado_por)
        VALUES (@idpublicacion, @titulo, @contenido, @foto, @fecha, @creado_por);
        
        PRINT '✅ Nueva publicación guardada correctamente.';
    END
    ELSE
    BEGIN
        -- 3. Si ya existe, no hacemos nada (así protegemos tus ediciones manuales)
        PRINT 'ℹ️ El ID ya existe. No se modificó para proteger cambios manuales.';
    END
END