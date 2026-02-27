/**
 * ========================================
 * 🔥 CLIENTE API CGPVP2 - Rey Edition 🔥
 * ========================================
 * Archivo para consumir todos los endpoints del backend FastAPI
 * Incluye manejo de errores, autenticación y helpers
 */

// ====================================
// CONFIGURACIÓN BASE
// ====================================
const API_CONFIG = {
    baseURL: 'https://paramedicosdelperu.org/api',  // Cambiar en producción
    timeout: 30000,  // 30 segundos
    headers: {
        'Content-Type': 'application/json'
    }
};

// ====================================
// HELPERS GENERALES
// ====================================

/**
 * Función base para hacer peticiones HTTP
 * @param {string} endpoint - Ruta del endpoint
 * @param {object} options - Opciones de fetch (method, body, headers)
 * @returns {Promise} - Respuesta JSON
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    
    const config = {
        method: options.method || 'GET',
        headers: {
            ...API_CONFIG.headers,
            ...options.headers
        },
        ...options
    };

    // Si hay body, convertirlo a JSON
    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, config);
        
        // Si no es exitoso, lanzar error
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                detail: `Error ${response.status}: ${response.statusText}`
            }));
            throw new Error(errorData.detail || errorData.message || 'Error en la petición');
        }

        return await response.json();
    } catch (error) {
        console.error(`❌ Error en ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Guardar token en localStorage
 */
function saveToken(token) {
    localStorage.setItem('admin_token', token);
}

/**
 * Obtener token de localStorage
 */
function getToken() {
    return localStorage.getItem('admin_token');
}

/**
 * Eliminar token (logout)
 */
function clearToken() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
}

/**
 * Guardar datos del admin
 */
function saveAdminData(adminData) {
    localStorage.setItem('admin_data', JSON.stringify(adminData));
}

/**
 * Obtener datos del admin
 */
function getAdminData() {
    const data = localStorage.getItem('admin_data');
    return data ? JSON.parse(data) : null;
}

// ====================================
// 🔐 MÓDULO LOGIN/ADMIN
// ====================================

const AdminAPI = {
    /**
     * Paso 1 del login: valida email/password y dispara el OTP por correo.
     * @param {string} email 
     * @param {string} password 
     * @returns {{ success: boolean, requires2FA?: boolean, admin_id?: number, message: string }}
     */
    async login(email, password) {
        try {
            console.log('📡 Enviando petición de login...');
            const response = await apiRequest('/admin/login', {
                method: 'POST',
                body: { email, password }
            });

            console.log('📥 Respuesta recibida:', response);

            // 🔐 Servidor pide 2FA → pasar al paso 2
            if (response.status === '2FA_REQUIRED') {
                console.log('🔐 2FA requerido para admin_id:', response.admin_id);
                return {
                    success: true,
                    requires2FA: true,
                    admin_id: response.admin_id,
                    message: response.message || 'Se envió un código a tu correo'
                };
            }

            // Flujo legacy: login directo sin 2FA (por si acaso)
            if (response.status === 'SUCCESS' || response.admin_id) {
                saveAdminData(response);
                const token = response.token || response.access_token || `temp_token_${response.admin_id}_${Date.now()}`;
                saveToken(token);
                return { success: true, requires2FA: false, data: response, message: 'Login exitoso' };
            }

            console.warn('⚠️ Login fallido:', response);
            return {
                success: false,
                message: response.mensaje || 'Credenciales inválidas'
            };
        } catch (error) {
            console.error('❌ Error en login:', error);
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Paso 2 del login: verifica el código OTP enviado al correo.
     * @param {number} admin_id 
     * @param {string} codigo   - 6 dígitos
     * @returns {{ success: boolean, data?: object, message: string }}
     */
    async verifyOTP(admin_id, codigo) {
        try {
            console.log('🔑 Verificando OTP para admin_id:', admin_id);
            const response = await apiRequest('/admin/login/verify-otp', {
                method: 'POST',
                body: { admin_id, codigo }
            });

            console.log('📥 Respuesta OTP:', response);

            if (response.status === 'LOGIN_SUCCESS') {
                // Construir objeto de sesión con los datos disponibles
                const adminData = response.admin || { admin_id };
                const token = response.token || response.access_token || `temp_token_${admin_id}_${Date.now()}`;

                saveAdminData({ ...adminData, admin_id });
                saveToken(token);

                console.log('✅ OTP verificado. Sesión iniciada.');
                return { success: true, data: adminData, message: 'Acceso concedido' };
            }

            return { success: false, message: response.detail || 'Código inválido o expirado' };
        } catch (error) {
            console.error('❌ Error verificando OTP:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Crear nuevo administrador
     */
    async crearAdmin(adminData) {
        return await apiRequest('/admin/crear', {
            method: 'POST',
            body: adminData
        });
    },

    /**
     * Actualizar perfil propio
     */
    async actualizarPerfil(data) {
        return await apiRequest('/admin/perfil', {
            method: 'PUT',
            body: data
        });
    },

    /**
     * Cambiar password (Super Admin)
     */
    async cambiarPassword(adminId, passwordNuevo, modificadoPor) {
        return await apiRequest('/admin/cambiar_password', {
            method: 'PUT',
            body: {
                admin_id: adminId,
                password_nuevo: passwordNuevo,
                modificado_por: modificadoPor
            }
        });
    },

    /**
     * Listar todos los administradores
     */
    async listarAdmins(soloActivos = true) {
        return await apiRequest(`/admin/listar?solo_activos=${soloActivos}`);
    },

    /**
     * Cambiar estado (activar/desactivar) admin
     */
    async cambiarEstado(adminId, activar, modificadoPor) {
        return await apiRequest('/admin/estado', {
            method: 'PUT',
            body: {
                admin_id: adminId,
                activar: activar,
                modificado_por: modificadoPor
            }
        });
    },

    /**
     * Verificar sesión actual
     */
    async verificarSesion(adminId) {
        return await apiRequest('/admin/verificar_sesion', {
            method: 'POST',
            body: { admin_id: adminId }
        });
    },

    /**
     * Logout (limpiar datos locales)
     */
    logout() {
        clearToken();
        window.location.href = '/';  // Redirigir al login
    }
};

// ====================================
// 📚 MÓDULO CURSOS
// ====================================

const CursosAPI = {
    /**
     * Obtener todos los cursos
     */
    async listar(soloActivos = true) {
        return await apiRequest(`/cursos/listar?solo_activos=${soloActivos}`);
    },

    /**
     * Obtener curso por ID
     */
    async obtenerPorId(cursoId) {
        return await apiRequest(`/cursos/${cursoId}`);
    },

    /**
     * Crear nuevo curso
     */
    async crear(cursoData) {
        return await apiRequest('/cursos/crear', {
            method: 'POST',
            body: cursoData
        });
    },

    /**
     * Actualizar curso
     */
    async actualizar(cursoId, cursoData) {
        return await apiRequest(`/cursos/${cursoId}`, {
            method: 'PUT',
            body: cursoData
        });
    },

    /**
     * Eliminar curso
     */
    async eliminar(cursoId) {
        return await apiRequest(`/cursos/${cursoId}`, {
            method: 'DELETE'
        });
    }
};

// ====================================
// 📰 MÓDULO NOTICIAS
// ====================================

const NoticiasAPI = {
    /**
     * Obtener todas las noticias
     */
    async listar(soloActivas = true) {
        return await apiRequest(`/noticias/listar?solo_activas=${soloActivas}`);
    },

    /**
     * Obtener noticia por ID
     */
    async obtenerPorId(noticiaId) {
        return await apiRequest(`/noticias/${noticiaId}`);
    },

    /**
     * Crear nueva noticia
     */
    async crear(noticiaData) {
        return await apiRequest('/noticias/crear', {
            method: 'POST',
            body: noticiaData
        });
    },

    /**
     * Actualizar noticia
     */
    async actualizar(noticiaId, noticiaData) {
        return await apiRequest(`/noticias/${noticiaId}`, {
            method: 'PUT',
            body: noticiaData
        });
    },

    /**
     * Eliminar noticia
     */
    async eliminar(noticiaId) {
        return await apiRequest(`/noticias/${noticiaId}`, {
            method: 'DELETE'
        });
    }
};

// ====================================
// 👨‍🏫 MÓDULO INSTRUCTORES
// ====================================

const InstructoresAPI = {
    /**
     * Obtener todos los instructores
     */
    async listar(soloActivos = true) {
        return await apiRequest(`/instructores/listar?solo_activos=${soloActivos}`);
    },

    /**
     * Obtener instructor por ID
     */
    async obtenerPorId(instructorId) {
        return await apiRequest(`/instructores/${instructorId}`);
    },

    /**
     * Crear nuevo instructor
     */
    async crear(instructorData) {
        return await apiRequest('/instructores/crear', {
            method: 'POST',
            body: instructorData
        });
    },

    /**
     * Actualizar instructor
     */
    async actualizar(instructorId, instructorData) {
        return await apiRequest(`/instructores/${instructorId}`, {
            method: 'PUT',
            body: instructorData
        });
    },

    /**
     * Eliminar instructor
     */
    async eliminar(instructorId) {
        return await apiRequest(`/instructores/${instructorId}`, {
            method: 'DELETE'
        });
    }
};

// ====================================
// 👥 MÓDULO MIEMBROS
// ====================================

const MiembrosAPI = {
    /**
     * Obtener todos los miembros
     */
    async listar(soloActivos = true) {
        return await apiRequest(`/miembros/listar?solo_activos=${soloActivos}`);
    },

    /**
     * Obtener miembro por ID
     */
    async obtenerPorId(miembroId) {
        return await apiRequest(`/miembros/${miembroId}`);
    }
};

// ====================================
// 📝 MÓDULO REGISTRO WEB
// ====================================

const RegistroAPI = {
    /**
     * Registrar nuevo usuario desde web
     */
    async registrar(registroData) {
        return await apiRequest('/registro', {
            method: 'POST',
            body: registroData
        });
    }
};

// ====================================
// 📅 MÓDULO EVENTOS
// ====================================

const EventosAPI = {
    /**
     * Listar eventos con filtros y paginación
     */
    async listar(params = {}) {
        const queryParams = new URLSearchParams();
        
        if (params.busqueda) queryParams.append('busqueda', params.busqueda);
        if (params.tipo) queryParams.append('tipo', params.tipo);
        if (params.estado) queryParams.append('estado', params.estado);
        if (params.fecha_desde) queryParams.append('fecha_desde', params.fecha_desde);
        if (params.fecha_hasta) queryParams.append('fecha_hasta', params.fecha_hasta);
        if (params.pagina) queryParams.append('pagina', params.pagina);
        if (params.por_pagina) queryParams.append('por_pagina', params.por_pagina);
        
        const query = queryParams.toString();
        return await apiRequest(`/admin/eventos${query ? '?' + query : ''}`);
    },

    /**
     * Obtener detalles de un evento
     */
    async obtenerPorId(eventoId) {
        return await apiRequest(`/admin/eventos/${eventoId}`);
    },

    /**
     * Crear nuevo evento
     */
    async crear(eventoData) {
        return await apiRequest('/admin/eventos', {
            method: 'POST',
            body: eventoData
        });
    },

    /**
     * Actualizar evento
     */
    async actualizar(eventoId, eventoData) {
        return await apiRequest(`/admin/eventos/${eventoId}`, {
            method: 'PUT',
            body: eventoData
        });
    },

    /**
     * Cambiar estado de evento
     */
    async cambiarEstado(eventoId, nuevoEstado, adminId) {
        return await apiRequest(`/admin/eventos/${eventoId}/estado`, {
            method: 'PUT',
            body: {
                nuevo_estado: nuevoEstado,
                admin_id: adminId
            }
        });
    },

    /**
     * Eliminar evento
     */
    async eliminar(eventoId, adminId) {
        return await apiRequest(`/admin/eventos/${eventoId}?admin_id=${adminId}`, {
            method: 'DELETE'
        });
    }
};

// ====================================
// 🛡️ MIDDLEWARE DE AUTENTICACIÓN
// ====================================

/**
 * Verificar si el usuario está autenticado
 * Llamar esta función en páginas protegidas
 */
async function verificarAutenticacion() {
    const adminData = getAdminData();
    
    if (!adminData || !adminData.admin_id) {
        window.location.href = '/';  // Redirigir al login
        return false;
    }

    // Verificar sesión en el backend
    try {
        const response = await AdminAPI.verificarSesion(adminData.admin_id);
        
        if (response.status !== 'SUCCESS') {
            AdminAPI.logout();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error verificando sesión:', error);
        AdminAPI.logout();
        return false;
    }
}

// ====================================
// 🎨 HELPERS DE UI
// ====================================

/**
 * Mostrar mensaje de éxito
 */
function mostrarExito(mensaje) {
    // Aquí puedes usar tu librería de notificaciones favorita
    // Por ejemplo: Toastify, SweetAlert, etc.
    console.log('✅', mensaje);
    alert(mensaje);  // Temporal - reemplazar con librería de UI
}

/**
 * Mostrar mensaje de error
 */
function mostrarError(mensaje) {
    console.error('❌', mensaje);
    alert('Error: ' + mensaje);  // Temporal - reemplazar con librería de UI
}

/**
 * Mostrar spinner de carga
 */
function mostrarCargando(mostrar = true) {
    // Implementar lógica de spinner
    const spinner = document.getElementById('spinner');
    if (spinner) {
        spinner.style.display = mostrar ? 'block' : 'none';
    }
}

// ====================================
// 📦 EXPORTAR TODO
// ====================================

// Si usas ES6 modules
// export { AdminAPI, CursosAPI, NoticiasAPI, InstructoresAPI, MiembrosAPI, RegistroAPI, verificarAutenticacion };

// Para uso en HTML directo (sin módulos)
window.API = {
    Admin: AdminAPI,   // incluye AdminAPI.login (paso 1) y AdminAPI.verifyOTP (paso 2)
    Cursos: CursosAPI,
    Noticias: NoticiasAPI,
    Instructores: InstructoresAPI,
    Miembros: MiembrosAPI,
    Registro: RegistroAPI,
    Eventos: EventosAPI,  // 🔥 AGREGADO
    verificarAuth: verificarAutenticacion,
    mostrarExito,
    mostrarError,
    mostrarCargando
};