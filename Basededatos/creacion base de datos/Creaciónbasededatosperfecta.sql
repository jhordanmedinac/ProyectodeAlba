-- =============================================
-- SISTEMA DE AUDITORÍA DE CONCESIONARIOS AUTOMOTRICES
-- SQL Server Database Creation Script - VERSIÓN 2.0
-- Modelo con Empresa → Marca → Concesionario → Local
-- Fecha: Febrero 2026
-- =============================================

-- Crear la base de datos
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'Summasdos')
BEGIN
    ALTER DATABASE Summasdos SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE Summasdos;
END
GO

CREATE DATABASE Summasdos;
GO

USE Summasdos;
GO

-- =============================================
-- SECCIÓN 1: ESTRUCTURA ORGANIZACIONAL
-- =============================================

-- =============================================
-- TABLA: Empresa
-- Descripción: Empresas matrices (propietarias de marcas/concesionarios)
-- =============================================
CREATE TABLE Empresa (
    id_empresa INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(200) NOT NULL,
    sector NVARCHAR(200) NOT NULL,
    estado BIT NOT NULL DEFAULT 1, -- 1 = Activo, 0 = Inactivo
    fecha_registro DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- TABLA: Marca
-- Descripción: Marcas automovilísticas que pertenecen a empresas
-- Una empresa puede tener múltiples marcas
-- =============================================
CREATE TABLE Marca (
    id_marca INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(200) NOT NULL,
    id_empresa INT NOT NULL,
    estado BIT NOT NULL DEFAULT 1, 
    fecha_registro DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Marca_Empresa FOREIGN KEY (id_empresa) 
        REFERENCES Empresa(id_empresa) ON DELETE CASCADE,
    CONSTRAINT UQ_Marca_Nombre_Empresa UNIQUE (nombre, id_empresa)
);
GO

-- =============================================
-- TABLA: Concesionario
-- Descripción: Concesionarios que pueden pertenecer a una marca específica
-- o directamente a la empresa
-- =============================================
CREATE TABLE Concesionario (
    id_concesionario INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(200) NOT NULL,
    id_empresa INT NOT NULL,
    id_marca INT NULL, -- NULL si depende directo de empresa
    estado BIT NOT NULL DEFAULT 1,
    fecha_registro DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Concesionario_Empresa FOREIGN KEY (id_empresa) 
        REFERENCES Empresa(id_empresa) ON DELETE CASCADE,
    CONSTRAINT FK_Concesionario_Marca FOREIGN KEY (id_marca) 
        REFERENCES Marca(id_marca) ON DELETE NO ACTION
);
GO

-- =============================================
-- TABLA: Local
-- Descripción: Locales físicos auditables
-- Pueden pertenecer a: Empresa, Marca o Concesionario
-- =============================================
CREATE TABLE Local (
    id_local INT IDENTITY(1,1) PRIMARY KEY,
    nombre_local NVARCHAR(200) NOT NULL,
    direccion NVARCHAR(300) NOT NULL,
    
    -- Relaciones jerárquicas (al menos id_empresa es obligatorio)
    id_empresa INT NOT NULL,
    id_marca INT NULL, -- NULL si no pertenece a marca específica
    id_concesionario INT NULL, -- NULL si no pertenece a concesionario
    estado BIT NOT NULL DEFAULT 1,
    fecha_registro DATETIME NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT FK_Local_Empresa FOREIGN KEY (id_empresa) 
        REFERENCES Empresa(id_empresa) ON DELETE CASCADE,
    CONSTRAINT FK_Local_Marca FOREIGN KEY (id_marca) 
        REFERENCES Marca(id_marca) ON DELETE NO ACTION,
    CONSTRAINT FK_Local_Concesionario FOREIGN KEY (id_concesionario) 
        REFERENCES Concesionario(id_concesionario) ON DELETE NO ACTION
);
GO

CREATE TABLE Operacion (
    id_operacion INT IDENTITY(1,1) PRIMARY KEY,
    id_local int not null,
    nombre NVARCHAR(200) NOT NULL,
    estado BIT NOT NULL DEFAULT 1, -- 1 = Activo, 0 = Inactivo
    fecha_registro DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Operacion_Local FOREIGN KEY (id_local) 
        REFERENCES Local(id_local) ON DELETE CASCADE
);
GO




-- ============================================================
-- FLUJO PLANTILLAS - Script de creación de tablas
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLA: Plantillas
-- ------------------------------------------------------------
CREATE TABLE Plantillas (
    id_plantilla            INT             PRIMARY KEY IDENTITY(1,1),
    nombre                  NVARCHAR(255)   NOT NULL,
    id_local                INT             NOT NULL,
    Capitulo                NVARCHAR(255)   NULL,
    Subcapitulo             NVARCHAR(255)   NULL,
    Porcentaje_Cumplimiento DECIMAL(5,2)    NULL DEFAULT 0,
    Estado                  BIT             NOT NULL DEFAULT 1,
    fecha_registro          DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Plantillas_Local FOREIGN KEY (id_local) 
        REFERENCES Local(id_local) ON DELETE CASCADE
);
CREATE TABLE Area (
id_area INT IDENTITY(1,1) PRIMARY KEY,
id_local int not null,
id_plantilla int null,
nombre nvarchar(200) not null,
estado bit not null default 1,
fecha_registro DATETIME NOT NULL DEFAULT GETDATE(),
CONSTRAINT FK_Area_local FOREIGN KEY (id_local) 
        REFERENCES Local(id_local) ON DELETE CASCADE,
CONSTRAINT FK_Area_plantilla FOREIGN KEY (id_plantilla) 
        REFERENCES Plantillas(id_plantilla) ON DELETE NO ACTION
);
GO
-- ------------------------------------------------------------
-- 2. TABLA: Criterios
-- ------------------------------------------------------------
CREATE TABLE Criterios (
    id_criterio      INT             PRIMARY KEY IDENTITY(1,1),
    id_area          INT             NOT NULL,
    nombre           NVARCHAR(255)   NOT NULL,
    Estado           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT FK_Criterios_area FOREIGN KEY (id_area) 
        REFERENCES Area(id_area) ON DELETE CASCADE
);
GO
-- ------------------------------------------------------------
-- 3. TABLA: Subcriterios
-- ------------------------------------------------------------
CREATE TABLE Subcriterios (
    id_subcriterio      INT             PRIMARY KEY IDENTITY(1,1),
    id_criterio         INT             NOT NULL,
    Nombre              NVARCHAR(255)   NOT NULL,
    Estado              BIT             NOT NULL DEFAULT 1,

    CONSTRAINT FK_Subcriterios_Criterios FOREIGN KEY (id_criterio) 
        REFERENCES Criterios(id_criterio) ON DELETE CASCADE
);
GO
-- ------------------------------------------------------------
-- 4. TABLA: Preguntas
-- ------------------------------------------------------------
CREATE TABLE Preguntas (
    id_pregunta     INT             PRIMARY KEY IDENTITY(1,1),
    id_area         INT             NOT NULL,
    id_criterio     INT             NULL,
    id_subcriterio  INT             NULL,
    Nombre          NVARCHAR(500)   NOT NULL,
    Peso            DECIMAL(5,2)    NULL DEFAULT 0,
    Como_Validar    NVARCHAR(500)   NULL,
    Es_SiNo         BIT             NOT NULL DEFAULT 0,  -- 1 = Si/No, 0 = Rango
    Es_Rango        BIT             NOT NULL DEFAULT 0,  -- 1 = Rango, 0 = Si/No
    Estado          BIT             NOT NULL DEFAULT 1,

    CONSTRAINT FK_Preguntas_Area FOREIGN KEY (id_area) 
        REFERENCES Area(id_area) ON DELETE CASCADE,

    CONSTRAINT FK_Preguntas_Criterios FOREIGN KEY (id_criterio) 
        REFERENCES Criterios(id_criterio),

    CONSTRAINT FK_Preguntas_Subcriterios FOREIGN KEY (id_subcriterio)
        REFERENCES Subcriterios(id_subcriterio)
);
GO
-- ------------------------------------------------------------
-- 5. TABLA: Rangos
-- ------------------------------------------------------------
CREATE TABLE Rangos (
    id_rango    INT             PRIMARY KEY IDENTITY(1,1),
    id_pregunta  INT             NOT NULL,
    Valor_A     DECIMAL(10,2)   NOT NULL,
    Valor_B     DECIMAL(10,2)   NOT NULL,
    Puntaje     DECIMAL(5,2)    NOT NULL,
    Estado      BIT             NOT NULL DEFAULT 1,

    CONSTRAINT FK_Rangos_Preguntas FOREIGN KEY (id_pregunta) 
        REFERENCES Preguntas(id_pregunta) ON DELETE CASCADE
);
-- Tabla: Usuarios
CREATE TABLE Usuarios (
    id_usuario INT PRIMARY KEY IDENTITY(1,1),

    id_empresa INT NULL,
    id_marca INT NULL,
    id_concesionario INT NULL,
    id_local INT NULL,

    rol VARCHAR(50) NOT NULL,
    nombre NVARCHAR(100) NOT NULL,
    apellido NVARCHAR(100) NOT NULL,
    contrasena NVARCHAR(255) NOT NULL,
    correo NVARCHAR(150) NOT NULL UNIQUE,
    pais NVARCHAR(100) NULL,
    dni INT,
    fecha_vencimiento_contrasena DATE NULL,
    fecha_registro DATETIME NOT NULL DEFAULT GETDATE(),
    foto NVARCHAR(255) NULL,
    Estado BIT NOT NULL DEFAULT 1,

    CONSTRAINT FK_Usuarios_Empresa 
        FOREIGN KEY (id_empresa) REFERENCES Empresa(id_empresa),

    CONSTRAINT FK_Usuarios_Marca 
        FOREIGN KEY (id_marca) REFERENCES Marca(id_marca),

    CONSTRAINT FK_Usuarios_Concesionario 
        FOREIGN KEY (id_concesionario) REFERENCES Concesionario(id_concesionario),

    CONSTRAINT FK_Usuarios_Local 
        FOREIGN KEY (id_local) REFERENCES Local(id_local)
);
GO
CREATE TABLE Permisos (
    id_permisos INT PRIMARY KEY IDENTITY(1,1),
    id_usuario INT NOT NULL,
    permiso VARCHAR(50) NOT NULL,
    CONSTRAINT FK_PERMISOS_USUARIO 
        FOREIGN KEY (id_usuario) REFERENCES Usuarios(ID_USUARIO)
);
GO
-- Tabla: Auditorias
CREATE TABLE Auditorias (
    id_auditorias             INT             PRIMARY KEY IDENTITY(1,1),
    id_plantillas             INT,
    id_usuario                INT             NOT NULL,  -- admin/auditor
    fecha_programada          DATE,
    fecha_registro            DATETIME        NOT NULL DEFAULT GETDATE(),
    porcentaje_cumplimiento   DECIMAL(5, 2),
    tipo_estado               VARCHAR(20)     NOT NULL, --Pendiente, En curso, Finalizada
    estado_activo             BIT             NOT NULL DEFAULT 1,

    CONSTRAINT fk_auditoria_plantillas FOREIGN KEY (id_plantillas)
        REFERENCES Plantillas(id_plantilla),

    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario)
        REFERENCES Usuarios(id_usuario)
);
GO
-- Tabla: Respuestas
CREATE TABLE Respuestas (
    id_respuestas   INT     PRIMARY KEY IDENTITY(1,1),
    id_preguntas    INT     NOT NULL,
    id_auditorias   INT     NOT NULL,
    puntaje         DECIMAL(5, 2),
    tipo_estado     BIT             NOT NuLL DEFAULT 1,
    estado          BIT             NOT NULL DEFAULT 1,
    fecha_registro            DATETIME        NOT NULL DEFAULT GETDATE(),


    CONSTRAINT fk_respuesta_auditoria FOREIGN KEY (id_auditorias)
        REFERENCES Auditorias(id_auditorias),

    CONSTRAINT fk_respuesta_preguntas FOREIGN KEY (id_preguntas)
        REFERENCES Preguntas(id_pregunta)
);
GO
-- Tabla: Plan_de_Accion
CREATE TABLE Plan_de_Accion (
    id_plan_accion  INT             PRIMARY KEY IDENTITY(1,1),
    id_respuestas   INT             NOT NULL,            
    id_usuario      INT             NOT NULL,
    titulo          NVARCHAR(255)   NOT NULL,
    fecha_limite    DATE,
    subsanar        BIT             NOT NULL DEFAULT 0,
    prioridad       VARCHAR(6),-- Alta, Media, Baja
    tipo_estado     VARCHAR(50),--Falta subsanar, En espera de validacion"
    estado_activo   BIT             NOT NULL DEFAULT 1,

    CONSTRAINT fk_plan_respuesta FOREIGN KEY (id_respuestas)
        REFERENCES Respuestas(id_respuestas),

    CONSTRAINT fk_plan_usuario FOREIGN KEY (id_usuario)
        REFERENCES Usuarios(id_usuario)
    
);
GO
-- Tabla: Evidencia
CREATE TABLE Evidencia (
    id_evidencia    INT     PRIMARY KEY IDENTITY(1,1),
    id_respuesta    INT     NULL,
    id_plan_accion  INT     NULL,                -- puede ser NULL
    comentario      NVARCHAR(500),
    tiene_gerente   BIT     NOT NULL,
    estado          BIT      NOT NULL DEFAULT 1,
    fecha_registro  DATETIME        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT fk_evidencia_respuesta FOREIGN KEY (id_respuesta)
        REFERENCES Respuestas(id_respuestas),

    CONSTRAINT fk_evidencia_plan_accion FOREIGN KEY (id_plan_accion)
        REFERENCES Plan_de_Accion(id_plan_accion)
);
GO
CREATE TABLE Imagenes (
    id_imagenes    INT PRIMARY KEY IDENTITY(1,1),
    id_evidencia   INT      NOT NULL,
    imagen         VARCHAR(255),
    estado         BIT      NOT NULL DEFAULT 1,
    CONSTRAINT fk_imagenes_evidencia FOREIGN KEY (id_evidencia)
        REFERENCES Evidencia(id_evidencia)
);

CREATE TABLE Responsables (
    id_responsable INT PRIMARY KEY IDENTITY(1,1),

    id_respuesta INT NOT NULL,
    nombre_responsable NVARCHAR(200) NOT NULL,
    lugar_validacion NVARCHAR(300) NOT NULL,
    fecha_registro DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Responsable_Respuesta 
        FOREIGN KEY (id_respuesta)
        REFERENCES Respuestas(id_respuestas) ON DELETE CASCADE
);
GO
CREATE INDEX IX_Responsables_Respuesta ON Responsables(id_respuesta);
-- Marca: ya tienes UNIQUE(nombre, id_empresa)
-- Concesionario: recomendable
CREATE INDEX IX_Concesionario_Empresa_Marca ON Concesionario(id_empresa, id_marca);

-- Local: recomendable
CREATE INDEX IX_Local_Empresa ON Local(id_empresa);
CREATE INDEX IX_Local_Empresa_Marca ON Local(id_empresa, id_marca);
CREATE INDEX IX_Local_Empresa_Concesionario ON Local(id_empresa, id_concesionario);

-- Operacion: recomendable
CREATE INDEX IX_Operacion_Local ON Operacion(id_local);

CREATE INDEX IX_Marca_Empresa_Estado ON Marca(id_empresa, estado);
CREATE INDEX IX_Concesionario_Empresa_Marca_Estado ON Concesionario(id_empresa, id_marca, estado);
CREATE INDEX IX_Local_Empresa_Marca_Conces_Estado ON Local(id_empresa, id_marca, id_concesionario, estado);

CREATE INDEX IX_Usuarios_Local ON Usuarios(id_local);