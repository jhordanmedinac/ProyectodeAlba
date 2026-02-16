-- =============================================
-- PROCEDIMIENTOS ALMACENADOS COMPLEMENTARIOS: PERFIL ADMIN
-- Sistema: CGPVP - Cuerpo General de Paramédicos Voluntarios del Perú
-- Descripción: SPs adicionales para gestión de perfil
-- Nota: Complementa a SP_LOGIN_ADMIN.sql existente
-- =============================================

USE DB_CGPVP2;
GO

-- =============================================
-- SP8: OBTENER PERFIL COMPLETO DEL ADMINISTRADOR
-- Descripción: Obtiene todos los datos del perfil (sin password)
-- =============================================
CREATE OR ALTER PROCEDURE SP_OBTENER_PERFIL_ADMIN
    @admin_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validar que existe
        IF NOT EXISTS (SELECT 1 FROM admin_users WHERE id = @admin_id)
        BEGIN
            SELECT 
                'ERROR' AS status,
                'Administrador no encontrado' AS mensaje;
            RETURN;
        END
        
        -- Obtener perfil completo con estadísticas
        SELECT 
            'SUCCESS' AS status,
            id AS admin_id,
            username,
            nombre_completo,
            email,
            rol,
            foto_perfil,
            activo,
            fecha_creacion,
            ultimo_login,
            -- Calcular tiempo desde último login
            CASE 
                WHEN ultimo_login IS NULL THEN 'Nunca'
                WHEN DATEDIFF(MINUTE, ultimo_login, GETDATE()) < 1 THEN 'Ahora mismo'
                WHEN DATEDIFF(MINUTE, ultimo_login, GETDATE()) < 60 THEN 
                    CAST(DATEDIFF(MINUTE, ultimo_login, GETDATE()) AS NVARCHAR) + ' minutos'
                WHEN DATEDIFF(HOUR, ultimo_login, GETDATE()) < 24 THEN 
                    CAST(DATEDIFF(HOUR, ultimo_login, GETDATE()) AS NVARCHAR) + ' horas'
                WHEN DATEDIFF(DAY, ultimo_login, GETDATE()) = 1 THEN 'Ayer'
                WHEN DATEDIFF(DAY, ultimo_login, GETDATE()) <= 7 THEN 
                    CAST(DATEDIFF(DAY, ultimo_login, GETDATE()) AS NVARCHAR) + ' días'
                ELSE FORMAT(ultimo_login, 'dd/MM/yyyy HH:mm')
            END AS ultimo_login_texto,
            -- Antigüedad en el sistema
            DATEDIFF(DAY, fecha_creacion, GETDATE()) AS dias_desde_creacion,
            CASE 
                WHEN DATEDIFF(DAY, fecha_creacion, GETDATE()) < 30 THEN 'Nuevo'
                WHEN DATEDIFF(DAY, fecha_creacion, GETDATE()) < 365 THEN 
                    CAST(DATEDIFF(MONTH, fecha_creacion, GETDATE()) AS NVARCHAR) + ' meses'
                ELSE CAST(DATEDIFF(YEAR, fecha_creacion, GETDATE()) AS NVARCHAR) + ' años'
            END AS antiguedad_texto
        FROM admin_users
        WHERE id = @admin_id;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- =============================================
-- SP9: ACTUALIZAR SOLO FOTO DE PERFIL
-- Descripción: Actualiza únicamente la foto del admin
-- =============================================
CREATE OR ALTER PROCEDURE SP_ACTUALIZAR_FOTO_ADMIN
    @admin_id INT,
    @foto_perfil NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que existe
        IF NOT EXISTS (SELECT 1 FROM admin_users WHERE id = @admin_id)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 
                'ERROR' AS status,
                'Administrador no encontrado' AS mensaje;
            RETURN;
        END
        
        -- Actualizar foto (puede ser NULL para eliminar)
        UPDATE admin_users
        SET foto_perfil = @foto_perfil
        WHERE id = @admin_id;
        
        COMMIT TRANSACTION;
        
        SELECT 
            'SUCCESS' AS status,
            CASE 
                WHEN @foto_perfil IS NULL THEN 'Foto de perfil eliminada correctamente'
                ELSE 'Foto de perfil actualizada correctamente'
            END AS mensaje,
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
-- SP10: VALIDAR DISPONIBILIDAD DE EMAIL
-- Descripción: Verifica si un email está disponible
-- =============================================
CREATE OR ALTER PROCEDURE SP_VALIDAR_EMAIL_DISPONIBLE
    @email NVARCHAR(100),
    @admin_id INT = NULL  -- NULL para nuevo, o ID para excluir en edición
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DECLARE @existe BIT = 0;
        
        -- Validar formato básico
        IF @email NOT LIKE '%_@__%.__%'
        BEGIN
            SELECT 
                'ERROR' AS status,
                1 AS formato_invalido,
                'Formato de email inválido' AS mensaje;
            RETURN;
        END
        
        -- Verificar si existe (excluyendo el propio admin si aplica)
        IF EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = @email 
            AND (@admin_id IS NULL OR id != @admin_id)
        )
        BEGIN
            SET @existe = 1;
        END
        
        SELECT 
            CASE WHEN @existe = 1 THEN 'ERROR' ELSE 'SUCCESS' END AS status,
            @existe AS existe,
            0 AS formato_invalido,
            CASE 
                WHEN @existe = 1 THEN 'El email ya está en uso'
                ELSE 'Email disponible'
            END AS mensaje;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO

-- =============================================
-- SP11: VALIDAR DISPONIBILIDAD DE USERNAME
-- Descripción: Verifica si un username está disponible
-- =============================================
CREATE OR ALTER PROCEDURE SP_VALIDAR_USERNAME_DISPONIBLE
    @username NVARCHAR(50),
    @admin_id INT = NULL  -- NULL para nuevo, o ID para excluir en edición
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DECLARE @existe BIT = 0;
        
        -- Verificar si existe (excluyendo el propio admin si aplica)
        IF EXISTS (
            SELECT 1 FROM admin_users 
            WHERE username = @username 
            AND (@admin_id IS NULL OR id != @admin_id)
        )
        BEGIN
            SET @existe = 1;
        END
        
        SELECT 
            CASE WHEN @existe = 1 THEN 'ERROR' ELSE 'SUCCESS' END AS status,
            @existe AS existe,
            CASE 
                WHEN @existe = 1 THEN 'El nombre de usuario ya está en uso'
                ELSE 'Nombre de usuario disponible'
            END AS mensaje;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'ERROR' AS status,
            ERROR_MESSAGE() AS mensaje;
    END CATCH
END
GO
