-- =============================================
-- DATOS DE PRUEBA - CGPVP
-- Cuerpo General de Paramédicos Voluntarios del Perú
-- =============================================

USE DB_CGPVP2;
GO

-- =============================================
-- INSERCIÓN DE DATOS: POSTULANTES
-- 15 postulantes de diferentes perfiles
-- =============================================

-- Postulante 1
INSERT INTO postulantes (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
VALUES ('Carlos', 'Mendoza', '72345678', '1998-03-15', 'masculino', 'carlos.mendoza@gmail.com', '987654321', 
'Av. Arequipa 1234', 'Lima', 'Miraflores', 'universitario', 'Estudiante de Medicina', 
'Quiero ayudar a mi comunidad y adquirir experiencia en emergencias médicas', 1);

-- Postulante 2
INSERT INTO postulantes (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
VALUES ('María', 'Torres', '73456789', '1995-07-22', 'femenino', 'maria.torres@hotmail.com', '965432187', 
'Jr. Los Pinos 567', 'Lima', 'San Isidro', 'tecnico', 'Técnica de Enfermería', 
'Tengo vocación de servicio y deseo formar parte de un equipo comprometido con salvar vidas', 1);

-- Postulante 3
INSERT INTO postulantes (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
VALUES ('Jorge', 'Ramirez', '71234567', '1992-11-08', 'masculino', 'jorge.ramirez@outlook.com', '912345678', 
'Calle Las Flores 890', 'Lima', 'San Juan de Lurigancho', 'secundaria', 'Comerciante', 
'Quiero retribuir a la sociedad y aprender primeros auxilios para ayudar en emergencias', 0);

-- Postulante 4
INSERT INTO postulantes (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
VALUES ('Ana', 'Gutierrez', '74567890', '1999-05-30', 'femenino', 'ana.gutierrez@gmail.com', '923456789', 
'Av. Universitaria 2345', 'Lima', 'Los Olivos', 'universitario', 'Estudiante de Psicología', 
'Me interesa el área de apoyo emocional en situaciones de emergencia y crisis', 0);

-- Postulante 5
INSERT INTO postulantes (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
VALUES ('Luis', 'Fernandez', '70123456', '1988-09-12', 'masculino', 'luis.fernandez@yahoo.com', '934567890', 
'Jr. Huancayo 456', 'Lima', 'La Victoria', 'tecnico', 'Técnico en Computación', 
'Quiero formar parte de una institución que ayuda a las personas en momentos críticos', 1);

-- Postulante 6
INSERT INTO postulantes (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
VALUES ('Patricia', 'Vega', '75678901', '2000-01-25', 'femenino', 'patricia.vega@gmail.com', '945678901', 
'Av. Brasil 3456', 'Lima', 'Pueblo Libre', 'universitario', 'Estudiante de Enfermería', 
'Deseo complementar mis estudios con experiencia práctica en atención de emergencias', 1);

-- Postulante 7
INSERT INTO postulantes (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
VALUES ('Roberto', 'Castro', '72567890', '1994-06-18', 'masculino', 'roberto.castro@hotmail.com', '956789012', 
'Calle Los Olivos 789', 'Lima', 'San Miguel', 'tecnico', 'Técnico Paramédico', 
'Cuento con formación y quiero poner mis conocimientos al servicio de la comunidad', 1);

-- Postulante 8
INSERT INTO postulantes (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
VALUES ('Carmen', 'Silva', '73678901', '1997-04-03', 'femenino', 'carmen.silva@gmail.com', '967890123', 
'Av. La Marina 1234', 'Lima', 'San Miguel', 'universitario', 'Abogada', 
'Quiero desarrollar habilidades en primeros auxilios y contribuir con mi tiempo libre', 0);

-- Postulante 9
INSERT INTO postulantes (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
VALUES ('Miguel', 'Rojas', '71345678', '1991-12-20', 'masculino', 'miguel.rojas@outlook.com', '978901234', 
'Jr. Ancash 567', 'Lima', 'Cercado de Lima', 'postgrado', 'Médico Cirujano', 
'Deseo colaborar con mi experiencia profesional en situaciones de emergencia', 1);

-- Postulante 10
INSERT INTO postulantes (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
VALUES ('Rosa', 'Palacios', '74789012', '1996-08-14', 'femenino', 'rosa.palacios@gmail.com', '989012345', 
'Av. Javier Prado 4567', 'Lima', 'San Borja', 'tecnico', 'Técnica en Radiología', 
'Me motiva ayudar a las personas y aprender más sobre atención pre-hospitalaria', 0);

-- Postulante 11
INSERT INTO postulantes (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
VALUES ('Fernando', 'Diaz', '70234567', '1989-02-28', 'masculino', 'fernando.diaz@yahoo.com', '990123456', 
'Calle San Martín 234', 'Lima', 'Surquillo', 'universitario', 'Ingeniero Industrial', 
'Quiero contribuir con la sociedad y desarrollar capacidades en gestión de emergencias', 0);

-- Postulante 12
INSERT INTO postulantes (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
VALUES ('Gabriela', 'Morales', '75890123', '2001-10-05', 'femenino', 'gabriela.morales@hotmail.com', '901234567', 
'Av. Arequipa 5678', 'Lima', 'Lince', 'universitario', 'Estudiante de Biología', 
'Me apasiona ayudar a otros y aprender sobre medicina de emergencias', 0);

-- Postulante 13
INSERT INTO postulantes (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
VALUES ('Daniel', 'Flores', '72890123', '1993-07-17', 'masculino', 'daniel.flores@gmail.com', '912345670', 
'Jr. Huaraz 890', 'Lima', 'Breña', 'tecnico', 'Bombero Voluntario', 
'Tengo experiencia en rescate y quiero ampliar mis conocimientos en atención médica', 1);

-- Postulante 14
INSERT INTO postulantes (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
VALUES ('Lucia', 'Herrera', '73901234', '1998-11-29', 'femenino', 'lucia.herrera@outlook.com', '923456780', 
'Av. Venezuela 2345', 'Lima', 'Cercado de Lima', 'universitario', 'Estudiante de Trabajo Social', 
'Deseo ayudar a personas en situación vulnerable y aprender primeros auxilios', 0);

-- Postulante 15
INSERT INTO postulantes (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, nivel_educativo, profesion, motivacion, experiencia)
VALUES ('Oscar', 'Paredes', '71456789', '1990-04-11', 'masculino', 'oscar.paredes@gmail.com', '934567801', 
'Calle Lima 678', 'Lima', 'Magdalena', 'postgrado', 'Especialista en Emergencias', 
'Quiero compartir mi experiencia y formar parte de esta noble institución', 1);

GO

-- =============================================
-- INSERCIÓN DE DATOS: ADMIN_USERS
-- Primero necesitamos un admin para las relaciones FK
-- =============================================

INSERT INTO admin_users (username, password_hash, nombre_completo, email, rol, activo)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye', 'Administrador Sistema', 'admin@cgpvp.org.pe', 'Super Admin', 1);

DECLARE @admin_id INT = SCOPE_IDENTITY();

GO

-- =============================================
-- INSERCIÓN DE DATOS: MIEMBROS
-- 20 miembros activos con diferentes rangos
-- =============================================

-- Miembro 1 - Desde postulante promovido
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, id_postulante, creado_por, modificado_por)
VALUES ('Carlos', 'Mendoza', '72345678', '1998-03-15', 'masculino', 'carlos.mendoza@gmail.com', '987654321', 
        'Av. Arequipa 1234', 'Lima', 'Miraflores', 'Estudiante de Medicina',
        '00001', 'TÉCNICO PARAMÉDICO', 'BRIGADA DE EMERGENCIAS - LIMA', 'Activo', 
        'BLS, ACLS, PHTLS', 1, 1, 1);

-- Miembro 2
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('María', 'Torres', '73456789', '1995-07-22', 'femenino', 'maria.torres@hotmail.com', '965432187', 
        'Jr. Los Pinos 567', 'Lima', 'San Isidro', 'Técnica de Enfermería',
        '00002', 'TÉCNICO PARAMÉDICO', 'BRIGADA DE EMERGENCIAS - LIMA', 'Activo', 
        'BLS, Primeros Auxilios Avanzados', 1, 1);

-- Miembro 3
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Roberto', 'Castro', '72567890', '1994-06-18', 'masculino', 'roberto.castro@hotmail.com', '956789012', 
        'Calle Los Olivos 789', 'Lima', 'San Miguel', 'Técnico Paramédico',
        '00003', 'INSTRUCTOR', 'DIVISIÓN DE CAPACITACIÓN - LIMA', 'Activo', 
        'BLS Instructor, ACLS, PHTLS, ITLS', 1, 1);

-- Miembro 4
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Miguel', 'Rojas', '71345678', '1991-12-20', 'masculino', 'miguel.rojas@outlook.com', '978901234', 
        'Jr. Ancash 567', 'Lima', 'Cercado de Lima', 'Médico Cirujano',
        '00004', 'JEFE DE BRIGADA', 'BRIGADA DE EMERGENCIAS - LIMA', 'Activo', 
        'ATLS, ACLS, BLS Instructor', 1, 1);

-- Miembro 5
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Patricia', 'Vega', '75678901', '2000-01-25', 'femenino', 'patricia.vega@gmail.com', '945678901', 
        'Av. Brasil 3456', 'Lima', 'Pueblo Libre', 'Estudiante de Enfermería',
        '00005', 'PARAMÉDICO VOLUNTARIO', 'BRIGADA DE EMERGENCIAS - LIMA', 'Activo', 
        'BLS, Primeros Auxilios', 1, 1);

-- Miembro 6
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Daniel', 'Flores', '72890123', '1993-07-17', 'masculino', 'daniel.flores@gmail.com', '912345670', 
        'Jr. Huaraz 890', 'Lima', 'Breña', 'Bombero Voluntario',
        '00006', 'TÉCNICO EN RESCATE', 'DIVISIÓN DE RESCATE - LIMA', 'Activo', 
        'Rescate Vehicular, Rescate en Altura, BLS', 1, 1);

-- Miembro 7
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Oscar', 'Paredes', '71456789', '1990-04-11', 'masculino', 'oscar.paredes@gmail.com', '934567801', 
        'Calle Lima 678', 'Lima', 'Magdalena', 'Especialista en Emergencias',
        '00007', 'COORDINADOR GENERAL', 'COMANDO GENERAL - LIMA', 'Activo', 
        'ATLS, ACLS, PALS, Gestión de Desastres', 1, 1);

-- Miembro 8
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Andrea', 'Lopez', '74123456', '1997-09-08', 'femenino', 'andrea.lopez@gmail.com', '987123456', 
        'Av. Grau 1234', 'Lima', 'Barranco', 'Licenciada en Enfermería',
        '00008', 'TÉCNICO PARAMÉDICO', 'BRIGADA DE EMERGENCIAS - CALLAO', 'Activo', 
        'BLS, ACLS, Enfermería de Emergencias', 1, 1);

-- Miembro 9
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Ricardo', 'Sanchez', '70987654', '1987-05-16', 'masculino', 'ricardo.sanchez@hotmail.com', '998765432', 
        'Jr. Callao 567', 'Lima', 'Callao', 'Técnico en Emergencias',
        '00009', 'INSTRUCTOR', 'DIVISIÓN DE CAPACITACIÓN - CALLAO', 'Activo', 
        'BLS Instructor, PHTLS Instructor, Triage', 1, 1);

-- Miembro 10
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Claudia', 'Vargas', '73234567', '1995-12-03', 'femenino', 'claudia.vargas@outlook.com', '965234567', 
        'Av. Pershing 890', 'Lima', 'Jesús María', 'Psicóloga',
        '00010', 'TÉCNICO EN APOYO PSICOSOCIAL', 'DIVISIÓN DE SALUD MENTAL - LIMA', 'Activo', 
        'Primeros Auxilios Psicológicos, Crisis Intervention', 1, 1);

-- Miembro 11
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Javier', 'Quispe', '72456789', '1992-03-25', 'masculino', 'javier.quispe@gmail.com', '976543210', 
        'Calle Las Begonias 234', 'Lima', 'San Isidro', 'Ingeniero',
        '00011', 'PARAMÉDICO VOLUNTARIO', 'BRIGADA DE EMERGENCIAS - LIMA', 'Activo', 
        'BLS, Primeros Auxilios', 1, 1);

-- Miembro 12
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Elena', 'Campos', '74567123', '1996-08-19', 'femenino', 'elena.campos@yahoo.com', '954321987', 
        'Av. Petit Thouars 456', 'Lima', 'Lince', 'Técnica en Farmacia',
        '00012', 'PARAMÉDICO VOLUNTARIO', 'BRIGADA DE EMERGENCIAS - LIMA', 'Activo', 
        'BLS, Manejo de Medicamentos', 1, 1);

-- Miembro 13
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Francisco', 'Huaman', '71567890', '1988-11-11', 'masculino', 'francisco.huaman@gmail.com', '943218765', 
        'Jr. Iquitos 789', 'Lima', 'Breña', 'Conductor de Ambulancia',
        '00013', 'CONDUCTOR ESPECIALIZADO', 'DIVISIÓN DE TRANSPORTE - LIMA', 'Activo', 
        'Conducción Defensiva, BLS', 1, 1);

-- Miembro 14
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Valeria', 'Ramos', '75234567', '1999-02-14', 'femenino', 'valeria.ramos@hotmail.com', '932109876', 
        'Av. Colonial 1234', 'Lima', 'Callao', 'Estudiante de Medicina',
        '00014', 'PARAMÉDICO VOLUNTARIO', 'BRIGADA DE EMERGENCIAS - CALLAO', 'Activo', 
        'BLS, Primeros Auxilios', 1, 1);

-- Miembro 15
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Sergio', 'Medina', '70345678', '1986-07-07', 'masculino', 'sergio.medina@outlook.com', '921098765', 
        'Calle 28 de Julio 567', 'Lima', 'Miraflores', 'Médico',
        '00015', 'JEFE DE DIVISIÓN', 'DIVISIÓN MÉDICA - LIMA', 'Activo', 
        'ATLS, ACLS, PALS, Gestión de Emergencias', 1, 1);

-- Miembro 16
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Melissa', 'Cruz', '73567890', '1994-10-30', 'femenino', 'melissa.cruz@gmail.com', '910987654', 
        'Av. Tacna 890', 'Lima', 'Cercado de Lima', 'Enfermera',
        '00016', 'TÉCNICO PARAMÉDICO', 'BRIGADA DE EMERGENCIAS - LIMA', 'Activo', 
        'BLS, ACLS, Cuidados Críticos', 1, 1);

-- Miembro 17
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Alberto', 'Navarro', '72123890', '1991-01-22', 'masculino', 'alberto.navarro@yahoo.com', '998876543', 
        'Jr. Moquegua 234', 'Lima', 'La Victoria', 'Técnico Electrónico',
        '00017', 'TÉCNICO EN COMUNICACIONES', 'DIVISIÓN DE COMUNICACIONES - LIMA', 'Activo', 
        'Radiooperador, Sistemas de Comunicación', 1, 1);

-- Miembro 18
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Carolina', 'Espinoza', '74890123', '1998-06-05', 'femenino', 'carolina.espinoza@gmail.com', '987765432', 
        'Av. Arequipa 3456', 'Lima', 'San Isidro', 'Administradora',
        '00018', 'PARAMÉDICO VOLUNTARIO', 'BRIGADA DE EMERGENCIAS - LIMA', 'Activo', 
        'BLS, Primeros Auxilios', 1, 1);

-- Miembro 19
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Hector', 'Villanueva', '71890234', '1989-09-18', 'masculino', 'hector.villanueva@hotmail.com', '976654321', 
        'Calle Los Sauces 678', 'Lima', 'Surco', 'Bombero',
        '00019', 'TÉCNICO EN RESCATE', 'DIVISIÓN DE RESCATE - LIMA', 'Activo', 
        'Rescate Urbano, Rescate Acuático, BLS', 1, 1);

-- Miembro 20
INSERT INTO miembros (nombre, apellido, dni, fecha_nacimiento, genero, email, telefono, direccion, departamento, distrito, profesion,
                      legajo, rango, jefatura, estado, cursos_certificaciones, creado_por, modificado_por)
VALUES ('Diana', 'Salazar', '75456789', '2000-04-12', 'femenino', 'diana.salazar@outlook.com', '965543210', 
        'Av. Brasil 5678', 'Lima', 'Magdalena', 'Estudiante de Enfermería',
        '00020', 'PARAMÉDICO VOLUNTARIO', 'BRIGADA DE EMERGENCIAS - LIMA', 'Activo', 
        'BLS, Primeros Auxilios Básicos', 1, 1);

GO

-- =============================================
-- VERIFICACIÓN DE DATOS INSERTADOS
-- =============================================

PRINT '========================================';
PRINT 'RESUMEN DE DATOS INSERTADOS';
PRINT '========================================';
PRINT '';

DECLARE @total_postulantes INT, @total_miembros INT, @total_admins INT;

SELECT @total_postulantes = COUNT(*) FROM postulantes;
SELECT @total_miembros = COUNT(*) FROM miembros;
SELECT @total_admins = COUNT(*) FROM admin_users;

PRINT 'Total Postulantes: ' + CAST(@total_postulantes AS NVARCHAR(10));
PRINT 'Total Miembros: ' + CAST(@total_miembros AS NVARCHAR(10));
PRINT 'Total Admin Users: ' + CAST(@total_admins AS NVARCHAR(10));
PRINT '';
PRINT '========================================';
PRINT 'DATOS INSERTADOS CORRECTAMENTE';
PRINT '========================================';

GO

-- =============================================
-- CONSULTAS DE VERIFICACIÓN
-- =============================================

-- Ver todos los postulantes
SELECT 'POSTULANTES' AS Tabla, COUNT(*) AS Total FROM postulantes
UNION ALL
SELECT 'MIEMBROS', COUNT(*) FROM miembros
UNION ALL
SELECT 'ADMIN USERS', COUNT(*) FROM admin_users;

-- Ver distribución por rango
SELECT rango, COUNT(*) AS cantidad
FROM miembros
GROUP BY rango
ORDER BY cantidad DESC;

-- Ver distribución por jefatura
SELECT jefatura, COUNT(*) AS cantidad
FROM miembros
GROUP BY jefatura
ORDER BY cantidad DESC;

-- Ver postulantes que ya son miembros
SELECT 
    p.nombre + ' ' + p.apellido AS postulante,
    m.legajo,
    m.rango
FROM postulantes p
INNER JOIN miembros m ON p.id = m.id_postulante;