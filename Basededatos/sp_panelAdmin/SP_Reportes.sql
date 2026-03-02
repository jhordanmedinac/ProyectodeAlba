-- =============================================
-- STORED PROCEDURES - REPORTES Y ESTADÍSTICAS
-- DB_CGPVP2
-- =============================================

USE DB_CGPVP2;
GO

-- =============================================
-- SP_REPORTE_MIEMBROS_ESTADO
-- Devuelve el conteo de miembros agrupado por estado
-- Usado en: Card "Miembros por Estado"
-- =============================================
CREATE OR ALTER PROCEDURE SP_REPORTE_MIEMBROS_ESTADO
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        estado,
        COUNT(*) AS total,
        CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL(5,2)) AS porcentaje
    FROM miembros
    GROUP BY estado
    ORDER BY 
        CASE estado
            WHEN 'Activo'     THEN 1
            WHEN 'Suspendido' THEN 2
            WHEN 'Baja'       THEN 3
            ELSE 4
        END;
END
GO

-- =============================================
-- SP_REPORTE_POSTULANTES_PERIODO
-- Devuelve postulantes filtrados por día, mes o año
-- @tipo_periodo: 'dia' | 'mes' | 'anio'
-- @valor:
--   - dia  → 'YYYY-MM-DD'  (ej: '2025-03-15')
--   - mes  → 'YYYY-MM'     (ej: '2025-03')
--   - anio → 'YYYY'        (ej: '2025')
-- Usado en: Card "Postulantes por Período"
-- =============================================
CREATE OR ALTER PROCEDURE SP_REPORTE_POSTULANTES_PERIODO
    @tipo_periodo NVARCHAR(10),  -- 'dia' | 'mes' | 'anio'
    @valor        NVARCHAR(10)   -- 'YYYY-MM-DD' | 'YYYY-MM' | 'YYYY'
AS
BEGIN
    SET NOCOUNT ON;

    -- Resumen: total del período
    SELECT
        @tipo_periodo AS tipo_periodo,
        @valor        AS periodo,
        COUNT(*)      AS total_postulantes
    FROM postulantes
    WHERE
        (@tipo_periodo = 'dia'  AND CAST(fecha_registro AS DATE) = TRY_CAST(@valor AS DATE))
     OR (@tipo_periodo = 'mes'  AND YEAR(fecha_registro)  = LEFT(@valor, 4)
                                AND MONTH(fecha_registro) = RIGHT(@valor, 2))
     OR (@tipo_periodo = 'anio' AND YEAR(fecha_registro)  = TRY_CAST(@valor AS INT));

    -- Detalle: listado de postulantes del período
    SELECT
        id,
        CONCAT(apellido, ' ', nombre) AS nombre_completo,
        dni,
        email,
        telefono,
        departamento,
        distrito,
        profesion,
        nivel_educativo,
        CONVERT(NVARCHAR(10), fecha_registro, 23) AS fecha_registro
    FROM postulantes
    WHERE
        (@tipo_periodo = 'dia'  AND CAST(fecha_registro AS DATE) = TRY_CAST(@valor AS DATE))
     OR (@tipo_periodo = 'mes'  AND YEAR(fecha_registro)  = LEFT(@valor, 4)
                                AND MONTH(fecha_registro) = RIGHT(@valor, 2))
     OR (@tipo_periodo = 'anio' AND YEAR(fecha_registro)  = TRY_CAST(@valor AS INT))
    ORDER BY fecha_registro DESC;
END
GO

-- =============================================
-- SP_REPORTE_POSTULANTES_DEPARTAMENTO
-- Devuelve conteo de postulantes agrupado por departamento
-- Usado en: Card "Postulantes por Departamento"
-- =============================================
CREATE OR ALTER PROCEDURE SP_REPORTE_POSTULANTES_DEPARTAMENTO
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ISNULL(departamento, 'Sin especificar') AS departamento,
        COUNT(*) AS total,
        CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL(5,2)) AS porcentaje
    FROM postulantes
    GROUP BY departamento
    ORDER BY total DESC;
END
GO

-- =============================================
-- SP_REPORTE_POSTULANTES_PROFESION
-- Devuelve ranking de profesiones entre postulantes
-- @top: cuántas profesiones mostrar (NULL = todas)
-- Usado en: Card "Postulantes por Profesión"
-- =============================================
CREATE OR ALTER PROCEDURE SP_REPORTE_POSTULANTES_PROFESION
    @top INT = NULL   -- NULL devuelve todas. Ej: 10 devuelve el top 10
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (ISNULL(@top, 2147483647))
        ISNULL(profesion, 'Sin especificar') AS profesion,
        COUNT(*) AS total,
        CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL(5,2)) AS porcentaje
    FROM postulantes
    GROUP BY profesion
    ORDER BY total DESC;
END
GO