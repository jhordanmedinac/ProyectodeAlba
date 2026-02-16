-- ============================================================
-- PANEL ADMIN CGPVP  |  SECCION: REPORTES
-- Archivo : 07_SP_REPORTES.sql
-- DB      : DB_CGPVP2
-- Desc    : Todos los reportes exportables del panel admin.
--           Cada SP devuelve el dataset listo para CSV.
--           Prefijo: SP_REP_
-- ============================================================
USE DB_CGPVP2;
GO

-- ------------------------------------------------------------
-- R1. Reporte general de miembros
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_REP_MIEMBROS
    @estado       NVARCHAR(20) = NULL,
    @rango        NVARCHAR(50) = NULL,
    @departamento NVARCHAR(50) = NULL,
    @desde        DATE         = NULL,
    @hasta        DATE         = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        m.id,
        m.legajo,
        m.apellido, m.nombre,
        m.dni,
        CONVERT(NVARCHAR,m.fecha_nacimiento,103)              AS fecha_nacimiento,
        DATEDIFF(YEAR,m.fecha_nacimiento,GETDATE())           AS edad,
        m.genero, m.email, m.telefono,
        m.direccion, m.departamento, m.distrito, m.profesion,
        m.rango, m.jefatura, m.estado,
        m.cursos_certificaciones,
        CONVERT(NVARCHAR,m.fecha_ingreso,103)                 AS fecha_ingreso,
        DATEDIFF(YEAR,m.fecha_ingreso,GETDATE())              AS anios_en_cuerpo
    FROM miembros m
    WHERE (@estado       IS NULL OR m.estado       = @estado)
      AND (@rango        IS NULL OR m.rango         = @rango)
      AND (@departamento IS NULL OR m.departamento  = @departamento)
      AND (@desde        IS NULL OR CAST(m.fecha_ingreso AS DATE) >= @desde)
      AND (@hasta        IS NULL OR CAST(m.fecha_ingreso AS DATE) <= @hasta)
    ORDER BY m.apellido, m.nombre;
END
GO

-- ------------------------------------------------------------
-- R2. Reporte de postulantes
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_REP_POSTULANTES
    @departamento    NVARCHAR(50) = NULL,
    @desde           DATE         = NULL,
    @hasta           DATE         = NULL,
    @solo_pendientes BIT          = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.id, p.apellido, p.nombre, p.dni,
        CONVERT(NVARCHAR,p.fecha_nacimiento,103) AS fecha_nacimiento,
        DATEDIFF(YEAR,p.fecha_nacimiento,GETDATE()) AS edad,
        p.genero, p.email, p.telefono,
        p.departamento, p.distrito, p.profesion,
        p.nivel_educativo, p.experiencia,
        CONVERT(NVARCHAR,p.fecha_registro,103)   AS fecha_registro,
        CASE WHEN m.id IS NOT NULL THEN 'Sí' ELSE 'No' END AS promovido_a_miembro,
        m.legajo, m.rango
    FROM postulantes p
    LEFT JOIN miembros m ON m.id_postulante = p.id
    WHERE (@departamento    IS NULL OR p.departamento = @departamento)
      AND (@desde           IS NULL OR CAST(p.fecha_registro AS DATE) >= @desde)
      AND (@hasta           IS NULL OR CAST(p.fecha_registro AS DATE) <= @hasta)
      AND (@solo_pendientes = 0     OR m.id IS NULL)
    ORDER BY p.fecha_registro DESC;
END
GO

-- ------------------------------------------------------------
-- R3. Reporte de inscripciones a cursos
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_REP_INSCRIPCIONES_CURSOS
    @id_curso  INT          = NULL,
    @estado    NVARCHAR(20) = NULL,
    @desde     DATE         = NULL,
    @hasta     DATE         = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        ic.id              AS id_inscripcion,
        c.titulo           AS curso,
        c.categoria, c.modalidad,
        CONVERT(NVARCHAR,c.fecha_inicio,103) AS curso_inicio,
        CONVERT(NVARCHAR,c.fecha_fin,103)    AS curso_fin,
        ic.apellido, ic.nombre,
        ic.dni, ic.email, ic.telefono, ic.edad,
        ic.estado          AS estado_inscripcion,
        CONVERT(NVARCHAR,ic.fecha_inscripcion,103) AS fecha_inscripcion,
        ic.notas
    FROM inscripciones_cursos ic
    INNER JOIN cursos c ON c.id = ic.id_curso
    WHERE (@id_curso IS NULL OR ic.id_curso = @id_curso)
      AND (@estado   IS NULL OR ic.estado   = @estado)
      AND (@desde    IS NULL OR CAST(ic.fecha_inscripcion AS DATE) >= @desde)
      AND (@hasta    IS NULL OR CAST(ic.fecha_inscripcion AS DATE) <= @hasta)
    ORDER BY c.titulo, ic.apellido, ic.nombre;
END
GO

-- ------------------------------------------------------------
-- R4. Reporte de inscripciones a eventos
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_REP_INSCRIPCIONES_EVENTOS
    @id_evento INT          = NULL,
    @estado    NVARCHAR(20) = NULL,
    @desde     DATE         = NULL,
    @hasta     DATE         = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        ie.id              AS id_inscripcion,
        e.titulo           AS evento,
        e.tipo,
        CONVERT(NVARCHAR,e.fecha,103)  AS fecha_evento,
        e.ubicacion,
        ie.apellido, ie.nombre,
        ie.dni, ie.email, ie.telefono, ie.edad,
        ie.estado          AS estado_inscripcion,
        CONVERT(NVARCHAR,ie.fecha_inscripcion,103) AS fecha_inscripcion,
        ie.notas
    FROM inscripciones_eventos ie
    INNER JOIN eventos_talleres e ON e.id = ie.id_evento
    WHERE (@id_evento IS NULL OR ie.id_evento = @id_evento)
      AND (@estado    IS NULL OR ie.estado    = @estado)
      AND (@desde     IS NULL OR CAST(ie.fecha_inscripcion AS DATE) >= @desde)
      AND (@hasta     IS NULL OR CAST(ie.fecha_inscripcion AS DATE) <= @hasta)
    ORDER BY e.fecha DESC, ie.apellido, ie.nombre;
END
GO
-- ------------------------------------------------------------
-- R5. Reporte de instructores
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_REP_INSTRUCTORES
    @especialidad NVARCHAR(100) = NULL,
    @estado       NVARCHAR(20)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        i.id, i.nombre_completo, i.especialidad, i.rango,
        i.experiencia_anios, i.certificaciones,
        i.email, i.telefono, i.estado,
        CONVERT(NVARCHAR,i.fecha_registro,103) AS fecha_registro,
        (SELECT COUNT(*) FROM cursos WHERE id_instructor=i.id)           AS total_cursos,
        (SELECT COUNT(*) FROM cursos WHERE id_instructor=i.id
          AND estado='Activo')                                           AS cursos_activos,
        (SELECT COUNT(*) FROM eventos_talleres WHERE id_instructor=i.id) AS total_eventos
    FROM instructores i
    WHERE (@especialidad IS NULL OR i.especialidad = @especialidad)
      AND (@estado       IS NULL OR i.estado       = @estado)
    ORDER BY i.nombre_completo;
END
GO

-- ------------------------------------------------------------
-- R6. Reporte de cursos con metricas de ocupacion
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_REP_CURSOS
    @categoria NVARCHAR(30) = NULL,
    @estado    NVARCHAR(20) = NULL,
    @desde     DATE         = NULL,
    @hasta     DATE         = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.id, c.titulo, c.categoria, c.modalidad, c.duracion,
        i.nombre_completo AS instructor,
        c.cupos, c.inscritos,
        c.cupos - c.inscritos AS disponibles,
        CAST(ROUND(c.inscritos*100.0/NULLIF(c.cupos,0),1) AS DECIMAL(5,1)) AS pct_ocupacion,
        c.precio, c.estado,
        CONVERT(NVARCHAR,c.fecha_inicio,103) AS fecha_inicio,
        CONVERT(NVARCHAR,c.fecha_fin,103)    AS fecha_fin,
        CONVERT(NVARCHAR,c.fecha_creacion,103) AS fecha_creacion
    FROM cursos c
    LEFT JOIN instructores i ON i.id = c.id_instructor
    WHERE (@categoria IS NULL OR c.categoria = @categoria)
      AND (@estado    IS NULL OR c.estado    = @estado)
      AND (@desde     IS NULL OR c.fecha_inicio >= @desde)
      AND (@hasta     IS NULL OR c.fecha_inicio <= @hasta)
    ORDER BY c.fecha_inicio DESC;
END
GO

-- ------------------------------------------------------------
-- R7. Reporte de eventos con metricas de asistencia
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_REP_EVENTOS
    @tipo   NVARCHAR(30) = NULL,
    @estado NVARCHAR(20) = NULL,
    @desde  DATE         = NULL,
    @hasta  DATE         = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        e.id, e.titulo, e.tipo,
        CONVERT(NVARCHAR,e.fecha,103) AS fecha,
        e.hora_inicio, e.hora_fin, e.ubicacion,
        i.nombre_completo AS instructor,
        e.capacidad, e.inscritos,
        e.capacidad - e.inscritos AS disponibles,
        CAST(ROUND(e.inscritos*100.0/NULLIF(e.capacidad,0),1) AS DECIMAL(5,1)) AS pct_ocupacion,
        e.estado,
        -- Asistencia real (solo para eventos finalizados)
        (SELECT COUNT(*) FROM inscripciones_eventos
         WHERE id_evento=e.id AND estado='Asistió')    AS asistieron,
        (SELECT COUNT(*) FROM inscripciones_eventos
         WHERE id_evento=e.id AND estado='No Asistió') AS no_asistieron
    FROM eventos_talleres e
    LEFT JOIN instructores i ON i.id = e.id_instructor
    WHERE (@tipo   IS NULL OR e.tipo   = @tipo)
      AND (@estado IS NULL OR e.estado = @estado)
      AND (@desde  IS NULL OR e.fecha  >= @desde)
      AND (@hasta  IS NULL OR e.fecha  <= @hasta)
    ORDER BY e.fecha DESC;
END
GO

-- ------------------------------------------------------------
-- R8. Reporte de historial de cambios (auditoria)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_REP_AUDITORIA
    @id_miembro    INT          = NULL,
    @campo         NVARCHAR(50) = NULL,  -- estado | rango | CREACION
    @admin_id      INT          = NULL,
    @desde         DATE         = NULL,
    @hasta         DATE         = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        h.id,
        CONCAT(m.apellido,', ',m.nombre)  AS miembro,
        m.legajo,
        h.campo_modificado,
        h.valor_anterior,
        h.valor_nuevo,
        h.motivo,
        CONVERT(NVARCHAR,h.fecha_cambio,120) AS fecha_cambio,
        au.nombre_completo                AS realizado_por
    FROM historial_cambios h
    INNER JOIN miembros    m  ON m.id  = h.id_miembro
    LEFT  JOIN admin_users au ON au.id = h.realizado_por
    WHERE (@id_miembro IS NULL OR h.id_miembro     = @id_miembro)
      AND (@campo      IS NULL OR h.campo_modificado = @campo)
      AND (@admin_id   IS NULL OR h.realizado_por  = @admin_id)
      AND (@desde      IS NULL OR CAST(h.fecha_cambio AS DATE) >= @desde)
      AND (@hasta      IS NULL OR CAST(h.fecha_cambio AS DATE) <= @hasta)
    ORDER BY h.fecha_cambio DESC;
END
GO
-- ------------------------------------------------------------
-- R9. Reporte resumen por departamento
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_REP_RESUMEN_DEPARTAMENTOS
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        ISNULL(departamento,'Sin registrar')          AS departamento,
        COUNT(*)                                       AS total_miembros,
        SUM(CASE WHEN estado='Activo'     THEN 1 ELSE 0 END) AS activos,
        SUM(CASE WHEN estado='Suspendido' THEN 1 ELSE 0 END) AS suspendidos,
        SUM(CASE WHEN estado='Baja'       THEN 1 ELSE 0 END) AS baja,
        CAST(ROUND(COUNT(*)*100.0/NULLIF((SELECT COUNT(*) FROM miembros),0),2)
             AS DECIMAL(5,2))                          AS pct_del_total
    FROM miembros
    GROUP BY departamento
    ORDER BY total_miembros DESC;
END
GO

-- ------------------------------------------------------------
-- R10. Reporte resumen ejecutivo (para la pantalla principal de reportes)
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_REP_RESUMEN_EJECUTIVO
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        -- Miembros
        (SELECT COUNT(*) FROM miembros)                              AS miembros_total,
        (SELECT COUNT(*) FROM miembros WHERE estado='Activo')        AS miembros_activos,
        (SELECT COUNT(*) FROM miembros
         WHERE MONTH(fecha_ingreso)=MONTH(GETDATE())
           AND YEAR(fecha_ingreso) =YEAR(GETDATE()))                 AS miembros_nuevos_mes,
        -- Postulantes
        (SELECT COUNT(*) FROM postulantes)                           AS postulantes_total,
        (SELECT COUNT(*) FROM postulantes
         WHERE MONTH(fecha_registro)=MONTH(GETDATE())
           AND YEAR(fecha_registro) =YEAR(GETDATE()))                AS postulantes_este_mes,
        (SELECT COUNT(*) FROM postulantes p
         WHERE NOT EXISTS (SELECT 1 FROM miembros m
                           WHERE m.id_postulante=p.id))              AS postulantes_pendientes,
        -- Cursos
        (SELECT COUNT(*) FROM cursos WHERE estado='Activo')          AS cursos_activos,
        (SELECT ISNULL(SUM(inscritos),0) FROM cursos
         WHERE estado='Activo')                                      AS inscritos_cursos,
        -- Eventos
        (SELECT COUNT(*) FROM eventos_talleres
         WHERE estado IN ('Programado','En Curso'))                  AS eventos_proximos,
        (SELECT COUNT(*) FROM eventos_talleres
         WHERE fecha >= DATEADD(DAY,-30,GETDATE())
           AND estado='Finalizado')                                  AS eventos_ultimo_mes,
        -- Instructores
        (SELECT COUNT(*) FROM instructores WHERE estado='Activo')    AS instructores_activos,
        -- Publicaciones
        (SELECT COUNT(*) FROM publicaciones WHERE activa=1)          AS publicaciones_activas;
END
GO

PRINT '== 07_SP_REPORTES.sql ejecutado OK ==';
PRINT '  SP_REP_MIEMBROS              SP_REP_POSTULANTES';
PRINT '  SP_REP_INSCRIPCIONES_CURSOS  SP_REP_INSCRIPCIONES_EVENTOS';
PRINT '  SP_REP_INSTRUCTORES          SP_REP_CURSOS';
PRINT '  SP_REP_EVENTOS               SP_REP_AUDITORIA';
PRINT '  SP_REP_RESUMEN_DEPARTAMENTOS SP_REP_RESUMEN_EJECUTIVO';
GO
