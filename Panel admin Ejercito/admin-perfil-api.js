// ============================================
// CGPVP - ADMIN PERFIL API
// Consumo de endpoints de perfil del administrador
// ADAPTADO AL MODAL EXISTENTE EN admin-panel.html
// ============================================

// 🔥 Leer admin_id real desde localStorage (el que guardó el login)
const _adminData = JSON.parse(localStorage.getItem('admin_data') || '{}');
const ADMIN_ID = _adminData.admin_id;
const API_PERFIL_BASE = 'https://paramedicosdelperu.org/api/admin/perfil';

// Variables globales
let perfilActual = null;

// ============================================
// 1️⃣ CARGAR PERFIL DEL ADMIN (desde API)
// Solo se llama al abrir el modal de perfil
// ============================================
async function cargarPerfilAdmin() {
    try {
        console.log('📡 Cargando perfil del admin ID:', ADMIN_ID);
        const response = await fetch(`${API_PERFIL_BASE}/${ADMIN_ID}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const perfil = await response.json();
        perfilActual = perfil;
        console.log('✅ Perfil cargado desde API:', perfil);
        
        return perfil;

    } catch (error) {
        console.error('❌ Error al cargar perfil:', error);
        mostrarNotificacionPerfil('Error al cargar el perfil', 'error');
        return null;
    }
}

// ============================================
// 2️⃣ ACTUALIZAR UI CON DATOS DEL PERFIL
// Solo para cuando se guarda una foto nueva
// ============================================
function actualizarUIConPerfil(perfil) {
    if (!perfil) return;

    // Foto sidebar
    const avatarSidebar = document.querySelector('.sidebar-footer .profile-avatar img');
    if (avatarSidebar && perfil.foto_perfil) {
        avatarSidebar.src = perfil.foto_perfil;
        if (typeof window.originalPhoto !== 'undefined') {
            window.originalPhoto = perfil.foto_perfil;
        }
    }

    // Foto topbar
    const avatarTopbar = document.querySelector('.topbar-right .admin-avatar img');
    if (avatarTopbar && perfil.foto_perfil) {
        avatarTopbar.src = perfil.foto_perfil;
    }

    // Nombre sidebar
    const nombreSidebar = document.querySelector('.sidebar-footer .profile-info h4');
    if (nombreSidebar) {
        nombreSidebar.textContent = perfil.nombre_completo || 'Admin CGPVP';
    }

    // Rol sidebar
    const rolSidebar = document.querySelector('.sidebar-footer .profile-info p');
    if (rolSidebar) {
        rolSidebar.textContent = perfil.rol || perfil.rango || 'Administrador';
    }

    console.log('✅ UI actualizada con datos del perfil');
}

// ============================================
// 3️⃣ ABRIR MODAL DE PERFIL
// Carga datos desde la API al abrir
// ============================================
window.openProfileModal = async function() {
    try {
        console.log('🔓 Abriendo modal de perfil...');
        
        // Guardar foto original antes de cargar
        const currentPhoto = document.querySelector('.profile-avatar img');
        if (currentPhoto && typeof window.originalPhoto !== 'undefined') {
            window.originalPhoto = currentPhoto.src;
        }

        // Intentar cargar datos frescos desde la API
        const perfil = await cargarPerfilAdmin();
        
        if (!perfil) {
            // Si falla la API, usar los datos del localStorage como fallback
            console.warn('⚠️ API falló. Usando datos del localStorage...');
            const adminLocal = JSON.parse(localStorage.getItem('admin_data') || '{}');
            llenarModalConDatos(adminLocal);
            if (typeof openModal === 'function') openModal('profileModal');
            return;
        }

        // Llenar modal con datos de la API
        llenarModalConDatos(perfil);

        // Abrir modal
        if (typeof openModal === 'function') {
            openModal('profileModal');
            console.log('✅ Modal de perfil abierto');
        } else {
            console.error('❌ Función openModal no encontrada');
        }

    } catch (error) {
        console.error('❌ Error al abrir modal de perfil:', error);
        mostrarNotificacionPerfil('Error al cargar el perfil', 'error');
        if (typeof openModal === 'function') openModal('profileModal');
    }
};

// ============================================
// HELPER: Llenar campos del modal con datos
// ============================================
function llenarModalConDatos(datos) {
    const nombreInput   = document.getElementById('perfilNombreCompleto');
    const rangoInput    = document.getElementById('perfilRango');
    const emailInput    = document.getElementById('perfilEmail');
    const telefonoInput = document.getElementById('perfilTelefono');
    const cargoInput    = document.getElementById('perfilCargo');
    const fotoPreview   = document.getElementById('profilePreview');

    if (nombreInput)   nombreInput.value   = datos.nombre_completo || '';
    if (rangoInput)    rangoInput.value    = datos.rol || datos.rango || '';
    if (emailInput)    emailInput.value    = datos.email || '';
    if (telefonoInput) telefonoInput.value = datos.telefono || '';
    if (cargoInput)    cargoInput.value    = datos.cargo || 'Administrador Principal';

    // 🔥 Foto: solo desde la BD. Si no tiene, mostrar placeholder con iniciales
    if (fotoPreview) {
        if (datos.foto_perfil) {
            fotoPreview.src = datos.foto_perfil;
        } else {
            fotoPreview.src = generarAvatarPlaceholder(datos.nombre_completo || datos.username || 'A');
        }
    }

    // También actualizar sidebar y topbar
    const sidebarAvatar = document.querySelector('.sidebar-footer .profile-avatar img');
    const topbarAvatar  = document.querySelector('.topbar-right .admin-avatar img');
    const fotoSrc = datos.foto_perfil || generarAvatarPlaceholder(datos.nombre_completo || datos.username || 'A');
    if (sidebarAvatar) sidebarAvatar.src = fotoSrc;
    if (topbarAvatar)  topbarAvatar.src  = fotoSrc;

    console.log('✅ Modal llenado con datos:', datos.nombre_completo || datos.username);
}

// ============================================
// HELPER: Generar avatar con iniciales (sin archivo local)
// ============================================
function generarAvatarPlaceholder(nombre) {
    const iniciales = nombre
        .split(' ')
        .slice(0, 2)
        .map(n => n[0]?.toUpperCase() || '')
        .join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
        <rect width="120" height="120" fill="#0066cc" rx="60"/>
        <text x="50%" y="55%" text-anchor="middle" dy=".1em" font-size="48" fill="white" font-family="Inter,sans-serif" font-weight="600">${iniciales}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

// ============================================
// 4️⃣ PREVIEW DE FOTO AL SELECCIONAR ARCHIVO
// ============================================
window.previewPhoto = function(ev) {
    const file = ev.target.files[0];
    if (!file) return;

    console.log('📸 Procesando nueva foto:', file.name, file.size, 'bytes');

    if (!file.type.startsWith('image/')) {
        mostrarNotificacionPerfil('Por favor selecciona una imagen válida', 'error');
        ev.target.value = '';
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        mostrarNotificacionPerfil('La imagen no debe superar los 2MB', 'error');
        ev.target.value = '';
        return;
    }

    const reader = new FileReader();
    
    reader.onload = async function(e) {
        const fotoBase64 = e.target.result;
        console.log('✅ Imagen convertida a Base64');
        
        // Actualizar previews
        const profilePreview = document.getElementById('profilePreview');
        const sidebarAvatar  = document.querySelector('.profile-avatar img');
        const topbarAvatar   = document.querySelector('.admin-avatar img');
        
        if (profilePreview) profilePreview.src = fotoBase64;
        if (sidebarAvatar)  sidebarAvatar.src  = fotoBase64;
        if (topbarAvatar)   topbarAvatar.src   = fotoBase64;

        // Guardar en la API
        await actualizarFotoPerfil(fotoBase64);
    };

    reader.onerror = function() {
        mostrarNotificacionPerfil('Error al leer la imagen', 'error');
    };

    reader.readAsDataURL(file);
};

// ============================================
// 5️⃣ RESTAURAR FOTO ORIGINAL AL CANCELAR
// ============================================
window.restoreOriginalPhoto = function() {
    console.log('🔄 Restaurando foto original...');
    
    const profilePreview = document.getElementById('profilePreview');
    const sidebarAvatar  = document.querySelector('.profile-avatar img');
    const topbarAvatar   = document.querySelector('.admin-avatar img');
    const fileInput      = document.getElementById('photoUpload');
    
    // 🔥 La foto original viene del localStorage o de la API, nunca de un archivo local
    const adminLocal = JSON.parse(localStorage.getItem('admin_data') || '{}');
    const original = (typeof window.originalPhoto !== 'undefined' && window.originalPhoto)
        ? window.originalPhoto
        : (adminLocal.foto_perfil || null);
    
    if (profilePreview) profilePreview.src = original || generarAvatarPlaceholder(_adminData.nombre_completo || 'A');
    if (sidebarAvatar)  sidebarAvatar.src  = original || generarAvatarPlaceholder(_adminData.nombre_completo || 'A');
    if (topbarAvatar)   topbarAvatar.src   = original || generarAvatarPlaceholder(_adminData.nombre_completo || 'A');
    if (fileInput)      fileInput.value    = '';
    
    console.log('✅ Foto original restaurada');
};

// ============================================
// 6️⃣ ACTUALIZAR FOTO EN LA API
// ============================================
async function actualizarFotoPerfil(fotoBase64) {
    try {
        console.log('📤 Enviando foto a la API...');
        
        const response = await fetch(`${API_PERFIL_BASE}/foto`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: ADMIN_ID,
                foto_perfil: fotoBase64
            })
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Foto actualizada en la API:', result);
        
        if (typeof window.originalPhoto !== 'undefined') {
            window.originalPhoto = fotoBase64;
        }
        
        // Actualizar también en localStorage
        const adminLocal = JSON.parse(localStorage.getItem('admin_data') || '{}');
        adminLocal.foto_perfil = fotoBase64;
        localStorage.setItem('admin_data', JSON.stringify(adminLocal));
        
        mostrarNotificacionPerfil('Foto de perfil actualizada correctamente', 'success');
        return result;

    } catch (error) {
        console.error('❌ Error al actualizar foto:', error);
        mostrarNotificacionPerfil('Error al actualizar la foto de perfil', 'error');
        return null;
    }
}

// ============================================
// 7️⃣ GUARDAR CAMBIOS DEL PERFIL (nombre, tel)
// ============================================
async function guardarCambiosPerfil(event) {
    if (event) event.preventDefault();

    try {
        console.log('💾 Guardando cambios del perfil...');
        
        const nombreCompleto = document.getElementById('perfilNombreCompleto')?.value.trim();
        const telefono       = document.getElementById('perfilTelefono')?.value.trim();

        // TODO: Descomentar cuando tengas el endpoint de actualización completa
        /*
        const response = await fetch(`${API_PERFIL_BASE}/${ADMIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_completo: nombreCompleto, telefono: telefono })
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const result = await response.json();
        console.log('✅ Perfil actualizado:', result);
        */

        // Actualizar nombre en localStorage y sidebar inmediatamente
        if (nombreCompleto) {
            const adminLocal = JSON.parse(localStorage.getItem('admin_data') || '{}');
            adminLocal.nombre_completo = nombreCompleto;
            localStorage.setItem('admin_data', JSON.stringify(adminLocal));

            const nombreSidebar = document.querySelector('.sidebar-footer .profile-info h4');
            if (nombreSidebar) nombreSidebar.textContent = nombreCompleto;
        }

        mostrarNotificacionPerfil('Perfil actualizado correctamente', 'success');
        
        if (typeof closeModal === 'function') closeModal('profileModal');

    } catch (error) {
        console.error('❌ Error al guardar perfil:', error);
        mostrarNotificacionPerfil('Error al actualizar el perfil', 'error');
    }
}

// ============================================
// 8️⃣ NOTIFICACIONES
// ============================================
function mostrarNotificacionPerfil(mensaje, tipo = 'info') {
    if (typeof showNotification === 'function') {
        showNotification(mensaje, tipo);
        return;
    }

    const notification = document.createElement('div');
    notification.textContent = mensaje;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${tipo === 'success' ? '#43e97b' : tipo === 'error' ? '#e74c3c' : '#4facfe'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-size: 14px;
        font-weight: 500;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// 9️⃣ INICIALIZACIÓN
// 🔥 NO llamamos cargarPerfilAdmin() aquí.
//    El sidebar ya se llena con cargarDatosAdmin()
//    desde el localStorage (en admin-panel.html).
//    La API solo se consulta al abrir el modal.
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando admin-perfil-api.js...');

    // Solo conectar el formulario de perfil
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', guardarCambiosPerfil);
        console.log('✅ Formulario de perfil conectado');
    }

    console.log('✅ admin-perfil-api.js inicializado. Sidebar cargado desde localStorage.');
});

// ============================================
// CSS PARA ANIMACIONES DE NOTIFICACIONES
// ============================================
const styleAnimations = document.createElement('style');
styleAnimations.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0);    opacity: 1; }
        to   { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(styleAnimations);