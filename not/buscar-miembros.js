// ============================================
// BUSCADOR DE MIEMBROS - NAVBAR CON MODAL
// ============================================

(function() {
    'use strict';
    
    // Configuración del API
    const API_BASE_URL = 'http://localhost:8000/api/miembros';
    
    // Elementos del DOM
    let searchInput = null;
    let searchBtn = null;
    let resultsContainer = null;
    let modalOverlay = null;
    
    // Debounce timer
    let searchTimeout = null;
    
    /**
     * Inicializar el buscador cuando el DOM esté listo
     */
    function init() {
        // Esperar a que el DOM esté completamente cargado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupSearcher);
        } else {
            setupSearcher();
        }
    }
    
    /**
     * Configurar el buscador
     */
    function setupSearcher() {
        searchInput = document.getElementById('navbarSearchInput');
        searchBtn = document.querySelector('.navbar-search .search-btn');
        
        if (!searchInput) {
            console.warn('⚠️ No se encontró el input de búsqueda en el navbar');
            return;
        }
        
        // Crear contenedor de resultados si no existe
        createResultsContainer();
        
        // Crear modal
        createModal();
        
        // Event listeners
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('focus', handleSearchFocus);
        searchInput.addEventListener('blur', handleSearchBlur);
        
        if (searchBtn) {
            searchBtn.addEventListener('click', handleSearchClick);
        }
        
        // Cerrar resultados al hacer click fuera
        document.addEventListener('click', handleOutsideClick);
        
        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
        
        console.log('✅ Buscador de miembros inicializado con modal');
    }
    
    /**
     * Crear contenedor para mostrar resultados
     */
    function createResultsContainer() {
        const navbarSearch = document.querySelector('.navbar-search');
        if (!navbarSearch) return;
        
        // Eliminar contenedor anterior si existe
        const oldContainer = document.getElementById('searchResults');
        if (oldContainer) {
            oldContainer.remove();
        }
        
        // Crear nuevo contenedor
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'searchResults';
        resultsContainer.className = 'search-results-dropdown';
        resultsContainer.style.display = 'none';
        
        navbarSearch.appendChild(resultsContainer);
    }
    
    /**
     * Crear modal para mostrar detalle del miembro
     */
    function createModal() {
        // Eliminar modal anterior si existe
        const oldModal = document.getElementById('memberModal');
        if (oldModal) {
            oldModal.remove();
        }
        
        // Crear nuevo modal
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'memberModal';
        modalOverlay.className = 'modal-overlay';
        modalOverlay.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <button class="modal-close" onclick="closeMemberModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="modal-member-header">
                        <div id="modalMemberPhoto"></div>
                        <div class="modal-member-info">
                            <h2 id="modalMemberName">Cargando...</h2>
                            <div id="modalMemberStatus"></div>
                        </div>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="modal-member-grid">
                        <div class="modal-info-section">
                            <div class="modal-info-item">
                                <div class="modal-info-label">
                                    <i class="fas fa-id-card"></i>
                                    DNI
                                </div>
                                <div class="modal-info-value" id="modalMemberDNI">-</div>
                            </div>
                            
                            <div class="modal-info-item">
                                <div class="modal-info-label">
                                    <i class="fas fa-hashtag"></i>
                                    Legajo
                                </div>
                                <div class="modal-info-value" id="modalMemberLegajo">-</div>
                            </div>
                            
                            <div class="modal-info-item">
                                <div class="modal-info-label">
                                    <i class="fas fa-medal"></i>
                                    Rango
                                </div>
                                <div class="modal-info-value" id="modalMemberRango">-</div>
                            </div>
                            
                            <div class="modal-info-item">
                                <div class="modal-info-label">
                                    <i class="fas fa-building"></i>
                                    Jefatura
                                </div>
                                <div class="modal-info-value" id="modalMemberJefatura">-</div>
                            </div>
                        </div>
                        
                        <div class="modal-qr-section">
                            <div class="modal-qr-title">
                                <i class="fas fa-qrcode"></i>
                                Código QR del Miembro
                            </div>
                            <div class="modal-qr-container">
                                <div id="memberQRCode"></div>
                            </div>
                            <div class="modal-qr-id" id="modalMemberID">ID: -</div>
                        </div>
                    </div>
                    
                    <div class="modal-update-date">
                        <i class="fas fa-clock"></i>
                        <span id="modalUpdateDate">Última actualización: -</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        // Event listener para cerrar al hacer click en el overlay
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
    
    /**
     * Manejar input de búsqueda (con debounce)
     */
    function handleSearchInput(e) {
        const query = e.target.value.trim();
        
        // Limpiar timeout anterior
        clearTimeout(searchTimeout);
        
        if (query.length === 0) {
            hideResults();
            return;
        }
        
        // Esperar 500ms después de que el usuario deje de escribir
        searchTimeout = setTimeout(() => {
            if (query.length >= 2) {
                buscarMiembros(query);
            }
        }, 500);
    }
    
    /**
     * Manejar focus en el input
     */
    function handleSearchFocus(e) {
        const query = e.target.value.trim();
        if (query.length >= 2 && resultsContainer.innerHTML) {
            showResults();
        }
    }
    
    /**
     * Manejar blur (pérdida de foco)
     */
    function handleSearchBlur(e) {
        // Delay para permitir clicks en los resultados
        setTimeout(() => {
            if (!resultsContainer.matches(':hover')) {
                hideResults();
            }
        }, 200);
    }
    
    /**
     * Manejar click en el botón de búsqueda
     */
    function handleSearchClick(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        
        if (query.length >= 2) {
            buscarMiembros(query);
        }
    }
    
    /**
     * Manejar clicks fuera del buscador
     */
    function handleOutsideClick(e) {
        const navbarSearch = document.querySelector('.navbar-search');
        if (navbarSearch && !navbarSearch.contains(e.target)) {
            hideResults();
        }
    }
    
    /**
     * Buscar miembros en el API
     */
    async function buscarMiembros(criterio) {
        console.log(`🔍 Buscando miembros: "${criterio}"`);
        
        // Mostrar loading
        showLoading();
        
        try {
            const response = await fetch(`${API_BASE_URL}/buscar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    criterio: criterio
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            console.log(`✅ Encontrados ${data.resultados.length} miembros`);
            
            mostrarResultados(data.resultados, criterio);
            
        } catch (error) {
            console.error('❌ Error al buscar miembros:', error);
            mostrarError('Error al realizar la búsqueda. Intenta nuevamente.');
        }
    }
    
    /**
     * Mostrar loading
     */
    function showLoading() {
        resultsContainer.innerHTML = `
            <div class="search-result-item loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Buscando...</span>
            </div>
        `;
        showResults();
    }
    
    /**
     * Mostrar error
     */
    function mostrarError(mensaje) {
        resultsContainer.innerHTML = `
            <div class="search-result-item error">
                <i class="fas fa-exclamation-circle"></i>
                <span>${mensaje}</span>
            </div>
        `;
        showResults();
    }
    
    /**
     * Mostrar resultados
     */
    function mostrarResultados(miembros, criterio) {
        if (!miembros || miembros.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-result-item no-results">
                    <i class="fas fa-search"></i>
                    <span>No se encontraron miembros con "<strong>${criterio}</strong>"</span>
                </div>
            `;
            showResults();
            return;
        }
        
        // Limitar a 10 resultados máximo
        const resultadosLimitados = miembros.slice(0, 10);
        
        let html = '';
        
        resultadosLimitados.forEach(miembro => {
            const nombre = miembro.nombre_completo || miembro.nombre || 'Sin nombre';
            const dni = miembro.dni || miembro.documento || 'Sin DNI';
            const cargo = miembro.cargo || miembro.rol || miembro.rango || 'Miembro';
            const foto = miembro.foto || miembro.imagen || null;
            const id = miembro.id || miembro.idmiembro || miembro.legajo || '';
            
            html += `
                <div class="search-result-item" data-miembro='${JSON.stringify(miembro)}'>
                    ${foto ? `<img src="${foto}" alt="${nombre}" class="result-avatar">` : 
                             `<div class="result-avatar-placeholder"><i class="fas fa-user"></i></div>`}
                    <div class="result-info">
                        <div class="result-name">${nombre}</div>
                        <div class="result-details">
                            <span class="result-dni"><i class="fas fa-id-card"></i> ${dni}</span>
                            <span class="result-cargo"><i class="fas fa-briefcase"></i> ${cargo}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Si hay más de 10 resultados, mostrar contador
        if (miembros.length > 10) {
            html += `
                <div class="search-result-footer">
                    <span>Mostrando 10 de ${miembros.length} resultados</span>
                </div>
            `;
        }
        
        resultsContainer.innerHTML = html;
        showResults();
        
        // Agregar event listeners a los resultados
        const items = resultsContainer.querySelectorAll('.search-result-item[data-miembro]');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const miembroData = JSON.parse(item.dataset.miembro);
                mostrarModalMiembro(miembroData);
            });
        });
    }
    
    /**
     * Mostrar modal con información del miembro
     */
    function mostrarModalMiembro(miembro) {
        console.log('👤 Mostrando detalle del miembro:', miembro);
        
        // Ocultar resultados de búsqueda
        hideResults();
        
        // Extraer datos del miembro (adaptar según los campos que devuelve tu SP)
        const nombre = miembro.nombre_completo || miembro.nombre || 'Sin nombre';
        const apellido = miembro.apellido || '';
        const nombreCompleto = miembro.nombre_completo || 'Sin nombre';
        
        const dni = miembro.dni || miembro.documento || 'No registrado';
        const legajo = miembro.legajo || miembro.id || miembro.idmiembro || 'No asignado';
        const rango = miembro.rango || miembro.cargo || miembro.rol || 'No especificado';
        const jefatura = miembro.jefatura || miembro.departamento || miembro.area || 'No asignado';
        const estado = (miembro.estado || 'activo').toLowerCase();
        const fechaActualizacion = miembro.fecha_actualizacion || miembro.updated_at || miembro.fecha_modificacion || new Date().toLocaleString('es-PE');
        const foto = miembro.foto || miembro.imagen || null;
        const id = legajo; // Usaremos el legajo como ID para el QR
        
        // Actualizar foto
        const photoContainer = document.getElementById('modalMemberPhoto');
        if (foto) {
            photoContainer.innerHTML = `<img src="${foto}" alt="${nombreCompleto}" class="modal-member-photo">`;
        } else {
            photoContainer.innerHTML = `<div class="modal-member-photo-placeholder"><i class="fas fa-user"></i></div>`;
        }
        
        // Actualizar nombre
        document.getElementById('modalMemberName').textContent = nombreCompleto;
        
        // Actualizar estado
        const statusContainer = document.getElementById('modalMemberStatus');
        let statusIcon = 'fa-check-circle';
        let statusClass = 'activo';
        let statusText = 'ACTIVO';
        
        if (estado === 'baja' || estado === 'inactivo') {
            statusIcon = 'fa-times-circle';
            statusClass = 'baja';
            statusText = 'BAJA';
        } else if (estado === 'suspendido') {
            statusIcon = 'fa-pause-circle';
            statusClass = 'suspendido';
            statusText = 'SUSPENDIDO';
        }
        
        statusContainer.innerHTML = `
            <div class="modal-member-status ${statusClass}">
                <i class="fas ${statusIcon}"></i>
                ${statusText}
            </div>
        `;
        
        // Actualizar información
        document.getElementById('modalMemberDNI').textContent = dni;
        document.getElementById('modalMemberLegajo').textContent = legajo;
        document.getElementById('modalMemberRango').textContent = rango;
        document.getElementById('modalMemberJefatura').textContent = jefatura;
        document.getElementById('modalMemberID').textContent = `ID: ${id}`;
        
        // Actualizar fecha de actualización
        document.getElementById('modalUpdateDate').textContent = `Última actualización: ${fechaActualizacion}`;
        
        // Generar código QR
        generarQR(id);
        
        // Mostrar modal
        openModal();
    }
    
    /**
     * Generar código QR usando QRCode.js
     */
    function generarQR(id) {
        const qrContainer = document.getElementById('memberQRCode');
        
        // Limpiar QR anterior
        qrContainer.innerHTML = '';
        
        // Verificar si QRCode está disponible
        if (typeof QRCode === 'undefined') {
            console.warn('⚠️ Librería QRCode no encontrada, cargando desde CDN...');
            
            // Cargar la librería dinámicamente
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
            script.onload = () => {
                console.log('✅ Librería QRCode cargada');
                crearQR(qrContainer, id);
            };
            script.onerror = () => {
                console.error('❌ Error al cargar QRCode.js');
                qrContainer.innerHTML = '<p style="color: #dc3545;">Error al generar QR</p>';
            };
            document.head.appendChild(script);
        } else {
            crearQR(qrContainer, id);
        }
    }
    
    /**
     * Crear el QR con QRCode.js
     */
    function crearQR(container, id) {
        try {
            new QRCode(container, {
                text: id.toString(),
                width: 200,
                height: 200,
                colorDark: "#00093C",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            console.log('✅ Código QR generado para ID:', id);
        } catch (error) {
            console.error('❌ Error al generar QR:', error);
            container.innerHTML = '<p style="color: #dc3545;">Error al generar QR</p>';
        }
    }
    
    /**
     * Abrir modal
     */
    function openModal() {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }
    
    /**
     * Cerrar modal
     */
    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restaurar scroll
    }
    
    /**
     * Exponer función para cerrar modal globalmente
     */
    window.closeMemberModal = closeModal;
    
    /**
     * Mostrar contenedor de resultados
     */
    function showResults() {
        resultsContainer.style.display = 'block';
    }
    
    /**
     * Ocultar contenedor de resultados
     */
    function hideResults() {
        resultsContainer.style.display = 'none';
    }
    
    // Inicializar
    init();
    
})();