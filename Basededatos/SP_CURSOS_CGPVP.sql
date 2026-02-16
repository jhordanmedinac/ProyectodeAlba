-- =============================================
-- STORED PROCEDURES PARA CURSOS - SOLO WEB PÚBLICA
-- Sistema: CGPVP2
-- Descripción: SPs optimizados para el frontend público
-- =============================================
USE [DB_CGPVP2]; 
GO

-- =============================================
-- SP 1: LISTAR CURSOS PARA WEB PÚBLICA
-- Endpoint: GET /api/cursos/activos
-- =============================================
IF OBJECT_ID('dbo.SP_LISTAR_CURSOSWEB', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_LISTAR_CURSOSWEB;
GO

CREATE PROCEDURE SP_LISTAR_CURSOSWEB
    @categoria NVARCHAR(30) = NULL,
    @modalidad NVARCHAR(20) = NULL,
    @estado NVARCHAR(20) = NULL,
    @busqueda NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.id AS id_curso,
        c.titulo,
        c.categoria,
        c.duracion,
        c.modalidad,
        c.fecha_inicio,
        c.fecha_fin,
        c.precio,
        c.cupos,
        (c.cupos - c.inscritos) AS cupos_disponibles,
        c.estado,
        c.imagen,
        c.direccion,
        -- Información del instructor
        i.nombre_completo AS instructor,
        i.id AS id_instructor
    FROM 
        cursos c
    LEFT JOIN 
        instructores i ON c.id_instructor = i.id
    WHERE 
        -- Filtro por categoría
        (@categoria IS NULL OR c.categoria = @categoria)
        -- Filtro por modalidad
        AND (@modalidad IS NULL OR c.modalidad = @modalidad)
        -- Filtro por estado
        AND (@estado IS NULL OR c.estado = @estado)
        -- Filtro por búsqueda en título
        AND (@busqueda IS NULL OR c.titulo LIKE '%' + @busqueda + '%')
    ORDER BY 
        c.fecha_inicio ASC;
END;
GO

-- =============================================
-- SP 2: OBTENER DETALLE DE UN CURSO PARA WEB PÚBLICA
-- Endpoint: GET /api/cursos/{id}
-- =============================================
IF OBJECT_ID('dbo.SP_OBTENER_CURSOWEB', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_OBTENER_CURSOWEB;
GO

CREATE PROCEDURE SP_OBTENER_CURSOWEB
    @id_curso INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        -- Información del curso
        c.id AS id_curso,
        c.titulo,
        c.categoria,
        c.duracion,
        c.modalidad,
        c.descripcion,
        c.requisitos,
        c.cupos,
        c.inscritos,
        (c.cupos - c.inscritos) AS cupos_disponibles,
        c.precio,
        c.direccion,
        c.imagen,
        c.estado,
        c.fecha_inicio,
        c.fecha_fin,
        c.fecha_creacion,
        -- Información del instructor
        i.id AS id_instructor,
        i.nombre_completo AS instructor,
        i.especialidad AS instructor_especialidad,
        i.experiencia_anios AS instructor_experiencia,
        i.certificaciones AS instructor_certificaciones,
        i.email AS instructor_email,
        i.telefono AS instructor_telefono,
        i.foto AS instructor_foto,
        i.bio AS instructor_bio
    FROM 
        cursos c
    LEFT JOIN 
        instructores i ON c.id_instructor = i.id
    WHERE 
        c.id = @id_curso;
END;
GO
IF OBJECT_ID('dbo.SP_PROXIMOS_EVENTOS_WEB', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_PROXIMOS_EVENTOS_WEB;
GO

CREATE PROCEDURE dbo.SP_PROXIMOS_EVENTOS_WEB
    @Limite INT = 3  -- Número de eventos a mostrar (por defecto 3)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Obtener eventos futuros ordenados por fecha más cercana
    SELECT TOP (@Limite)
        id,
        titulo,
        tipo,
        descripcion,
        fecha,
        hora_inicio,
        hora_fin,
        ubicacion,
        COALESCE(instructor_nombre, 'Por confirmar') AS instructor,
        capacidad,
        inscritos,
        (capacidad - inscritos) AS cupos_disponibles,
        estado,
        imagen,
        -- Campos adicionales útiles para el frontend
        CASE 
            WHEN tipo = 'Taller' THEN 'fa-tools'
            WHEN tipo = 'Simulacro' THEN 'fa-exclamation-triangle'
            WHEN tipo = 'Conferencia' THEN 'fa-microphone'
            ELSE 'fa-calendar-check'
        END AS icono,
        CASE 
            WHEN ubicacion LIKE '%virtual%' OR ubicacion LIKE '%zoom%' OR ubicacion LIKE '%meet%' THEN 'Virtual'
            ELSE 'Presencial'
        END AS modalidad
    FROM 
        eventos_talleres
    WHERE 
        estado IN ('Programado', 'En Curso')  -- Solo eventos activos
        AND fecha >= CAST(GETDATE() AS DATE)  -- Solo futuros o de hoy
        AND (capacidad - inscritos) > 0       -- Solo con cupos disponibles
    ORDER BY 
        fecha ASC,
        hora_inicio ASC;
        
END;
GO

-- =============================================
-- ✅ STORED PROCEDURES CREADOS EXITOSAMENTE
-- =============================================
PRINT '==============================================';
PRINT '✅ SPs PARA WEB PÚBLICA CREADOS';
PRINT '==============================================';
PRINT '';
PRINT '📋 SPs Disponibles:';
PRINT '1. SP_LISTAR_CURSOSWEB   - Lista cursos con filtros';
PRINT '2. SP_OBTENER_CURSOWEB   - Detalle completo de un curso';
PRINT '';
PRINT '🧪 Pruebas:';
PRINT '';
PRINT '-- Listar todos los cursos activos:';
PRINT 'EXEC SP_LISTAR_CURSOSWEB @estado = ''Activo'';';
PRINT '';
PRINT '-- Listar cursos Básicos Presenciales:';
PRINT 'EXEC SP_LISTAR_CURSOSWEB @categoria = ''Básico'', @modalidad = ''Presencial'', @estado = ''Activo'';';
PRINT '';
PRINT '-- Obtener detalle del curso 1:';
PRINT 'EXEC SP_OBTENER_CURSOWEB @id_curso = 1;';
PRINT '';
PRINT '-- Buscar por texto:';
PRINT 'EXEC SP_LISTAR_CURSOSWEB @busqueda = ''Primeros Auxilios'', @estado = ''Activo'';';
PRINT '';
PRINT '==============================================';
GO

EXEC SP_LISTAR_CURSOSWEB @estado = 'Activo';
EXEC SP_OBTENER_CURSOWEB @id_curso = 3;

EXEC SP_LISTAR_CURSOSWEB