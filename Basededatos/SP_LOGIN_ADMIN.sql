-- =============================================
-- PROCEDIMIENTOS ALMACENADOS: LOGIN Y AUTENTICACIÓN
-- Sistema: CGPVP - Cuerpo General de Paramédicos Voluntarios del Perú
-- Descripción: Gestión de autenticación y sesiones de administradores
-- =============================================

USE DB_CGPVP2;
GO

-- =============================================
-- SP1: VALIDAR LOGIN DE ADMINISTRADOR
-- Descripción: Valida credenciales y retorna datos del admin
-- =============================================
CREATE OR ALTER PROCEDURE SP_VALIDAR_LOGIN_ADMIN
    @email NVARCHAR(100),
    @password NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    DECLARE @admin_id INT;
    DECLARE @password_hash NVARCHAR(255);
    DECLARE @activo BIT;
    
    BEGIN TRY
        -- Buscar admin por email
        SELECT 
            @admin_id = id,
            @password_hash = password_hash,
            @activo = activo
        FROM admin_users
        WHERE email = @email;
        
        -- Validar si existe el usuario
        IF @admin_id IS NULL
        BEGIN
            SELECT 
                'ERROR' AS status,
                'Usuario no encontrado' AS mensaje,
                NULL AS admin_id,
                NULL AS username,
                NULL AS nombre_completo,
                NULL AS email,
                NULL AS rol,
                NULL AS foto_perfil;
            RETURN;
        END
        
        -- Validar si está activo
        IF @activo = 0
        BEGIN
            SELECT 
                'ERROR' AS status,
                'Usuario desactivado. Contacta al administrador' AS mensaje,
                NULL AS admin_id,
                NULL AS username,
                NULL AS nombre_completo,
                NULL AS email,
                NULL AS rol,
                NULL AS foto_perfil;
            RETURN;
        END
        
        -- Validar contraseña (en producción usar HASHBYTES)
        -- Por ahora comparación directa para desarrollo
        IF @password_hash != @password
        BEGIN
            SELECT 
                'ERROR' AS status,
                'Contraseña incorrecta' AS mensaje,
                NULL AS admin_id,
                NULL AS username,
                NULL AS nombre_completo,
                NULL AS email,
                NULL AS rol,
                NULL AS foto_perfil;
            RETURN;
        END
        
        -- Actualizar último login
        UPDATE admin_users
        SET ultimo_login = SYSUTCDATETIME()
        WHERE id = @admin_id;
        
        -- Login exitoso
        SELECT 
            'SUCCESS' AS status,
            'Login exitoso' AS mensaje,
            id AS admin_id,
            username,
            nombre_completo,
            email,
            rol,
            foto_perfil,
            ultimo_login
        FROM admin_users
        WHERE id = @admin_id;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje,
            NULL AS admin_id,
            NULL AS username,
            NULL AS nombre_completo,
            NULL AS email,
            NULL AS rol,
            NULL AS foto_perfil;
    END CATCH
END
GO

-- =============================================
-- SP2: CREAR NUEVO ADMINISTRADOR
-- Descripción: Registra un nuevo usuario administrador
-- =============================================
CREATE OR ALTER PROCEDURE SP_CREAR_ADMIN
    @username NVARCHAR(50),
    @password NVARCHAR(255),
    @nombre_completo NVARCHAR(100),
    @email NVARCHAR(100),
    @rol NVARCHAR(20) = 'Editor',
    @foto_perfil NVARCHAR(MAX) = NULL,
    @creado_por INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar username único
        IF EXISTS (SELECT 1 FROM admin_users WHERE username = @username)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'El nombre de usuario ya existe' AS mensaje,
                NULL AS admin_id;
            RETURN;
        END
        
        -- Validar email único
        IF EXISTS (SELECT 1 FROM admin_users WHERE email = @email)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'El email ya está registrado' AS mensaje,
                NULL AS admin_id;
            RETURN;
        END
        
        -- Validar rol
        IF @rol NOT IN ('Super Admin', 'Editor', 'Gestor')
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Rol inválido. Debe ser: Super Admin, Editor o Gestor' AS mensaje,
                NULL AS admin_id;
            RETURN;
        END
        
        -- En producción: hashear contraseña con HASHBYTES
        -- Por ahora guardamos directo para desarrollo
        DECLARE @password_hash_final NVARCHAR(255) = @password;
        
        -- Insertar nuevo admin
        INSERT INTO admin_users (
            username,
            password_hash,
            nombre_completo,
            email,
            rol,
            foto_perfil,
            activo
        )
        VALUES (
            @username,
            @password_hash_final,
            @nombre_completo,
            @email,
            @rol,
            @foto_perfil,
            1
        );
        
        DECLARE @new_id INT = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Administrador creado exitosamente' AS mensaje,
            @new_id AS admin_id,
            @username AS username,
            @nombre_completo AS nombre_completo,
            @email AS email,
            @rol AS rol;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
            ROLLBACK TRANSACTION;
            
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje,
            NULL AS admin_id;
    END CATCH
END
GO

-- =============================================
-- SP3: ACTUALIZAR PERFIL DE ADMINISTRADOR
-- Descripción: Permite al admin actualizar su propio perfil
-- =============================================
CREATE OR ALTER PROCEDURE SP_ACTUALIZAR_PERFIL_ADMIN
    @admin_id INT,
    @nombre_completo NVARCHAR(100) = NULL,
    @email NVARCHAR(100) = NULL,
    @foto_perfil NVARCHAR(MAX) = NULL,
    @password_actual NVARCHAR(255) = NULL,
    @password_nuevo NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el admin existe
        IF NOT EXISTS (SELECT 1 FROM admin_users WHERE id = @admin_id)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Administrador no encontrado' AS mensaje;
            RETURN;
        END
        
        -- Si quiere cambiar email, validar que no esté en uso
        IF @email IS NOT NULL
        BEGIN
            IF EXISTS (SELECT 1 FROM admin_users WHERE email = @email AND id != @admin_id)
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT 
                    'ERROR' AS status,
                    'El email ya está en uso por otro administrador' AS mensaje;
                RETURN;
            END
        END
        
        -- Si quiere cambiar contraseña, validar la actual
        IF @password_nuevo IS NOT NULL
        BEGIN
            DECLARE @password_hash_actual NVARCHAR(255);
            SELECT @password_hash_actual = password_hash
            FROM admin_users
            WHERE id = @admin_id;
            
            IF @password_hash_actual != @password_actual
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT 
                    'ERROR' AS status,
                    'La contraseña actual es incorrecta' AS mensaje;
                RETURN;
            END
            
            -- Actualizar contraseña
            UPDATE admin_users
            SET password_hash = @password_nuevo
            WHERE id = @admin_id;
        END
        
        -- Actualizar datos del perfil
        UPDATE admin_users
        SET 
            nombre_completo = ISNULL(@nombre_completo, nombre_completo),
            email = ISNULL(@email, email),
            foto_perfil = ISNULL(@foto_perfil, foto_perfil)
        WHERE id = @admin_id;
        
        COMMIT TRANSACTION;
        
        -- Retornar datos actualizados
        SELECT 
            'SUCCESS' AS status,
            'Perfil actualizado exitosamente' AS mensaje,
            id AS admin_id,
            username,
            nombre_completo,
            email,
            rol,
            foto_perfil
        FROM admin_users
        WHERE id = @admin_id;
        
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
-- SP4: CAMBIAR CONTRASEÑA DE ADMINISTRADOR
-- Descripción: Permite cambiar la contraseña (por Super Admin)
-- =============================================
CREATE OR ALTER PROCEDURE SP_CAMBIAR_PASSWORD_ADMIN
    @admin_id INT,
    @password_nuevo NVARCHAR(255),
    @modificado_por INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el admin que modifica es Super Admin
        DECLARE @rol_modificador NVARCHAR(20);
        SELECT @rol_modificador = rol
        FROM admin_users
        WHERE id = @modificado_por;
        
        IF @rol_modificador != 'Super Admin'
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Solo Super Admin puede cambiar contraseñas de otros usuarios' AS mensaje;
            RETURN;
        END
        
        -- Validar que el admin objetivo existe
        IF NOT EXISTS (SELECT 1 FROM admin_users WHERE id = @admin_id)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Administrador no encontrado' AS mensaje;
            RETURN;
        END
        
        -- Actualizar contraseña
        UPDATE admin_users
        SET password_hash = @password_nuevo
        WHERE id = @admin_id;
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            'Contraseña actualizada exitosamente' AS mensaje,
            @admin_id AS admin_id;
        
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
-- SP5: LISTAR ADMINISTRADORES
-- Descripción: Lista todos los administradores del sistema
-- =============================================
CREATE OR ALTER PROCEDURE SP_LISTAR_ADMINS
    @solo_activos BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            id AS admin_id,
            username,
            nombre_completo,
            email,
            rol,
            foto_perfil,
            activo,
            fecha_creacion,
            ultimo_login
        FROM admin_users
        WHERE (@solo_activos = 0 OR activo = 1)
        ORDER BY 
            CASE 
                WHEN rol = 'Super Admin' THEN 1
                WHEN rol = 'Editor' THEN 2
                WHEN rol = 'Gestor' THEN 3
            END,
            nombre_completo;
            
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- =============================================
-- SP6: ACTIVAR/DESACTIVAR ADMINISTRADOR
-- Descripción: Cambia el estado activo de un admin
-- =============================================
CREATE OR ALTER PROCEDURE SP_CAMBIAR_ESTADO_ADMIN
    @admin_id INT,
    @activar BIT,
    @modificado_por INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el modificador es Super Admin
        DECLARE @rol_modificador NVARCHAR(20);
        SELECT @rol_modificador = rol
        FROM admin_users
        WHERE id = @modificado_por;
        
        IF @rol_modificador != 'Super Admin'
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Solo Super Admin puede activar/desactivar administradores' AS mensaje;
            RETURN;
        END
        
        -- No permitir desactivarse a sí mismo
        IF @admin_id = @modificado_por AND @activar = 0
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'No puedes desactivar tu propia cuenta' AS mensaje;
            RETURN;
        END
        
        -- Validar que el admin existe
        IF NOT EXISTS (SELECT 1 FROM admin_users WHERE id = @admin_id)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Administrador no encontrado' AS mensaje;
            RETURN;
        END
        
        -- Actualizar estado
        UPDATE admin_users
        SET activo = @activar
        WHERE id = @admin_id;
        
        COMMIT TRANSACTION;
        
        DECLARE @accion NVARCHAR(20) = CASE WHEN @activar = 1 THEN 'activado' ELSE 'desactivado' END;
        
        SELECT 
            'SUCCESS' AS status,
            'Administrador ' + @accion + ' exitosamente' AS mensaje,
            @admin_id AS admin_id,
            @activar AS nuevo_estado;
        
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
-- SP7: VERIFICAR SESIÓN
-- Descripción: Valida si una sesión de admin es válida
-- =============================================
CREATE OR ALTER PROCEDURE SP_VERIFICAR_SESION_ADMIN
    @admin_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verificar si el admin existe y está activo
        IF EXISTS (
            SELECT 1 
            FROM admin_users 
            WHERE id = @admin_id 
            AND activo = 1
        )
        BEGIN
            SELECT 
                'VALID' AS status,
                'Sesión válida' AS mensaje,
                id AS admin_id,
                username,
                nombre_completo,
                email,
                rol,
                foto_perfil
            FROM admin_users
            WHERE id = @admin_id;
        END
        ELSE
        BEGIN
            SELECT 
                'INVALID' AS status,
                'Sesión inválida o usuario desactivado' AS mensaje,
                NULL AS admin_id;
        END
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje,
            NULL AS admin_id;
    END CATCH
END
GO

-- =============================================
-- DATOS INICIALES: ADMIN POR DEFECTO
-- =============================================
-- Crear un admin por defecto si no existe ninguno
IF NOT EXISTS (SELECT 1 FROM admin_users)
BEGIN
    INSERT INTO admin_users (
        username,
        password_hash,
        nombre_completo,
        email,
        rol,
        foto_perfil,
        activo
    )
    VALUES (
        'admin',
        'admin123',  -- En producción usar hash: CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', 'admin123'), 2)
        'Administrador CGPVP',
        'admin@cgpvp.pe',
        'Super Admin',
        NULL,
        1
    );
    
    PRINT 'Usuario admin creado exitosamente';
    PRINT 'Usuario: admin@cgpvp.pe';
    PRINT 'Contraseña: admin123';
END
GO

-- =============================================
-- FIN DEL ARCHIVO SP_LOGIN_ADMIN.sql
-- =============================================
