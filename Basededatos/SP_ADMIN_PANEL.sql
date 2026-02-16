-- =============================================
-- PROCEDIMIENTOS ALMACENADOS: PANEL ADMINISTRATIVO
-- Sistema: CGPVP - Cuerpo General de Paramédicos Voluntarios del Perú
-- Descripción: CRUD completo para Usuarios, Eventos, Dashboard y Reportes
-- =============================================

USE DB_CGPVP2;
GO

-- =============================================
-- SECCIÓN 1: GESTIÓN DE USUARIOS (MIEMBROS)
-- Maneja Aspirantes, Alumnos (BIRED/EMGRA) y Rescatistas
-- =============================================

-- SP1.1: LISTAR TODOS LOS USUARIOS
CREATE OR ALTER PROCEDURE SP_LISTAR_USUARIOS
    @rol NVARCHAR(20) = NULL,  -- 'aspirante', 'alumno', 'rescatista' o NULL para todos
    @estado NVARCHAR(20) = NULL,  -- 'Activo', 'Suspendido', 'Baja' o NULL para todos
    @busqueda NVARCHAR(100) = NULL  -- Buscar por nombre, apellido, DNI o email
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            m.id,
            m.nombre,
            m.apellido,
            m.dni,
            m.fecha_nacimiento,
            DATEDIFF(YEAR, m.fecha_nacimiento, GETDATE()) AS edad,
            m.genero,
            m.email,
            m.telefono,
            m.direccion,
            m.departamento,
            m.distrito,
            m.profesion,
            m.legajo,
            m.rango,
            m.jefatura,
            m.foto_perfil,
            m.estado,
            m.fecha_ingreso,
            m.fecha_ultimo_cambio,
            m.cursos_certificaciones,
            m.notas,
            p.nivel_educativo,
            p.motivacion,
            p.experiencia,
            -- Determinar rol basado en el rango
            CASE 
                WHEN m.rango LIKE '%ASPIRANTE%' THEN 'aspirante'
                WHEN m.rango LIKE '%BIRED%' OR m.rango LIKE '%EMGRA%' THEN 'alumno'
                WHEN m.rango LIKE '%RESCATISTA%' OR m.rango LIKE '%TÉCNICO%' THEN 'rescatista'
                ELSE 'otro'
            END AS rol_determinado,
            -- Determinar nivel de alumno
            CASE 
                WHEN m.rango LIKE '%BIRED%' THEN 'bired'
                WHEN m.rango LIKE '%EMGRA%' THEN 'emgra'
                ELSE ''
            END AS nivel_alumno
        FROM miembros m
        LEFT JOIN postulantes p ON m.id_postulante = p.id
        WHERE 
            (@rol IS NULL OR 
                (@rol = 'aspirante' AND m.rango LIKE '%ASPIRANTE%') OR
                (@rol = 'alumno' AND (m.rango LIKE '%BIRED%' OR m.rango LIKE '%EMGRA%')) OR
                (@rol = 'rescatista' AND (m.rango LIKE '%RESCATISTA%' OR m.rango LIKE '%TÉCNICO%'))
            )
            AND (@estado IS NULL OR m.estado = @estado)
            AND (
                @busqueda IS NULL OR
                m.nombre LIKE '%' + @busqueda + '%' OR
                m.apellido LIKE '%' + @busqueda + '%' OR
                m.dni LIKE '%' + @busqueda + '%' OR
                m.email LIKE '%' + @busqueda + '%' OR
                m.legajo LIKE '%' + @busqueda + '%'
            )
        ORDER BY m.fecha_ingreso DESC;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- SP1.2: OBTENER USUARIO POR ID
CREATE OR ALTER PROCEDURE SP_OBTENER_USUARIO
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            m.id,
            m.nombre,
            m.apellido,
            m.dni,
            m.fecha_nacimiento,
            DATEDIFF(YEAR, m.fecha_nacimiento, GETDATE()) AS edad,
            m.genero,
            m.email,
            m.telefono,
            m.direccion,
            m.departamento,
            m.distrito,
            m.profesion,
            m.legajo,
            m.rango,
            m.jefatura,
            m.foto_perfil,
            m.codigo_qr,
            m.estado,
            m.fecha_ingreso,
            m.fecha_ultimo_cambio,
            m.cursos_certificaciones,
            m.notas,
            m.id_postulante,
            p.nivel_educativo,
            p.motivacion,
            p.experiencia,
            p.fecha_registro
        FROM miembros m
        LEFT JOIN postulantes p ON m.id_postulante = p.id
        WHERE m.id = @id;
        
        IF @@ROWCOUNT = 0
        BEGIN
            SELECT 
                'ERROR' AS status,
                'Usuario no encontrado' AS mensaje;
        END
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- SP1.3: CREAR NUEVO USUARIO/MIEMBRO
CREATE OR ALTER PROCEDURE SP_CREAR_USUARIO
    -- Datos personales
    @nombre NVARCHAR(50),
    @apellido NVARCHAR(50),
    @dni CHAR(8),
    @fecha_nacimiento DATE,
    @genero NVARCHAR(10),
    @email NVARCHAR(100),
    @telefono CHAR(9),
    @direccion NVARCHAR(200) = NULL,
    @departamento NVARCHAR(50) = NULL,
    @distrito NVARCHAR(50) = NULL,
    @profesion NVARCHAR(100) = NULL,
    
    -- Datos de credencial
    @legajo NVARCHAR(20),
    @rango NVARCHAR(50),
    @jefatura NVARCHAR(100),
    @foto_perfil NVARCHAR(MAX) = NULL,
    
    -- Estado y notas
    @estado NVARCHAR(20) = 'Activo',
    @notas NVARCHAR(500) = NULL,
    @cursos_certificaciones NVARCHAR(MAX) = NULL,
    
    -- Relación con postulante (opcional)
    @id_postulante INT = NULL,
    
    -- Auditoría
    @creado_por INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar DNI único
        IF EXISTS (SELECT 1 FROM miembros WHERE dni = @dni)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'El DNI ya está registrado en el sistema' AS mensaje,
                NULL AS id_usuario;
            RETURN;
        END
        
        -- Validar legajo único
        IF EXISTS (SELECT 1 FROM miembros WHERE legajo = @legajo)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'El número de legajo ya existe' AS mensaje,
                NULL AS id_usuario;
            RETURN;
        END
        
        -- Validar formato DNI
        IF LEN(@dni) != 8 OR @dni NOT LIKE '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'El DNI debe contener exactamente 8 dígitos' AS mensaje,
                NULL AS id_usuario;
            RETURN;
        END
        
        -- Validar género
        IF @genero NOT IN ('masculino', 'femenino', 'otro')
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Género inválido' AS mensaje,
                NULL AS id_usuario;
            RETURN;
        END
        
        -- Validar estado
        IF @estado NOT IN ('Activo', 'Suspendido', 'Baja')
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Estado inválido' AS mensaje,
                NULL AS id_usuario;
            RETURN;
        END
        
        -- Insertar nuevo miembro
        INSERT INTO miembros (
            nombre, apellido, dni, fecha_nacimiento, genero,
            email, telefono, direccion, departamento, distrito,
            profesion, legajo, rango, jefatura, foto_perfil,
            estado, cursos_certificaciones, notas,
            id_postulante, creado_por, modificado_por
        )
        VALUES (
            @nombre, @apellido, @dni, @fecha_nacimiento, @genero,
            @email, @telefono, @direccion, @departamento, @distrito,
            @profesion, @legajo, @rango, @jefatura, @foto_perfil,
            @estado, @cursos_certificaciones, @notas,
            @id_postulante, @creado_por, @creado_por
        );
        
        DECLARE @new_id INT = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Usuario creado exitosamente' AS mensaje,
            @new_id AS id_usuario,
            @legajo AS legajo,
            @nombre + ' ' + @apellido AS nombre_completo;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
            ROLLBACK TRANSACTION;
            
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje,
            NULL AS id_usuario;
    END CATCH
END
GO

-- SP1.4: ACTUALIZAR USUARIO
CREATE OR ALTER PROCEDURE SP_ACTUALIZAR_USUARIO
    @id INT,
    
    -- Datos personales
    @nombre NVARCHAR(50) = NULL,
    @apellido NVARCHAR(50) = NULL,
    @fecha_nacimiento DATE = NULL,
    @genero NVARCHAR(10) = NULL,
    @email NVARCHAR(100) = NULL,
    @telefono CHAR(9) = NULL,
    @direccion NVARCHAR(200) = NULL,
    @departamento NVARCHAR(50) = NULL,
    @distrito NVARCHAR(50) = NULL,
    @profesion NVARCHAR(100) = NULL,
    
    -- Datos de credencial
    @rango NVARCHAR(50) = NULL,
    @jefatura NVARCHAR(100) = NULL,
    @foto_perfil NVARCHAR(MAX) = NULL,
    
    -- Estado y notas
    @estado NVARCHAR(20) = NULL,
    @notas NVARCHAR(500) = NULL,
    @cursos_certificaciones NVARCHAR(MAX) = NULL,
    
    -- Auditoría
    @modificado_por INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM miembros WHERE id = @id)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Usuario no encontrado' AS mensaje;
            RETURN;
        END
        
        -- Validar género si se proporciona
        IF @genero IS NOT NULL AND @genero NOT IN ('masculino', 'femenino', 'otro')
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Género inválido' AS mensaje;
            RETURN;
        END
        
        -- Validar estado si se proporciona
        IF @estado IS NOT NULL AND @estado NOT IN ('Activo', 'Suspendido', 'Baja')
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Estado inválido' AS mensaje;
            RETURN;
        END
        
        -- Actualizar datos
        UPDATE miembros
        SET 
            nombre = ISNULL(@nombre, nombre),
            apellido = ISNULL(@apellido, apellido),
            fecha_nacimiento = ISNULL(@fecha_nacimiento, fecha_nacimiento),
            genero = ISNULL(@genero, genero),
            email = ISNULL(@email, email),
            telefono = ISNULL(@telefono, telefono),
            direccion = ISNULL(@direccion, direccion),
            departamento = ISNULL(@departamento, departamento),
            distrito = ISNULL(@distrito, distrito),
            profesion = ISNULL(@profesion, profesion),
            rango = ISNULL(@rango, rango),
            jefatura = ISNULL(@jefatura, jefatura),
            foto_perfil = ISNULL(@foto_perfil, foto_perfil),
            estado = ISNULL(@estado, estado),
            notas = ISNULL(@notas, notas),
            cursos_certificaciones = ISNULL(@cursos_certificaciones, cursos_certificaciones),
            fecha_ultimo_cambio = SYSUTCDATETIME(),
            modificado_por = @modificado_por
        WHERE id = @id;
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Usuario actualizado exitosamente' AS mensaje,
            @id AS id_usuario;
        
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

-- SP1.5: CAMBIAR ROL DE USUARIO (Aspirante -> Alumno -> Rescatista)
CREATE OR ALTER PROCEDURE SP_CAMBIAR_ROL_USUARIO
    @id INT,
    @nuevo_rol NVARCHAR(20),  -- 'aspirante', 'alumno', 'rescatista'
    @nivel_alumno NVARCHAR(20) = NULL,  -- 'bired' o 'emgra' (solo si es alumno)
    @motivo NVARCHAR(500) = NULL,
    @modificado_por INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM miembros WHERE id = @id)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Usuario no encontrado' AS mensaje;
            RETURN;
        END
        
        -- Obtener rango actual
        DECLARE @rango_actual NVARCHAR(50);
        DECLARE @rango_nuevo NVARCHAR(50);
        
        SELECT @rango_actual = rango FROM miembros WHERE id = @id;
        
        -- Determinar nuevo rango según el rol
        IF @nuevo_rol = 'aspirante'
        BEGIN
            SET @rango_nuevo = 'ASPIRANTE';
        END
        ELSE IF @nuevo_rol = 'alumno'
        BEGIN
            IF @nivel_alumno = 'bired'
                SET @rango_nuevo = 'ALUMNO BIRED';
            ELSE IF @nivel_alumno = 'emgra'
                SET @rango_nuevo = 'ALUMNO EMGRA';
            ELSE
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT 
                    'ERROR' AS status,
                    'Debe especificar el nivel de alumno (BIRED o EMGRA)' AS mensaje;
                RETURN;
            END
        END
        ELSE IF @nuevo_rol = 'rescatista'
        BEGIN
            SET @rango_nuevo = 'TÉCNICO PARAMÉDICO';
        END
        ELSE
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Rol inválido. Debe ser: aspirante, alumno o rescatista' AS mensaje;
            RETURN;
        END
        
        -- Actualizar rango
        UPDATE miembros
        SET 
            rango = @rango_nuevo,
            notas = ISNULL(notas, '') + CHAR(13) + CHAR(10) + 
                   '--- Cambio de Rol (' + CONVERT(VARCHAR, GETDATE(), 120) + ') ---' + CHAR(13) + CHAR(10) +
                   'De: ' + @rango_actual + ' -> A: ' + @rango_nuevo + CHAR(13) + CHAR(10) +
                   'Motivo: ' + ISNULL(@motivo, 'No especificado'),
            fecha_ultimo_cambio = SYSUTCDATETIME(),
            modificado_por = @modificado_por
        WHERE id = @id;
        
        -- Registrar en historial de cambios
        INSERT INTO historial_cambios (
            id_miembro,
            campo_modificado,
            valor_anterior,
            valor_nuevo,
            motivo,
            realizado_por
        )
        VALUES (
            @id,
            'rango',
            @rango_actual,
            @rango_nuevo,
            @motivo,
            @modificado_por
        );
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Rol actualizado exitosamente' AS mensaje,
            @id AS id_usuario,
            @rango_nuevo AS nuevo_rango;
        
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

-- SP1.6: CAMBIAR ESTADO DE USUARIO
CREATE OR ALTER PROCEDURE SP_CAMBIAR_ESTADO_USUARIO
    @id INT,
    @nuevo_estado NVARCHAR(20),  -- 'Activo', 'Suspendido', 'Baja'
    @motivo NVARCHAR(500) = NULL,
    @modificado_por INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM miembros WHERE id = @id)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Usuario no encontrado' AS mensaje;
            RETURN;
        END
        
        -- Validar estado
        IF @nuevo_estado NOT IN ('Activo', 'Suspendido', 'Baja')
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Estado inválido. Debe ser: Activo, Suspendido o Baja' AS mensaje;
            RETURN;
        END
        
        -- Obtener estado actual
        DECLARE @estado_actual NVARCHAR(20);
        SELECT @estado_actual = estado FROM miembros WHERE id = @id;
        
        -- Actualizar estado
        UPDATE miembros
        SET 
            estado = @nuevo_estado,
            notas = ISNULL(notas, '') + CHAR(13) + CHAR(10) + 
                   '--- Cambio de Estado (' + CONVERT(VARCHAR, GETDATE(), 120) + ') ---' + CHAR(13) + CHAR(10) +
                   'De: ' + @estado_actual + ' -> A: ' + @nuevo_estado + CHAR(13) + CHAR(10) +
                   'Motivo: ' + ISNULL(@motivo, 'No especificado'),
            fecha_ultimo_cambio = SYSUTCDATETIME(),
            modificado_por = @modificado_por
        WHERE id = @id;
        
        -- Registrar en historial de cambios
        INSERT INTO historial_cambios (
            id_miembro,
            campo_modificado,
            valor_anterior,
            valor_nuevo,
            motivo,
            realizado_por
        )
        VALUES (
            @id,
            'estado',
            @estado_actual,
            @nuevo_estado,
            @motivo,
            @modificado_por
        );
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Estado actualizado exitosamente' AS mensaje,
            @id AS id_usuario,
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

-- SP1.7: ELIMINAR USUARIO (Soft Delete)
CREATE OR ALTER PROCEDURE SP_ELIMINAR_USUARIO
    @id INT,
    @motivo NVARCHAR(500) = NULL,
    @modificado_por INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM miembros WHERE id = @id)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Usuario no encontrado' AS mensaje;
            RETURN;
        END
        
        -- Cambiar estado a "Baja" en lugar de eliminar físicamente
        UPDATE miembros
        SET 
            estado = 'Baja',
            notas = ISNULL(notas, '') + CHAR(13) + CHAR(10) + 
                   '--- ELIMINACIÓN (' + CONVERT(VARCHAR, GETDATE(), 120) + ') ---' + CHAR(13) + CHAR(10) +
                   'Motivo: ' + ISNULL(@motivo, 'No especificado'),
            fecha_ultimo_cambio = SYSUTCDATETIME(),
            modificado_por = @modificado_por
        WHERE id = @id;
        
        -- Registrar en historial
        INSERT INTO historial_cambios (
            id_miembro,
            campo_modificado,
            valor_anterior,
            valor_nuevo,
            motivo,
            realizado_por
        )
        VALUES (
            @id,
            'eliminado',
            'Activo',
            'Eliminado (Baja)',
            @motivo,
            @modificado_por
        );
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Usuario dado de baja exitosamente' AS mensaje,
            @id AS id_usuario;
        
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

-- SP1.8: CONVERTIR POSTULANTE A MIEMBRO
CREATE OR ALTER PROCEDURE SP_CONVERTIR_POSTULANTE_A_MIEMBRO
    @id_postulante INT,
    @legajo NVARCHAR(20),
    @rango NVARCHAR(50) = 'ASPIRANTE',
    @jefatura NVARCHAR(100),
    @foto_perfil NVARCHAR(MAX) = NULL,
    @creado_por INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el postulante existe
        IF NOT EXISTS (SELECT 1 FROM postulantes WHERE id = @id_postulante)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Postulante no encontrado' AS mensaje,
                NULL AS id_miembro;
            RETURN;
        END
        
        -- Validar que no esté ya convertido
        IF EXISTS (SELECT 1 FROM miembros WHERE id_postulante = @id_postulante)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Este postulante ya fue convertido a miembro' AS mensaje,
                NULL AS id_miembro;
            RETURN;
        END
        
        -- Validar legajo único
        IF EXISTS (SELECT 1 FROM miembros WHERE legajo = @legajo)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'El número de legajo ya existe' AS mensaje,
                NULL AS id_miembro;
            RETURN;
        END
        
        -- Obtener datos del postulante
        DECLARE @nombre NVARCHAR(50), @apellido NVARCHAR(50), @dni CHAR(8),
                @fecha_nacimiento DATE, @genero NVARCHAR(10), @email NVARCHAR(100),
                @telefono CHAR(9), @direccion NVARCHAR(200), @departamento NVARCHAR(50),
                @distrito NVARCHAR(50), @profesion NVARCHAR(100);
        
        SELECT 
            @nombre = nombre,
            @apellido = apellido,
            @dni = dni,
            @fecha_nacimiento = fecha_nacimiento,
            @genero = genero,
            @email = email,
            @telefono = telefono,
            @direccion = direccion,
            @departamento = departamento,
            @distrito = distrito,
            @profesion = profesion
        FROM postulantes
        WHERE id = @id_postulante;
        
        -- Crear miembro
        INSERT INTO miembros (
            nombre, apellido, dni, fecha_nacimiento, genero,
            email, telefono, direccion, departamento, distrito,
            profesion, legajo, rango, jefatura, foto_perfil,
            estado, id_postulante, creado_por, modificado_por
        )
        VALUES (
            @nombre, @apellido, @dni, @fecha_nacimiento, @genero,
            @email, @telefono, @direccion, @departamento, @distrito,
            @profesion, @legajo, @rango, @jefatura, @foto_perfil,
            'Activo', @id_postulante, @creado_por, @creado_por
        );
        
        DECLARE @new_id INT = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Postulante convertido a miembro exitosamente' AS mensaje,
            @new_id AS id_miembro,
            @legajo AS legajo;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
            ROLLBACK TRANSACTION;
            
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje,
            NULL AS id_miembro;
    END CATCH
END
GO

-- =============================================
-- SECCIÓN 2: GESTIÓN DE EVENTOS Y TALLERES
-- =============================================

-- SP2.1: LISTAR EVENTOS
CREATE OR ALTER PROCEDURE SP_LISTAR_EVENTOS
    @tipo NVARCHAR(30) = NULL,  -- 'Capacitación', 'Taller', 'Simulacro', 'Conferencia'
    @estado NVARCHAR(20) = NULL,  -- 'Programado', 'En Curso', 'Finalizado', 'Cancelado'
    @fecha_desde DATE = NULL,
    @fecha_hasta DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            e.id,
            e.titulo,
            e.tipo,
            e.descripcion,
            e.fecha,
            e.hora_inicio,
            e.hora_fin,
            e.ubicacion,
            e.id_instructor,
            e.instructor_nombre,
            i.nombre_completo AS instructor_nombre_completo,
            e.capacidad,
            e.inscritos,
            (e.capacidad - e.inscritos) AS cupos_disponibles,
            e.estado,
            e.imagen,
            e.fecha_creacion
        FROM eventos_talleres e
        LEFT JOIN instructores i ON e.id_instructor = i.id
        WHERE 
            (@tipo IS NULL OR e.tipo = @tipo)
            AND (@estado IS NULL OR e.estado = @estado)
            AND (@fecha_desde IS NULL OR e.fecha >= @fecha_desde)
            AND (@fecha_hasta IS NULL OR e.fecha <= @fecha_hasta)
        ORDER BY e.fecha DESC, e.hora_inicio;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- SP2.2: CREAR EVENTO
CREATE OR ALTER PROCEDURE SP_CREAR_EVENTO
    @titulo NVARCHAR(200),
    @tipo NVARCHAR(30),
    @descripcion NVARCHAR(MAX) = NULL,
    @fecha DATE,
    @hora_inicio TIME = NULL,
    @hora_fin TIME = NULL,
    @ubicacion NVARCHAR(300) = NULL,
    @id_instructor INT = NULL,
    @instructor_nombre NVARCHAR(150) = NULL,
    @capacidad INT = 30,
    @imagen NVARCHAR(MAX) = NULL,
    @creado_por INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar tipo
        IF @tipo NOT IN ('Capacitación', 'Taller', 'Simulacro', 'Conferencia')
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Tipo de evento inválido' AS mensaje,
                NULL AS id_evento;
            RETURN;
        END
        
        -- Insertar evento
        INSERT INTO eventos_talleres (
            titulo, tipo, descripcion, fecha, hora_inicio, hora_fin,
            ubicacion, id_instructor, instructor_nombre, capacidad,
            inscritos, estado, imagen, modificado_por
        )
        VALUES (
            @titulo, @tipo, @descripcion, @fecha, @hora_inicio, @hora_fin,
            @ubicacion, @id_instructor, @instructor_nombre, @capacidad,
            0, 'Programado', @imagen, @creado_por
        );
        
        DECLARE @new_id INT = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Evento creado exitosamente' AS mensaje,
            @new_id AS id_evento;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
            ROLLBACK TRANSACTION;
            
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje,
            NULL AS id_evento;
    END CATCH
END
GO

-- SP2.3: ACTUALIZAR EVENTO
CREATE OR ALTER PROCEDURE SP_ACTUALIZAR_EVENTO
    @id INT,
    @titulo NVARCHAR(200) = NULL,
    @tipo NVARCHAR(30) = NULL,
    @descripcion NVARCHAR(MAX) = NULL,
    @fecha DATE = NULL,
    @hora_inicio TIME = NULL,
    @hora_fin TIME = NULL,
    @ubicacion NVARCHAR(300) = NULL,
    @id_instructor INT = NULL,
    @instructor_nombre NVARCHAR(150) = NULL,
    @capacidad INT = NULL,
    @estado NVARCHAR(20) = NULL,
    @imagen NVARCHAR(MAX) = NULL,
    @modificado_por INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el evento existe
        IF NOT EXISTS (SELECT 1 FROM eventos_talleres WHERE id = @id)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Evento no encontrado' AS mensaje;
            RETURN;
        END
        
        -- Validar tipo si se proporciona
        IF @tipo IS NOT NULL AND @tipo NOT IN ('Capacitación', 'Taller', 'Simulacro', 'Conferencia')
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Tipo de evento inválido' AS mensaje;
            RETURN;
        END
        
        -- Validar estado si se proporciona
        IF @estado IS NOT NULL AND @estado NOT IN ('Programado', 'En Curso', 'Finalizado', 'Cancelado')
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Estado inválido' AS mensaje;
            RETURN;
        END
        
        -- Actualizar evento
        UPDATE eventos_talleres
        SET 
            titulo = ISNULL(@titulo, titulo),
            tipo = ISNULL(@tipo, tipo),
            descripcion = ISNULL(@descripcion, descripcion),
            fecha = ISNULL(@fecha, fecha),
            hora_inicio = ISNULL(@hora_inicio, hora_inicio),
            hora_fin = ISNULL(@hora_fin, hora_fin),
            ubicacion = ISNULL(@ubicacion, ubicacion),
            id_instructor = ISNULL(@id_instructor, id_instructor),
            instructor_nombre = ISNULL(@instructor_nombre, instructor_nombre),
            capacidad = ISNULL(@capacidad, capacidad),
            estado = ISNULL(@estado, estado),
            imagen = ISNULL(@imagen, imagen),
            modificado_por = @modificado_por
        WHERE id = @id;
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Evento actualizado exitosamente' AS mensaje,
            @id AS id_evento;
        
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

-- SP2.4: ELIMINAR EVENTO
CREATE OR ALTER PROCEDURE SP_ELIMINAR_EVENTO
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el evento existe
        IF NOT EXISTS (SELECT 1 FROM eventos_talleres WHERE id = @id)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Evento no encontrado' AS mensaje;
            RETURN;
        END
        
        -- Verificar si tiene inscritos
        DECLARE @inscritos INT;
        SELECT @inscritos = inscritos FROM eventos_talleres WHERE id = @id;
        
        IF @inscritos > 0
        BEGIN
            -- Si tiene inscritos, mejor cancelar que eliminar
            UPDATE eventos_talleres
            SET estado = 'Cancelado'
            WHERE id = @id;
            
            COMMIT TRANSACTION;
            
            SELECT 
                'WARNING' AS status,
                'El evento fue cancelado porque tiene inscritos. No se eliminó.' AS mensaje,
                @id AS id_evento;
            RETURN;
        END
        
        -- Eliminar evento
        DELETE FROM eventos_talleres WHERE id = @id;
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Evento eliminado exitosamente' AS mensaje,
            @id AS id_evento;
        
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

-- =============================================
-- SECCIÓN 3: DASHBOARD Y ESTADÍSTICAS
-- =============================================

-- SP3.1: OBTENER KPIs DEL DASHBOARD
CREATE OR ALTER PROCEDURE SP_OBTENER_KPIS_DASHBOARD
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Total de inscritos (todos los miembros activos)
        DECLARE @total_inscritos INT;
        SELECT @total_inscritos = COUNT(*) 
        FROM miembros 
        WHERE estado IN ('Activo', 'Suspendido');
        
        -- Aspirantes (en espera)
        DECLARE @total_aspirantes INT;
        SELECT @total_aspirantes = COUNT(*) 
        FROM miembros 
        WHERE rango LIKE '%ASPIRANTE%' AND estado = 'Activo';
        
        -- Alumnos (BIRED + EMGRA)
        DECLARE @total_alumnos INT;
        DECLARE @alumnos_bired INT;
        DECLARE @alumnos_emgra INT;
        
        SELECT @total_alumnos = COUNT(*) 
        FROM miembros 
        WHERE (rango LIKE '%BIRED%' OR rango LIKE '%EMGRA%') AND estado = 'Activo';
        
        SELECT @alumnos_bired = COUNT(*) 
        FROM miembros 
        WHERE rango LIKE '%BIRED%' AND estado = 'Activo';
        
        SELECT @alumnos_emgra = COUNT(*) 
        FROM miembros 
        WHERE rango LIKE '%EMGRA%' AND estado = 'Activo';
        
        -- Rescatistas activos
        DECLARE @total_rescatistas INT;
        SELECT @total_rescatistas = COUNT(*) 
        FROM miembros 
        WHERE (rango LIKE '%RESCATISTA%' OR rango LIKE '%TÉCNICO%') AND estado = 'Activo';
        
        -- Cursos activos
        DECLARE @cursos_activos INT;
        SELECT @cursos_activos = COUNT(*) 
        FROM cursos 
        WHERE estado = 'Activo';
        
        -- Eventos programados
        DECLARE @eventos_programados INT;
        SELECT @eventos_programados = COUNT(*) 
        FROM eventos_talleres 
        WHERE estado IN ('Programado', 'En Curso');
        
        -- Instructores activos
        DECLARE @instructores_activos INT;
        SELECT @instructores_activos = COUNT(*) 
        FROM instructores 
        WHERE estado = 'Activo';
        
        -- Postulantes nuevos (último mes)
        DECLARE @postulantes_mes INT;
        SELECT @postulantes_mes = COUNT(*) 
        FROM postulantes 
        WHERE fecha_registro >= DATEADD(MONTH, -1, GETDATE());
        
        -- Retornar todos los KPIs
        SELECT 
            @total_inscritos AS total_inscritos,
            @total_aspirantes AS total_aspirantes,
            @total_alumnos AS total_alumnos,
            @alumnos_bired AS alumnos_bired,
            @alumnos_emgra AS alumnos_emgra,
            @total_rescatistas AS total_rescatistas,
            @cursos_activos AS cursos_activos,
            @eventos_programados AS eventos_programados,
            @instructores_activos AS instructores_activos,
            @postulantes_mes AS postulantes_nuevos_mes,
            GETDATE() AS fecha_consulta;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- SP3.2: ESTADÍSTICAS POR PERIODO
CREATE OR ALTER PROCEDURE SP_ESTADISTICAS_PERIODO
    @fecha_inicio DATE,
    @fecha_fin DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Nuevos miembros en el periodo
        DECLARE @nuevos_miembros INT;
        SELECT @nuevos_miembros = COUNT(*) 
        FROM miembros 
        WHERE CAST(fecha_ingreso AS DATE) BETWEEN @fecha_inicio AND @fecha_fin;
        
        -- Postulantes en el periodo
        DECLARE @nuevos_postulantes INT;
        SELECT @nuevos_postulantes = COUNT(*) 
        FROM postulantes 
        WHERE CAST(fecha_registro AS DATE) BETWEEN @fecha_inicio AND @fecha_fin;
        
        -- Eventos realizados en el periodo
        DECLARE @eventos_realizados INT;
        SELECT @eventos_realizados = COUNT(*) 
        FROM eventos_talleres 
        WHERE fecha BETWEEN @fecha_inicio AND @fecha_fin;
        
        -- Cambios de estado en el periodo
        DECLARE @cambios_estado INT;
        SELECT @cambios_estado = COUNT(*) 
        FROM historial_cambios 
        WHERE CAST(fecha_cambio AS DATE) BETWEEN @fecha_inicio AND @fecha_fin
        AND campo_modificado = 'estado';
        
        SELECT 
            @nuevos_miembros AS nuevos_miembros,
            @nuevos_postulantes AS nuevos_postulantes,
            @eventos_realizados AS eventos_realizados,
            @cambios_estado AS cambios_estado,
            @fecha_inicio AS periodo_inicio,
            @fecha_fin AS periodo_fin;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- SP3.3: DISTRIBUCIÓN POR DEPARTAMENTO
CREATE OR ALTER PROCEDURE SP_ESTADISTICAS_POR_DEPARTAMENTO
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            departamento,
            COUNT(*) AS total_miembros,
            SUM(CASE WHEN rango LIKE '%ASPIRANTE%' THEN 1 ELSE 0 END) AS aspirantes,
            SUM(CASE WHEN rango LIKE '%BIRED%' OR rango LIKE '%EMGRA%' THEN 1 ELSE 0 END) AS alumnos,
            SUM(CASE WHEN rango LIKE '%RESCATISTA%' OR rango LIKE '%TÉCNICO%' THEN 1 ELSE 0 END) AS rescatistas
        FROM miembros
        WHERE estado = 'Activo' AND departamento IS NOT NULL
        GROUP BY departamento
        ORDER BY total_miembros DESC;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- =============================================
-- SECCIÓN 4: REPORTES
-- =============================================

-- SP4.1: REPORTE DE MIEMBROS ACTIVOS
CREATE OR ALTER PROCEDURE SP_REPORTE_MIEMBROS_ACTIVOS
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            m.legajo,
            m.nombre,
            m.apellido,
            m.dni,
            DATEDIFF(YEAR, m.fecha_nacimiento, GETDATE()) AS edad,
            m.genero,
            m.email,
            m.telefono,
            m.departamento,
            m.distrito,
            m.rango,
            m.jefatura,
            m.estado,
            m.fecha_ingreso,
            DATEDIFF(DAY, m.fecha_ingreso, GETDATE()) AS dias_en_cgpvp,
            m.cursos_certificaciones
        FROM miembros m
        WHERE m.estado = 'Activo'
        ORDER BY m.rango, m.fecha_ingreso;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- SP4.2: REPORTE DE POSTULANTES PENDIENTES
CREATE OR ALTER PROCEDURE SP_REPORTE_POSTULANTES_PENDIENTES
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            p.id,
            p.nombre,
            p.apellido,
            p.dni,
            DATEDIFF(YEAR, p.fecha_nacimiento, GETDATE()) AS edad,
            p.email,
            p.telefono,
            p.departamento,
            p.distrito,
            p.nivel_educativo,
            p.profesion,
            p.experiencia,
            p.motivacion,
            p.fecha_registro,
            DATEDIFF(DAY, p.fecha_registro, GETDATE()) AS dias_esperando,
            CASE 
                WHEN EXISTS (SELECT 1 FROM miembros WHERE id_postulante = p.id) THEN 'Convertido'
                ELSE 'Pendiente'
            END AS estado_conversion
        FROM postulantes p
        WHERE NOT EXISTS (SELECT 1 FROM miembros WHERE id_postulante = p.id)
        ORDER BY p.fecha_registro DESC;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- SP4.3: REPORTE DE EVENTOS Y ASISTENCIA
CREATE OR ALTER PROCEDURE SP_REPORTE_EVENTOS
    @estado NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            e.id,
            e.titulo,
            e.tipo,
            e.fecha,
            e.hora_inicio,
            e.hora_fin,
            e.ubicacion,
            e.instructor_nombre,
            e.capacidad,
            e.inscritos,
            (e.capacidad - e.inscritos) AS cupos_disponibles,
            CAST(ROUND((CAST(e.inscritos AS FLOAT) / e.capacidad) * 100, 2) AS DECIMAL(5,2)) AS porcentaje_ocupacion,
            e.estado
        FROM eventos_talleres e
        WHERE @estado IS NULL OR e.estado = @estado
        ORDER BY e.fecha DESC;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- SP4.4: HISTORIAL DE CAMBIOS DE UN USUARIO
CREATE OR ALTER PROCEDURE SP_OBTENER_HISTORIAL_USUARIO
    @id_miembro INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            h.id,
            h.campo_modificado,
            h.valor_anterior,
            h.valor_nuevo,
            h.motivo,
            h.fecha_cambio,
            a.nombre_completo AS realizado_por_nombre,
            a.rol AS realizado_por_rol
        FROM historial_cambios h
        LEFT JOIN admin_users a ON h.realizado_por = a.id
        WHERE h.id_miembro = @id_miembro
        ORDER BY h.fecha_cambio DESC;
        
        IF @@ROWCOUNT = 0
        BEGIN
            SELECT 
                'INFO' AS status,
                'No hay historial de cambios para este usuario' AS mensaje;
        END
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- =============================================
-- FIN DEL ARCHIVO SP_ADMIN_PANEL.sql
-- =============================================
