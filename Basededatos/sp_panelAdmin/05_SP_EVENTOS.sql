-- ============================================================
-- PANEL ADMIN CGPVP  |  SECCION: EVENTOS Y TALLERES
-- Archivo : 05_SP_EVENTOS_MODIFICADO.sql
-- DB      : DB_CGPVP2
-- Tablas  : eventos_talleres
-- Desc    : CRUD de eventos (SIN capacidad/inscritos)
-- ============================================================
USE DB_CGPVP2;
GO

-- ------------------------------------------------------------
-- 1. Listar eventos con filtros y paginacion
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_EV_LISTAR
    @busqueda   NVARCHAR(100) = NULL,
    @tipo       NVARCHAR(30)  = NULL,   -- Capacitación|Taller|Simulacro|Conferencia
    @estado     NVARCHAR(20)  = NULL,   -- Programado|En Curso|Finalizado|Cancelado
    @desde      DATE          = NULL,
    @hasta      DATE          = NULL,
    @pagina     INT           = 1,
    @por_pagina INT           = 10
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@pagina-1)*@por_pagina;
    SELECT
        e.id, e.titulo, e.tipo, e.descripcion,
        e.fecha, e.hora_inicio, e.hora_fin, e.ubicacion,
        e.estado, e.imagen, e.fecha_creacion,
        i.nombre_completo                                                     AS instructor_nombre,
        au.nombre_completo                                                    AS modificado_por_nombre
    FROM eventos_talleres e
    LEFT JOIN instructores i  ON i.id  = e.id_instructor
    LEFT JOIN admin_users  au ON au.id = e.modificado_por
    WHERE
        (@busqueda IS NULL OR e.titulo LIKE '%'+@busqueda+'%' OR
                              e.ubicacion LIKE '%'+@busqueda+'%')
        AND (@tipo   IS NULL OR e.tipo   = @tipo)
        AND (@estado IS NULL OR e.estado = @estado)
        AND (@desde  IS NULL OR e.fecha >= @desde)
        AND (@hasta  IS NULL OR e.fecha <= @hasta)
    ORDER BY e.fecha DESC
    OFFSET @offset ROWS FETCH NEXT @por_pagina ROWS ONLY;
END
GO

-- ------------------------------------------------------------
-- 2. Contar eventos (para paginacion)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_EV_CONTAR
    @busqueda NVARCHAR(100) = NULL,
    @tipo     NVARCHAR(30)  = NULL,
    @estado   NVARCHAR(20)  = NULL,
    @desde    DATE          = NULL,
    @hasta    DATE          = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*) AS total
    FROM eventos_talleres e
    WHERE
        (@busqueda IS NULL OR e.titulo LIKE '%'+@busqueda+'%')
        AND (@tipo   IS NULL OR e.tipo   = @tipo)
        AND (@estado IS NULL OR e.estado = @estado)
        AND (@desde  IS NULL OR e.fecha >= @desde)
        AND (@hasta  IS NULL OR e.fecha <= @hasta);
END
GO

-- ------------------------------------------------------------
-- 3. Detalle de evento
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_EV_DETALLE
    @id_evento INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT e.id, e.titulo, e.tipo, e.descripcion,
           e.fecha, e.hora_inicio, e.hora_fin, e.ubicacion,
           e.estado, e.imagen, e.fecha_creacion,
           e.id_instructor,
           i.nombre_completo AS instructor_nombre,
           i.email           AS instructor_email,
           au.nombre_completo AS modificado_por_nombre
    FROM eventos_talleres e
    LEFT JOIN instructores i  ON i.id  = e.id_instructor
    LEFT JOIN admin_users  au ON au.id = e.modificado_por
    WHERE e.id = @id_evento;
END
GO

-- ------------------------------------------------------------
-- 4. Crear evento
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_EV_CREAR
    @titulo        NVARCHAR(200),
    @tipo          NVARCHAR(30),
    @descripcion   NVARCHAR(MAX)  = NULL,
    @fecha         DATE,
    @hora_inicio   TIME           = NULL,
    @hora_fin      TIME           = NULL,
    @ubicacion     NVARCHAR(300)  = NULL,
    @id_instructor INT            = NULL,
    @admin_id      INT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF @id_instructor IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM instructores WHERE id=@id_instructor AND estado='Activo')
            THROW 50080,'El instructor no existe o está inactivo',1;

        IF @hora_fin IS NOT NULL AND @hora_inicio IS NOT NULL AND @hora_fin <= @hora_inicio
            THROW 50081,'La hora de fin debe ser posterior a la de inicio',1;

        DECLARE @instructor_nombre NVARCHAR(150) = NULL;
        IF @id_instructor IS NOT NULL
            SELECT @instructor_nombre = nombre_completo FROM instructores WHERE id=@id_instructor;

        INSERT INTO eventos_talleres
            (titulo,tipo,descripcion,fecha,hora_inicio,hora_fin,ubicacion,
             id_instructor,instructor_nombre,estado,modificado_por)
        VALUES
            (@titulo,@tipo,@descripcion,@fecha,@hora_inicio,@hora_fin,@ubicacion,
             @id_instructor,@instructor_nombre,'Programado',@admin_id);

        DECLARE @new_id INT = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
        SELECT 'SUCCESS' AS status,'Evento creado correctamente' AS mensaje,
               @new_id AS id_evento;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
        SELECT 'ERROR' AS status, ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- 5. Actualizar evento
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_EV_ACTUALIZAR
    @id_evento     INT,
    @titulo        NVARCHAR(200),
    @tipo          NVARCHAR(30),
    @descripcion   NVARCHAR(MAX)  = NULL,
    @fecha         DATE,
    @hora_inicio   TIME           = NULL,
    @hora_fin      TIME           = NULL,
    @ubicacion     NVARCHAR(300)  = NULL,
    @id_instructor INT            = NULL,
    @estado        NVARCHAR(20)   = 'Programado',
    @admin_id      INT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM eventos_talleres WHERE id=@id_evento)
            THROW 50082,'El evento no existe',1;

        IF @hora_fin IS NOT NULL AND @hora_inicio IS NOT NULL AND @hora_fin <= @hora_inicio
            THROW 50081,'La hora de fin debe ser posterior a la de inicio',1;

        DECLARE @instructor_nombre NVARCHAR(150) = NULL;
        IF @id_instructor IS NOT NULL
            SELECT @instructor_nombre = nombre_completo FROM instructores WHERE id=@id_instructor;

        UPDATE eventos_talleres SET
            titulo             = @titulo,
            tipo               = @tipo,
            descripcion        = @descripcion,
            fecha              = @fecha,
            hora_inicio        = @hora_inicio,
            hora_fin           = @hora_fin,
            ubicacion          = @ubicacion,
            id_instructor      = @id_instructor,
            instructor_nombre  = @instructor_nombre,
            estado             = @estado,
            modificado_por     = @admin_id
        WHERE id=@id_evento;

        COMMIT TRANSACTION;
        SELECT 'SUCCESS' AS status,'Evento actualizado correctamente' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
        SELECT 'ERROR' AS status, ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- 6. Cambiar estado del evento
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_EV_CAMBIAR_ESTADO
    @id_evento    INT,
    @nuevo_estado NVARCHAR(20),   -- Programado|En Curso|Finalizado|Cancelado
    @admin_id     INT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM eventos_talleres WHERE id=@id_evento)
            THROW 50084,'El evento no existe',1;
        IF @nuevo_estado NOT IN ('Programado','En Curso','Finalizado','Cancelado')
            THROW 50085,'Estado invalido',1;

        UPDATE eventos_talleres SET estado=@nuevo_estado, modificado_por=@admin_id
        WHERE id=@id_evento;

        COMMIT TRANSACTION;
        SELECT 'SUCCESS' AS status,
               'Estado del evento actualizado a '+@nuevo_estado AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
        SELECT 'ERROR' AS status, ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- 7. Eliminar evento
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_EV_ELIMINAR
    @id_evento INT,
    @admin_id  INT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM eventos_talleres WHERE id=@id_evento)
            THROW 50086,'El evento no existe',1;

        -- Eliminar directamente el evento
        DELETE FROM eventos_talleres WHERE id=@id_evento;
        
        COMMIT TRANSACTION;
        SELECT 'SUCCESS' AS status,'Evento eliminado correctamente' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
        SELECT 'ERROR' AS status, ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

PRINT '== 05_SP_EVENTOS_MODIFICADO.sql ejecutado OK ==';
PRINT '  SP_EV_LISTAR';
PRINT '   SP_EV_CONTAR';
PRINT '  SP_EV_DETALLE';
PRINT '  SP_EV_CREAR';
PRINT '  SP_EV_ACTUALIZAR';
PRINT '  SP_EV_CAMBIAR_ESTADO';
PRINT '  SP_EV_ELIMINAR';
PRINT '';
PRINT '  SP_EV_CALENDARIO (eliminado)';
PRINT '  SP_EV_ESTADISTICAS (eliminado)';
GO
select * from eventos_talleres