-- ============================================================
-- PANEL ADMIN CGPVP  |  SECCION: GESTION DE USUARIOS
-- Archivo : 02_SP_GESTION_USUARIOS.sql
-- DB      : DB_CGPVP2
-- Tablas  : postulantes, miembros, historial_cambios
-- Desc    : CRUD de postulantes y miembros, promocion,
--           cambio de estado/rango, historial y exportacion
-- ============================================================
USE DB_CGPVP2;
GO

-- ============================================================
-- ▌ BLOQUE A — POSTULANTES
-- ============================================================

-- ------------------------------------------------------------
-- A1. Listar postulantes con filtros y paginacion
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_GU_LISTAR_POSTULANTES
    @busqueda        NVARCHAR(100) = NULL,
    @departamento    NVARCHAR(50)  = NULL,
    @solo_pendientes BIT           = 0,   -- 1 = los que aun no son miembros
    @pagina          INT           = 1,
    @por_pagina      INT           = 10
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@pagina-1)*@por_pagina;
    SELECT
        p.id,
        p.nombre, p.apellido,
        CONCAT(p.apellido,', ',p.nombre)             AS nombre_completo,
        p.dni, p.email, p.telefono,
        p.departamento, p.distrito, p.profesion,
        p.nivel_educativo, p.genero,
        p.experiencia, p.motivacion,
        p.fecha_registro,
        DATEDIFF(DAY,p.fecha_registro,GETDATE())     AS dias_espera,
        CASE WHEN m.id IS NOT NULL THEN 1 ELSE 0 END AS ya_es_miembro,
        m.legajo, m.rango, m.estado                  AS estado_miembro
    FROM postulantes p
    LEFT JOIN miembros m ON m.id_postulante = p.id
    WHERE
        (@busqueda IS NULL OR
            p.nombre   LIKE '%'+@busqueda+'%' OR
            p.apellido LIKE '%'+@busqueda+'%' OR
            p.dni      LIKE '%'+@busqueda+'%' OR
            p.email    LIKE '%'+@busqueda+'%')
        AND (@departamento    IS NULL OR p.departamento = @departamento)
        AND (@solo_pendientes = 0     OR m.id IS NULL)
    ORDER BY p.fecha_registro DESC
    OFFSET @offset ROWS FETCH NEXT @por_pagina ROWS ONLY;
END
GO

-- ------------------------------------------------------------
-- A2. Contar postulantes (para paginacion)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_GU_CONTAR_POSTULANTES
    @busqueda        NVARCHAR(100) = NULL,
    @departamento    NVARCHAR(50)  = NULL,
    @solo_pendientes BIT           = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*) AS total
    FROM postulantes p
    LEFT JOIN miembros m ON m.id_postulante = p.id
    WHERE
        (@busqueda IS NULL OR
            p.nombre   LIKE '%'+@busqueda+'%' OR
            p.apellido LIKE '%'+@busqueda+'%' OR
            p.dni      LIKE '%'+@busqueda+'%')
        AND (@departamento    IS NULL OR p.departamento = @departamento)
        AND (@solo_pendientes = 0     OR m.id IS NULL);
END
GO

-- ------------------------------------------------------------
-- A3. Ver ficha completa de un postulante
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_GU_DETALLE_POSTULANTE
    @id_postulante INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.*,
           DATEDIFF(YEAR,p.fecha_nacimiento,GETDATE()) AS edad,
           CASE WHEN m.id IS NOT NULL THEN 1 ELSE 0 END AS ya_es_miembro,
           m.id AS id_miembro, m.legajo, m.rango,
           m.jefatura, m.estado AS estado_miembro
    FROM postulantes p
    LEFT JOIN miembros m ON m.id_postulante = p.id
    WHERE p.id = @id_postulante;
END
GO

-- ============================================================
-- ▌ BLOQUE B — MIEMBROS
-- ============================================================

-- ------------------------------------------------------------
-- B1. Listar miembros con filtros y paginacion
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_GU_LISTAR_MIEMBROS
    @busqueda     NVARCHAR(100) = NULL,
    @estado       NVARCHAR(20)  = NULL,   -- Activo | Suspendido | Baja
    @rango        NVARCHAR(50)  = NULL,
    @departamento NVARCHAR(50)  = NULL,
    @pagina       INT           = 1,
    @por_pagina   INT           = 10
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@pagina-1)*@por_pagina;
    SELECT
        m.id,
        m.nombre, m.apellido,
        CONCAT(m.apellido,', ',m.nombre)         AS nombre_completo,
        m.dni,
        DATEDIFF(YEAR,m.fecha_nacimiento,GETDATE()) AS edad,
        m.genero, m.email, m.telefono,
        m.departamento, m.distrito, m.profesion,
        m.legajo, m.rango, m.jefatura,
        m.estado, m.cursos_certificaciones,
        m.fecha_ingreso, m.fecha_ultimo_cambio,
        DATEDIFF(YEAR,m.fecha_ingreso,GETDATE()) AS anios_en_cuerpo,
        au.nombre_completo AS modificado_por_nombre
    FROM miembros m
    LEFT JOIN admin_users au ON au.id = m.modificado_por
    WHERE
        (@busqueda IS NULL OR
            m.nombre   LIKE '%'+@busqueda+'%' OR
            m.apellido LIKE '%'+@busqueda+'%' OR
            m.dni      LIKE '%'+@busqueda+'%' OR
            m.legajo   LIKE '%'+@busqueda+'%')
        AND (@estado      IS NULL OR m.estado      = @estado)
        AND (@rango       IS NULL OR m.rango        = @rango)
        AND (@departamento IS NULL OR m.departamento = @departamento)
    ORDER BY m.apellido, m.nombre
    OFFSET @offset ROWS FETCH NEXT @por_pagina ROWS ONLY;
END
GO

-- ------------------------------------------------------------
-- B2. Contar miembros (para paginacion)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_GU_CONTAR_MIEMBROS
    @busqueda     NVARCHAR(100) = NULL,
    @estado       NVARCHAR(20)  = NULL,
    @rango        NVARCHAR(50)  = NULL,
    @departamento NVARCHAR(50)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*) AS total
    FROM miembros
    WHERE
        (@busqueda IS NULL OR
            nombre   LIKE '%'+@busqueda+'%' OR
            apellido LIKE '%'+@busqueda+'%' OR
            dni      LIKE '%'+@busqueda+'%' OR
            legajo   LIKE '%'+@busqueda+'%')
        AND (@estado      IS NULL OR estado      = @estado)
        AND (@rango       IS NULL OR rango        = @rango)
        AND (@departamento IS NULL OR departamento = @departamento);
END
GO

-- ------------------------------------------------------------
-- B3. Ver ficha completa de un miembro
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_GU_DETALLE_MIEMBRO
    @id_miembro INT
AS
BEGIN
    SET NOCOUNT ON;
    -- Datos del miembro
    SELECT m.*,
           DATEDIFF(YEAR,m.fecha_nacimiento,GETDATE())  AS edad,
           DATEDIFF(MONTH,m.fecha_ingreso,GETDATE())    AS meses_en_cuerpo,
           au_c.nombre_completo AS creado_por_nombre,
           au_m.nombre_completo AS modificado_por_nombre
    FROM miembros m
    LEFT JOIN admin_users au_c ON au_c.id = m.creado_por
    LEFT JOIN admin_users au_m ON au_m.id = m.modificado_por
    WHERE m.id = @id_miembro;

    -- Cursos en los que esta inscrito
    SELECT ic.id AS id_inscripcion,
           c.titulo, c.categoria, c.modalidad,
           c.fecha_inicio, c.fecha_fin,
           ic.estado AS estado_inscripcion,
           ic.fecha_inscripcion
    FROM inscripciones_cursos ic
    INNER JOIN cursos c ON c.id = ic.id_curso
    WHERE ic.dni = (SELECT dni FROM miembros WHERE id = @id_miembro)
    ORDER BY ic.fecha_inscripcion DESC;

    -- Eventos en los que estuvo inscrito
    SELECT ie.id AS id_inscripcion,
           e.titulo, e.tipo, e.fecha,
           ie.estado AS estado_inscripcion,
           ie.fecha_inscripcion
    FROM inscripciones_eventos ie
    INNER JOIN eventos_talleres e ON e.id = ie.id_evento
    WHERE ie.dni = (SELECT dni FROM miembros WHERE id = @id_miembro)
    ORDER BY ie.fecha_inscripcion DESC;
END
GO

-- ------------------------------------------------------------
-- B4. Cambiar estado del miembro + auditoria
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_GU_CAMBIAR_ESTADO_MIEMBRO
    @id_miembro   INT,
    @nuevo_estado NVARCHAR(20),   -- Activo | Suspendido | Baja
    @motivo       NVARCHAR(500),
    @admin_id     INT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM miembros WHERE id=@id_miembro)
            THROW 50050,'El miembro no existe',1;
        IF @nuevo_estado NOT IN ('Activo','Suspendido','Baja')
            THROW 50051,'Estado invalido. Use: Activo, Suspendido o Baja',1;

        DECLARE @estado_ant NVARCHAR(20);
        SELECT @estado_ant = estado FROM miembros WHERE id=@id_miembro;

        UPDATE miembros SET
            estado              = @nuevo_estado,
            fecha_ultimo_cambio = SYSUTCDATETIME(),
            modificado_por      = @admin_id,
            notas               = CONCAT(ISNULL(notas,''),' | ',
                                  CONVERT(NVARCHAR,GETDATE(),103),': ',
                                  @nuevo_estado,' — ',@motivo)
        WHERE id=@id_miembro;

        INSERT INTO historial_cambios
            (id_miembro,campo_modificado,valor_anterior,valor_nuevo,motivo,realizado_por)
        VALUES (@id_miembro,'estado',@estado_ant,@nuevo_estado,@motivo,@admin_id);

        COMMIT TRANSACTION;
        SELECT 'SUCCESS' AS status,
               'Estado actualizado: '+@estado_ant+' → '+@nuevo_estado AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
        SELECT 'ERROR' AS status, ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- B5. Cambiar rango del miembro + auditoria
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_GU_CAMBIAR_RANGO_MIEMBRO
    @id_miembro  INT,
    @nuevo_rango NVARCHAR(50),
    @motivo      NVARCHAR(500) = NULL,
    @admin_id    INT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM miembros WHERE id=@id_miembro)
            THROW 50055,'El miembro no existe',1;

        DECLARE @rango_ant NVARCHAR(50);
        SELECT @rango_ant = rango FROM miembros WHERE id=@id_miembro;

        UPDATE miembros SET
            rango               = @nuevo_rango,
            fecha_ultimo_cambio = SYSUTCDATETIME(),
            modificado_por      = @admin_id
        WHERE id=@id_miembro;

        INSERT INTO historial_cambios
            (id_miembro,campo_modificado,valor_anterior,valor_nuevo,motivo,realizado_por)
        VALUES (@id_miembro,'rango',@rango_ant,@nuevo_rango,@motivo,@admin_id);

        COMMIT TRANSACTION;
        SELECT 'SUCCESS' AS status,
               'Rango actualizado: '+@rango_ant+' → '+@nuevo_rango AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
        SELECT 'ERROR' AS status, ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- B6. Historial completo de cambios de un miembro
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_GU_HISTORIAL_MIEMBRO
    @id_miembro INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT h.id,
           h.campo_modificado,
           h.valor_anterior,
           h.valor_nuevo,
           h.motivo,
           h.fecha_cambio,
           au.nombre_completo AS realizado_por_nombre
    FROM historial_cambios h
    LEFT JOIN admin_users au ON au.id = h.realizado_por
    WHERE h.id_miembro = @id_miembro
    ORDER BY h.fecha_cambio DESC;
END
GO

-- ------------------------------------------------------------
-- B7. Exportar miembros a CSV (todos los campos relevantes)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_GU_EXPORTAR_MIEMBROS
    @estado       NVARCHAR(20) = NULL,
    @rango        NVARCHAR(50) = NULL,
    @departamento NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        m.id, m.nombre, m.apellido,
        m.dni,
        CONVERT(NVARCHAR,m.fecha_nacimiento,103) AS fecha_nacimiento,
        DATEDIFF(YEAR,m.fecha_nacimiento,GETDATE()) AS edad,
        m.genero, m.email, m.telefono,
        m.direccion, m.departamento, m.distrito, m.profesion,
        m.legajo, m.rango, m.jefatura, m.estado,
        m.cursos_certificaciones,
        CONVERT(NVARCHAR,m.fecha_ingreso,103) AS fecha_ingreso
    FROM miembros m
    WHERE (@estado       IS NULL OR m.estado       = @estado)
      AND (@rango        IS NULL OR m.rango         = @rango)
      AND (@departamento IS NULL OR m.departamento  = @departamento)
    ORDER BY m.apellido, m.nombre;
END
GO
--procedure para registrar miembros por el panel admin
CREATE OR ALTER PROCEDURE SP_GU_CREAR_MIEMBRO
    @nombre           NVARCHAR(100),
    @apellido         NVARCHAR(100),
    @dni              NVARCHAR(20),
    @email            NVARCHAR(100)  = NULL,
    @telefono         NVARCHAR(20)   = NULL,
    @fecha_nacimiento DATE           = NULL,
    @genero           NVARCHAR(10)   = NULL,
    @departamento     NVARCHAR(50)   = NULL,
    @distrito         NVARCHAR(50)   = NULL,
    @direccion        NVARCHAR(200)  = NULL,
    @profesion        NVARCHAR(100)  = NULL,
    @rango            NVARCHAR(50)   = 'Aspirante',
    @jefatura         NVARCHAR(100)  = '',
    @estado           NVARCHAR(20)   = 'Activo',
    @admin_id         INT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validaciones basicas
        IF @nombre IS NULL OR LTRIM(RTRIM(@nombre)) = ''
            THROW 50100, 'El nombre es obligatorio', 1;

        IF @apellido IS NULL OR LTRIM(RTRIM(@apellido)) = ''
            THROW 50101, 'El apellido es obligatorio', 1;

        IF @dni IS NULL OR LTRIM(RTRIM(@dni)) = ''
            THROW 50102, 'El DNI es obligatorio', 1;

        -- DNI duplicado
        IF EXISTS (SELECT 1 FROM miembros WHERE dni = @dni)
            THROW 50103, 'Ya existe un miembro registrado con ese DNI', 1;

        -- Pre-calcular legajo antes del INSERT
        -- (evita el UPDATE posterior sobre columna NOT NULL)
        DECLARE @next_id   INT          = ISNULL((SELECT MAX(id) FROM miembros), 0) + 1;
        DECLARE @legajo    NVARCHAR(20) = 'CGP-' + CAST(YEAR(GETDATE()) AS NVARCHAR(4))
                                        + '-' + RIGHT('0000' + CAST(@next_id AS NVARCHAR(10)), 4);

        -- Insertar directamente en miembros
        -- jefatura: NOT NULL, se deja vacio y el admin lo asigna despues
        INSERT INTO miembros (
            nombre, apellido, dni,
            email, telefono, fecha_nacimiento, genero,
            departamento, distrito, direccion, profesion,
            legajo, rango, jefatura, estado,
            fecha_ingreso, fecha_ultimo_cambio,
            creado_por, modificado_por
        )
        VALUES (
            @nombre, @apellido, @dni,
            @email, @telefono, @fecha_nacimiento, @genero,
            @departamento, @distrito, @direccion, @profesion,
            @legajo, @rango, @jefatura, @estado,
            SYSUTCDATETIME(), SYSUTCDATETIME(),
            @admin_id, @admin_id
        );

        DECLARE @id_miembro INT = SCOPE_IDENTITY();

        -- Registrar en historial
        INSERT INTO historial_cambios
            (id_miembro, campo_modificado, valor_anterior, valor_nuevo,
             motivo, realizado_por)
        VALUES (
            @id_miembro, 'creacion', NULL, @estado,
            'Miembro registrado desde panel admin', @admin_id
        );

        COMMIT TRANSACTION;

        SELECT 'SUCCESS'                          AS status,
               'Miembro registrado correctamente' AS mensaje,
               @id_miembro                        AS id_miembro,
               @legajo                            AS legajo;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'ERROR'         AS status,
               ERROR_MESSAGE() AS mensaje,
               NULL            AS id_miembro,
               NULL            AS legajo;
    END CATCH
END
GO
--sp editar miembro
CREATE OR ALTER PROCEDURE SP_GU_EDITAR_MIEMBRO
    @id_miembro       INT,
    @nombre           NVARCHAR(100),
    @apellido         NVARCHAR(100),
    @dni              NVARCHAR(20),
    @email            NVARCHAR(100)  = NULL,
    @telefono         NVARCHAR(20)   = NULL,
    @fecha_nacimiento DATE           = NULL,
    @genero           NVARCHAR(10),
    @departamento     NVARCHAR(50)   = NULL,
    @distrito         NVARCHAR(50)   = NULL,
    @direccion        NVARCHAR(200)  = NULL,
    @profesion        NVARCHAR(100)  = NULL,
    @rango            NVARCHAR(50),
    @jefatura         NVARCHAR(100),
    @estado           NVARCHAR(20),
    @admin_id         INT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validaciones
        IF NOT EXISTS (SELECT 1 FROM miembros WHERE id = @id_miembro)
            THROW 50200, 'El miembro no existe', 1;

        IF @nombre IS NULL OR LTRIM(RTRIM(@nombre)) = ''
            THROW 50201, 'El nombre es obligatorio', 1;

        IF @apellido IS NULL OR LTRIM(RTRIM(@apellido)) = ''
            THROW 50202, 'El apellido es obligatorio', 1;

        IF @dni IS NULL OR LTRIM(RTRIM(@dni)) = ''
            THROW 50203, 'El DNI es obligatorio', 1;

        -- DNI duplicado en otro miembro
        IF EXISTS (SELECT 1 FROM miembros WHERE dni = @dni AND id <> @id_miembro)
            THROW 50204, 'Ese DNI ya está registrado en otro miembro', 1;

        -- Guardar valores anteriores para historial
        DECLARE @rango_ant   NVARCHAR(50),
                @estado_ant  NVARCHAR(20),
                @nombre_ant  NVARCHAR(100),
                @apellido_ant NVARCHAR(100);

        SELECT  @rango_ant    = rango,
                @estado_ant   = estado,
                @nombre_ant   = nombre,
                @apellido_ant = apellido
        FROM miembros WHERE id = @id_miembro;

        -- UPDATE
        UPDATE miembros SET
            nombre              = @nombre,
            apellido            = @apellido,
            dni                 = @dni,
            email               = @email,
            telefono            = @telefono,
            fecha_nacimiento    = @fecha_nacimiento,
            genero              = @genero,
            departamento        = @departamento,
            distrito            = @distrito,
            direccion           = @direccion,
            profesion           = @profesion,
            rango               = @rango,
            jefatura            = @jefatura,
            estado              = @estado,
            fecha_ultimo_cambio = SYSUTCDATETIME(),
            modificado_por      = @admin_id
        WHERE id = @id_miembro;

        -- Historial solo si cambió rango o estado
        IF @rango_ant <> @rango
            INSERT INTO historial_cambios (id_miembro, campo_modificado, valor_anterior, valor_nuevo, motivo, realizado_por)
            VALUES (@id_miembro, 'rango', @rango_ant, @rango, 'Edición desde panel admin', @admin_id);

        IF @estado_ant <> @estado
            INSERT INTO historial_cambios (id_miembro, campo_modificado, valor_anterior, valor_nuevo, motivo, realizado_por)
            VALUES (@id_miembro, 'estado', @estado_ant, @estado, 'Edición desde panel admin', @admin_id);

        COMMIT TRANSACTION;

        SELECT 'SUCCESS'                      AS status,
               'Miembro actualizado correctamente' AS mensaje,
               @id_miembro                    AS id_miembro;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'ERROR'         AS status,
               ERROR_MESSAGE() AS mensaje,
               NULL            AS id_miembro;
    END CATCH
END
GO
CREATE PROCEDURE dbo.sp_EliminarMiembroFisico
    @id INT,
    @confirmacion BIT = 0  -- Requiere confirmación explícita
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verificar confirmación
        IF @confirmacion = 0
        BEGIN
            RAISERROR('Debe confirmar explícitamente la eliminación física (@confirmacion = 1)', 16, 1);
            RETURN -1;
        END
        
        BEGIN TRANSACTION;
        
        -- Verificar que el miembro existe
        IF NOT EXISTS (SELECT 1 FROM dbo.miembros WHERE id = @id)
        BEGIN
            RAISERROR('El miembro con ID %d no existe', 16, 1, @id);
            RETURN -2;
        END
        
        -- Guardar datos antes de eliminar (para el log)
        DECLARE @nombre NVARCHAR(50), @apellido NVARCHAR(50), @dni CHAR(8), @legajo NVARCHAR(20);
        
        SELECT 
            @nombre = nombre,
            @apellido = apellido,
            @dni = dni,
            @legajo = legajo
        FROM dbo.miembros
        WHERE id = @id;
        
        -- Eliminar físicamente
        DELETE FROM dbo.miembros WHERE id = @id;
        
        COMMIT TRANSACTION;
        
        -- Retornar confirmación
        SELECT 
            @id AS id_eliminado,
            @nombre AS nombre,
            @apellido AS apellido,
            @dni AS dni,
            @legajo AS legajo,
            SYSUTCDATETIME() AS fecha_eliminacion,
            'Eliminado físicamente' AS resultado;
        
        RETURN 0;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
        RETURN -99;
    END CATCH
END
GO