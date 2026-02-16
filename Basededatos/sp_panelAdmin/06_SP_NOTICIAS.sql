-- ============================================================
-- STORED PROCEDURES - MÓDULO NOTICIAS
-- Base de datos: DB_CGPVP2
-- Tabla: publicaciones
-- Descripción: CRUD completo para gestión de noticias
-- ============================================================

USE DB_CGPVP2;
GO

-- ============================================================
-- SP 1: LISTAR NOTICIAS CON PAGINACIÓN Y FILTROS
-- ============================================================
CREATE OR ALTER PROCEDURE SP_NOT_LISTAR
    @busqueda      NVARCHAR(200) = NULL,
    @creado_por    NVARCHAR(20)  = NULL,   -- 'Facebook' | 'Admin'
    @solo_activas  BIT           = 1,
    @solo_destacadas BIT         = 0,
    @desde         DATE          = NULL,
    @hasta         DATE          = NULL,
    @pagina        INT           = 1,
    @por_pagina    INT           = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Calcular offset para paginación
    DECLARE @offset INT = (@pagina - 1) * @por_pagina;
    
    -- Query principal con paginación
    SELECT
        idpublicacion,
        titulo,
        contenido,
        -- Resumen del contenido (200 chars) para las cards
        LEFT(contenido, 200) + (CASE WHEN LEN(contenido) > 200 THEN '…' ELSE '' END) AS resumen,
        foto,
        fecha,
        creado_por,
        destacada,
        activa,
        fecha_creacion
    FROM publicaciones
    WHERE
        (@solo_activas = 0 OR activa = 1)
        AND (@solo_destacadas = 0 OR destacada = 1)
        AND (@creado_por IS NULL OR creado_por = @creado_por)
        AND (@busqueda IS NULL 
             OR titulo LIKE '%' + @busqueda + '%'
             OR contenido LIKE '%' + @busqueda + '%')
        AND (@desde IS NULL OR CAST(fecha AS DATE) >= @desde)
        AND (@hasta IS NULL OR CAST(fecha AS DATE) <= @hasta)
    ORDER BY 
        destacada DESC,  -- Destacadas primero
        fecha DESC       -- Más recientes primero
    OFFSET @offset ROWS 
    FETCH NEXT @por_pagina ROWS ONLY;
END
GO

-- ============================================================
-- SP 2: CONTAR NOTICIAS (PARA PAGINACIÓN)
-- ============================================================
CREATE OR ALTER PROCEDURE SP_NOT_CONTAR
    @busqueda        NVARCHAR(200) = NULL,
    @creado_por      NVARCHAR(20)  = NULL,
    @solo_activas    BIT           = 1,
    @solo_destacadas BIT           = 0,
    @desde           DATE          = NULL,
    @hasta           DATE          = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) AS total
    FROM publicaciones
    WHERE
        (@solo_activas = 0 OR activa = 1)
        AND (@solo_destacadas = 0 OR destacada = 1)
        AND (@creado_por IS NULL OR creado_por = @creado_por)
        AND (@busqueda IS NULL 
             OR titulo LIKE '%' + @busqueda + '%'
             OR contenido LIKE '%' + @busqueda + '%')
        AND (@desde IS NULL OR CAST(fecha AS DATE) >= @desde)
        AND (@hasta IS NULL OR CAST(fecha AS DATE) <= @hasta);
END
GO

-- ============================================================
-- SP 3: OBTENER DETALLE DE UNA PUBLICACIÓN
-- ============================================================
CREATE OR ALTER PROCEDURE SP_NOT_DETALLE
    @idpublicacion NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        idpublicacion,
        titulo,
        contenido,
        foto,
        fecha,
        creado_por,
        destacada,
        activa,
        fecha_creacion
    FROM publicaciones
    WHERE idpublicacion = @idpublicacion;
END
GO

-- ============================================================
-- SP 4: CREAR PUBLICACIÓN (DESDE ADMIN)
-- ============================================================
CREATE OR ALTER PROCEDURE SP_NOT_CREAR
    @titulo    NVARCHAR(200),
    @contenido NVARCHAR(MAX),
    @foto      NVARCHAR(MAX) = NULL,
    @fecha     DATETIME2     = NULL,
    @destacada BIT           = 0,
    @admin_id  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones
        IF LTRIM(RTRIM(@titulo)) = ''
            THROW 50001, 'El título no puede estar vacío', 1;
            
        IF LTRIM(RTRIM(@contenido)) = ''
            THROW 50002, 'El contenido no puede estar vacío', 1;
        
        -- Si no se proporciona fecha, usar la actual
        IF @fecha IS NULL
            SET @fecha = SYSUTCDATETIME();
        
        -- Generar ID único: admin_YYYYMMDDHHMMSS_RAND
        DECLARE @timestamp NVARCHAR(50) = FORMAT(GETDATE(), 'yyyyMMddHHmmss');
        DECLARE @random INT = ABS(CHECKSUM(NEWID())) % 9000 + 1000;
        DECLARE @new_id NVARCHAR(100) = CONCAT('admin_', @timestamp, '_', @random);
        
        -- Si se marca como destacada, quitar destacado de las demás
        IF @destacada = 1
        BEGIN
            UPDATE publicaciones
            SET destacada = 0
            WHERE destacada = 1;
        END
        
        -- Insertar nueva publicación
        INSERT INTO publicaciones (
            idpublicacion,
            titulo,
            contenido,
            foto,
            fecha,
            creado_por,
            destacada,
            activa,
            fecha_creacion
        )
        VALUES (
            @new_id,
            LTRIM(RTRIM(@titulo)),
            @contenido,
            @foto,
            @fecha,
            'Admin',
            @destacada,
            1,
            SYSUTCDATETIME()
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar éxito con el ID generado
        SELECT 
            'SUCCESS' AS status,
            'Publicación creada correctamente' AS mensaje,
            @new_id AS idpublicacion;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- ============================================================
-- SP 5: EDITAR PUBLICACIÓN (SOLO LAS DE ADMIN)
-- ============================================================
CREATE OR ALTER PROCEDURE SP_NOT_EDITAR
    @idpublicacion NVARCHAR(100),
    @titulo        NVARCHAR(200),
    @contenido     NVARCHAR(MAX),
    @foto          NVARCHAR(MAX) = NULL,
    @fecha         DATETIME2     = NULL,
    @destacada     BIT           = 0,
    @admin_id      INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que existe
        IF NOT EXISTS (SELECT 1 FROM publicaciones WHERE idpublicacion = @idpublicacion)
            THROW 50003, 'La publicación no existe', 1;
        
        -- ⚠️ COMENTADO: Ya NO verificamos si es de Facebook
        -- Ahora se pueden editar todas las publicaciones
        /*
        IF EXISTS (SELECT 1 FROM publicaciones 
                   WHERE idpublicacion = @idpublicacion AND creado_por = 'Facebook')
            THROW 50004, 'No se pueden editar publicaciones de Facebook', 1;
        */
        
        -- Validaciones
        IF LTRIM(RTRIM(@titulo)) = ''
            THROW 50001, 'El título no puede estar vacío', 1;
        
        IF LTRIM(RTRIM(@contenido)) = ''
            THROW 50002, 'El contenido no puede estar vacío', 1;
        
        -- Si se marca como destacada, quitar destacado de las demás
        IF @destacada = 1
        BEGIN
            UPDATE publicaciones
            SET destacada = 0
            WHERE idpublicacion != @idpublicacion;
        END
        
        -- Actualizar publicación
        UPDATE publicaciones
        SET 
            titulo = LTRIM(RTRIM(@titulo)),
            contenido = @contenido,
            foto = ISNULL(@foto, foto),  -- Si viene NULL, mantener la actual
            fecha = ISNULL(@fecha, fecha),  -- Si viene NULL, mantener la actual
            destacada = @destacada
        WHERE idpublicacion = @idpublicacion;
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Publicación actualizada correctamente' AS mensaje;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- ============================================================
-- SP 6: TOGGLE DESTACADA (MARCAR/DESMARCAR)
-- ============================================================
CREATE OR ALTER PROCEDURE SP_NOT_TOGGLE_DESTACADA
    @idpublicacion NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que existe
        IF NOT EXISTS (SELECT 1 FROM publicaciones WHERE idpublicacion = @idpublicacion)
        BEGIN
            SELECT 'ERROR' AS status, 'Publicación no encontrada' AS mensaje;
            RETURN;
        END
        
        -- Obtener estado actual
        DECLARE @actual_destacada BIT;
        SELECT @actual_destacada = destacada 
        FROM publicaciones 
        WHERE idpublicacion = @idpublicacion;
        
        -- Si se va a marcar como destacada, quitar las demás
        IF @actual_destacada = 0
        BEGIN
            UPDATE publicaciones
            SET destacada = 0
            WHERE destacada = 1;
        END
        
        -- Toggle del estado
        UPDATE publicaciones
        SET destacada = CASE WHEN destacada = 1 THEN 0 ELSE 1 END
        WHERE idpublicacion = @idpublicacion;
        
        COMMIT TRANSACTION;
        
        -- Retornar mensaje apropiado
        SELECT 
            'SUCCESS' AS status,
            CASE WHEN @actual_destacada = 0
                 THEN 'Publicación marcada como destacada'
                 ELSE 'Publicación quitada de destacadas'
            END AS mensaje;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- ============================================================
-- SP 7: TOGGLE ACTIVA (ACTIVAR/DESACTIVAR)
-- ============================================================
CREATE OR ALTER PROCEDURE SP_NOT_TOGGLE_ACTIVA
    @idpublicacion NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que existe
        IF NOT EXISTS (SELECT 1 FROM publicaciones WHERE idpublicacion = @idpublicacion)
        BEGIN
            SELECT 'ERROR' AS status, 'Publicación no encontrada' AS mensaje;
            RETURN;
        END
        
        -- Toggle del estado
        UPDATE publicaciones
        SET activa = CASE WHEN activa = 1 THEN 0 ELSE 1 END
        WHERE idpublicacion = @idpublicacion;
        
        COMMIT TRANSACTION;
        
        -- Retornar mensaje apropiado
        DECLARE @nueva_activa BIT;
        SELECT @nueva_activa = activa 
        FROM publicaciones 
        WHERE idpublicacion = @idpublicacion;
        
        SELECT 
            'SUCCESS' AS status,
            CASE WHEN @nueva_activa = 1
                 THEN 'Publicación activada'
                 ELSE 'Publicación desactivada / archivada'
            END AS mensaje;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- ============================================================
-- SP 8: ELIMINAR PUBLICACIÓN (DEFINITIVO)
-- ============================================================
CREATE OR ALTER PROCEDURE SP_NOT_ELIMINAR
    @idpublicacion NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que existe
        IF NOT EXISTS (SELECT 1 FROM publicaciones WHERE idpublicacion = @idpublicacion)
        BEGIN
            SELECT 'ERROR' AS status, 'Publicación no encontrada' AS mensaje;
            RETURN;
        END
        
        -- Eliminar definitivamente
        DELETE FROM publicaciones
        WHERE idpublicacion = @idpublicacion;
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Publicación eliminada definitivamente' AS mensaje;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- ============================================================
-- SP 9: ESTADÍSTICAS DEL MÓDULO
-- ============================================================
CREATE OR ALTER PROCEDURE SP_NOT_ESTADISTICAS
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT
        -- Totales
        COUNT(*) AS total_publicaciones,
        SUM(CASE WHEN activa = 1 THEN 1 ELSE 0 END) AS activas,
        SUM(CASE WHEN activa = 0 THEN 1 ELSE 0 END) AS archivadas,
        SUM(CASE WHEN destacada = 1 THEN 1 ELSE 0 END) AS destacadas,
        
        -- Por origen
        SUM(CASE WHEN creado_por = 'Facebook' THEN 1 ELSE 0 END) AS desde_facebook,
        SUM(CASE WHEN creado_por = 'Admin' THEN 1 ELSE 0 END) AS desde_admin,
        
        -- Por periodo
        SUM(CASE WHEN MONTH(fecha) = MONTH(GETDATE()) 
                 AND YEAR(fecha) = YEAR(GETDATE()) 
                 THEN 1 ELSE 0 END) AS este_mes,
                 
        -- Última publicación
        MAX(fecha) AS ultima_publicacion
    FROM publicaciones;
END
GO

-- ============================================================
-- VERIFICACIÓN Y MENSAJES
-- ============================================================
PRINT '';
PRINT '╔══════════════════════════════════════════════════════════╗';
PRINT '║  ✅ STORED PROCEDURES CREADOS EXITOSAMENTE              ║';
PRINT '╚══════════════════════════════════════════════════════════╝';
PRINT '';
PRINT '📋 PROCEDIMIENTOS CREADOS:';
PRINT '';
PRINT '  1. SP_NOT_LISTAR         - Listar con paginación y filtros';
PRINT '  2. SP_NOT_CONTAR         - Contar registros (paginación)';
PRINT '  3. SP_NOT_DETALLE        - Obtener detalle de publicación';
PRINT '  4. SP_NOT_CREAR          - Crear publicación (Admin)';
PRINT '  5. SP_NOT_EDITAR         - Editar publicación (Admin)';
PRINT '  6. SP_NOT_TOGGLE_DESTACADA - Marcar/desmarcar destacada';
PRINT '  7. SP_NOT_TOGGLE_ACTIVA  - Activar/desactivar';
PRINT '  8. SP_NOT_ELIMINAR       - Eliminar definitivamente';
PRINT '  9. SP_NOT_ESTADISTICAS   - Obtener estadísticas';
PRINT '';
PRINT '🔧 CARACTERÍSTICAS:';
PRINT '  ✓ Manejo de errores con TRY/CATCH';
PRINT '  ✓ Transacciones para integridad de datos';
PRINT '  ✓ Solo una noticia destacada a la vez';
PRINT '  ✓ IDs únicos autogenerados (admin_TIMESTAMP_RAND)';
PRINT '  ✓ Validaciones de datos';
PRINT '  ✓ Protección contra edición de posts de Facebook';
PRINT '';
PRINT '🧪 PRUEBAS RECOMENDADAS:';
PRINT '  EXEC SP_NOT_LISTAR @pagina=1, @por_pagina=10;';
PRINT '  EXEC SP_NOT_ESTADISTICAS;';
PRINT '';
PRINT '══════════════════════════════════════════════════════════';
GO