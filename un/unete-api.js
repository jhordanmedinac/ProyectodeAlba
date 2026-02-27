// unete-api.js
// 🔥 Script para conectar el formulario con la API de FastAPI

// =============================================
// CONFIGURACIÓN DE LA API
// =============================================
const API_CONFIG = {
    baseURL: 'https://paramedicosdelperu.org',
    endpoints: {
        registrar: '/api/registro/registrar'
    }
};

// =============================================
// FUNCIÓN PRINCIPAL DE REGISTRO
// =============================================
async function enviarRegistro(formData) {
    try {
        // Mostrar loading
        mostrarLoading(true);

        // Preparar datos según el modelo PostulanteWeb
        const datosRegistro = {
            nombre: formData.get('nombre').trim(),
            apellido: formData.get('apellido').trim(),
            dni: formData.get('dni').trim(),
            fecha_nacimiento: formData.get('fechaNacimiento'),
            genero: formData.get('genero').toLowerCase(),
            email: formData.get('email').toLowerCase().trim(),
            telefono: formData.get('telefono').trim(),
            direccion: formData.get('direccion').trim(),
            departamento: formData.get('departamento').trim(),
            distrito: formData.get('distrito').trim(),
            nivel_educativo: formData.get('nivelEducativo').toLowerCase(),
            profesion: formData.get('profesion').trim(),
            motivacion: formData.get('motivacion').trim(),
            experiencia: formData.get('experiencia') === 'on',
            experiencia_detalle: formData.get('experienciaTexto')?.trim() || null
        };

        console.log('📤 Enviando datos:', datosRegistro);

        // Realizar petición a la API
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.registrar}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(datosRegistro)
        });

        // Procesar respuesta
        const resultado = await response.json();

        // Ocultar loading
        mostrarLoading(false);

        if (response.ok && resultado.status === 'SUCCESS') {
            // ✅ Registro exitoso
            console.log('✅ Registro exitoso:', resultado);
            mostrarModalExito(resultado);
            return true;
        } else {
            // ❌ Error del servidor
            console.error('❌ Error del servidor:', resultado);
            mostrarError(resultado.detail || resultado.mensaje || 'Error al registrar');
            return false;
        }

    } catch (error) {
        // ❌ Error de conexión
        console.error('❌ Error de conexión:', error);
        mostrarLoading(false);
        mostrarError('No se pudo conectar con el servidor. Verifica que la API esté funcionando.');
        return false;
    }
}

// =============================================
// FUNCIONES DE UI
// =============================================

function mostrarLoading(show) {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    if (show) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
    } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        btnText.style.display = 'block';
        btnLoading.style.display = 'none';
    }
}

function mostrarModalExito(resultado) {
    // Crear modal de éxito dinámico
    const modal = document.getElementById('confirmModal');
    const modalContent = modal.querySelector('.modal-body');
    
    modalContent.innerHTML = `
        <div class="success-animation">
            <i class="fas fa-check-circle"></i>
        </div>
        <h3>¡Registro Exitoso!</h3>
        <div class="success-details">
            <p><strong>Nombre Completo:</strong> ${resultado.nombre_completo}</p>
            <p><strong>DNI:</strong> ${resultado.dni}</p>
            <p><strong>Email:</strong> ${resultado.email}</p>
            <p><strong>Edad:</strong> ${resultado.edad} años</p>
            <p><strong>Fecha de Registro:</strong> ${new Date(resultado.fecha_registro).toLocaleDateString('es-PE')}</p>
            <p><strong>ID de Postulante:</strong> #${resultado.id_postulante}</p>
        </div>
        <p class="success-message">${resultado.mensaje}</p>
        
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Resetear formulario después de cerrar modal
    setTimeout(() => {
        document.getElementById('registroForm').reset();
    }, 1000);
}

function mostrarError(mensaje) {
    // Crear notificación de error
    const notification = document.createElement('div');
    notification.className = 'notification error-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${mensaje}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);

    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// =============================================
// VALIDACIONES MEJORADAS
// =============================================

function validarFormulario(formData) {
    const errores = [];

    // Validar edad mínima
    const fechaNacimiento = new Date(formData.get('fechaNacimiento'));
    const edad = calcularEdad(fechaNacimiento);
    if (edad < 13) {
        errores.push('Debes tener al menos 13 años para postular');
    }

    // Validar DNI único (esto se hace en el backend, pero podemos pre-validar)
    const dni = formData.get('dni');
    if (!/^\d{8}$/.test(dni)) {
        errores.push('El DNI debe tener exactamente 8 dígitos numéricos');
    }

    // Validar email
    const email = formData.get('email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errores.push('Ingresa un email válido');
    }

    // Validar teléfono
    const telefono = formData.get('telefono');
    if (!/^\d{9}$/.test(telefono)) {
        errores.push('El teléfono debe tener 9 dígitos');
    }

    // Validar experiencia
    const tieneExperiencia = formData.get('experiencia') === 'on';
    const experienciaDetalle = formData.get('experienciaTexto');
    if (tieneExperiencia && (!experienciaDetalle || experienciaDetalle.trim().length < 10)) {
        errores.push('Si tienes experiencia, debes describirla (mínimo 10 caracteres)');
    }

    return errores;
}

function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    
    return edad;
}

// =============================================
// INTEGRACIÓN CON EL FORMULARIO EXISTENTE
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registroForm');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Limpiar errores previos
            document.querySelectorAll('.form-error').forEach(error => {
                error.textContent = '';
            });
            document.querySelectorAll('.form-group').forEach(group => {
                group.classList.remove('error');
            });

            // Obtener datos del formulario
            const formData = new FormData(this);

            // Validar formulario
            const errores = validarFormulario(formData);

            if (errores.length > 0) {
                // Mostrar errores
                errores.forEach(error => {
                    mostrarError(error);
                });
                return;
            }

            // Confirmar antes de enviar
            if (!confirm('¿Confirmas que todos los datos son correctos?')) {
                return;
            }

            // Enviar a la API
            const exitoso = await enviarRegistro(formData);

            if (exitoso) {
                console.log('🎉 Registro completado exitosamente');
            }
        });
    }

    // Agregar estilos para las notificaciones si no existen
    agregarEstilosNotificaciones();
});

// =============================================
// ESTILOS PARA NOTIFICACIONES
// =============================================
function agregarEstilosNotificaciones() {
    if (document.getElementById('notification-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
        }

        .error-notification {
            border-left: 4px solid #ef4444;
        }

        .notification-content {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
        }

        .error-notification .fa-exclamation-circle {
            color: #ef4444;
            font-size: 24px;
        }

        .notification-close {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            color: #64748b;
            transition: color 0.2s;
        }

        .notification-close:hover {
            color: #ef4444;
        }

        .fade-out {
            animation: fadeOut 0.3s ease-out forwards;
        }

        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes fadeOut {
            to {
                opacity: 0;
                transform: translateX(400px);
            }
        }

        .success-animation {
            text-align: center;
            margin-bottom: 20px;
        }

        .success-animation .fa-check-circle {
            font-size: 64px;
            color: #10b981;
            animation: successPulse 0.6s ease-out;
        }

        @keyframes successPulse {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                transform: scale(1.2);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }

        .success-details {
            background: #f0fdf4;
            border: 1px solid #86efac;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
        }

        .success-details p {
            margin: 8px 0;
            color: #166534;
        }

        .success-message {
            color: #10b981;
            font-weight: 600;
            margin: 16px 0;
            text-align: center;
        }

        .info-message {
            background: #eff6ff;
            border: 1px solid #93c5fd;
            border-radius: 8px;
            padding: 12px;
            color: #1e40af;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .btn-loading {
            display: none;
            align-items: center;
            gap: 8px;
        }

        .btn-loading::after {
            content: '';
            width: 16px;
            height: 16px;
            border: 2px solid #ffffff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    
    document.head.appendChild(styles);
}

// =============================================
// EXPORTAR FUNCIONES PÚBLICAS
// =============================================
window.enviarRegistro = enviarRegistro;
window.mostrarError = mostrarError;
window.validarFormulario = validarFormulario;

console.log('🔥 API de registro cargada correctamente');