-- =============================================
-- TABLA Y PROCEDIMIENTOS: INSCRIPCIONES A EVENTOS/TALLERES
-- Sistema: CGPVP - Cuerpo General de Paramédicos Voluntarios del Perú
-- Descripción: Gestión de inscripciones de personas a eventos, talleres, simulacros y conferencias
-- =============================================

USE DB_CGPVP2;
GO

-- =============================================
-- TABLA: inscripciones_eventos
-- Descripción: Registra las personas inscritas en cada evento/taller
-- =============================================

IF OBJECT_ID('dbo.inscripciones_eventos', 'U') IS NOT NULL 
    DROP TABLE dbo.inscripciones_eventos;
GO

CREATE TABLE inscripciones_eventos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    
    -- Relación con el evento
    id_evento INT NOT NULL,
    
    -- Datos del inscrito
    nombre NVARCHAR(50) NOT NULL,
    apellido NVARCHAR(50) NOT NULL,
    dni CHAR(8) NOT NULL,
    email NVARCHAR(100) NOT NULL,
    edad INT NOT NULL,
    telefono CHAR(9) NULL,
    
    -- Estado de la inscripción
    estado NVARCHAR(20) NOT NULL DEFAULT 'Confirmado' CHECK (estado IN ('Confirmado', 'Asistió', 'No Asistió', 'Cancelado')),
    
    -- Auditoría
    fecha_inscripcion DATETIME2 DEFAULT SYSUTCDATETIME(),
    fecha_actualizacion DATETIME2 DEFAULT SYSUTCDATETIME(),
    registrado_por INT NULL,  -- Admin que registró la inscripción
    notas NVARCHAR(500) NULL,
    
    -- Restricciones
    CONSTRAINT FK_inscripciones_evento FOREIGN KEY (id_evento) 
        REFERENCES eventos_talleres(id) ON DELETE CASCADE,
    CONSTRAINT FK_inscripciones_eventos_admin FOREIGN KEY (registrado_por) 
        REFERENCES admin_users(id) ON DELETE NO ACTION,
    
    -- Evitar duplicados: una persona (DNI) no puede inscribirse 2 veces al mismo evento
    CONSTRAINT UQ_inscripcion_evento_dni UNIQUE (id_evento, dni)
);
GO

CREATE INDEX IDX_inscripciones_eventos_evento ON inscripciones_eventos(id_evento);
CREATE INDEX IDX_inscripciones_eventos_dni ON inscripciones_eventos(dni);
CREATE INDEX IDX_inscripciones_eventos_estado ON inscripciones_eventos(estado);
CREATE INDEX IDX_inscripciones_eventos_fecha ON inscripciones_eventos(fecha_inscripcion);
GO

PRINT '✓ Tabla inscripciones_eventos creada exitosamente';
GO

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS
-- =============================================

-- =============================================
-- SP1: INSCRIBIR PERSONA A UN EVENTO
-- =============================================
CREATE OR ALTER PROCEDURE SP_INSCRIBIR_A_EVENTO
    @id_evento INT,
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
        
        -- Validar que el evento existe
        IF NOT EXISTS (SELECT 1 FROM eventos_talleres WHERE id = @id_evento)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'El evento no existe' AS mensaje,
                NULL AS id_inscripcion;
            RETURN;
        END
        
        -- Verificar que el evento está programado o en curso
        DECLARE @estado_evento NVARCHAR(20);
        DECLARE @fecha_evento DATE;
        
        SELECT 
            @estado_evento = estado,
            @fecha_evento = fecha
        FROM eventos_talleres 
        WHERE id = @id_evento;
        
        IF @estado_evento NOT IN ('Programado', 'En Curso')
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'El evento no está disponible para inscripciones. Estado: ' + @estado_evento AS mensaje,
                NULL AS id_inscripcion;
            RETURN;
        END
        
        -- Verificar que el evento no haya pasado
        IF @fecha_evento < CAST(GETDATE() AS DATE)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'No se puede inscribir a un evento que ya pasó' AS mensaje,
                NULL AS id_inscripcion;
            RETURN;
        END
        
        -- Verificar que la persona no esté ya inscrita
        IF EXISTS (SELECT 1 FROM inscripciones_eventos WHERE id_evento = @id_evento AND dni = @dni)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'La persona con DNI ' + @dni + ' ya está inscrita en este evento' AS mensaje,
                NULL AS id_inscripcion;
            RETURN;
        END
        
        -- Verificar capacidad disponible
        DECLARE @capacidad INT, @inscritos INT;
        SELECT @capacidad = capacidad, @inscritos = inscritos 
        FROM eventos_talleres 
        WHERE id = @id_evento;
        
        IF @inscritos >= @capacidad
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'El evento está lleno. No hay cupos disponibles.' AS mensaje,
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
        INSERT INTO inscripciones_eventos (
            id_evento,
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
            @id_evento,
            LTRIM(RTRIM(@nombre)),
            LTRIM(RTRIM(@apellido)),
            @dni,
            LOWER(LTRIM(RTRIM(@email))),
            @edad,
            @telefono,
            'Confirmado',
            @registrado_por
        );
        
        DECLARE @new_id INT = SCOPE_IDENTITY();
        
        -- Actualizar contador de inscritos en el evento
        UPDATE eventos_talleres
        SET inscritos = inscritos + 1
        WHERE id = @id_evento;
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Inscripción al evento registrada exitosamente' AS mensaje,
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

PRINT '✓ SP_INSCRIBIR_A_EVENTO creado';
GO

-- =============================================
-- SP2: LISTAR INSCRITOS DE UN EVENTO
-- =============================================
CREATE OR ALTER PROCEDURE SP_LISTAR_INSCRITOS_EVENTO
    @id_evento INT,
    @estado NVARCHAR(20) = NULL,  -- Filtrar por estado
    @busqueda NVARCHAR(100) = NULL  -- Buscar por nombre, apellido o DNI
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validar que el evento existe
        IF NOT EXISTS (SELECT 1 FROM eventos_talleres WHERE id = @id_evento)
        BEGIN
            SELECT 
                'ERROR' AS status,
                'El evento no existe' AS mensaje;
            RETURN;
        END
        
        -- Listar inscritos
        SELECT 
            i.id AS id_inscripcion,
            i.id_evento,
            e.titulo AS nombre_evento,
            e.tipo AS tipo_evento,
            e.fecha AS fecha_evento,
            e.hora_inicio,
            e.hora_fin,
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
        FROM inscripciones_eventos i
        INNER JOIN eventos_talleres e ON i.id_evento = e.id
        LEFT JOIN admin_users a ON i.registrado_por = a.id
        WHERE 
            i.id_evento = @id_evento
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

PRINT '✓ SP_LISTAR_INSCRITOS_EVENTO creado';
GO

-- =============================================
-- SP3: OBTENER DETALLES DE UNA INSCRIPCIÓN
-- =============================================
CREATE OR ALTER PROCEDURE SP_OBTENER_INSCRIPCION_EVENTO
    @id_inscripcion INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            i.id AS id_inscripcion,
            i.id_evento,
            e.titulo AS nombre_evento,
            e.tipo AS tipo_evento,
            e.fecha AS fecha_evento,
            e.hora_inicio,
            e.hora_fin,
            e.ubicacion,
            e.instructor_nombre,
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
        FROM inscripciones_eventos i
        INNER JOIN eventos_talleres e ON i.id_evento = e.id
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

PRINT '✓ SP_OBTENER_INSCRIPCION_EVENTO creado';
GO

-- =============================================
-- SP4: MARCAR ASISTENCIA
-- =============================================
CREATE OR ALTER PROCEDURE SP_MARCAR_ASISTENCIA_EVENTO
    @id_inscripcion INT,
    @asistio BIT,  -- 1 = Asistió, 0 = No asistió
    @notas NVARCHAR(500) = NULL,
    @modificado_por INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que la inscripción existe
        IF NOT EXISTS (SELECT 1 FROM inscripciones_eventos WHERE id = @id_inscripcion)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Inscripción no encontrada' AS mensaje;
            RETURN;
        END
        
        DECLARE @nuevo_estado NVARCHAR(20);
        SET @nuevo_estado = CASE WHEN @asistio = 1 THEN 'Asistió' ELSE 'No Asistió' END;
        
        -- Actualizar estado
        UPDATE inscripciones_eventos
        SET 
            estado = @nuevo_estado,
            fecha_actualizacion = SYSUTCDATETIME(),
            notas = CASE 
                WHEN @notas IS NOT NULL THEN 
                    ISNULL(notas, '') + CHAR(13) + CHAR(10) + 
                    '--- Asistencia Registrada (' + CONVERT(VARCHAR, GETDATE(), 120) + ') ---' + CHAR(13) + CHAR(10) +
                    'Estado: ' + @nuevo_estado + CHAR(13) + CHAR(10) +
                    'Nota: ' + @notas
                ELSE 
                    ISNULL(notas, '') + CHAR(13) + CHAR(10) + 
                    '--- Asistencia Registrada (' + CONVERT(VARCHAR, GETDATE(), 120) + ') ---' + CHAR(13) + CHAR(10) +
                    'Estado: ' + @nuevo_estado
            END
        WHERE id = @id_inscripcion;
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Asistencia registrada exitosamente' AS mensaje,
            @id_inscripcion AS id_inscripcion,
            @nuevo_estado AS estado;
        
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

PRINT '✓ SP_MARCAR_ASISTENCIA_EVENTO creado';
GO

-- =============================================
-- SP5: CAMBIAR ESTADO DE INSCRIPCIÓN
-- =============================================
CREATE OR ALTER PROCEDURE SP_CAMBIAR_ESTADO_INSCRIPCION_EVENTO
    @id_inscripcion INT,
    @nuevo_estado NVARCHAR(20),  -- 'Confirmado', 'Asistió', 'No Asistió', 'Cancelado'
    @notas NVARCHAR(500) = NULL,
    @modificado_por INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que la inscripción existe
        IF NOT EXISTS (SELECT 1 FROM inscripciones_eventos WHERE id = @id_inscripcion)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Inscripción no encontrada' AS mensaje;
            RETURN;
        END
        
        -- Validar estado
        IF @nuevo_estado NOT IN ('Confirmado', 'Asistió', 'No Asistió', 'Cancelado')
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Estado inválido' AS mensaje;
            RETURN;
        END
        
        -- Obtener estado actual
        DECLARE @estado_actual NVARCHAR(20);
        DECLARE @id_evento INT;
        
        SELECT 
            @estado_actual = estado,
            @id_evento = id_evento
        FROM inscripciones_eventos 
        WHERE id = @id_inscripcion;
        
        -- Actualizar estado
        UPDATE inscripciones_eventos
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
        
        -- Si se cancela, disminuir contador de inscritos
        IF (@nuevo_estado = 'Cancelado' AND @estado_actual != 'Cancelado')
        BEGIN
            UPDATE eventos_talleres
            SET inscritos = inscritos - 1
            WHERE id = @id_evento AND inscritos > 0;
        END
        
        -- Si se reactiva, aumentar contador de inscritos
        IF (@estado_actual = 'Cancelado' AND @nuevo_estado != 'Cancelado')
        BEGIN
            UPDATE eventos_talleres
            SET inscritos = inscritos + 1
            WHERE id = @id_evento;
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

PRINT '✓ SP_CAMBIAR_ESTADO_INSCRIPCION_EVENTO creado';
GO

-- =============================================
-- SP6: ELIMINAR INSCRIPCIÓN
-- =============================================
CREATE OR ALTER PROCEDURE SP_ELIMINAR_INSCRIPCION_EVENTO
    @id_inscripcion INT,
    @motivo NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que la inscripción existe
        IF NOT EXISTS (SELECT 1 FROM inscripciones_eventos WHERE id = @id_inscripcion)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Inscripción no encontrada' AS mensaje;
            RETURN;
        END
        
        -- Obtener datos antes de eliminar
        DECLARE @id_evento INT;
        DECLARE @estado NVARCHAR(20);
        
        SELECT 
            @id_evento = id_evento,
            @estado = estado
        FROM inscripciones_eventos 
        WHERE id = @id_inscripcion;
        
        -- Eliminar inscripción
        DELETE FROM inscripciones_eventos WHERE id = @id_inscripcion;
        
        -- Disminuir contador de inscritos si no estaba cancelada
        IF @estado != 'Cancelado'
        BEGIN
            UPDATE eventos_talleres
            SET inscritos = inscritos - 1
            WHERE id = @id_evento AND inscritos > 0;
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

PRINT '✓ SP_ELIMINAR_INSCRIPCION_EVENTO creado';
GO

-- =============================================
-- SP7: ACTUALIZAR DATOS DE INSCRITO
-- =============================================
CREATE OR ALTER PROCEDURE SP_ACTUALIZAR_INSCRITO_EVENTO
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
        IF NOT EXISTS (SELECT 1 FROM inscripciones_eventos WHERE id = @id_inscripcion)
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
        UPDATE inscripciones_eventos
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

PRINT '✓ SP_ACTUALIZAR_INSCRITO_EVENTO creado';
GO

-- =============================================
-- SP8: ESTADÍSTICAS DE INSCRIPCIONES POR EVENTO
-- =============================================
CREATE OR ALTER PROCEDURE SP_ESTADISTICAS_INSCRIPCIONES_EVENTO
    @id_evento INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validar que el evento existe
        IF NOT EXISTS (SELECT 1 FROM eventos_talleres WHERE id = @id_evento)
        BEGIN
            SELECT 
                'ERROR' AS status,
                'El evento no existe' AS mensaje;
            RETURN;
        END
        
        SELECT 
            e.id AS id_evento,
            e.titulo AS nombre_evento,
            e.tipo,
            e.fecha,
            e.capacidad,
            e.inscritos,
            (e.capacidad - e.inscritos) AS cupos_disponibles,
            CAST(ROUND((CAST(e.inscritos AS FLOAT) / e.capacidad) * 100, 2) AS DECIMAL(5,2)) AS porcentaje_ocupacion,
            
            -- Contar por estados
            (SELECT COUNT(*) FROM inscripciones_eventos WHERE id_evento = @id_evento AND estado = 'Confirmado') AS total_confirmados,
            (SELECT COUNT(*) FROM inscripciones_eventos WHERE id_evento = @id_evento AND estado = 'Asistió') AS total_asistieron,
            (SELECT COUNT(*) FROM inscripciones_eventos WHERE id_evento = @id_evento AND estado = 'No Asistió') AS total_no_asistieron,
            (SELECT COUNT(*) FROM inscripciones_eventos WHERE id_evento = @id_evento AND estado = 'Cancelado') AS total_cancelados,
            
            -- Calcular tasa de asistencia
            CASE 
                WHEN (SELECT COUNT(*) FROM inscripciones_eventos WHERE id_evento = @id_evento AND estado IN ('Asistió', 'No Asistió')) > 0
                THEN CAST(ROUND(
                    (CAST((SELECT COUNT(*) FROM inscripciones_eventos WHERE id_evento = @id_evento AND estado = 'Asistió') AS FLOAT) / 
                     (SELECT COUNT(*) FROM inscripciones_eventos WHERE id_evento = @id_evento AND estado IN ('Asistió', 'No Asistió'))) * 100, 2
                ) AS DECIMAL(5,2))
                ELSE 0
            END AS tasa_asistencia,
            
            -- Edad promedio
            (SELECT AVG(edad) FROM inscripciones_eventos WHERE id_evento = @id_evento) AS edad_promedio,
            (SELECT MIN(edad) FROM inscripciones_eventos WHERE id_evento = @id_evento) AS edad_minima,
            (SELECT MAX(edad) FROM inscripciones_eventos WHERE id_evento = @id_evento) AS edad_maxima
            
        FROM eventos_talleres e
        WHERE e.id = @id_evento;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

PRINT '✓ SP_ESTADISTICAS_INSCRIPCIONES_EVENTO creado';
GO

-- =============================================
-- SP9: BUSCAR INSCRIPCIONES POR DNI (Global)
-- =============================================
CREATE OR ALTER PROCEDURE SP_BUSCAR_INSCRIPCIONES_EVENTOS_POR_DNI
    @dni CHAR(8)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            i.id AS id_inscripcion,
            i.id_evento,
            e.titulo AS nombre_evento,
            e.tipo AS tipo_evento,
            e.fecha AS fecha_evento,
            e.hora_inicio,
            e.hora_fin,
            e.ubicacion,
            i.nombre,
            i.apellido,
            i.nombre + ' ' + i.apellido AS nombre_completo,
            i.dni,
            i.email,
            i.edad,
            i.telefono,
            i.estado,
            i.fecha_inscripcion
        FROM inscripciones_eventos i
        INNER JOIN eventos_talleres e ON i.id_evento = e.id
        WHERE i.dni = @dni
        ORDER BY e.fecha DESC, i.fecha_inscripcion DESC;
        
        IF @@ROWCOUNT = 0
        BEGIN
            SELECT 
                'INFO' AS status,
                'No se encontraron inscripciones a eventos para el DNI: ' + @dni AS mensaje;
        END
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

PRINT '✓ SP_BUSCAR_INSCRIPCIONES_EVENTOS_POR_DNI creado';
GO

-- =============================================
-- SP10: REPORTE DE ASISTENCIA POR EVENTO
-- =============================================
CREATE OR ALTER PROCEDURE SP_REPORTE_ASISTENCIA_EVENTO
    @id_evento INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validar que el evento existe
        IF NOT EXISTS (SELECT 1 FROM eventos_talleres WHERE id = @id_evento)
        BEGIN
            SELECT 
                'ERROR' AS status,
                'El evento no existe' AS mensaje;
            RETURN;
        END
        
        -- Generar reporte de asistencia
        SELECT 
            i.nombre,
            i.apellido,
            i.nombre + ' ' + i.apellido AS nombre_completo,
            i.dni,
            i.email,
            i.telefono,
            i.edad,
            i.estado,
            CASE 
                WHEN i.estado = 'Asistió' THEN 'Presente'
                WHEN i.estado = 'No Asistió' THEN 'Ausente'
                WHEN i.estado = 'Confirmado' THEN 'Pendiente'
                WHEN i.estado = 'Cancelado' THEN 'Cancelado'
            END AS asistencia,
            i.fecha_inscripcion,
            i.notas
        FROM inscripciones_eventos i
        WHERE i.id_evento = @id_evento
        ORDER BY 
            CASE i.estado
                WHEN 'Asistió' THEN 1
                WHEN 'Confirmado' THEN 2
                WHEN 'No Asistió' THEN 3
                WHEN 'Cancelado' THEN 4
            END,
            i.apellido, i.nombre;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

PRINT '✓ SP_REPORTE_ASISTENCIA_EVENTO creado';
GO

PRINT '';
PRINT '========================================';
PRINT 'INSTALACIÓN COMPLETADA';
PRINT '========================================';
PRINT '';
PRINT 'Tabla creada:';
PRINT '  • inscripciones_eventos';
PRINT '';
PRINT 'Procedimientos almacenados creados:';
PRINT '  • SP_INSCRIBIR_A_EVENTO';
PRINT '  • SP_LISTAR_INSCRITOS_EVENTO';
PRINT '  • SP_OBTENER_INSCRIPCION_EVENTO';
PRINT '  • SP_MARCAR_ASISTENCIA_EVENTO';
PRINT '  • SP_CAMBIAR_ESTADO_INSCRIPCION_EVENTO';
PRINT '  • SP_ELIMINAR_INSCRIPCION_EVENTO';
PRINT '  • SP_ACTUALIZAR_INSCRITO_EVENTO';
PRINT '  • SP_ESTADISTICAS_INSCRIPCIONES_EVENTO';
PRINT '  • SP_BUSCAR_INSCRIPCIONES_EVENTOS_POR_DNI';
PRINT '  • SP_REPORTE_ASISTENCIA_EVENTO';
PRINT '';
PRINT '========================================';
GO
