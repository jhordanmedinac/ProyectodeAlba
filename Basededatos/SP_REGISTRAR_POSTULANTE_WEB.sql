-- =============================================
-- PROCEDIMIENTO ALMACENADO: REGISTRO DESDE FORMULARIO WEB
-- Sistema: CGPVP - Cuerpo General de Paramédicos Voluntarios del Perú
-- Descripción: Registra postulantes desde el formulario público web

USE DB_CGPVP2;
GO

-- =============================================
-- SP: REGISTRAR POSTULANTE DESDE FORMULARIO WEB
-- Validaciones completas incluidas
-- =============================================

CREATE OR ALTER PROCEDURE SP_REGISTRAR_POSTULANTE_WEB
    -- INFORMACIÓN PERSONAL
    @nombre NVARCHAR(50),
    @apellido NVARCHAR(50),
    @dni CHAR(8),
    @fecha_nacimiento DATE,
    @genero NVARCHAR(10),
    
    -- INFORMACIÓN DE CONTACTO
    @email NVARCHAR(100),
    @telefono CHAR(9),
    @direccion NVARCHAR(200),
    @departamento NVARCHAR(50),
    @distrito NVARCHAR(50),
    
    -- INFORMACIÓN ACADÉMICA Y PROFESIONAL
    @nivel_educativo NVARCHAR(20),
    @profesion NVARCHAR(100),
    
    -- MOTIVACIÓN Y EXPERIENCIA
    @motivacion NVARCHAR(500),
    @experiencia BIT = 0,
    @experiencia_detalle NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    -- Variables para validaciones
    DECLARE @edad INT;
    DECLARE @id_nuevo INT;
    DECLARE @mensaje_error NVARCHAR(500);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- =========================================
        -- VALIDACIONES PREVIAS
        -- =========================================
        
        -- 1. Validar DNI único
        IF EXISTS (SELECT 1 FROM postulantes WHERE dni = @dni)
        BEGIN
            SET @mensaje_error = 'El DNI ' + @dni + ' ya se encuentra registrado. Si ya te postulaste anteriormente, espera la respuesta del equipo.';
            RAISERROR(@mensaje_error, 16, 1);
            RETURN;
        END
        
        -- 2. Validar Email único
        IF EXISTS (SELECT 1 FROM postulantes WHERE email = @email)
        BEGIN
            SET @mensaje_error = 'El correo electrónico ' + @email + ' ya está registrado. Usa otro correo o recupera tu postulación anterior.';
            RAISERROR(@mensaje_error, 16, 1);
            RETURN;
        END
        
        -- 3. Validar edad mínima (13 años según el formulario)
        SET @edad = DATEDIFF(YEAR, @fecha_nacimiento, GETDATE()) - 
                    CASE 
                        WHEN MONTH(@fecha_nacimiento) > MONTH(GETDATE()) OR 
                             (MONTH(@fecha_nacimiento) = MONTH(GETDATE()) AND DAY(@fecha_nacimiento) > DAY(GETDATE()))
                        THEN 1 
                        ELSE 0 
                    END;
        
        IF @edad < 13
        BEGIN
            RAISERROR('Debes tener al menos 13 años para postular al CGPVP.', 16, 1);
            RETURN;
        END
        
        -- 4. Validar formato DNI
        IF LEN(@dni) != 8 OR @dni NOT LIKE '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
        BEGIN
            RAISERROR('El DNI debe contener exactamente 8 dígitos numéricos.', 16, 1);
            RETURN;
        END
        
        -- 5. Validar formato teléfono
        IF LEN(@telefono) != 9 OR @telefono NOT LIKE '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
        BEGIN
            RAISERROR('El teléfono debe contener exactamente 9 dígitos.', 16, 1);
            RETURN;
        END
        
        -- 6. Validar formato email
        IF @email NOT LIKE '%_@__%.__%'
        BEGIN
            RAISERROR('Formato de correo electrónico inválido.', 16, 1);
            RETURN;
        END
        
        -- 7. Validar valores de género
        IF @genero NOT IN ('masculino', 'femenino', 'otro')
        BEGIN
            RAISERROR('El género debe ser: masculino, femenino u otro.', 16, 1);
            RETURN;
        END
        
        -- 8. Validar nivel educativo
        IF @nivel_educativo NOT IN ('sin estudios', 'secundaria', 'tecnico', 'universitario', 'postgrado')
        BEGIN
            RAISERROR('Nivel educativo inválido.', 16, 1);
            RETURN;
        END
        
        -- 9. Validar longitud de campos
        IF LEN(LTRIM(RTRIM(@nombre))) < 2
        BEGIN
            RAISERROR('El nombre debe tener al menos 2 caracteres.', 16, 1);
            RETURN;
        END
        
        IF LEN(LTRIM(RTRIM(@apellido))) < 2
        BEGIN
            RAISERROR('El apellido debe tener al menos 2 caracteres.', 16, 1);
            RETURN;
        END
        
        IF LEN(LTRIM(RTRIM(@motivacion))) < 10
        BEGIN
            RAISERROR('La motivación debe tener al menos 10 caracteres.', 16, 1);
            RETURN;
        END
        
        -- 10. Si tiene experiencia, debe detallarla
        IF @experiencia = 1 AND (@experiencia_detalle IS NULL OR LEN(LTRIM(RTRIM(@experiencia_detalle))) < 10)
        BEGIN
            RAISERROR('Si tienes experiencia previa, debes describirla (mínimo 10 caracteres).', 16, 1);
            RETURN;
        END
        
        -- =========================================
        -- INSERCIÓN DE DATOS
        -- =========================================
        
        -- Limpiar espacios en blanco
        SET @nombre = LTRIM(RTRIM(@nombre));
        SET @apellido = LTRIM(RTRIM(@apellido));
        SET @email = LOWER(LTRIM(RTRIM(@email)));
        SET @direccion = LTRIM(RTRIM(@direccion));
        SET @profesion = LTRIM(RTRIM(@profesion));
        SET @motivacion = LTRIM(RTRIM(@motivacion));
        
        -- Agregar experiencia detallada a la motivación si existe
        IF @experiencia = 1 AND @experiencia_detalle IS NOT NULL
        BEGIN
            SET @motivacion = @motivacion + CHAR(13) + CHAR(10) + 
                             '--- EXPERIENCIA PREVIA ---' + CHAR(13) + CHAR(10) + 
                             LTRIM(RTRIM(@experiencia_detalle));
        END
        
        -- Insertar postulante
        INSERT INTO postulantes (
            nombre, 
            apellido, 
            dni, 
            fecha_nacimiento, 
            genero, 
            email, 
            telefono,
            direccion, 
            departamento, 
            distrito, 
            nivel_educativo, 
            profesion, 
            motivacion, 
            experiencia
        )
        VALUES (
            @nombre,
            @apellido,
            @dni,
            @fecha_nacimiento,
            @genero,
            @email,
            @telefono,
            @direccion,
            @departamento,
            @distrito,
            @nivel_educativo,
            @profesion,
            @motivacion,
            @experiencia
        );
        
        -- Obtener ID del nuevo registro
        SET @id_nuevo = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        -- =========================================
        -- RESPUESTA EXITOSA
        -- =========================================
        SELECT 
            'SUCCESS' AS status,
            @id_nuevo AS id_postulante,
            @nombre + ' ' + @apellido AS nombre_completo,
            @dni AS dni,
            @email AS email,
            GETDATE() AS fecha_registro,
            @edad AS edad,
            'Tu postulación ha sido registrada exitosamente. Te contactaremos pronto.' AS mensaje
        
    END TRY
    BEGIN CATCH
        -- Rollback en caso de error
        IF @@TRANCOUNT > 0 
            ROLLBACK TRANSACTION;
        
        -- Capturar detalles del error
        DECLARE @error_message NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @error_severity INT = ERROR_SEVERITY();
        DECLARE @error_state INT = ERROR_STATE();
        DECLARE @error_number INT = ERROR_NUMBER();
        
        -- Retornar error estructurado
        SELECT 
            'ERROR' AS status,
            @error_number AS codigo_error,
            @error_message AS mensaje_error,
            @error_severity AS severidad,
            NULL AS id_postulante,
            NULL AS nombre_completo,
            @dni AS dni_intentado,
            @email AS email_intentado;
        
        -- Re-lanzar el error para logs del servidor
        RAISERROR(@error_message, @error_severity, @error_state);
        
    END CATCH
END
GO


