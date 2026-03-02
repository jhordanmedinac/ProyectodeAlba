-- =============================================
-- BASE DE DATOS COMPLETA: DB_CGPVP
-- Cuerpo General de Param�dicos Voluntarios del Per�
-- Sistema Integral: Web + Panel Admin + Credenciales Digitales
-- =============================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'DB_CGPVP2')
BEGIN
    CREATE DATABASE DB_CGPVP2;
END
GO
USE DB_CGPVP2;
GO

-- =============================================
-- TABLA 1: admin_users (Primero porque otras tablas dependen de ella)
-- Descripci�n: Usuarios administradores del panel
-- =============================================
IF OBJECT_ID('dbo.admin_users', 'U') IS NOT NULL DROP TABLE dbo.admin_users;
GO

CREATE TABLE admin_users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    nombre_completo NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    rol NVARCHAR(20) NOT NULL DEFAULT 'Editor' CHECK (rol IN ('Super Admin','Editor','Gestor')),
    foto_perfil NVARCHAR(MAX) NULL,
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME2 DEFAULT SYSUTCDATETIME(),
    ultimo_login DATETIME2 NULL
);
GO

-- =============================================
-- TABLA 2: postulantes
-- Descripci�n: Registro desde formulario web p�blico
-- =============================================
IF OBJECT_ID('dbo.postulantes', 'U') IS NOT NULL DROP TABLE dbo.postulantes;
GO

CREATE TABLE postulantes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(50) NOT NULL,
    apellido NVARCHAR(50) NOT NULL,
    dni CHAR(8) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    genero NVARCHAR(10) NOT NULL CHECK (genero IN ('masculino','femenino','otro')),
    email NVARCHAR(100) NOT NULL UNIQUE,
    telefono CHAR(9) NOT NULL,
    direccion NVARCHAR(200) NOT NULL,
    departamento NVARCHAR(50) NOT NULL,
    distrito NVARCHAR(50) NOT NULL,
    nivel_educativo NVARCHAR(20) NOT NULL CHECK (nivel_educativo IN ('sin estudios','secundaria','tecnico','universitario','postgrado')),
    profesion NVARCHAR(100) NOT NULL,
    motivacion NVARCHAR(500) NOT NULL,
    experiencia BIT DEFAULT 0,
    fecha_registro DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

-- =============================================
-- TABLA 3: miembros (Credenciales Digitales)
-- Descripci�n: Miembros del cuerpo con credencial digital
-- =============================================
IF OBJECT_ID('dbo.miembros', 'U') IS NOT NULL DROP TABLE dbo.miembros;
GO

CREATE TABLE miembros (
    id INT IDENTITY(1,1) PRIMARY KEY,
    
    -- Datos personales
    nombre NVARCHAR(50) NOT NULL,
    apellido NVARCHAR(50) NOT NULL,
    dni CHAR(8) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    genero NVARCHAR(10) NOT NULL CHECK (genero IN ('masculino','femenino','otro')),
    email NVARCHAR(100) NOT NULL,
    telefono CHAR(9) NOT NULL,
    direccion NVARCHAR(200) NULL,
    departamento NVARCHAR(50) NULL,
    distrito NVARCHAR(50) NULL,
    profesion NVARCHAR(100) NULL,
    
    -- Datos de la credencial
    legajo NVARCHAR(20) NOT NULL UNIQUE,  -- N�mero de legajo (ej: 12345)
    rango NVARCHAR(50) NOT NULL,  -- T�CNICO PARAM�DICO, INSTRUCTOR, etc.
    jefatura NVARCHAR(100) NOT NULL,  -- BRIGADA DE EMERGENCIAS - LIMA, etc.
    foto_perfil NVARCHAR(MAX) NULL,  -- URL o base64 de la foto
    codigo_qr NVARCHAR(MAX) NULL,  -- Datos o URL del QR
    
    -- Estado
    estado NVARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Suspendido','Baja')),
    
    -- Cursos y certificaciones
    cursos_certificaciones NVARCHAR(MAX) NULL,  -- JSON o texto separado por comas
    
    -- Auditor�a
    fecha_ingreso DATETIME2 DEFAULT SYSUTCDATETIME(),
    fecha_ultimo_cambio DATETIME2 DEFAULT SYSUTCDATETIME(),
    creado_por INT NULL,
    modificado_por INT NULL,
    notas NVARCHAR(500) NULL,
    
    -- Relaci�n opcional con postulantes
    id_postulante INT NULL,
    
    CONSTRAINT FK_miembros_postulantes FOREIGN KEY (id_postulante) 
        REFERENCES postulantes(id) ON DELETE SET NULL,
    CONSTRAINT FK_miembros_creado_por FOREIGN KEY (creado_por) 
        REFERENCES admin_users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_miembros_modificado_por FOREIGN KEY (modificado_por) 
        REFERENCES admin_users(id) ON DELETE NO ACTION
);
GO

CREATE INDEX IDX_miembros_dni ON miembros(dni);
CREATE INDEX IDX_miembros_legajo ON miembros(legajo);
CREATE INDEX IDX_miembros_estado ON miembros(estado);
CREATE INDEX IDX_miembros_rango ON miembros(rango);
GO

-- =============================================
-- TABLA 4: instructores
-- Descripci�n: Gesti�n de instructores y formadores
-- =============================================
IF OBJECT_ID('dbo.instructores', 'U') IS NOT NULL DROP TABLE dbo.instructores;
GO

CREATE TABLE instructores (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre_completo NVARCHAR(150) NOT NULL,
    especialidad NVARCHAR(100) NOT NULL,
    rango NVARCHAR(50) NULL,
    experiencia_anios INT DEFAULT 0,
    certificaciones NVARCHAR(500) NULL,
    email NVARCHAR(100) NULL,
    telefono CHAR(9) NULL,
    foto NVARCHAR(MAX) NULL,
    bio NVARCHAR(1000) NULL,
    estado NVARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    fecha_registro DATETIME2 DEFAULT SYSUTCDATETIME(),
    modificado_por INT NULL,

    CONSTRAINT FK_instructores_admin FOREIGN KEY (modificado_por) 
        REFERENCES admin_users(id) ON DELETE NO ACTION
);
GO

CREATE INDEX IDX_instructores_especialidad ON instructores(especialidad);
CREATE INDEX IDX_instructores_estado ON instructores(estado);
GO

-- =============================================
-- TABLA 5: cursos
-- Descripci�n: Gesti�n de cursos y capacitaciones
-- =============================================
IF OBJECT_ID('dbo.cursos', 'U') IS NOT NULL DROP TABLE dbo.cursos;
GO

CREATE TABLE cursos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    titulo NVARCHAR(200) NOT NULL,
    categoria NVARCHAR(30) NOT NULL CHECK (categoria IN ('B�sico', 'Intermedio', 'Avanzado', 'Especializado')),
    duracion NVARCHAR(50) NULL,
    modalidad NVARCHAR(20) NOT NULL DEFAULT 'Presencial' CHECK (modalidad IN ('Presencial', 'Virtual', 'Semipresencial')),
    id_instructor INT NULL,
    descripcion NVARCHAR(MAX) NULL,
    requisitos NVARCHAR(500) NULL,
    cupos INT DEFAULT 30,
    inscritos INT DEFAULT 0,
    precio DECIMAL(10,2) DEFAULT 0.00,
    imagen NVARCHAR(MAX) NULL,
    estado NVARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo', 'Finalizado')),
    fecha_inicio DATE NULL,
    fecha_fin DATE NULL,
    fecha_creacion DATETIME2 DEFAULT SYSUTCDATETIME(),
    modificado_por INT NULL,

    CONSTRAINT FK_cursos_instructor FOREIGN KEY (id_instructor) 
        REFERENCES instructores(id) ON DELETE SET NULL,
    CONSTRAINT FK_cursos_admin FOREIGN KEY (modificado_por) 
        REFERENCES admin_users(id) ON DELETE NO ACTION,
    CONSTRAINT CK_cursos_cupos CHECK (inscritos <= cupos)
);
GO

CREATE INDEX IDX_cursos_categoria ON cursos(categoria);
CREATE INDEX IDX_cursos_estado ON cursos(estado);
CREATE INDEX IDX_cursos_instructor ON cursos(id_instructor);
CREATE INDEX IDX_cursos_fechas ON cursos(fecha_inicio, fecha_fin);
GO
ALTER TABLE cursos
ADD direccion NVARCHAR(250) NULL;
GO
-- =============================================
-- TABLA 6: eventos_talleres
-- Descripci�n: Gesti�n de eventos, talleres, simulacros y conferencias
-- =============================================
IF OBJECT_ID('dbo.eventos_talleres', 'U') IS NOT NULL DROP TABLE dbo.eventos_talleres;
GO

CREATE TABLE eventos_talleres (
    id INT IDENTITY(1,1) PRIMARY KEY,
    titulo NVARCHAR(200) NOT NULL,
    tipo NVARCHAR(30) NOT NULL CHECK (tipo IN ('Capacitaci�n', 'Taller', 'Simulacro', 'Conferencia')),
    descripcion NVARCHAR(MAX) NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NULL,
    hora_fin TIME NULL,
    ubicacion NVARCHAR(300) NULL,
    id_instructor INT NULL,
    instructor_nombre NVARCHAR(150) NULL,
    capacidad INT DEFAULT 30,
    inscritos INT DEFAULT 0,
    estado NVARCHAR(20) NOT NULL DEFAULT 'Programado' CHECK (estado IN ('Programado', 'En Curso', 'Finalizado', 'Cancelado')),
    imagen NVARCHAR(MAX) NULL,
    fecha_creacion DATETIME2 DEFAULT SYSUTCDATETIME(),
    modificado_por INT NULL,

    CONSTRAINT FK_eventos_instructor FOREIGN KEY (id_instructor) 
        REFERENCES instructores(id) ON DELETE SET NULL,
    CONSTRAINT FK_eventos_admin FOREIGN KEY (modificado_por) 
        REFERENCES admin_users(id) ON DELETE NO ACTION,
    CONSTRAINT CK_eventos_cupos CHECK (inscritos <= capacidad)
);
GO

CREATE INDEX IDX_eventos_tipo ON eventos_talleres(tipo);
CREATE INDEX IDX_eventos_estado ON eventos_talleres(estado);
CREATE INDEX IDX_eventos_fecha ON eventos_talleres(fecha);
CREATE INDEX IDX_eventos_instructor ON eventos_talleres(id_instructor);
GO

-- =============================================
-- TABLA 7: publicaciones
-- Descripci�n: Noticias para web y Facebook
-- =============================================
IF OBJECT_ID('dbo.publicaciones', 'U') IS NOT NULL DROP TABLE dbo.publicaciones;
GO

CREATE TABLE publicaciones (
    idpublicacion NVARCHAR(100) PRIMARY KEY,
    titulo NVARCHAR(200) NOT NULL,
    contenido NVARCHAR(MAX) NOT NULL,
    foto VARBINARY(MAX) NULL,
    fecha DATETIME2 NOT NULL,
    creado_por NVARCHAR(20) DEFAULT 'Facebook' CHECK (creado_por IN ('Facebook', 'Admin')),
    destacada BIT DEFAULT 0 NOT NULL,
    fecha_creacion DATETIME2 DEFAULT SYSUTCDATETIME(),
    activa BIT DEFAULT 1
);
GO

CREATE INDEX IDX_publicaciones_fecha ON publicaciones(fecha DESC);
CREATE INDEX IDX_publicaciones_activa ON publicaciones(activa);
CREATE INDEX IDX_publicaciones_destacada ON publicaciones(destacada);
GO

-- =============================================
-- TABLA 8: historial_cambios
-- Descripci�n: Auditor�a de cambios en miembros
-- =============================================
IF OBJECT_ID('dbo.historial_cambios', 'U') IS NOT NULL DROP TABLE dbo.historial_cambios;
GO

CREATE TABLE historial_cambios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    id_miembro INT NOT NULL,
    campo_modificado NVARCHAR(50) NOT NULL,
    valor_anterior NVARCHAR(500) NULL,
    valor_nuevo NVARCHAR(500) NOT NULL,
    motivo NVARCHAR(500) NULL,
    fecha_cambio DATETIME2 DEFAULT SYSUTCDATETIME(),
    realizado_por INT NULL,
    
    CONSTRAINT FK_historial_miembros FOREIGN KEY (id_miembro) 
        REFERENCES miembros(id) ON DELETE CASCADE,
    CONSTRAINT FK_historial_admin FOREIGN KEY (realizado_por) 
        REFERENCES admin_users(id) ON DELETE NO ACTION
);
GO

CREATE INDEX IDX_historial_miembro ON historial_cambios(id_miembro);
CREATE INDEX IDX_historial_fecha ON historial_cambios(fecha_cambio);
GO

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS - POSTULANTES
-- =============================================

-- SP1: Registrar postulante desde formulario web
CREATE OR ALTER PROCEDURE SP_REGISTRAR_POSTULANTE
    @nombre NVARCHAR(50),
    @apellido NVARCHAR(50),
    @dni CHAR(8),
    @fecha_nacimiento DATE,
    @genero NVARCHAR(10),
    @email NVARCHAR(100),
    @telefono CHAR(9),
    @direccion NVARCHAR(200),
    @departamento NVARCHAR(50),
    @distrito NVARCHAR(50),
    @nivel_educativo NVARCHAR(20),
    @profesion NVARCHAR(100),
    @motivacion NVARCHAR(500),
    @experiencia BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        IF EXISTS (SELECT 1 FROM postulantes WHERE dni = @dni)
            THROW 50001, 'El DNI ya est� registrado', 1;
        
        IF EXISTS (SELECT 1 FROM postulantes WHERE email = @email)
            THROW 50002, 'El Email ya est� registrado', 1;
        
        INSERT INTO postulantes 
        (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono,
         direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
        VALUES 
        (@nombre, @apellido, @dni, @fecha_nacimiento, @genero, @email, @telefono,
         @direccion, @departamento, @distrito, @nivel_educativo, @profesion, @motivacion, @experiencia);
        
        DECLARE @new_id INT = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        SELECT 'SUCCESS' AS status, @new_id AS id_postulante;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- SP2: Listar postulantes
CREATE OR ALTER PROCEDURE SP_LISTAR_POSTULANTES
    @busqueda NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        p.id,
        p.nombre,
        p.apellido,
        CONCAT(p.apellido, ' ', p.nombre) AS nombre_completo,
        p.dni,
        p.email,
        p.telefono,
        p.departamento,
        p.distrito,
        p.profesion,
        p.nivel_educativo,
        p.fecha_registro,
        CASE 
            WHEN EXISTS (SELECT 1 FROM miembros m WHERE m.id_postulante = p.id) 
            THEN 1 ELSE 0 
        END AS ya_es_miembro
    FROM postulantes p
    WHERE @busqueda IS NULL OR 
          p.nombre LIKE '%' + @busqueda + '%' OR 
          p.apellido LIKE '%' + @busqueda + '%' OR 
          p.dni LIKE '%' + @busqueda + '%'
    ORDER BY p.fecha_registro DESC;
END
GO

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS - MIEMBROS
-- =============================================

-- SP3: Registrar miembro NUEVO (no viene de postulante)
CREATE OR ALTER PROCEDURE SP_REGISTRAR_MIEMBRO_NUEVO
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
    @legajo NVARCHAR(20),
    @rango NVARCHAR(50),
    @jefatura NVARCHAR(100),
    @estado NVARCHAR(20) = 'Activo',
    @cursos_certificaciones NVARCHAR(MAX) = NULL,
    @admin_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        IF EXISTS (SELECT 1 FROM miembros WHERE dni = @dni)
            THROW 50010, 'El DNI ya est� registrado como miembro', 1;
        
        IF EXISTS (SELECT 1 FROM miembros WHERE legajo = @legajo)
            THROW 50011, 'El n�mero de legajo ya existe', 1;
        
        INSERT INTO miembros
        (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono,
         direccion, departamento, distrito, profesion,
         legajo, rango, jefatura, estado, cursos_certificaciones,
         creado_por, modificado_por)
        VALUES
        (@nombre, @apellido, @dni, @fecha_nacimiento, @genero, @email, @telefono,
         @direccion, @departamento, @distrito, @profesion,
         @legajo, @rango, @jefatura, @estado, @cursos_certificaciones,
         @admin_id, @admin_id);
        
        DECLARE @new_id INT = SCOPE_IDENTITY();
        
        INSERT INTO historial_cambios 
        (id_miembro, campo_modificado, valor_nuevo, motivo, realizado_por)
        VALUES 
        (@new_id, 'CREACION', 'Miembro creado', 'Registro nuevo por administrador', @admin_id);
        
        COMMIT TRANSACTION;
        
        SELECT 'SUCCESS' AS status, @new_id AS id_miembro, @legajo AS legajo;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- SP4: Promover postulante a miembro
CREATE OR ALTER PROCEDURE SP_PROMOVER_POSTULANTE_A_MIEMBRO
    @id_postulante INT,
    @legajo NVARCHAR(20),
    @rango NVARCHAR(50),
    @jefatura NVARCHAR(100),
    @admin_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        IF NOT EXISTS (SELECT 1 FROM postulantes WHERE id = @id_postulante)
            THROW 50020, 'El postulante no existe', 1;
        
        IF EXISTS (SELECT 1 FROM miembros WHERE id_postulante = @id_postulante)
            THROW 50021, 'El postulante ya es miembro', 1;
        
        IF EXISTS (SELECT 1 FROM miembros WHERE legajo = @legajo)
            THROW 50022, 'El n�mero de legajo ya existe', 1;
        
        DECLARE @nombre NVARCHAR(50), @apellido NVARCHAR(50), @dni CHAR(8),
                @fecha_nacimiento DATE, @genero NVARCHAR(10), @email NVARCHAR(100),
                @telefono CHAR(9), @direccion NVARCHAR(200), @departamento NVARCHAR(50),
                @distrito NVARCHAR(50), @profesion NVARCHAR(100);
        
        SELECT 
            @nombre = nombre, @apellido = apellido, @dni = dni,
            @fecha_nacimiento = fecha_nacimiento, @genero = genero,
            @email = email, @telefono = telefono, @direccion = direccion,
            @departamento = departamento, @distrito = distrito, @profesion = profesion
        FROM postulantes WHERE id = @id_postulante;
        
        INSERT INTO miembros
        (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono,
         direccion, departamento, distrito, profesion,
         legajo, rango, jefatura, estado, id_postulante,
         creado_por, modificado_por)
        VALUES
        (@nombre, @apellido, @dni, @fecha_nacimiento, @genero, @email, @telefono,
         @direccion, @departamento, @distrito, @profesion,
         @legajo, @rango, @jefatura, 'Activo', @id_postulante,
         @admin_id, @admin_id);
        
        DECLARE @id_miembro INT = SCOPE_IDENTITY();
        
        INSERT INTO historial_cambios 
        (id_miembro, campo_modificado, valor_nuevo, motivo, realizado_por)
        VALUES 
        (@id_miembro, 'CREACION', 'Promovido desde postulante', 
         'Postulante ID: ' + CAST(@id_postulante AS NVARCHAR), @admin_id);
        
        COMMIT TRANSACTION;
        
        SELECT 'SUCCESS' AS status, @id_miembro AS id_miembro, @legajo AS legajo;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- SP5: Actualizar miembro
CREATE OR ALTER PROCEDURE SP_ACTUALIZAR_MIEMBRO
    @id_miembro INT,
    @nombre NVARCHAR(50),
    @apellido NVARCHAR(50),
    @email NVARCHAR(100),
    @telefono CHAR(9),
    @direccion NVARCHAR(200) = NULL,
    @departamento NVARCHAR(50) = NULL,
    @distrito NVARCHAR(50) = NULL,
    @profesion NVARCHAR(100) = NULL,
    @rango NVARCHAR(50),
    @jefatura NVARCHAR(100),
    @estado NVARCHAR(20),
    @cursos_certificaciones NVARCHAR(MAX) = NULL,
    @admin_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        IF NOT EXISTS (SELECT 1 FROM miembros WHERE id = @id_miembro)
            THROW 50030, 'El miembro no existe', 1;
        
        DECLARE @rango_anterior NVARCHAR(50), @estado_anterior NVARCHAR(20);
        SELECT @rango_anterior = rango, @estado_anterior = estado 
        FROM miembros WHERE id = @id_miembro;
        
        UPDATE miembros
        SET nombre = @nombre,
            apellido = @apellido,
            email = @email,
            telefono = @telefono,
            direccion = @direccion,
            departamento = @departamento,
            distrito = @distrito,
            profesion = @profesion,
            rango = @rango,
            jefatura = @jefatura,
            estado = @estado,
            cursos_certificaciones = @cursos_certificaciones,
            fecha_ultimo_cambio = SYSUTCDATETIME(),
            modificado_por = @admin_id
        WHERE id = @id_miembro;
        
        IF @rango != @rango_anterior
        BEGIN
            INSERT INTO historial_cambios 
            (id_miembro, campo_modificado, valor_anterior, valor_nuevo, realizado_por)
            VALUES (@id_miembro, 'rango', @rango_anterior, @rango, @admin_id);
        END
        
        IF @estado != @estado_anterior
        BEGIN
            INSERT INTO historial_cambios 
            (id_miembro, campo_modificado, valor_anterior, valor_nuevo, realizado_por)
            VALUES (@id_miembro, 'estado', @estado_anterior, @estado, @admin_id);
        END
        
        COMMIT TRANSACTION;
        
        SELECT 'SUCCESS' AS status;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- SP6: Listar miembros
CREATE OR ALTER PROCEDURE SP_LISTAR_MIEMBROS
    @estado NVARCHAR(20) = NULL,
    @rango NVARCHAR(50) = NULL,
    @busqueda NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id, nombre, apellido,
        CONCAT(apellido, ' ', nombre) AS nombre_completo,
        dni, fecha_nacimiento,
        DATEDIFF(YEAR, fecha_nacimiento, GETDATE()) AS edad,
        genero, email, telefono, direccion, departamento, distrito, profesion,
        legajo, rango, jefatura, estado, cursos_certificaciones,
        fecha_ingreso, fecha_ultimo_cambio
    FROM miembros
    WHERE (@estado IS NULL OR estado = @estado)
      AND (@rango IS NULL OR rango = @rango)
      AND (@busqueda IS NULL OR 
           nombre LIKE '%' + @busqueda + '%' OR 
           apellido LIKE '%' + @busqueda + '%' OR 
           dni LIKE '%' + @busqueda + '%' OR
           legajo LIKE '%' + @busqueda + '%')
    ORDER BY apellido, nombre;
END
GO

-- SP7: Obtener miembro por ID
CREATE OR ALTER PROCEDURE SP_OBTENER_MIEMBRO_POR_ID
    @id_miembro INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM miembros WHERE id = @id_miembro;
END
GO

-- SP8: Eliminar miembro (soft delete)
CREATE OR ALTER PROCEDURE SP_ELIMINAR_MIEMBRO
    @id_miembro INT,
    @motivo NVARCHAR(500),
    @admin_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        IF NOT EXISTS (SELECT 1 FROM miembros WHERE id = @id_miembro)
            THROW 50040, 'El miembro no existe', 1;
        
        UPDATE miembros
        SET estado = 'Baja',
            fecha_ultimo_cambio = SYSUTCDATETIME(),
            modificado_por = @admin_id,
            notas = CONCAT(ISNULL(notas, ''), ' | BAJA: ', @motivo)
        WHERE id = @id_miembro;
        
        INSERT INTO historial_cambios 
        (id_miembro, campo_modificado, valor_anterior, valor_nuevo, motivo, realizado_por)
        VALUES (@id_miembro, 'estado', 'Activo', 'Baja', @motivo, @admin_id);
        
        COMMIT TRANSACTION;
        
        SELECT 'SUCCESS' AS status;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS - ESTAD�STICAS
-- =============================================

CREATE OR ALTER PROCEDURE SP_ESTADISTICAS_DASHBOARD
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        (SELECT COUNT(*) FROM postulantes) AS total_postulantes,
        (SELECT COUNT(*) FROM postulantes 
         WHERE MONTH(fecha_registro) = MONTH(GETDATE()) 
         AND YEAR(fecha_registro) = YEAR(GETDATE())) AS postulantes_mes,
        (SELECT COUNT(*) FROM miembros) AS total_miembros,
        (SELECT COUNT(*) FROM miembros WHERE estado = 'Activo') AS miembros_activos,
        (SELECT COUNT(*) FROM miembros WHERE estado = 'Suspendido') AS miembros_suspendidos,
        (SELECT COUNT(*) FROM miembros WHERE estado = 'Baja') AS miembros_baja,
        (SELECT COUNT(*) FROM instructores WHERE estado = 'Activo') AS total_instructores,
        (SELECT COUNT(*) FROM cursos WHERE estado = 'Activo') AS total_cursos,
        (SELECT COUNT(*) FROM eventos_talleres WHERE estado IN ('Programado', 'En Curso')) AS total_eventos_proximos;
END
GO

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS - PUBLICACIONES
-- =============================================

CREATE OR ALTER PROCEDURE SP_INSERTAR_ACTUALIZAR_PUBLICACION  
    @idpublicacion VARCHAR(255),  
    @titulo NVARCHAR(MAX),  
    @contenido NVARCHAR(MAX),  
    @foto VARBINARY(MAX),  
    @fecha DATETIME,  
    @creado_por VARCHAR(50)  
AS  
BEGIN  
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1 
            FROM publicaciones 
            WHERE idpublicacion = @idpublicacion
        )  
        BEGIN  
            INSERT INTO publicaciones 
            (idpublicacion, titulo, contenido, foto, fecha, creado_por)  
            VALUES 
            (@idpublicacion, @titulo, @contenido, @foto, @fecha, @creado_por);  
        END  

        COMMIT TRANSACTION;
    END TRY

    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Opcional: devolver error real
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO
CREATE OR ALTER PROCEDURE SP_LISTAR_PUBLICACIONES_PAGINADO
    @Pagina INT,
    @CantidadPorPagina INT,
    @SoloDestacadas BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@Pagina - 1) * @CantidadPorPagina;

    SELECT idpublicacion, titulo, contenido, foto, fecha, creado_por, destacada
    FROM publicaciones
    WHERE activa = 1 AND (@SoloDestacadas = 0 OR destacada = 1)
    ORDER BY destacada DESC, fecha DESC
    OFFSET @Offset ROWS FETCH NEXT @CantidadPorPagina ROWS ONLY;
END
GO
----PROCEDIMIENTO ALMACENADO BUSQUEDA DE MIEMBOR
CREATE OR ALTER PROCEDURE SP_BUSCAR_MIEMBRO
    @criterio_busqueda NVARCHAR(100)  -- Puede ser nombre, apellido o DNI
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        -- Datos personales
        m.id,
        m.nombre,
        m.apellido,
        CONCAT(m.apellido, ' ', m.nombre) AS nombre_completo,
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
        
        -- Datos de la credencial
        m.legajo,
        m.rango,
        m.jefatura,
        m.foto_perfil,
        m.codigo_qr,
        m.estado,
        m.cursos_certificaciones,
        
        -- Fechas
        m.fecha_ingreso,
        m.fecha_ultimo_cambio,
        
        -- Relaciones
        m.id_postulante,
        
        -- Tiempo en el cuerpo
        DATEDIFF(DAY, m.fecha_ingreso, GETDATE()) AS dias_en_cuerpo,
        DATEDIFF(MONTH, m.fecha_ingreso, GETDATE()) AS meses_en_cuerpo,
        DATEDIFF(YEAR, m.fecha_ingreso, GETDATE()) AS anios_en_cuerpo
        
    FROM miembros m
    WHERE m.dni = @criterio_busqueda  -- B�squeda exacta por DNI
       OR m.nombre LIKE '%' + @criterio_busqueda + '%'  -- B�squeda parcial por nombre
       OR m.apellido LIKE '%' + @criterio_busqueda + '%'  -- B�squeda parcial por apellido
       OR CONCAT(m.apellido, ' ', m.nombre) LIKE '%' + @criterio_busqueda + '%'  -- B�squeda por nombre completo
       OR m.legajo = @criterio_busqueda  -- B�squeda por legajo
    ORDER BY 
        CASE 
            WHEN m.dni = @criterio_busqueda THEN 1  -- Prioridad a coincidencia exacta de DNI
            WHEN m.legajo = @criterio_busqueda THEN 2  -- Prioridad a coincidencia exacta de legajo
            ELSE 3
        END,
        m.apellido, m.nombre;
END
GO
