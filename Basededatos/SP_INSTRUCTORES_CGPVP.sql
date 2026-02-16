-- =============================================
-- STORED PROCEDURES - INSTRUCTORES
-- Cuerpo General de Paramédicos Voluntarios del Perú
-- Sistema de Gestión de Instructores
-- =============================================

USE DB_CGPVP2;
GO

CREATE PROCEDURE SP_ObtenerTodosInstructores
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id,
        nombre_completo,
        especialidad,
        rango,
        experiencia_anios,
        certificaciones,
        email,
        foto,
        bio
    FROM instructores
    WHERE estado = 'Activo'
    ORDER BY experiencia_anios DESC;
END;
GO

CREATE PROCEDURE SP_ObtenerInstructorPorId
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id,
        nombre_completo,
        rango,
        experiencia_anios,
        certificaciones,
        email,
        foto,
        bio
    FROM instructores
    WHERE id = @id AND estado = 'Activo';
END;
GO

CREATE PROCEDURE SP_BuscarInstructores
    @termino NVARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id,
        nombre_completo,
        especialidad,
        rango,
        experiencia_anios,
        certificaciones,
        email,
        foto,
        bio
    FROM instructores
    WHERE estado = 'Activo'
        AND (
            nombre_completo LIKE '%' + @termino + '%'
            OR rango LIKE '%' + @termino + '%'
            OR certificaciones LIKE '%' + @termino + '%'
        )
    ORDER BY experiencia_anios DESC;
END;
GO

CREATE PROCEDURE SP_FiltrarPorEspecialidad
    @especialidad NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id,
        nombre_completo,
        especialidad,
        rango,
        experiencia_anios,
        certificaciones,
        email,
        foto,
        bio
    FROM instructores
    WHERE estado = 'Activo'
        AND (@especialidad IS NULL OR especialidad = @especialidad)
    ORDER BY experiencia_anios DESC;
END;
GO