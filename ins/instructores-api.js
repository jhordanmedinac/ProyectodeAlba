/**
 * ═══════════════════════════════════════════════════════════════
 * CGPVP - INTEGRACIÓN DE API CON SISTEMA EXISTENTE
 * Se integra con tu HTML sin romper funcionalidad actual
 * ═══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000/api/instructores',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
};

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('La solicitud tardó demasiado tiempo');
        }
        throw error;
    }
}

async function fetchWithRetry(url, options = {}, attempts = API_CONFIG.RETRY_ATTEMPTS) {
    try {
        return await fetchWithTimeout(url, options);
    } catch (error) {
        if (attempts <= 1) throw error;
        console.warn(`Reintentando... (${API_CONFIG.RETRY_ATTEMPTS - attempts + 1}/${API_CONFIG.RETRY_ATTEMPTS})`);
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
        return fetchWithRetry(url, options, attempts - 1);
    }
}

function manejarErrorHTTP(response) {
    if (!response.ok) {
        const errorMsgs = {
            400: 'Solicitud inválida',
            401: 'No autorizado',
            403: 'Acceso denegado',
            404: 'Recurso no encontrado',
            500: 'Error del servidor',
            503: 'Servicio no disponible'
        };
        throw new Error(errorMsgs[response.status] || `Error ${response.status}`);
    }
    return response;
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    
    const notif = document.createElement('div');
    notif.className = `notification notification-${tipo}`;
    notif.textContent = mensaje;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${tipo === 'error' ? '#dc3545' : tipo === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════
// SERVICIOS DE API
// ═══════════════════════════════════════════════════════════════

const InstructoresAPI = {
    
    async obtenerTodos() {
        try {
            const response = await fetchWithRetry(`${API_CONFIG.BASE_URL}/instructores`);
            manejarErrorHTTP(response);
            const data = await response.json();
            if (data.status === 'SUCCESS') return data.instructores;
            throw new Error('Error al obtener instructores');
        } catch (error) {
            console.error(' Error en obtenerTodos:', error);
            mostrarNotificacion('Error al cargar instructores: ' + error.message, 'error');
            throw error;
        }
    },
    
    async obtenerPorId(idInstructor) {
        try {
            if (!idInstructor) throw new Error('ID requerido');
            const response = await fetchWithRetry(`${API_CONFIG.BASE_URL}/instructores/${idInstructor}`);
            manejarErrorHTTP(response);
            const data = await response.json();
            if (data.status === 'SUCCESS') return data.instructor;
            throw new Error('Instructor no encontrado');
        } catch (error) {
            console.error(' Error en obtenerPorId:', error);
            mostrarNotificacion('Error al cargar instructor: ' + error.message, 'error');
            throw error;
        }
    },
    
    async buscar(termino) {
        try {
            if (!termino || termino.trim().length < 2) {
                throw new Error('Ingresa al menos 2 caracteres');
            }
            const terminoEncoded = encodeURIComponent(termino.trim());
            const response = await fetchWithRetry(`${API_CONFIG.BASE_URL}/instructores/buscar/${terminoEncoded}`);
            manejarErrorHTTP(response);
            const data = await response.json();
            if (data.status === 'SUCCESS') return data.instructores;
            throw new Error('Error en la búsqueda');
        } catch (error) {
            console.error(' Error en buscar:', error);
            mostrarNotificacion('Error en búsqueda: ' + error.message, 'error');
            throw error;
        }
    },
    
    async filtrarPorEspecialidad(especialidad) {
        try {
            const especialidadParam = (!especialidad || especialidad === 'todos') 
                ? 'todos' 
                : encodeURIComponent(especialidad);
            
            const response = await fetchWithRetry(
                `${API_CONFIG.BASE_URL}/instructores/especialidad/${especialidadParam}`
            );
            manejarErrorHTTP(response);
            const data = await response.json();
            if (data.status === 'SUCCESS') return data.instructores;
            throw new Error('Error al filtrar');
        } catch (error) {
            console.error(' Error en filtrarPorEspecialidad:', error);
            mostrarNotificacion('Error al filtrar: ' + error.message, 'error');
            throw error;
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// INTEGRACIÓN CON TU HTML EXISTENTE
// ═══════════════════════════════════════════════════════════════

const InstructoresUI = {
    
    async init() {
        console.log('Inicializando sistema de instructores con API...');
        
        // Cargar instructores desde la API
        await this.cargarInstructoresDesdeAPI();
        
        // Configurar búsqueda con API
        this.configurarBusquedaAPI();
        
        // Configurar filtros con API
        this.configurarFiltrosAPI();
        
        // Cargar especialidades dinámicas
        await this.cargarEspecialidadesDinamicas();
        
        console.log('Sistema API inicializado');
    },
    
    async cargarEspecialidadesDinamicas() {
        try {
            const instructores = await InstructoresAPI.obtenerTodos();
            
            // Extraer especialidades únicas
            const especialidadesSet = new Set();
            instructores.forEach(inst => {
                if (inst.especialidad) {
                    especialidadesSet.add(inst.especialidad);
                }
            });
            
            const especialidades = Array.from(especialidadesSet).sort();
            
            //  1. Actualizar el SELECT de especialidades
            const selectEspecialidad = document.getElementById('specialtyFilter');
            if (selectEspecialidad) {
                selectEspecialidad.innerHTML = '<option value="todos">Todas las especialidades</option>';
                
                especialidades.forEach(esp => {
                    const option = document.createElement('option');
                    option.value = esp;
                    option.textContent = esp;
                    selectEspecialidad.appendChild(option);
                });
                
                console.log(`✅ ${especialidades.length} especialidades cargadas en select`);
            }
            
            //  2. Actualizar el SIDEBAR de especialidades
            const sidebarList = document.querySelector('.specialty-list');
            if (sidebarList) {
                sidebarList.innerHTML = '';
                
                // Mapeo de especialidades a iconos
                const iconos = {
                    'Emergencias Médicas': 'fas fa-ambulance',
                    'Rescate Técnico': 'fas fa-mountain',
                    'Atención de Trauma': 'fas fa-user-injured',
                    'Soporte Vital Avanzado': 'fas fa-heartbeat',
                    'Cardiología': 'fas fa-heartbeat',
                    'Bomberos': 'fas fa-fire',
                    'Medicina Táctica': 'fas fa-shield-alt',
                    'Medicina Prehospitalaria': 'fas fa-truck-medical',
                    'Otros': 'fas fa-star'
                };
                
                // Agregar cada especialidad
                especialidades.forEach(esp => {
                    const li = document.createElement('li');
                    const icono = iconos[esp] || 'fas fa-certificate';
                    
                    li.innerHTML = `
                        <a href="#" class="list-link" data-filter="${esp}">
                            <i class="${icono}"></i> ${esp}
                        </a>
                    `;
                    sidebarList.appendChild(li);
                });
                
                // Agregar opción "Ver Todos" al final
                const liTodos = document.createElement('li');
                liTodos.innerHTML = `
                    <a href="#" class="list-link active" data-filter="todos">
                        <i class="fas fa-globe"></i> Ver Todos
                    </a>
                `;
                sidebarList.appendChild(liTodos);
                
                console.log(`✅ ${especialidades.length} especialidades cargadas en sidebar`);
                
                //  3. Configurar eventos en los links del sidebar
                this.configurarSidebarEspecialidades();
            }
            
            // Actualizar el select de ordenamiento si existe
            const sortFilter = document.getElementById('sortFilter');
            if (sortFilter && sortFilter.innerHTML.includes('Ordenar por')) {
                sortFilter.innerHTML = `
                    <option value="">Ordenar por</option>
                    <option value="experiencia-desc">Mayor experiencia</option>
                    <option value="experiencia-asc">Menor experiencia</option>
                    <option value="nombre-asc">Nombre (A-Z)</option>
                    <option value="nombre-desc">Nombre (Z-A)</option>
                `;
            }
            
        } catch (error) {
            console.error('Error al cargar especialidades:', error);
        }
    },
    
    configurarSidebarEspecialidades() {
        const links = document.querySelectorAll('.specialty-list .list-link');
        
        links.forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                
                // Remover clase active de todos los links
                links.forEach(l => l.classList.remove('active'));
                
                // Agregar clase active al link clickeado
                link.classList.add('active');
                
                // Obtener el filtro
                const filtro = link.getAttribute('data-filter');
                
                try {
                    this.mostrarCargando(true);
                    const instructores = await InstructoresAPI.filtrarPorEspecialidad(filtro);
                    this.renderizarInstructores(instructores);
                    
                    // Sincronizar con el select
                    const selectEspecialidad = document.getElementById('specialtyFilter');
                    if (selectEspecialidad) {
                        selectEspecialidad.value = filtro;
                    }
                    
                    const mensaje = filtro && filtro !== 'todos' 
                        ? `Mostrando: ${filtro}`
                        : 'Mostrando todos los instructores';
                    mostrarNotificacion(mensaje, 'info');
                } catch (error) {
                    console.error('Error al filtrar:', error);
                } finally {
                    this.mostrarCargando(false);
                }
            });
        });
    },
    
    async cargarInstructoresDesdeAPI() {
        try {
            const grid = document.querySelector('.instructors-grid');
            if (!grid) {
                console.warn(' Grid no encontrado, saltando carga de API');
                return;
            }
            
            console.log(' Grid encontrado:', grid);
            
            // Mostrar loading
            this.mostrarCargando(true);
            
            // Obtener datos de la API
            const instructores = await InstructoresAPI.obtenerTodos();
            console.log(' Instructores recibidos:', instructores);
            
            // Ver todos los campos del primer instructor
            if (instructores.length > 0) {
                console.log('🔍 Campos disponibles:', Object.keys(instructores[0]));
                console.log('🔍 Primer instructor completo:', instructores[0]);
            }
            
            // Limpiar grid
            grid.innerHTML = '';
            
            // Renderizar instructores
            instructores.forEach((instructor, index) => {
                if (instructor.foto) {
                    console.log(`    Primeros 80 caracteres:`, instructor.foto.substring(0, 80));
                }
                const card = this.crearCardInstructor(instructor);
                grid.appendChild(card);
            });
            
            // Verificar visibilidad
            const primeraCard = grid.querySelector('.instructor-card');
            if (primeraCard) {
                const estilos = window.getComputedStyle(primeraCard);
                console.log(`🎨 Estilos de la primera card:`, {
                    display: estilos.display,
                    visibility: estilos.visibility,
                    opacity: estilos.opacity,
                    height: estilos.height,
                    width: estilos.width
                });
            }
            
            // Activar animaciones reveal
            this.activarAnimaciones();
            
           
            
        } catch (error) {
            console.error('Error al cargar instructores:', error);
            this.mostrarError('No se pudieron cargar los instructores desde la API');
        } finally {
            this.mostrarCargando(false);
        }
    },
    
    crearCardInstructor(instructor) {
        const card = document.createElement('article');
        card.className = 'instructor-card reveal';
        card.dataset.specialty = (instructor.especialidad || 'general').toLowerCase();
        
        // Obtener iniciales del nombre
        const obtenerIniciales = (nombre) => {
            if (!nombre) return 'IN';
            const palabras = nombre.trim().split(' ');
            if (palabras.length >= 2) {
                return (palabras[0][0] + palabras[1][0]).toUpperCase();
            }
            return nombre.substring(0, 2).toUpperCase();
        };
        
        const iniciales = obtenerIniciales(instructor.nombre_completo);
        
        // SVG con iniciales como fallback
        const imagenPorDefecto = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%2300093C' width='400' height='300'/%3E%3Ccircle cx='200' cy='120' r='50' fill='%23c5a059'/%3E%3Cpath d='M 140 220 Q 140 170 200 170 Q 260 170 260 220 L 260 300 L 140 300 Z' fill='%23c5a059'/%3E%3Ctext fill='%2300093C' font-family='Arial, sans-serif' font-size='28' font-weight='bold' x='200' y='130' text-anchor='middle' dominant-baseline='middle'%3E${iniciales}%3C/text%3E%3C/svg%3E`;
        
        // Procesar la imagen - buscar en campo 'foto'
        let imagenSrc = imagenPorDefecto;
        if (instructor.foto && instructor.foto.startsWith('data:image')) {
            imagenSrc = instructor.foto;
        } else if (instructor.foto && instructor.foto.startsWith('http')) {
            imagenSrc = instructor.foto;
        }
        
        //  ESTRUCTURA EXACTA COMO LAS CARDS ORIGINALES
        card.innerHTML = `
            <div class="card-photo">
                <img src="${imagenSrc}" 
                     alt="${instructor.nombre_completo}"
                     onerror="this.src='${imagenPorDefecto}'">
                <div class="card-overlay">
                    <div class="overlay-social">
                        ${instructor.email ? `<a href="mailto:${instructor.email}"><i class="fas fa-envelope"></i></a>` : ''}
                    </div>
                </div>
            </div>
            <div class="card-body">
                <h3 class="card-name">${instructor.nombre_completo}</h3>
                <p class="card-title">
                    <i class="fas fa-stethoscope"></i> ${instructor.rango || 'Instructor'}
                </p>
                
                <!-- Nueva sección: Experiencia -->
                <div class="card-experience">
                    <i class="fas fa-briefcase"></i>
                    <span><strong>Experiencia:</strong> ${instructor.experiencia_anios || '0'} años ${instructor.especialidad ? 'en ' + instructor.especialidad.toLowerCase() : ''}</span>
                </div>
                
                <!-- Nueva sección: Certificaciones -->
                <div class="card-certifications">
                    <i class="fas fa-certificate"></i>
                    <span><strong>Certificaciones:</strong> ${instructor.certificaciones || 'No especificadas'}</span>
                </div>
                
                <!-- Botón Ver Biografía -->
                <button class="btn-bio" onclick="abrirModalAPI(${instructor.id})">
                    <i class="fas fa-user"></i> Ver Biografía
                </button>
            </div>
        `;
        
        console.log('✅ Card HTML creada para:', instructor.nombre_completo);
        
        return card;
    },
    
    configurarBusquedaAPI() {
        const searchInput = document.getElementById('searchInstructors');
        if (!searchInput) return;
        
        let timeoutId;
        searchInput.addEventListener('input', async (e) => {
            clearTimeout(timeoutId);
            const termino = e.target.value.trim();
            
            if (termino.length < 2) {
                // Si es muy corto, recargar todos
                timeoutId = setTimeout(() => this.cargarInstructoresDesdeAPI(), 300);
                return;
            }
            
            timeoutId = setTimeout(async () => {
                try {
                    this.mostrarCargando(true);
                    const instructores = await InstructoresAPI.buscar(termino);
                    this.renderizarInstructores(instructores);
                    mostrarNotificacion(`${instructores.length} instructor(es) encontrado(s)`, 'info');
                } catch (error) {
                    console.error('Error en búsqueda:', error);
                } finally {
                    this.mostrarCargando(false);
                }
            }, 500);
        });
    },
    
    configurarFiltrosAPI() {
        const specialtyFilter = document.getElementById('specialtyFilter');
        if (specialtyFilter) {
            specialtyFilter.addEventListener('change', async (e) => {
                const especialidad = e.target.value;
                try {
                    this.mostrarCargando(true);
                    const instructores = await InstructoresAPI.filtrarPorEspecialidad(especialidad);
                    this.renderizarInstructores(instructores);
                    
                    const mensaje = especialidad && especialidad !== 'todos' 
                        ? `Mostrando: ${especialidad}`
                        : 'Mostrando todos';
                    mostrarNotificacion(mensaje, 'info');
                } catch (error) {
                    console.error('Error al filtrar:', error);
                } finally {
                    this.mostrarCargando(false);
                }
            });
        }
        
        //  AGREGAR FILTRO DE ORDENAMIENTO
        const sortFilter = document.getElementById('sortFilter');
        if (sortFilter) {
            sortFilter.addEventListener('change', async (e) => {
                const ordenamiento = e.target.value;
                if (!ordenamiento) return;
                
                try {
                    this.mostrarCargando(true);
                    
                    // Obtener instructores actuales (respetando filtro de especialidad si existe)
                    const especialidadActual = specialtyFilter ? specialtyFilter.value : 'todos';
                    let instructores = await InstructoresAPI.filtrarPorEspecialidad(especialidadActual);
                    
                    // Ordenar según la opción seleccionada
                    instructores = this.ordenarInstructores(instructores, ordenamiento);
                    
                    this.renderizarInstructores(instructores);
                    
                    const mensajes = {
                        'experiencia-desc': 'Ordenado por mayor experiencia',
                        'experiencia-asc': 'Ordenado por menor experiencia',
                        'nombre-asc': 'Ordenado por nombre (A-Z)',
                        'nombre-desc': 'Ordenado por nombre (Z-A)'
                    };
                    
                    mostrarNotificacion(mensajes[ordenamiento] || 'Ordenado', 'info');
                } catch (error) {
                    console.error('Error al ordenar:', error);
                } finally {
                    this.mostrarCargando(false);
                }
            });
        }
    },
    
    ordenarInstructores(instructores, tipo) {
        const copia = [...instructores];
        
        switch(tipo) {
            case 'experiencia-desc':
                return copia.sort((a, b) => (b.experiencia_anios || 0) - (a.experiencia_anios || 0));
                
            case 'experiencia-asc':
                return copia.sort((a, b) => (a.experiencia_anios || 0) - (b.experiencia_anios || 0));
                
            case 'nombre-asc':
                return copia.sort((a, b) => 
                    (a.nombre_completo || '').localeCompare(b.nombre_completo || '')
                );
                
            case 'nombre-desc':
                return copia.sort((a, b) => 
                    (b.nombre_completo || '').localeCompare(a.nombre_completo || '')
                );
                
            default:
                return copia;
        }
    },
    
    renderizarInstructores(instructores) {
        const grid = document.querySelector('.instructors-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (!instructores || instructores.length === 0) {
            grid.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1; text-align:center; padding:60px 20px;">
                    <i class="fas fa-search" style="font-size:48px; color:#6c757d; margin-bottom:20px;"></i>
                    <p style="color:#6c757d;">No se encontraron instructores</p>
                </div>
            `;
            return;
        }
        
        instructores.forEach(instructor => {
            const card = this.crearCardInstructor(instructor);
            grid.appendChild(card);
        });
        
        this.activarAnimaciones();
    },
    
    mostrarCargando(mostrar) {
        const grid = document.querySelector('.instructors-grid');
        if (!grid) return;
        
        if (mostrar) {
            grid.innerHTML = `
                <div class="loading-spinner" style="grid-column: 1/-1; text-align:center; padding:60px 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size:48px; color:#c5a059; margin-bottom:20px;"></i>
                    <p style="color:#00093C;">Cargando instructores...</p>
                </div>
            `;
        }
    },
    
    mostrarError(mensaje) {
        const grid = document.querySelector('.instructors-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="error-message" style="grid-column: 1/-1; text-align:center; padding:60px 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size:48px; color:#dc3545; margin-bottom:20px;"></i>
                    <p style="color:#dc3545; margin-bottom:20px;">${mensaje}</p>
                    <button onclick="InstructoresUI.cargarInstructoresDesdeAPI()" 
                            style="padding:12px 24px; background:#c5a059; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600;">
                        Intentar de nuevo
                    </button>
                </div>
            `;
        }
    },
    
    activarAnimaciones() {
        const reveals = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });
        
        reveals.forEach(reveal => observer.observe(reveal));
    }
};

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN GLOBAL PARA ABRIR MODAL DESDE API
// ═══════════════════════════════════════════════════════════════

async function abrirModalAPI(idInstructor) {
    try {
        const instructor = await InstructoresAPI.obtenerPorId(idInstructor);
        
        const modal = document.getElementById('bioModal');
        const modalBody = document.getElementById('bioModalBody');
        
        if (!modal || !modalBody) {
            console.error(' Modal no encontrado');
            return;
        }
        
        // Obtener iniciales
        const obtenerIniciales = (nombre) => {
            if (!nombre) return 'IN';
            const palabras = nombre.trim().split(' ');
            if (palabras.length >= 2) {
                return (palabras[0][0] + palabras[1][0]).toUpperCase();
            }
            return nombre.substring(0, 2).toUpperCase();
        };
        
        const iniciales = obtenerIniciales(instructor.nombre_completo);
        const imagenPorDefecto = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%2300093C' width='200' height='200'/%3E%3Ccircle cx='100' cy='80' r='35' fill='%23c5a059'/%3E%3Cpath d='M 55 150 Q 55 110 100 110 Q 145 110 145 150 L 145 200 L 55 200 Z' fill='%23c5a059'/%3E%3Ctext fill='%2300093C' font-family='Arial, sans-serif' font-size='22' font-weight='bold' x='100' y='88' text-anchor='middle' dominant-baseline='middle'%3E${iniciales}%3C/text%3E%3C/svg%3E`;
        
        // Procesar imagen - campo 'foto' de la BD
        let imagenSrc = imagenPorDefecto;
        if (instructor.foto && instructor.foto.startsWith('data:image')) {
            imagenSrc = instructor.foto;
        } else if (instructor.foto && instructor.foto.startsWith('http')) {
            imagenSrc = instructor.foto;
        }
        
        modalBody.innerHTML = `
            <div class="bio-header">
                <img src="${imagenSrc}" 
                     alt="${instructor.nombre_completo}" 
                     class="bio-photo"
                     onerror="this.src='${imagenPorDefecto}'">
                <div class="bio-header-info">
                    <h2>${instructor.nombre_completo}</h2>
                    <p class="bio-title"><i class="fas fa-briefcase"></i> ${instructor.rango || 'Instructor'}</p>
                    <p class="bio-experience"><i class="fas fa-clock"></i> <strong>Experiencia:</strong> ${instructor.experiencia_anios || '0'} años</p>
                    ${instructor.email ? `<p class="bio-email"><i class="fas fa-envelope"></i> ${instructor.email}</p>` : ''}
                </div>
            </div>
            
            <div class="bio-section">
                <h3><i class="fas fa-user"></i> Biografía</h3>
                <p>${instructor.bio || 'Biografía no disponible'}</p>
            </div>
            
            ${instructor.especialidad ? `
                <div class="bio-section">
                    <h3><i class="fas fa-medal"></i> Especialidad</h3>
                    <p>${instructor.especialidad}</p>
                </div>
            ` : ''}
            
            ${instructor.certificaciones ? `
                <div class="bio-section">
                    <h3><i class="fas fa-certificate"></i> Certificaciones</h3>
                    <p>${instructor.certificaciones}</p>
                </div>
            ` : ''}
        `;
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        mostrarNotificacion('Error al cargar biografía', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════
// ESTILOS ADICIONALES
// ═══════════════════════════════════════════════════════════════

const styles = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;

if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

// ═══════════════════════════════════════════════════════════════
// INICIALIZACIÓN AUTOMÁTICA
// ═══════════════════════════════════════════════════════════════

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            InstructoresUI.init();
        });
    } else {
        InstructoresUI.init();
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.InstructoresAPI = InstructoresAPI;
    window.InstructoresUI = InstructoresUI;
    window.abrirModalAPI = abrirModalAPI;
}