-- =============================================
-- TABLA Y PROCEDIMIENTOS: INSCRIPCIONES A CURSOS
-- Sistema: CGPVP - Cuerpo General de Paramédicos Voluntarios del Perú
-- Descripción: Gestión de inscripciones de personas a cursos
-- =============================================

USE DB_CGPVP2;
GO

-- =============================================
-- TABLA: inscripciones_cursos
-- Descripción: Registra las personas inscritas en cada curso
-- =============================================

IF OBJECT_ID('dbo.inscripciones_cursos', 'U') IS NOT NULL 
    DROP TABLE dbo.inscripciones_cursos;
GO

CREATE TABLE inscripciones_cursos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    
    -- Relación con el curso
    id_curso INT NOT NULL,
    
    -- Datos del inscrito
    nombre NVARCHAR(50) NOT NULL,
    apellido NVARCHAR(50) NOT NULL,
    dni CHAR(8) NOT NULL,
    email NVARCHAR(100) NOT NULL,
    edad INT NOT NULL,
    telefono CHAR(9) NULL,
    
    -- Estado de la inscripción
    estado NVARCHAR(20) NOT NULL DEFAULT 'Inscrito' CHECK (estado IN ('Inscrito', 'Asistiendo', 'Completado', 'Retirado', 'Cancelado')),
    
    -- Auditoría
    fecha_inscripcion DATETIME2 DEFAULT SYSUTCDATETIME(),
    fecha_actualizacion DATETIME2 DEFAULT SYSUTCDATETIME(),
    registrado_por INT NULL,  -- Admin que registró la inscripción
    notas NVARCHAR(500) NULL,
    
    -- Restricciones
    CONSTRAINT FK_inscripciones_curso FOREIGN KEY (id_curso) 
        REFERENCES cursos(id) ON DELETE CASCADE,
    CONSTRAINT FK_inscripciones_admin FOREIGN KEY (registrado_por) 
        REFERENCES admin_users(id) ON DELETE NO ACTION,
    
    -- Evitar duplicados: una persona (DNI) no puede inscribirse 2 veces al mismo curso
    CONSTRAINT UQ_inscripcion_curso_dni UNIQUE (id_curso, dni)
);
GO

CREATE INDEX IDX_inscripciones_curso ON inscripciones_cursos(id_curso);
CREATE INDEX IDX_inscripciones_dni ON inscripciones_cursos(dni);
CREATE INDEX IDX_inscripciones_estado ON inscripciones_cursos(estado);
CREATE INDEX IDX_inscripciones_fecha ON inscripciones_cursos(fecha_inscripcion);
GO

PRINT '✓ Tabla inscripciones_cursos creada exitosamente';
GO

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS
-- =============================================

-- =============================================
-- SP1: INSCRIBIR PERSONA A UN CURSO
-- =============================================
CREATE OR ALTER PROCEDURE SP_INSCRIBIR_A_CURSO
    @id_curso INT,
    @nombre NVARCHAR(50),
    @apellido NVARCHAR(50),
    @dni CHAR(8),
    @email NVARCHAR(100),
    @edad INT,
    @telefono CHAR(9) = NULL,
    @registrado_por INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el curso existe
        IF NOT EXISTS (SELECT 1 FROM cursos WHERE id = @id_curso)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'El curso no existe' AS mensaje,
                NULL AS id_inscripcion;
            RETURN;
        END
        
        -- Verificar que el curso está activo
        DECLARE @estado_curso NVARCHAR(20);
        SELECT @estado_curso = estado FROM cursos WHERE id = @id_curso;
        
        IF @estado_curso != 'Activo'
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'El curso no está activo. No se pueden recibir inscripciones.' AS mensaje,
                NULL AS id_inscripcion;
            RETURN;
        END
        
        -- Verificar que la persona no esté ya inscrita
        IF EXISTS (SELECT 1 FROM inscripciones_cursos WHERE id_curso = @id_curso AND dni = @dni)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'La persona con DNI ' + @dni + ' ya está inscrita en este curso' AS mensaje,
                NULL AS id_inscripcion;
            RETURN;
        END
        
        -- Verificar cupos disponibles
        DECLARE @cupos INT, @inscritos INT;
        SELECT @cupos = cupos, @inscritos = inscritos 
        FROM cursos 
        WHERE id = @id_curso;
        
        IF @inscritos >= @cupos
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'El curso está lleno. No hay cupos disponibles.' AS mensaje,
                NULL AS id_inscripcion;
            RETURN;
        END
        
        -- Validar DNI
        IF LEN(@dni) != 8 OR @dni NOT LIKE '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'El DNI debe contener exactamente 8 dígitos numéricos' AS mensaje,
                NULL AS id_inscripcion;
            RETURN;
        END
        
        -- Validar edad mínima
        IF @edad < 13
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'La edad mínima para inscribirse es 13 años' AS mensaje,
                NULL AS id_inscripcion;
            RETURN;
        END
        
        -- Validar email
        IF @email NOT LIKE '%_@__%.__%'
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Formato de correo electrónico inválido' AS mensaje,
                NULL AS id_inscripcion;
            RETURN;
        END
        
        -- Registrar inscripción
        INSERT INTO inscripciones_cursos (
            id_curso,
            nombre,
            apellido,
            dni,
            email,
            edad,
            telefono,
            estado,
            registrado_por
        )
        VALUES (
            @id_curso,
            LTRIM(RTRIM(@nombre)),
            LTRIM(RTRIM(@apellido)),
            @dni,
            LOWER(LTRIM(RTRIM(@email))),
            @edad,
            @telefono,
            'Inscrito',
            @registrado_por
        );
        
        DECLARE @new_id INT = SCOPE_IDENTITY();
        
        -- Actualizar contador de inscritos en el curso
        UPDATE cursos
        SET inscritos = inscritos + 1
        WHERE id = @id_curso;
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Inscripción registrada exitosamente' AS mensaje,
            @new_id AS id_inscripcion,
            @nombre + ' ' + @apellido AS nombre_completo,
            @dni AS dni;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
            ROLLBACK TRANSACTION;
            
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje,
            NULL AS id_inscripcion;
    END CATCH
END
GO

PRINT '✓ SP_INSCRIBIR_A_CURSO creado';
GO

-- =============================================
-- SP2: LISTAR INSCRITOS DE UN CURSO
-- =============================================
CREATE OR ALTER PROCEDURE SP_LISTAR_INSCRITOS_CURSO
    @id_curso INT,
    @estado NVARCHAR(20) = NULL,  -- Filtrar por estado de inscripción
    @busqueda NVARCHAR(100) = NULL  -- Buscar por nombre, apellido o DNI
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validar que el curso existe
        IF NOT EXISTS (SELECT 1 FROM cursos WHERE id = @id_curso)
        BEGIN
            SELECT 
                'ERROR' AS status,
                'El curso no existe' AS mensaje;
            RETURN;
        END
        
        -- Listar inscritos
        SELECT 
            i.id AS id_inscripcion,
            i.id_curso,
            c.titulo AS nombre_curso,
            i.nombre,
            i.apellido,
            i.nombre + ' ' + i.apellido AS nombre_completo,
            i.dni,
            i.email,
            i.edad,
            i.telefono,
            i.estado,
            i.fecha_inscripcion,
            i.fecha_actualizacion,
            i.notas,
            a.nombre_completo AS registrado_por_nombre
        FROM inscripciones_cursos i
        INNER JOIN cursos c ON i.id_curso = c.id
        LEFT JOIN admin_users a ON i.registrado_por = a.id
        WHERE 
            i.id_curso = @id_curso
            AND (@estado IS NULL OR i.estado = @estado)
            AND (
                @busqueda IS NULL OR
                i.nombre LIKE '%' + @busqueda + '%' OR
                i.apellido LIKE '%' + @busqueda + '%' OR
                i.dni LIKE '%' + @busqueda + '%' OR
                i.email LIKE '%' + @busqueda + '%'
            )
        ORDER BY i.fecha_inscripcion DESC;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

PRINT '✓ SP_LISTAR_INSCRITOS_CURSO creado';
GO

-- =============================================
-- SP3: OBTENER DETALLES DE UNA INSCRIPCIÓN
-- =============================================
CREATE OR ALTER PROCEDURE SP_OBTENER_INSCRIPCION
    @id_inscripcion INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            i.id AS id_inscripcion,
            i.id_curso,
            c.titulo AS nombre_curso,
            c.categoria,
            c.modalidad,
            c.fecha_inicio,
            c.fecha_fin,
            i.nombre,
            i.apellido,
            i.nombre + ' ' + i.apellido AS nombre_completo,
            i.dni,
            i.email,
            i.edad,
            i.telefono,
            i.estado,
            i.fecha_inscripcion,
            i.fecha_actualizacion,
            i.notas,
            a.nombre_completo AS registrado_por_nombre,
            a.email AS registrado_por_email
        FROM inscripciones_cursos i
        INNER JOIN cursos c ON i.id_curso = c.id
        LEFT JOIN admin_users a ON i.registrado_por = a.id
        WHERE i.id = @id_inscripcion;
        
        IF @@ROWCOUNT = 0
        BEGIN
            SELECT 
                'ERROR' AS status,
                'Inscripción no encontrada' AS mensaje;
        END
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

PRINT '✓ SP_OBTENER_INSCRIPCION creado';
GO

-- =============================================
-- SP4: CAMBIAR ESTADO DE INSCRIPCIÓN
-- =============================================
CREATE OR ALTER PROCEDURE SP_CAMBIAR_ESTADO_INSCRIPCION
    @id_inscripcion INT,
    @nuevo_estado NVARCHAR(20),  -- 'Inscrito', 'Asistiendo', 'Completado', 'Retirado', 'Cancelado'
    @notas NVARCHAR(500) = NULL,
    @modificado_por INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que la inscripción existe
        IF NOT EXISTS (SELECT 1 FROM inscripciones_cursos WHERE id = @id_inscripcion)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Inscripción no encontrada' AS mensaje;
            RETURN;
        END
        
        -- Validar estado
        IF @nuevo_estado NOT IN ('Inscrito', 'Asistiendo', 'Completado', 'Retirado', 'Cancelado')
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Estado inválido' AS mensaje;
            RETURN;
        END
        
        -- Obtener estado actual
        DECLARE @estado_actual NVARCHAR(20);
        DECLARE @id_curso INT;
        
        SELECT 
            @estado_actual = estado,
            @id_curso = id_curso
        FROM inscripciones_cursos 
        WHERE id = @id_inscripcion;
        
        -- Actualizar estado
        UPDATE inscripciones_cursos
        SET 
            estado = @nuevo_estado,
            fecha_actualizacion = SYSUTCDATETIME(),
            notas = CASE 
                WHEN @notas IS NOT NULL THEN 
                    ISNULL(notas, '') + CHAR(13) + CHAR(10) + 
                    '--- Cambio de Estado (' + CONVERT(VARCHAR, GETDATE(), 120) + ') ---' + CHAR(13) + CHAR(10) +
                    'De: ' + @estado_actual + ' -> A: ' + @nuevo_estado + CHAR(13) + CHAR(10) +
                    'Nota: ' + @notas
                ELSE notas
            END
        WHERE id = @id_inscripcion;
        
        -- Si se cancela o retira, disminuir contador de inscritos
        IF (@nuevo_estado IN ('Cancelado', 'Retirado') AND @estado_actual NOT IN ('Cancelado', 'Retirado'))
        BEGIN
            UPDATE cursos
            SET inscritos = inscritos - 1
            WHERE id = @id_curso AND inscritos > 0;
        END
        
        -- Si se reactiva, aumentar contador de inscritos
        IF (@estado_actual IN ('Cancelado', 'Retirado') AND @nuevo_estado NOT IN ('Cancelado', 'Retirado'))
        BEGIN
            UPDATE cursos
            SET inscritos = inscritos + 1
            WHERE id = @id_curso;
        END
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Estado de inscripción actualizado exitosamente' AS mensaje,
            @id_inscripcion AS id_inscripcion,
            @nuevo_estado AS nuevo_estado;
        
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

PRINT '✓ SP_CAMBIAR_ESTADO_INSCRIPCION creado';
GO

-- =============================================
-- SP5: ELIMINAR INSCRIPCIÓN
-- =============================================
CREATE OR ALTER PROCEDURE SP_ELIMINAR_INSCRIPCION
    @id_inscripcion INT,
    @motivo NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que la inscripción existe
        IF NOT EXISTS (SELECT 1 FROM inscripciones_cursos WHERE id = @id_inscripcion)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Inscripción no encontrada' AS mensaje;
            RETURN;
        END
        
        -- Obtener datos antes de eliminar
        DECLARE @id_curso INT;
        DECLARE @estado NVARCHAR(20);
        
        SELECT 
            @id_curso = id_curso,
            @estado = estado
        FROM inscripciones_cursos 
        WHERE id = @id_inscripcion;
        
        -- Eliminar inscripción
        DELETE FROM inscripciones_cursos WHERE id = @id_inscripcion;
        
        -- Disminuir contador de inscritos si no estaba ya cancelada/retirada
        IF @estado NOT IN ('Cancelado', 'Retirado')
        BEGIN
            UPDATE cursos
            SET inscritos = inscritos - 1
            WHERE id = @id_curso AND inscritos > 0;
        END
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Inscripción eliminada exitosamente' AS mensaje,
            @id_inscripcion AS id_inscripcion;
        
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

PRINT '✓ SP_ELIMINAR_INSCRIPCION creado';
GO

-- =============================================
-- SP6: ACTUALIZAR DATOS DE INSCRITO
-- =============================================
CREATE OR ALTER PROCEDURE SP_ACTUALIZAR_INSCRITO
    @id_inscripcion INT,
    @nombre NVARCHAR(50) = NULL,
    @apellido NVARCHAR(50) = NULL,
    @email NVARCHAR(100) = NULL,
    @telefono CHAR(9) = NULL,
    @edad INT = NULL,
    @notas NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que la inscripción existe
        IF NOT EXISTS (SELECT 1 FROM inscripciones_cursos WHERE id = @id_inscripcion)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Inscripción no encontrada' AS mensaje;
            RETURN;
        END
        
        -- Validar email si se proporciona
        IF @email IS NOT NULL AND @email NOT LIKE '%_@__%.__%'
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Formato de correo electrónico inválido' AS mensaje;
            RETURN;
        END
        
        -- Actualizar datos
        UPDATE inscripciones_cursos
        SET 
            nombre = ISNULL(@nombre, nombre),
            apellido = ISNULL(@apellido, apellido),
            email = ISNULL(@email, email),
            telefono = ISNULL(@telefono, telefono),
            edad = ISNULL(@edad, edad),
            notas = ISNULL(@notas, notas),
            fecha_actualizacion = SYSUTCDATETIME()
        WHERE id = @id_inscripcion;
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Datos de inscrito actualizados exitosamente' AS mensaje,
            @id_inscripcion AS id_inscripcion;
        
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

PRINT '✓ SP_ACTUALIZAR_INSCRITO creado';
GO

-- =============================================
-- SP7: ESTADÍSTICAS DE INSCRIPCIONES POR CURSO
-- =============================================
CREATE OR ALTER PROCEDURE SP_ESTADISTICAS_INSCRIPCIONES_CURSO
    @id_curso INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validar que el curso existe
        IF NOT EXISTS (SELECT 1 FROM cursos WHERE id = @id_curso)
        BEGIN
            SELECT 
                'ERROR' AS status,
                'El curso no existe' AS mensaje;
            RETURN;
        END
        
        SELECT 
            c.id AS id_curso,
            c.titulo AS nombre_curso,
            c.cupos,
            c.inscritos,
            (c.cupos - c.inscritos) AS cupos_disponibles,
            CAST(ROUND((CAST(c.inscritos AS FLOAT) / c.cupos) * 100, 2) AS DECIMAL(5,2)) AS porcentaje_ocupacion,
            
            -- Contar por estados
            (SELECT COUNT(*) FROM inscripciones_cursos WHERE id_curso = @id_curso AND estado = 'Inscrito') AS total_inscritos,
            (SELECT COUNT(*) FROM inscripciones_cursos WHERE id_curso = @id_curso AND estado = 'Asistiendo') AS total_asistiendo,
            (SELECT COUNT(*) FROM inscripciones_cursos WHERE id_curso = @id_curso AND estado = 'Completado') AS total_completados,
            (SELECT COUNT(*) FROM inscripciones_cursos WHERE id_curso = @id_curso AND estado = 'Retirado') AS total_retirados,
            (SELECT COUNT(*) FROM inscripciones_cursos WHERE id_curso = @id_curso AND estado = 'Cancelado') AS total_cancelados,
            
            -- Edad promedio
            (SELECT AVG(edad) FROM inscripciones_cursos WHERE id_curso = @id_curso) AS edad_promedio,
            (SELECT MIN(edad) FROM inscripciones_cursos WHERE id_curso = @id_curso) AS edad_minima,
            (SELECT MAX(edad) FROM inscripciones_cursos WHERE id_curso = @id_curso) AS edad_maxima
            
        FROM cursos c
        WHERE c.id = @id_curso;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

PRINT '✓ SP_ESTADISTICAS_INSCRIPCIONES_CURSO creado';
GO

-- =============================================
-- SP8: BUSCAR INSCRIPCIONES POR DNI (Global)
-- =============================================
CREATE OR ALTER PROCEDURE SP_BUSCAR_INSCRIPCIONES_POR_DNI
    @dni CHAR(8)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            i.id AS id_inscripcion,
            i.id_curso,
            c.titulo AS nombre_curso,
            c.categoria,
            c.modalidad,
            c.fecha_inicio,
            c.fecha_fin,
            i.nombre,
            i.apellido,
            i.nombre + ' ' + i.apellido AS nombre_completo,
            i.dni,
            i.email,
            i.edad,
            i.telefono,
            i.estado,
            i.fecha_inscripcion
        FROM inscripciones_cursos i
        INNER JOIN cursos c ON i.id_curso = c.id
        WHERE i.dni = @dni
        ORDER BY i.fecha_inscripcion DESC;
        
        IF @@ROWCOUNT = 0
        BEGIN
            SELECT 
                'INFO' AS status,
                'No se encontraron inscripciones para el DNI: ' + @dni AS mensaje;
        END
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

PRINT '✓ SP_BUSCAR_INSCRIPCIONES_POR_DNI creado';
GO

PRINT '';
PRINT '========================================';
PRINT 'INSTALACIÓN COMPLETADA';
PRINT '========================================';
PRINT '';
PRINT 'Tabla creada:';
PRINT '  • inscripciones_cursos';
PRINT '';
PRINT 'Procedimientos almacenados creados:';
PRINT '  • SP_INSCRIBIR_A_CURSO';
PRINT '  • SP_LISTAR_INSCRITOS_CURSO';
PRINT '  • SP_OBTENER_INSCRIPCION';
PRINT '  • SP_CAMBIAR_ESTADO_INSCRIPCION';
PRINT '  • SP_ELIMINAR_INSCRIPCION';
PRINT '  • SP_ACTUALIZAR_INSCRITO';
PRINT '  • SP_ESTADISTICAS_INSCRIPCIONES_CURSO';
PRINT '  • SP_BUSCAR_INSCRIPCIONES_POR_DNI';
PRINT '';
PRINT '========================================';
GO
