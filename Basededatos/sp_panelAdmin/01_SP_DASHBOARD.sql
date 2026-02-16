-- ============================================================
-- PANEL ADMIN CGPVP  |  SECCION: DASHBOARD
-- Archivo : 01_SP_DASHBOARD.sql
-- DB      : DB_CGPVP2
-- Desc    : KPIs principales, graficos y actividad reciente
-- ============================================================
USE DB_CGPVP2;
GO
exec SP_DS_KPI_PRINCIPAL
-- ------------------------------------------------------------
-- 1. KPIs PRINCIPALES  (tarjetas superiores del dashboard)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DS_KPI_PRINCIPAL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        -- Postulantes
        (SELECT COUNT(*)   FROM postulantes)                                        AS total_postulantes,
        (SELECT COUNT(*)   FROM postulantes
         WHERE MONTH(fecha_registro)=MONTH(GETDATE())
           AND YEAR(fecha_registro) =YEAR(GETDATE()))                               AS postulantes_este_mes,
        -- Miembros
        (SELECT COUNT(*)   FROM miembros)                                           AS total_miembros,
        (SELECT COUNT(*)   FROM miembros WHERE estado='Activo')                     AS miembros_activos,
        (SELECT COUNT(*)   FROM miembros WHERE estado='Suspendido')                 AS miembros_suspendidos,
        (SELECT COUNT(*)   FROM miembros WHERE estado='Baja')                       AS miembros_baja,
        -- Instructores
        (SELECT COUNT(*)   FROM instructores WHERE estado='Activo')                 AS instructores_activos,
        -- Cursos
        (SELECT COUNT(*)   FROM cursos WHERE estado='Activo')                       AS cursos_activos,
        (SELECT ISNULL(SUM(inscritos),0) FROM cursos WHERE estado='Activo')         AS inscritos_en_cursos,
        -- Eventos
        (SELECT COUNT(*)   FROM eventos_talleres
         WHERE estado IN ('Programado','En Curso'))                                 AS eventos_proximos,
        (SELECT ISNULL(SUM(inscritos),0) FROM eventos_talleres
         WHERE estado IN ('Programado','En Curso'))                                 AS inscritos_en_eventos,
        -- Publicaciones
        (SELECT COUNT(*)   FROM publicaciones WHERE activa=1)                       AS publicaciones_activas,
        (SELECT COUNT(*)   FROM publicaciones WHERE activa=1 AND destacada=1)       AS publicaciones_destacadas;
END
GO

-- ------------------------------------------------------------
-- 2. GRAFICO: Miembros por estado  (dona / pie)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DS_GRAFICO_MIEMBROS_ESTADO
AS
BEGIN
    SET NOCOUNT ON;
    SELECT estado,
           COUNT(*) AS cantidad,
           CAST(ROUND(COUNT(*)*100.0 / NULLIF((SELECT COUNT(*) FROM miembros),0),2)
                AS DECIMAL(5,2)) AS porcentaje
    FROM miembros
    GROUP BY estado
    ORDER BY cantidad DESC;
END
GO

-- ------------------------------------------------------------
-- 3. GRAFICO: Miembros por rango  (barras horizontales)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DS_GRAFICO_MIEMBROS_RANGO
AS
BEGIN
    SET NOCOUNT ON;
    SELECT rango, COUNT(*) AS cantidad
    FROM miembros
    GROUP BY rango
    ORDER BY cantidad DESC;
END
GO

-- ------------------------------------------------------------
-- 4. GRAFICO: Nuevos postulantes por mes — ultimo año  (lineas)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DS_GRAFICO_POSTULANTES_MES
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        YEAR(fecha_registro)            AS anio,
        MONTH(fecha_registro)           AS mes_num,
        FORMAT(fecha_registro,'MMM yyyy') AS mes_label,
        COUNT(*)                        AS total
    FROM postulantes
    WHERE fecha_registro >= DATEADD(MONTH,-12,GETDATE())
    GROUP BY YEAR(fecha_registro), MONTH(fecha_registro),
             FORMAT(fecha_registro,'MMM yyyy')
    ORDER BY anio, mes_num;
END
GO

-- ------------------------------------------------------------
-- 5. GRAFICO: Miembros por departamento  (barras)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DS_GRAFICO_MIEMBROS_DEPARTAMENTO
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ISNULL(departamento,'Sin registrar') AS departamento,
           COUNT(*) AS cantidad
    FROM miembros
    GROUP BY departamento
    ORDER BY cantidad DESC;
END
GO

-- ------------------------------------------------------------
-- 6. GRAFICO: Distribucion de edades de miembros
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DS_GRAFICO_EDADES_MIEMBROS
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        CASE
            WHEN DATEDIFF(YEAR,fecha_nacimiento,GETDATE()) BETWEEN 18 AND 25 THEN '18-25'
            WHEN DATEDIFF(YEAR,fecha_nacimiento,GETDATE()) BETWEEN 26 AND 35 THEN '26-35'
            WHEN DATEDIFF(YEAR,fecha_nacimiento,GETDATE()) BETWEEN 36 AND 45 THEN '36-45'
            WHEN DATEDIFF(YEAR,fecha_nacimiento,GETDATE()) BETWEEN 46 AND 55 THEN '46-55'
            WHEN DATEDIFF(YEAR,fecha_nacimiento,GETDATE()) >= 56             THEN '56+'
            ELSE 'Sin dato'
        END AS rango_edad,
        COUNT(*) AS cantidad
    FROM miembros
    WHERE fecha_nacimiento IS NOT NULL
    GROUP BY
        CASE
            WHEN DATEDIFF(YEAR,fecha_nacimiento,GETDATE()) BETWEEN 18 AND 25 THEN '18-25'
            WHEN DATEDIFF(YEAR,fecha_nacimiento,GETDATE()) BETWEEN 26 AND 35 THEN '26-35'
            WHEN DATEDIFF(YEAR,fecha_nacimiento,GETDATE()) BETWEEN 36 AND 45 THEN '36-45'
            WHEN DATEDIFF(YEAR,fecha_nacimiento,GETDATE()) BETWEEN 46 AND 55 THEN '46-55'
            WHEN DATEDIFF(YEAR,fecha_nacimiento,GETDATE()) >= 56             THEN '56+'
            ELSE 'Sin dato'
        END
    ORDER BY rango_edad;
END
GO

-- ------------------------------------------------------------
-- 7. GRAFICO: Ocupacion de cursos activos  (barras agrupadas)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DS_GRAFICO_OCUPACION_CURSOS
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 8
        titulo,
        inscritos,
        cupos,
        cupos - inscritos AS disponibles,
        CAST(ROUND(inscritos*100.0/NULLIF(cupos,0),1) AS DECIMAL(5,1)) AS pct_ocupacion
    FROM cursos
    WHERE estado = 'Activo'
    ORDER BY pct_ocupacion DESC;
END
GO

-- ------------------------------------------------------------
-- 8. ACTIVIDAD RECIENTE  (feed lateral del dashboard)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DS_ACTIVIDAD_RECIENTE
    @top INT = 15
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@top) tipo, descripcion, detalle, fecha
    FROM (
        SELECT 'Postulante' AS tipo,
               CONCAT(nombre,' ',apellido) AS descripcion,
               'Nuevo postulante registrado' AS detalle,
               fecha_registro AS fecha
        FROM postulantes

        UNION ALL

        SELECT 'Miembro',
               CONCAT(nombre,' ',apellido),
               CONCAT('Miembro ingresado — Legajo: ',legajo),
               fecha_ingreso
        FROM miembros

        UNION ALL

        SELECT 'Cambio',
               CONCAT('Miembro ID: ',CAST(id_miembro AS NVARCHAR)),
               CONCAT(campo_modificado,' → ',valor_nuevo),
               fecha_cambio
        FROM historial_cambios
    ) AS feed
    ORDER BY fecha DESC;
END
GO

-- ------------------------------------------------------------
-- 1. KPI: CONTEO POR RANGO (Aspirantes, Alumnos, Rescatistas)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DS_KPI_POR_RANGO
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Contar por cada rango (con los nombres exactos)
    SELECT
        (SELECT COUNT(*) FROM miembros WHERE rango = 'Aspirante') AS total_aspirantes,
        (SELECT COUNT(*) FROM miembros WHERE rango IN ('Alumno - BIRED', 'Alumno - EMGRA')) AS total_alumnos,
        (SELECT COUNT(*) FROM miembros WHERE rango = 'Alumno - BIRED') AS alumnos_bired,
        (SELECT COUNT(*) FROM miembros WHERE rango = 'Alumno - EMGRA') AS alumnos_emgra,
        (SELECT COUNT(*) FROM miembros WHERE rango = 'Rescatista' AND estado = 'Activo') AS total_rescatistas,
        (SELECT COUNT(*) FROM miembros) AS total_inscritos;
END
GO

-- ------------------------------------------------------------
-- 2. KPI: RESUMEN AGRUPADO POR RANGO (para las cards)
-- Devuelve solo lo necesario para las 3 cards principales
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DS_RESUMEN_RANGOS
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Conteos por rango (con los nombres exactos de la BD)
    SELECT
        SUM(CASE WHEN rango = 'Aspirante' THEN 1 ELSE 0 END) AS aspirantes,
        
        -- Total de alumnos (ambos niveles)
        SUM(CASE WHEN rango IN ('Alumno - BIRED', 'Alumno - EMGRA') THEN 1 ELSE 0 END) AS alumnos,
        
        -- Desglose por nivel
        SUM(CASE WHEN rango = 'Alumno - BIRED' THEN 1 ELSE 0 END) AS alumnos_bired,
        SUM(CASE WHEN rango = 'Alumno - EMGRA' THEN 1 ELSE 0 END) AS alumnos_emgra,
        
        SUM(CASE WHEN rango = 'Rescatista' AND estado = 'Activo' THEN 1 ELSE 0 END) AS rescatistas,
        
        COUNT(*) AS total_inscritos
    FROM miembros;
END
GO