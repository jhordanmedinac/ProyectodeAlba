from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from Conexiónsql import get_connection

app = FastAPI()

# ================================
# FUNCIÓN PARA EJECUTAR SP
# ================================
def ejecutar_sp(sp_nombre: str, params: tuple):
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"EXEC {sp_nombre} " + ",".join(["?"] * len(params)), params)

            if cursor.description:
                columns = [col[0] for col in cursor.description]
                rows = cursor.fetchall()
                return [dict(zip(columns, row)) for row in rows]
            return [{"status": "SUCCESS"}]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# 1️⃣ LOGIN ADMIN
# ================================
class LoginAdmin(BaseModel):
    email: str
    password: str

@app.post("/login")
def login_admin(data: LoginAdmin):
    return ejecutar_sp("SP_VALIDAR_LOGIN_ADMIN", (data.email, data.password))[0]

# ================================
# 2️⃣ CREAR ADMIN
# ================================
class CrearAdmin(BaseModel):
    username: str
    password: str
    nombre_completo: str
    email: str
    rol: str = "Editor"
    foto_perfil: str | None = None
    creado_por: int | None = None

@app.post("/crear")
def crear_admin(admin: CrearAdmin):
    return ejecutar_sp("SP_CREAR_ADMIN", (
        admin.username,
        admin.password,
        admin.nombre_completo,
        admin.email,
        admin.rol,
        admin.foto_perfil,
        admin.creado_por
    ))[0]

# ================================
# 3️⃣ ACTUALIZAR PERFIL PROPIO
# ================================
class ActualizarPerfilAdmin(BaseModel):
    admin_id: int
    nombre_completo: str | None = None
    email: str | None = None
    foto_perfil: str | None = None
    password_actual: str | None = None
    password_nuevo: str | None = None

@app.put("/perfil")
def actualizar_perfil(data: ActualizarPerfilAdmin):
    return ejecutar_sp("SP_ACTUALIZAR_PERFIL_ADMIN", (
        data.admin_id,
        data.nombre_completo,
        data.email,
        data.foto_perfil,
        data.password_actual,
        data.password_nuevo
    ))[0]

# ================================
# 4️⃣ CAMBIAR PASSWORD (SUPER ADMIN)
# ================================
class CambiarPasswordAdmin(BaseModel):
    admin_id: int
    password_nuevo: str
    modificado_por: int

@app.put("/cambiar_password")
def cambiar_password(data: CambiarPasswordAdmin):
    return ejecutar_sp("SP_CAMBIAR_PASSWORD_ADMIN", (
        data.admin_id,
        data.password_nuevo,
        data.modificado_por
    ))[0]

# ================================
# 5️⃣ LISTAR ADMINS
# ================================
@app.get("/listar")
def listar_admins(solo_activos: bool = True):
    resultado = ejecutar_sp("SP_LISTAR_ADMINS", (solo_activos,))
    return {"status": "SUCCESS", "resultados": resultado}

# ================================
# 6️⃣ ACTIVAR / DESACTIVAR ADMIN
# ================================
class CambiarEstadoAdmin(BaseModel):
    admin_id: int
    activar: bool
    modificado_por: int

@app.put("/estado")
def cambiar_estado_admin(data: CambiarEstadoAdmin):
    return ejecutar_sp("SP_CAMBIAR_ESTADO_ADMIN", (
        data.admin_id,
        data.activar,
        data.modificado_por
    ))[0]

# ================================
# 7️⃣ VERIFICAR SESIÓN
# ================================
class VerificarSesion(BaseModel):
    admin_id: int

@app.post("/verificar_sesion")
def verificar_sesion(data: VerificarSesion):
    return ejecutar_sp("SP_VERIFICAR_SESION_ADMIN", (data.admin_id,))[0]