-- ============================================================
-- PANEL ADMIN CGPVP  |  SECCION: INSTRUCTORES
-- Archivo : 03_SP_INSTRUCTORES.sql
-- DB      : DB_CGPVP2
-- Tabla   : instructores
-- Desc    : CRUD, detalle con cursos/eventos asignados,
--           estadisticas del modulo
-- ============================================================
USE DB_CGPVP2;
GO

-- ------------------------------------------------------------
-- 1. Listar instructores con filtros
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_INS_LISTAR
    @busqueda     NVARCHAR(100) = NULL,
    @especialidad NVARCHAR(100) = NULL,
    @estado       NVARCHAR(20)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        i.id,
        i.nombre_completo, i.especialidad, i.rango,
        i.experiencia_anios, i.certificaciones,
        i.email, i.telefono, i.foto, i.bio,
        i.estado, i.fecha_registro,
        -- Carga activa
        (SELECT COUNT(*) FROM cursos c
         WHERE c.id_instructor=i.id AND c.estado='Activo')              AS cursos_activos,
        (SELECT COUNT(*) FROM eventos_talleres e
         WHERE e.id_instructor=i.id
           AND e.estado IN ('Programado','En Curso'))                   AS eventos_activos,
        au.nombre_completo AS modificado_por_nombre
    FROM instructores i
    LEFT JOIN admin_users au ON au.id = i.modificado_por
    WHERE
        (@busqueda IS NULL OR
            i.nombre_completo LIKE '%'+@busqueda+'%' OR
            i.especialidad    LIKE '%'+@busqueda+'%')
        AND (@especialidad IS NULL OR i.especialidad = @especialidad)
        AND (@estado       IS NULL OR i.estado       = @estado)
    ORDER BY i.nombre_completo;
END
GO

-- ------------------------------------------------------------
-- 2. Detalle de instructor + cursos y eventos asignados
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_INS_DETALLE
    @id_instructor INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT i.*,
           (SELECT COUNT(*) FROM cursos         WHERE id_instructor=i.id) AS total_cursos,
           (SELECT COUNT(*) FROM eventos_talleres WHERE id_instructor=i.id) AS total_eventos
    FROM instructores i WHERE i.id=@id_instructor;

    SELECT c.id, c.titulo, c.categoria, c.modalidad,
           c.estado, c.fecha_inicio, c.fecha_fin, c.inscritos, c.cupos
    FROM cursos c
    WHERE c.id_instructor=@id_instructor ORDER BY c.fecha_inicio DESC;

    SELECT e.id, e.titulo, e.tipo, e.fecha, e.hora_inicio,
           e.estado, e.inscritos, e.capacidad
    FROM eventos_talleres e
    WHERE e.id_instructor=@id_instructor ORDER BY e.fecha DESC;
END
GO

-- ------------------------------------------------------------
-- 3. Crear instructor
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_INS_CREAR
    @nombre_completo  NVARCHAR(150),
    @especialidad     NVARCHAR(100),
    @rango            NVARCHAR(50)   = NULL,
    @experiencia_anios INT           = 0,
    @certificaciones  NVARCHAR(500)  = NULL,
    @email            NVARCHAR(100)  = NULL,
    @telefono         CHAR(9)        = NULL,
    @bio              NVARCHAR(1000) = NULL,
    @admin_id         INT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF @email IS NOT NULL
           AND EXISTS (SELECT 1 FROM instructores WHERE email=@email)
            THROW 50060,'Ya existe un instructor con ese email',1;

        INSERT INTO instructores
            (nombre_completo,especialidad,rango,experiencia_anios,
             certificaciones,email,telefono,bio,estado,modificado_por)
        VALUES
            (@nombre_completo,@especialidad,@rango,@experiencia_anios,
             @certificaciones,@email,@telefono,@bio,'Activo',@admin_id);

        DECLARE @new_id INT = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
        SELECT 'SUCCESS' AS status,
               'Instructor creado correctamente' AS mensaje,
               @new_id AS id_instructor;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
        SELECT 'ERROR' AS status, ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- 4. Actualizar instructor
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_INS_ACTUALIZAR
    @id_instructor    INT,
    @nombre_completo  NVARCHAR(150),
    @especialidad     NVARCHAR(100),
    @rango            NVARCHAR(50)   = NULL,
    @experiencia_anios INT           = 0,
    @certificaciones  NVARCHAR(500)  = NULL,
    @email            NVARCHAR(100)  = NULL,
    @telefono         CHAR(9)        = NULL,
    @bio              NVARCHAR(1000) = NULL,
    @estado           NVARCHAR(20)   = 'Activo',
    @admin_id         INT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM instructores WHERE id=@id_instructor)
            THROW 50061,'El instructor no existe',1;

        UPDATE instructores SET
            nombre_completo   = @nombre_completo,
            especialidad      = @especialidad,
            rango             = @rango,
            experiencia_anios = @experiencia_anios,
            certificaciones   = @certificaciones,
            email             = @email,
            telefono          = @telefono,
            bio               = @bio,
            estado            = @estado,
            modificado_por    = @admin_id
        WHERE id=@id_instructor;

        COMMIT TRANSACTION;
        SELECT 'SUCCESS' AS status,'Instructor actualizado correctamente' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
        SELECT 'ERROR' AS status, ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- 5. Eliminar instructor
--    Regla: si tiene cursos activos → solo desactiva (no borra)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_INS_ELIMINAR
    @id_instructor INT,
    @admin_id      INT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM instructores WHERE id=@id_instructor)
            THROW 50062,'El instructor no existe',1;

        DECLARE @carga INT;
        SELECT @carga = COUNT(*) FROM cursos
        WHERE id_instructor=@id_instructor AND estado='Activo';

        IF @carga > 0
        BEGIN
            UPDATE instructores SET estado='Inactivo', modificado_por=@admin_id
            WHERE id=@id_instructor;
            COMMIT TRANSACTION;
            SELECT 'WARNING' AS status,
                   CONCAT('Instructor desactivado. Tiene ',@carga,
                          ' curso(s) activo(s). Reasigna antes de eliminar.') AS mensaje;
            RETURN;
        END

        DELETE FROM instructores WHERE id=@id_instructor;
        COMMIT TRANSACTION;
        SELECT 'SUCCESS' AS status,'Instructor eliminado correctamente' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
        SELECT 'ERROR' AS status, ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- 6. Estadisticas del modulo (cards superiores)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_INS_ESTADISTICAS
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        COUNT(*)                                                              AS total_instructores,
        SUM(CASE WHEN estado='Activo'   THEN 1 ELSE 0 END)                  AS activos,
        SUM(CASE WHEN estado='Inactivo' THEN 1 ELSE 0 END)                  AS inactivos,
        CAST(AVG(CAST(experiencia_anios AS FLOAT)) AS DECIMAL(4,1))         AS promedio_experiencia,
        -- Por especialidad
        SUM(CASE WHEN especialidad='Emergencias Médicas'   THEN 1 ELSE 0 END) AS esp_emergencias,
        SUM(CASE WHEN especialidad='Rescate'               THEN 1 ELSE 0 END) AS esp_rescate,
        SUM(CASE WHEN especialidad='Trauma'                THEN 1 ELSE 0 END) AS esp_trauma,
        SUM(CASE WHEN especialidad='Soporte Vital'         THEN 1 ELSE 0 END) AS esp_soporte_vital,
        SUM(CASE WHEN especialidad='Comunicaciones'        THEN 1 ELSE 0 END) AS esp_comunicaciones,
        SUM(CASE WHEN especialidad='Materiales Peligrosos' THEN 1 ELSE 0 END) AS esp_mat_peligrosos,
        SUM(CASE WHEN especialidad='Búsqueda y Salvamento' THEN 1 ELSE 0 END) AS esp_busqueda,
        SUM(CASE WHEN especialidad='Otros'                 THEN 1 ELSE 0 END) AS esp_otros
    FROM instructores;
END
GO

PRINT '== 03_SP_INSTRUCTORES.sql ejecutado OK ==';
PRINT '  SP_INS_LISTAR  SP_INS_DETALLE  SP_INS_CREAR';
PRINT '  SP_INS_ACTUALIZAR  SP_INS_ELIMINAR  SP_INS_ESTADISTICAS';
GO
