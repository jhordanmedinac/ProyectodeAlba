use DB_CGPVP2;

CREATE OR ALTER TRIGGER TR_UNICO_DESTACADO
ON publicaciones
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Verificar si en este UPDATE alguien puso destacado = 1
    IF EXISTS (
        SELECT 1
        FROM inserted
        WHERE destacada = 1
    )
    BEGIN
        -- Poner en 0 todas las demás filas excepto la(s) recién actualizada(s)
        UPDATE P
        SET destacada = 0
        FROM publicaciones P
        INNER JOIN inserted I ON P.idpublicacion <> I.idpublicacion
        WHERE I.destacada = 1;
    END
END;