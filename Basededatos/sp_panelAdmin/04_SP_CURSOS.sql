-- =============================================
-- STORED PROCEDURES OPTIMIZADOS - MÓDULO CURSOS
-- Sistema CGPVP - Clean Code
-- Total: 6 SPs esenciales
-- =============================================

USE DB_CGPVP2;
GO

-- =============================================
-- AGREGAR CAMPO ENLACE SI NO EXISTE
-- =============================================
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('cursos') 
    AND name = 'enlace'
)
BEGIN
    ALTER TABLE cursos ADD enlace NVARCHAR(500) NULL;
    PRINT ' Campo "enlace" agregado a la tabla cursos';
END
ELSE
BEGIN
    PRINT ' Campo "enlace" ya existe';
END
GO
-- =============================================
-- SP1: LISTAR CURSOS (con filtros opcionales)
-- =============================================
IF OBJECT_ID('SP_LISTAR_CURSOS', 'P') IS NOT NULL DROP PROCEDURE SP_LISTAR_CURSOS;
GO
CREATE PROCEDURE SP_LISTAR_CURSOS
    @categoria NVARCHAR(30) = NULL,
    @modalidad NVARCHAR(20) = NULL,
    @estado NVARCHAR(20) = NULL,
    @busqueda NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.id,
        c.titulo,
        c.categoria,
        c.duracion,
        c.modalidad,
        c.id_instructor,
        ISNULL(i.nombre_completo, 'Sin asignar') AS instructor,
        c.descripcion,
        c.requisitos,
        c.cupos,
        c.inscritos,
        (c.cupos - c.inscritos) AS cupos_disponibles,
        c.direccion,
        c.enlace,
        c.imagen,
        c.estado,
        c.fecha_inicio,
        c.fecha_fin,
        c.fecha_creacion
    FROM cursos c
    LEFT JOIN instructores i ON c.id_instructor = i.id
    WHERE 
        (@categoria IS NULL OR c.categoria = @categoria)
        AND (@modalidad IS NULL OR c.modalidad = @modalidad)
        AND (@estado IS NULL OR c.estado = @estado)
        AND (@busqueda IS NULL OR 
            c.titulo LIKE '%' + @busqueda + '%' OR 
            c.descripcion LIKE '%' + @busqueda + '%' OR
            i.nombre_completo LIKE '%' + @busqueda + '%')
    ORDER BY c.fecha_creacion DESC;
END;
GO

-- =============================================
-- SP2: OBTENER CURSO POR ID
-- =============================================
IF OBJECT_ID('SP_OBTENER_CURSO', 'P') IS NOT NULL DROP PROCEDURE SP_OBTENER_CURSO;
GO
CREATE PROCEDURE SP_OBTENER_CURSO
    @id_curso INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.id,
        c.titulo,
        c.categoria,
        c.duracion,
        c.modalidad,
        c.id_instructor,
        ISNULL(i.nombre_completo, 'Sin asignar') AS instructor,
        c.descripcion,
        c.requisitos,
        c.cupos,
        c.inscritos,
        (c.cupos - c.inscritos) AS cupos_disponibles,
        c.direccion,
        c.enlace,
        c.imagen,
        c.estado,
        c.fecha_inicio,
        c.fecha_fin,
        c.fecha_creacion
    FROM cursos c
    LEFT JOIN instructores i ON c.id_instructor = i.id
    WHERE c.id = @id_curso;
END;
GO

-- =============================================
-- SP3: REGISTRAR CURSO
-- =============================================
IF OBJECT_ID('SP_REGISTRAR_CURSO', 'P') IS NOT NULL DROP PROCEDURE SP_REGISTRAR_CURSO;
GO
CREATE PROCEDURE SP_REGISTRAR_CURSO
    @titulo NVARCHAR(200),
    @categoria NVARCHAR(30),
    @duracion NVARCHAR(50) = NULL,
    @modalidad NVARCHAR(20) = 'Presencial',
    @id_instructor INT = NULL,
    @descripcion NVARCHAR(MAX) = NULL,
    @requisitos NVARCHAR(500) = NULL,
    @cupos INT = 30,
    @direccion NVARCHAR(250) = NULL,
    @enlace NVARCHAR(500) = NULL,
    @imagen NVARCHAR(MAX) = NULL,
    @fecha_inicio DATE = NULL,
    @fecha_fin DATE = NULL,
    @admin_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones mínimas
        IF @titulo IS NULL OR LTRIM(RTRIM(@titulo)) = ''
            THROW 50001, 'El título es obligatorio', 1;
            
        IF @modalidad = 'Presencial' AND (@direccion IS NULL OR LTRIM(RTRIM(@direccion)) = '')
            THROW 50002, 'Cursos presenciales requieren dirección', 1;
            
        IF @modalidad IN ('Virtual', 'Semipresencial') AND (@enlace IS NULL OR LTRIM(RTRIM(@enlace)) = '')
            THROW 50003, 'Cursos virtuales requieren enlace', 1;
        
        -- Insertar
        INSERT INTO cursos (
            titulo, categoria, duracion, modalidad, id_instructor,
            descripcion, requisitos, cupos, direccion, enlace, imagen,
            fecha_inicio, fecha_fin, modificado_por
        )
        VALUES (
            @titulo, @categoria, @duracion, @modalidad, @id_instructor,
            @descripcion, @requisitos, @cupos, @direccion, @enlace, @imagen,
            @fecha_inicio, @fecha_fin, @admin_id
        );
        
        DECLARE @id INT = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        SELECT 'SUCCESS' AS status, 'Curso registrado' AS mensaje, @id AS id;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'ERROR' AS status, ERROR_MESSAGE() AS mensaje;
    END CATCH
END;
GO

-- =============================================
-- SP4: ACTUALIZAR CURSO
-- =============================================
IF OBJECT_ID('SP_ACTUALIZAR_CURSO', 'P') IS NOT NULL DROP PROCEDURE SP_ACTUALIZAR_CURSO;
GO
CREATE PROCEDURE SP_ACTUALIZAR_CURSO
    @id_curso INT,
    @titulo NVARCHAR(200),
    @categoria NVARCHAR(30),
    @duracion NVARCHAR(50),
    @modalidad NVARCHAR(20),
    @id_instructor INT = NULL,
    @descripcion NVARCHAR(MAX) = NULL,
    @requisitos NVARCHAR(500) = NULL,
    @cupos INT,
    @direccion NVARCHAR(250) = NULL,
    @enlace NVARCHAR(500) = NULL,
    @imagen NVARCHAR(MAX) = NULL,
    @estado NVARCHAR(20),
    @fecha_inicio DATE = NULL,
    @fecha_fin DATE = NULL,
    @admin_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar existencia
        IF NOT EXISTS (SELECT 1 FROM cursos WHERE id = @id_curso)
            THROW 50004, 'Curso no existe', 1;
        
        -- Validar cupos vs inscritos
        IF @cupos < (SELECT inscritos FROM cursos WHERE id = @id_curso)
            THROW 50005, 'Cupos menor que inscritos actuales', 1;
            
        IF @modalidad = 'Presencial' AND (@direccion IS NULL OR LTRIM(RTRIM(@direccion)) = '')
            THROW 50002, 'Cursos presenciales requieren dirección', 1;
            
        IF @modalidad IN ('Virtual', 'Semipresencial') AND (@enlace IS NULL OR LTRIM(RTRIM(@enlace)) = '')
            THROW 50003, 'Cursos virtuales requieren enlace', 1;
        
        -- Actualizar
        UPDATE cursos SET
            titulo = @titulo,
            categoria = @categoria,
            duracion = @duracion,
            modalidad = @modalidad,
            id_instructor = @id_instructor,
            descripcion = @descripcion,
            requisitos = @requisitos,
            cupos = @cupos,
            direccion = @direccion,
            enlace = @enlace,
            imagen = @imagen,
            estado = @estado,
            fecha_inicio = @fecha_inicio,
            fecha_fin = @fecha_fin,
            modificado_por = @admin_id
        WHERE id = @id_curso;
        
        COMMIT TRANSACTION;
        
        SELECT 'SUCCESS' AS status, 'Curso actualizado' AS mensaje;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'ERROR' AS status, ERROR_MESSAGE() AS mensaje;
    END CATCH
END;
GO

-- =============================================
-- SP5: ELIMINAR CURSO
-- =============================================
IF OBJECT_ID('SP_ELIMINAR_CURSO', 'P') IS NOT NULL DROP PROCEDURE SP_ELIMINAR_CURSO;
GO
CREATE PROCEDURE SP_ELIMINAR_CURSO
    @id_curso INT,
    @admin_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @inscritos INT;
        SELECT @inscritos = inscritos FROM cursos WHERE id = @id_curso;
        
        IF @inscritos IS NULL
            THROW 50004, 'Curso no existe', 1;
        
        -- Si tiene inscritos, marcar inactivo. Si no, eliminar.
        IF @inscritos > 0
        BEGIN
            UPDATE cursos SET estado = 'Inactivo', modificado_por = @admin_id
            WHERE id = @id_curso;
            
            SELECT 'WARNING' AS status, 'Curso marcado como inactivo (tiene inscritos)' AS mensaje;
        END
        ELSE
        BEGIN
            DELETE FROM cursos WHERE id = @id_curso;
            SELECT 'SUCCESS' AS status, 'Curso eliminado' AS mensaje;
        END
        
        COMMIT TRANSACTION;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'ERROR' AS status, ERROR_MESSAGE() AS mensaje;
    END CATCH
END;
GO

-- =============================================
-- SP6: CAMBIAR ESTADO
-- =============================================
IF OBJECT_ID('SP_CAMBIAR_ESTADO_CURSO', 'P') IS NOT NULL DROP PROCEDURE SP_CAMBIAR_ESTADO_CURSO;
GO
CREATE PROCEDURE SP_CAMBIAR_ESTADO_CURSO
    @id_curso INT,
    @nuevo_estado NVARCHAR(20),
    @admin_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        
        IF NOT EXISTS (SELECT 1 FROM cursos WHERE id = @id_curso)
            THROW 50004, 'Curso no existe', 1;
            
        IF @nuevo_estado NOT IN ('Activo', 'Inactivo', 'Finalizado')
            THROW 50006, 'Estado inválido', 1;
        
        UPDATE cursos 
        SET estado = @nuevo_estado, modificado_por = @admin_id
        WHERE id = @id_curso;
        
        SELECT 'SUCCESS' AS status, 'Estado actualizado' AS mensaje;
            
    END TRY
    BEGIN CATCH
        SELECT 'ERROR' AS status, ERROR_MESSAGE() AS mensaje;
    END CATCH
END;
GO

PRINT '';
PRINT ' STORED PROCEDURES OPTIMIZADOS CREADOS';
PRINT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
PRINT 'Total: 6 SPs';
PRINT '';
PRINT '  1. SP_LISTAR_CURSOS        → Lista con filtros';
PRINT '  2. SP_OBTENER_CURSO        → Detalle por ID';
PRINT '  3. SP_REGISTRAR_CURSO      → Crear';
PRINT '  4. SP_ACTUALIZAR_CURSO     → Editar';
PRINT '  5. SP_ELIMINAR_CURSO       → Eliminar (soft/hard)';
PRINT '  6. SP_CAMBIAR_ESTADO_CURSO → Cambiar estado';
PRINT '';
PRINT ' Listo para usar, Rey!';
GO