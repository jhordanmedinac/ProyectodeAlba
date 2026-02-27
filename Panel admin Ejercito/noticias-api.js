// ============================================
// NOTICIAS API - VERSIÓN COMPLETA
// Consume TODOS los endpoints del backend
// ============================================

(function() {
'use strict';

console.log('🚀 Cargando noticias-api.js COMPLETO...');

const API_BASE_URL = 'https://paramedicosdelperu.org/api/admin/noticias';

// Variables locales (NO colisionan con otros módulos)
let paginaActual = 1;
let totalPaginas = 1;
const NOTICIAS_POR_PAGINA = 10;

// ============================================
// FUNCIÓN PRINCIPAL - CARGAR NOTICIAS
// ============================================

async function cargarNoticias(pagina = 1, busqueda = '') {
    console.log('🔵 cargarNoticias() - Página:', pagina, '| Búsqueda:', busqueda);
    
    const grid = document.querySelector('.news-grid');
    
    if (!grid) {
        console.error('❌ No se encontró .news-grid');
        return;
    }
    
    // Mostrar loading
    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px;">
            <div style="width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #00093C; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <p style="color: #666; margin-top: 20px;">Cargando noticias...</p>
        </div>
    `;
    
    try {
        const params = new URLSearchParams({
            pagina: pagina,
            por_pagina: NOTICIAS_POR_PAGINA,
            solo_activas: true,
            solo_destacadas: false
        });
        
        if (busqueda) params.append('busqueda', busqueda);
        
        const url = `${API_BASE_URL}/listar?${params}`;
        console.log('🔵 Fetching:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('🔵 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('🔵 Resultado:', result);
        
        if (result.status === 'SUCCESS') {
            console.log('✅ SUCCESS - Noticias recibidas:', result.data.length);
            
            if (result.data.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 80px;">
                        <i class="fas fa-newspaper" style="font-size: 64px; color: #ddd;"></i>
                        <h3 style="color: #666; margin: 20px 0;">No hay noticias</h3>
                        <p style="color: #999;">Crea tu primera noticia para comenzar</p>
                    </div>
                `;
                return;
            }
            
            renderNoticiasGrid(result.data);
            
            paginaActual = result.pagination.pagina_actual;
            totalPaginas = result.pagination.total_paginas;
            
            renderPaginacion(result.pagination);
            renderInfo(result.pagination);
            
        } else {
            console.error('❌ Status no es SUCCESS:', result);
            mostrarError('Error: ' + (result.mensaje || 'Error desconocido'));
        }
        
    } catch (error) {
        console.error('❌ ERROR en cargarNoticias:', error);
        mostrarError('Error de conexión: ' + error.message);
    }
}

// ============================================
// CARGAR NOTICIAS CON FILTROS DE FECHA
// ============================================

async function cargarNoticiasFiltradas(pagina = 1, desde = null, hasta = null) {
    console.log('🔵 cargarNoticiasFiltradas() - Página:', pagina, '| Desde:', desde, '| Hasta:', hasta);
    
    const grid = document.querySelector('.news-grid');
    
    if (!grid) {
        console.error('❌ No se encontró .news-grid');
        return;
    }
    
    // Mostrar loading
    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px;">
            <div style="width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #00093C; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <p style="color: #666; margin-top: 20px;">Filtrando noticias...</p>
        </div>
    `;
    
    try {
        const params = new URLSearchParams({
            pagina: pagina,
            por_pagina: NOTICIAS_POR_PAGINA,
            solo_activas: true,
            solo_destacadas: false
        });
        
        if (desde) params.append('desde', desde);
        if (hasta) params.append('hasta', hasta);
        
        // Agregar búsqueda si existe
        const searchInput = document.getElementById('searchNoticias');
        if (searchInput && searchInput.value.trim()) {
            params.append('busqueda', searchInput.value.trim());
        }
        
        const url = `${API_BASE_URL}/listar?${params}`;
        console.log('🔵 Fetching con filtros:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'SUCCESS') {
            console.log('✅ Noticias filtradas:', result.data.length);
            
            if (!result.data || result.data.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 80px;">
                        <i class="fas fa-filter" style="font-size: 64px; color: #ddd;"></i>
                        <h3 style="color: #666; margin: 20px 0;">No hay noticias en este período</h3>
                        <p style="color: #999;">Intenta con otro rango de fechas o crea una nueva noticia</p>
                    </div>
                `;
                
                // Limpiar paginación
                const paginacionInfo = document.querySelector('.pagination-info');
                const paginacionControls = document.querySelector('.pagination-controls');
                if (paginacionInfo) paginacionInfo.innerHTML = '';
                if (paginacionControls) paginacionControls.innerHTML = '';
                
                return;
            }
            
            renderNoticiasGrid(result.data);
            
            paginaActual = result.pagination.pagina_actual;
            totalPaginas = result.pagination.total_paginas;
            
            renderPaginacion(result.pagination);
            renderInfo(result.pagination);
            
        } else {
            mostrarError('Error: ' + (result.mensaje || 'Error desconocido'));
        }
        
    } catch (error) {
        console.error('❌ ERROR al filtrar:', error);
        mostrarError('Error al filtrar: ' + error.message);
    }
}

// ============================================
// RENDERIZAR GRID DE NOTICIAS
// ============================================

function renderNoticiasGrid(noticias) {
    console.log('🔵 Renderizando', noticias ? noticias.length : 0, 'noticias');
    
    const grid = document.querySelector('.news-grid');
    if (!grid) {
        console.error('❌ Grid no encontrado');
        return;
    }
    
    // Validación defensiva
    if (!noticias || !Array.isArray(noticias) || noticias.length === 0) {
        console.warn('⚠️ No hay noticias para renderizar');
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 80px;">
                <i class="fas fa-newspaper" style="font-size: 64px; color: #ddd;"></i>
                <h3 style="color: #666; margin: 20px 0;">No hay noticias</h3>
                <p style="color: #999;">Crea tu primera noticia para comenzar</p>
            </div>
        `;
        return;
    }
    
    // Placeholder en base64 (SVG)
    const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250"%3E%3Crect width="400" height="250" fill="%2300093C"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="white" text-anchor="middle" dy=".3em"%3ESin Imagen%3C/text%3E%3C/svg%3E';
    
    const html = noticias.map(n => {
        // Validar que la noticia tenga los campos necesarios
        if (!n || !n.idpublicacion) {
            console.warn('⚠️ Noticia inválida:', n);
            return '';
        }
        
        const fecha = n.fecha ? new Date(n.fecha).toLocaleDateString('es-PE', {
            year: 'numeric', month: 'long', day: 'numeric'
        }) : 'Sin fecha';
        
        const contenido = n.contenido || '';
        const preview = contenido.length > 150 ? contenido.substring(0, 150) + '...' : contenido;
        
        // Badge según origen
        const origenBadge = n.creado_por === 'Facebook' 
            ? '<span style="position: absolute; top: 12px; left: 12px; background: #1877F2; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;"><i class="fab fa-facebook"></i> Facebook</span>'
            : '';
        
        return `
            <div class="news-card" 
                 data-id="${n.idpublicacion}"
                 data-preview="${(preview.substring(0,60) + (preview.length > 60 ? '...' : '')).replace(/"/g, '&quot;')}"
                 data-fecha="${fecha.replace(/"/g, '&quot;')}"
                 style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div class="news-image" style="position: relative; height: 200px; background: #f0f0f0;">
                    <img src="${API_BASE_URL}/foto/${n.idpublicacion}" 
                         alt="Noticia"
                         style="width: 100%; height: 100%; object-fit: cover;"
                         onerror="this.src='${placeholder}'">
                    ${origenBadge}
                    ${n.destacada ? '<span style="position: absolute; top: 12px; right: 12px; background: #FDB750; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px;">⭐ Destacada</span>' : ''}
                </div>
                <div class="news-content" style="padding: 20px;">
                    <div class="news-meta" style="display: flex; gap: 16px; font-size: 13px; color: #666; margin-bottom: 12px;">
                        <span>📅 ${fecha}</span>
                        <span>👤 ${n.creado_por || 'Admin'}</span>
                    </div>
                    <p style="color: #333; line-height: 1.6; margin-bottom: 16px;">${preview}</p>
                    <div class="news-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button onclick="verDetalleNoticia('${n.idpublicacion}')" 
                                class="btn-action btn-view"
                                title="Ver detalles">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            Ver
                        </button>
                        <button onclick="editarNoticia('${n.idpublicacion}')" 
                                class="btn-action btn-edit"
                                title="Editar noticia">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Editar
                        </button>
                        <button onclick="toggleDestacada('${n.idpublicacion}')" 
                                class="btn-action ${n.destacada ? 'btn-star-active' : 'btn-star'}"
                                title="${n.destacada ? 'Quitar de destacadas' : 'Marcar como destacada'}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="${n.destacada ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            ${n.destacada ? 'Destacada' : 'Destacar'}
                        </button>
                        <button onclick="eliminarNoticia('${n.idpublicacion}')" 
                                class="btn-action btn-delete"
                                title="Eliminar noticia">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    grid.innerHTML = html;
    console.log('✅ Grid renderizado');
}

// ============================================
// RENDERIZAR PAGINACIÓN
// ============================================

function renderPaginacion(pagination) {
    console.log('🔵 Renderizando paginación');
    
    const container = document.querySelector('.pagination-controls');
    if (!container) {
        console.warn('⚠️ .pagination-controls no encontrado');
        return;
    }
    
    const { pagina_actual, total_paginas } = pagination;
    
    let html = `
        <button onclick="cargarNoticias(${pagina_actual - 1})" 
                ${pagina_actual === 1 ? 'disabled' : ''}
                style="padding: 8px 16px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 6px;">
            ◀ Anterior
        </button>
    `;
    
    for (let i = 1; i <= total_paginas; i++) {
        if (i === 1 || i === total_paginas || (i >= pagina_actual - 1 && i <= pagina_actual + 1)) {
            html += `
                <button onclick="cargarNoticias(${i})" 
                        style="padding: 8px 16px; border: 1px solid #ddd; background: ${i === pagina_actual ? '#00093C' : 'white'}; color: ${i === pagina_actual ? 'white' : '#333'}; cursor: pointer; border-radius: 6px;">
                    ${i}
                </button>
            `;
        }
    }
    
    html += `
        <button onclick="cargarNoticias(${pagina_actual + 1})" 
                ${pagina_actual === total_paginas ? 'disabled' : ''}
                style="padding: 8px 16px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 6px;">
            Siguiente ▶
        </button>
    `;
    
    container.innerHTML = html;
    console.log('✅ Paginación renderizada');
}

// ============================================
// RENDERIZAR INFO DE PAGINACIÓN
// ============================================

function renderInfo(pagination) {
    const container = document.querySelector('.pagination-info');
    if (!container) return;
    
    const { pagina_actual, por_pagina, total_registros } = pagination;
    const desde = ((pagina_actual - 1) * por_pagina) + 1;
    const hasta = Math.min(pagina_actual * por_pagina, total_registros);
    
    container.innerHTML = `Mostrando ${desde} a ${hasta} de ${total_registros} noticias`;
}

// ============================================
// MOSTRAR ERROR
// ============================================

function mostrarError(mensaje) {
    const grid = document.querySelector('.news-grid');
    if (!grid) return;
    
    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px; background: #ffebee; border-radius: 12px;">
            <p style="color: #c62828; font-size: 18px; margin-bottom: 10px;">❌ ${mensaje}</p>
            <button onclick="cargarNoticias()" style="padding: 12px 24px; background: #00093C; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 20px;">
                🔄 Reintentar
            </button>
        </div>
    `;
}

// ============================================
// MODAL NUEVA NOTICIA
// ============================================

function showAddNewsModal() {
    console.log('📝 Abriendo modal de nueva noticia');
    
    // Limpiar formulario
    const form = document.getElementById('newsForm');
    if (form) form.reset();
    
    // Limpiar preview de imagen
    const preview = document.getElementById('newsImagePreview');
    const placeholder = document.getElementById('newsUploadPlaceholder');
    if (preview) preview.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
    
    // Cambiar título del modal
    const title = document.getElementById('newsModalTitle');
    if (title) title.textContent = 'Nueva Noticia';
    
    // Abrir modal
    openModal('newsModal');
}

// ============================================
// CREAR NOTICIA
// ============================================

async function crearNoticia(event) {
    event.preventDefault();
    console.log('📝 Creando noticia...');
    
    const contenido = document.getElementById('newsDescription').value?.trim();
    const fecha = document.getElementById('newsDate').value;
    const destacada = document.getElementById('newsDestacada').checked;
    const fotoFile = document.getElementById('newsImageFile')?.files[0];
    
    // Obtener admin_id del localStorage
    const adminData = JSON.parse(localStorage.getItem('admin_data') || '{}');
    const admin_id = adminData.admin_id || 1;
    
    // Validaciones
    if (!contenido) {
        showToast('El contenido es obligatorio', 'error');
        return;
    }
    
    try {
        // Usar FormData para enviar archivo + campos
        const formData = new FormData();
        formData.append('contenido', contenido);
        formData.append('destacada', destacada);
        formData.append('admin_id', admin_id);
        if (fecha && fecha.trim() !== '') formData.append('fecha', fecha);
        if (fotoFile) formData.append('foto', fotoFile);
        
        console.log('🔵 Enviando FormData (con archivo)');
        
        const response = await fetch(`${API_BASE_URL}/crear`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                // NO poner Content-Type — el browser lo setea solo con boundary
            },
            body: formData
        });
        
        console.log('🔵 Response status:', response.status);
        
        const result = await response.json();
        console.log('🔵 Response data:', result);
        
        if (!response.ok) {
            const errorMsg = result.detail || result.mensaje || `Error HTTP: ${response.status}`;
            throw new Error(errorMsg);
        }
        
        if (result.status === 'SUCCESS') {
            showToast('✅ Noticia creada correctamente', 'success');
            closeModal('newsModal');
            
            // Limpiar formulario
            document.getElementById('newsDescription').value = '';
            document.getElementById('newsDate').value = '';
            document.getElementById('newsDestacada').checked = false;
            const fileInput = document.getElementById('newsImageFile');
            if (fileInput) fileInput.value = '';
            document.getElementById('newsImagePreview').style.display = 'none';
            
            cargarNoticias(paginaActual);
        } else {
            throw new Error(result.mensaje || 'Error al crear');
        }
        
    } catch (error) {
        console.error('❌ Error al crear noticia:', error);
        showToast('Error al crear: ' + error.message, 'error');
    }
}

// ============================================
// VER DETALLE DE NOTICIA
// ============================================

async function verDetalleNoticia(id) {
    console.log('👁️ Ver detalle noticia:', id);
    
    try {
        const response = await fetch(`${API_BASE_URL}/detalle/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'SUCCESS') {
            const noticia = result.data;
            
            // Cargar datos en el modal de vista
            const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250"%3E%3Crect width="400" height="250" fill="%2300093C"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="white" text-anchor="middle" dy=".3em"%3ESin Imagen%3C/text%3E%3C/svg%3E';
            const imgEl = document.getElementById('viewNewsImage');
            imgEl.src = `${API_BASE_URL}/foto/${id}`;
            imgEl.onerror = function() { this.src = placeholder; };
            
            const fecha = new Date(noticia.fecha).toLocaleDateString('es-PE', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            document.getElementById('viewNewsDate').textContent = fecha;
            document.getElementById('viewNewsDescription').textContent = noticia.contenido;
            
            // Abrir modal
            openModal('viewNewsModal');
        } else {
            throw new Error(result.mensaje || 'Error al obtener detalle');
        }
        
    } catch (error) {
        console.error('❌ Error al ver detalle:', error);
        showToast('Error al cargar detalle: ' + error.message, 'error');
    }
}

// ============================================
// EDITAR NOTICIA
// ============================================

async function editarNoticia(id) {
    console.log('✏️ Editar noticia:', id);
    
    try {
        // Primero obtener los datos de la noticia
        const response = await fetch(`${API_BASE_URL}/detalle/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'SUCCESS') {
            const noticia = result.data;
            
            // Cargar datos en el formulario de edición
            document.getElementById('editNewsDescription').value = noticia.contenido || '';
            
            // Mostrar imagen actual desde el endpoint de foto (ahora es binario)
            const editPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250"%3E%3Crect width="400" height="250" fill="%2300093C"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="white" text-anchor="middle" dy=".3em"%3ESin Imagen%3C/text%3E%3C/svg%3E';
            const currentImgContainer = document.getElementById('editNewsCurrentImage');
            const currentImg = document.getElementById('editNewsImagePreviewImg');
            currentImg.src = `${API_BASE_URL}/foto/${id}`;
            currentImg.onload = function() { if (currentImgContainer) currentImgContainer.style.display = 'block'; };
            currentImg.onerror = function() { if (currentImgContainer) currentImgContainer.style.display = 'none'; };
            // Limpiar selección de nueva imagen
            const fileInput = document.getElementById('editNewsImageFile');
            if (fileInput) fileInput.value = '';
            document.getElementById('editNewsImagePreview').style.display = 'none';
            
            // Manejar fecha - puede venir en diferentes formatos
            if (noticia.fecha) {
                try {
                    const fechaStr = noticia.fecha.split('T')[0]; // Solo la fecha YYYY-MM-DD
                    document.getElementById('editNewsDate').value = fechaStr;
                } catch (e) {
                    console.warn('⚠️ Error al parsear fecha:', e);
                    document.getElementById('editNewsDate').value = '';
                }
            } else {
                document.getElementById('editNewsDate').value = '';
            }
            
            document.getElementById('editNewsDestacada').checked = noticia.destacada || false;
            
            // Guardar ID en un atributo del formulario
            const form = document.getElementById('editNewsForm');
            form.dataset.noticiaId = id;
            
            console.log('✅ Datos cargados en formulario de edición');
            
            // Abrir modal de edición
            openModal('editNewsModal');
        } else {
            throw new Error(result.mensaje || 'Error al obtener noticia');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar noticia para editar:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ============================================
// GUARDAR EDICIÓN
// ============================================

async function guardarEdicionNoticia(event) {
    if (event) event.preventDefault();
    
    const form = document.getElementById('editNewsForm');
    const idpublicacion = form.dataset.noticiaId;
    
    if (!idpublicacion) {
        showToast('Error: No se pudo identificar la noticia', 'error');
        return;
    }
    
    const contenido = document.getElementById('editNewsDescription').value?.trim();
    const fecha = document.getElementById('editNewsDate').value;
    const destacada = document.getElementById('editNewsDestacada').checked;
    const fotoFile = document.getElementById('editNewsImageFile')?.files[0];
    
    const adminData = JSON.parse(localStorage.getItem('admin_data') || '{}');
    const admin_id = adminData.admin_id || 1;
    
    if (!contenido) {
        showToast('El contenido es obligatorio', 'error');
        return;
    }
    
    try {
        // Usar FormData para soportar archivo opcional
        const formData = new FormData();
        formData.append('idpublicacion', idpublicacion);
        formData.append('contenido', contenido);
        formData.append('destacada', destacada);
        formData.append('admin_id', admin_id);
        if (fecha && fecha.trim() !== '') formData.append('fecha', fecha);
        if (fotoFile) formData.append('foto', fotoFile); // Solo si hay nueva imagen
        
        console.log('🔵 Enviando edición con FormData, nueva foto:', !!fotoFile);
        
        const response = await fetch(`${API_BASE_URL}/editar`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                // NO poner Content-Type
            },
            body: formData
        });
        
        console.log('🔵 Response status:', response.status);
        
        const result = await response.json();
        console.log('🔵 Response data:', result);
        
        if (!response.ok) {
            const errorMsg = result.detail || result.mensaje || `Error HTTP: ${response.status}`;
            throw new Error(errorMsg);
        }
        
        if (result.status === 'SUCCESS') {
            showToast('✅ Noticia actualizada correctamente', 'success');
            closeModal('editNewsModal');
            cargarNoticias(paginaActual);
        } else {
            throw new Error(result.mensaje || 'Error al actualizar');
        }
        
    } catch (error) {
        console.error('❌ Error al actualizar noticia:', error);
        showToast('Error al actualizar: ' + error.message, 'error');
    }
}

// ============================================
// TOGGLE DESTACADA
// ============================================

async function toggleDestacada(id) {
    console.log('⭐ Toggle destacada:', id);
    
    try {
        const response = await fetch(`${API_BASE_URL}/toggle-destacada`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idpublicacion: id })
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'SUCCESS') {
            showToast('✅ ' + result.mensaje, 'success');
            cargarNoticias(paginaActual);
        } else {
            throw new Error(result.mensaje || 'Error al actualizar');
        }
        
    } catch (error) {
        console.error('❌ Error al toggle destacada:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ============================================
// TOGGLE ACTIVA (ARCHIVAR/ACTIVAR)
// ============================================

async function toggleActiva(id) {
    console.log('📦 Toggle activa:', id);
    
    try {
        const response = await fetch(`${API_BASE_URL}/toggle-activa`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idpublicacion: id })
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'SUCCESS') {
            showToast('✅ ' + result.mensaje, 'success');
            cargarNoticias(paginaActual);
        } else {
            throw new Error(result.mensaje || 'Error al actualizar');
        }
        
    } catch (error) {
        console.error('❌ Error al toggle activa:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ============================================
// ELIMINAR NOTICIA
// ============================================

async function eliminarNoticia(id) {
    console.log('🗑️ Eliminar noticia:', id);

    // Leer datos desde data-attributes de la card
    const card    = document.querySelector(`.news-card[data-id="${id}"]`);
    const preview = card?.dataset.preview || `Noticia #${id}`;
    const fecha   = card?.dataset.fecha   || '—';

    const msgEl = document.querySelector('#deleteNoticiaModal .del-noticia-message');
    if (msgEl) {
        msgEl.innerHTML = `
            <div style="text-align:center;">
                <div class="del-noticia-avatar"><i class="fas fa-newspaper"></i></div>
                <h3 class="del-noticia-title">¿Eliminar esta noticia?</h3>
                <p class="del-noticia-subtitle">Estás a punto de <strong>eliminar permanentemente</strong> la noticia:</p>
                <div class="del-noticia-info-card">
                    <p><strong>Contenido:</strong> <span>${preview}</span></p>
                    <p><strong>Fecha:</strong> <span>${fecha}</span></p>
                </div>
                <div class="del-noticia-warning-box">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Esta acción NO SE PUEDE DESHACER. Se eliminará la noticia y todos sus datos.</p>
                </div>
            </div>`;
    }

    const modal = document.getElementById('deleteNoticiaModal');
    if (modal) modal.dataset.noticiaId = id;
    openModal('deleteNoticiaModal');
}

async function confirmarEliminarNoticia() {
    const modal = document.getElementById('deleteNoticiaModal');
    const id    = modal?.dataset.noticiaId;
    if (!id) return;

    const btn = document.getElementById('btnConfirmDeleteNoticia');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...'; }

    try {
        const response = await fetch(`${API_BASE_URL}/eliminar`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idpublicacion: id })
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const result = await response.json();

        if (result.status === 'SUCCESS') {
            if (typeof window.closeModal === 'function') closeModal('deleteNoticiaModal');
            showToast('✅ Noticia eliminada correctamente', 'success');
            cargarNoticias(paginaActual);
        } else {
            throw new Error(result.mensaje || 'Error al eliminar');
        }
    } catch (error) {
        console.error('❌ Error al eliminar noticia:', error);
        showToast('Error al eliminar: ' + error.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-trash-alt"></i> Eliminar'; }
    }
}

// ============================================
// CARGAR ESTADÍSTICAS
// ============================================

async function cargarEstadisticasNoticias() {
    console.log('📊 Cargando estadísticas de noticias...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/estadisticas`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'SUCCESS') {
            console.log('✅ Estadísticas:', result.data);
            
            // Actualizar KPIs en el dashboard si existen
            const stats = result.data;
            
            // Aquí puedes actualizar elementos del DOM con las estadísticas
            // Por ejemplo, si tienes un widget de estadísticas en la sección de noticias
            
            return stats;
        } else {
            throw new Error(result.mensaje || 'Error al obtener estadísticas');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar estadísticas:', error);
        return null;
    }
}

// ============================================
// EXPORTAR FUNCIONES AL SCOPE GLOBAL
// ============================================

window.cargarNoticias = cargarNoticias;
window.cargarNoticiasFiltradas = cargarNoticiasFiltradas;
window.showAddNewsModal = showAddNewsModal;
window.crearNoticia = crearNoticia;
window.verDetalleNoticia = verDetalleNoticia;
window.editarNoticia = editarNoticia;
window.guardarEdicionNoticia = guardarEdicionNoticia;
window.toggleDestacada = toggleDestacada;
window.toggleActiva = toggleActiva;
window.eliminarNoticia          = eliminarNoticia;
window.confirmarEliminarNoticia = confirmarEliminarNoticia;
window.cargarEstadisticasNoticias = cargarEstadisticasNoticias;

console.log('✅ Funciones exportadas');

// ============================================
// INICIALIZACIÓN CON MUTATIONOBSERVER
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔵 DOM listo - Configurando MutationObserver para noticias');
    
    const noticiasSection = document.getElementById('noticias');
    
    if (!noticiasSection) {
        console.error('❌ No se encontró la sección #noticias');
        return;
    }
    
    console.log('✅ Sección #noticias encontrada, configurando observer...');
    
    let isLoading = false; // Flag para evitar cargas duplicadas
    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                
                if (target.classList.contains('active') && target.id === 'noticias') {
                    if (!isLoading) {
                        console.log('🎯 ¡Sección noticias ACTIVADA! Cargando noticias...');
                        isLoading = true;
                        cargarNoticias().finally(() => {
                            setTimeout(() => { isLoading = false; }, 500);
                        });
                    }
                }
            }
        });
    });
    
    observer.observe(noticiasSection, { 
        attributes: true, 
        attributeFilter: ['class'] 
    });
    
    console.log('✅ MutationObserver configurado correctamente');
    
    // Si la sección ya está activa al cargar la página, cargar noticias
    if (noticiasSection.classList.contains('active')) {
        console.log('🎯 Sección noticias ya estaba activa, cargando...');
        cargarNoticias();
    }
    
    // ============================================
    // CONECTAR BÚSQUEDA
    // ============================================
    const searchInput = document.getElementById('searchNoticias');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const busqueda = this.value.trim();
                console.log('🔍 Buscando:', busqueda);
                cargarNoticias(1, busqueda); // Siempre página 1 al buscar
            }, 500); // Debounce de 500ms
        });
        console.log('✅ Búsqueda conectada');
    }
    
    // ============================================
    // CONECTAR FILTRO DE FECHAS
    // ============================================
    const filterSelect = document.getElementById('filterFechasNoticias');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            const filtro = this.value;
            console.log('📅 Filtro seleccionado:', filtro);
            
            // Calcular fechas según filtro
            let desde = null;
            let hasta = null;
            const hoy = new Date();
            
            switch(filtro) {
                case 'hoy':
                    desde = hoy.toISOString().split('T')[0];
                    hasta = desde;
                    break;
                case 'semana':
                    // Últimos 7 días
                    const semanaAtras = new Date(hoy);
                    semanaAtras.setDate(hoy.getDate() - 7);
                    desde = semanaAtras.toISOString().split('T')[0];
                    hasta = hoy.toISOString().split('T')[0];
                    break;
                case 'mes':
                    // Este mes
                    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
                    hasta = hoy.toISOString().split('T')[0];
                    break;
                case 'anterior':
                    // Meses anteriores (desde hace 6 meses hasta el mes pasado)
                    const seisMesesAtras = new Date(hoy);
                    seisMesesAtras.setMonth(hoy.getMonth() - 6);
                    const mesPasado = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
                    desde = seisMesesAtras.toISOString().split('T')[0];
                    hasta = mesPasado.toISOString().split('T')[0];
                    break;
                default:
                    // Todas las fechas
                    desde = null;
                    hasta = null;
            }
            
            cargarNoticiasFiltradas(1, desde, hasta);
        });
        console.log('✅ Filtro de fechas conectado');
    }
    
    // ============================================
    // CONECTAR BOTÓN "NUEVA NOTICIA"
    // ============================================
    // El botón ya tiene onclick="showAddNewsModal()" en el HTML
    // pero lo conectamos también por si se crea dinámicamente
    const btnNuevaNoticia = document.querySelector('.btn-primary[onclick*="showAddNewsModal"]');
    if (btnNuevaNoticia && !btnNuevaNoticia.onclick) {
        btnNuevaNoticia.addEventListener('click', showAddNewsModal);
        console.log('✅ Botón "Nueva Noticia" conectado');
    }
    
    // ============================================
    // CONECTAR FORMULARIOS
    // ============================================
    
    // Conecta formulario de crear
    const newsForm = document.getElementById('newsForm');
    if (newsForm) {
        newsForm.addEventListener('submit', crearNoticia);
        console.log('✅ Formulario de nueva noticia conectado');
    }
    
    // Conecta formulario de editar
    const editNewsForm = document.getElementById('editNewsForm');
    if (editNewsForm) {
        editNewsForm.addEventListener('submit', guardarEdicionNoticia);
        console.log('✅ Formulario de edición conectado');
    }
    
    // Conectar botón de guardar edición (alternativo al submit)
    const btnGuardarEdicion = document.getElementById('btnGuardarEdicionNoticia');
    if (btnGuardarEdicion) {
        btnGuardarEdicion.addEventListener('click', guardarEdicionNoticia);
        console.log('✅ Botón de guardar edición conectado');
    }
});

console.log('✅ noticias-api.js COMPLETO cargado');

// ============================================
// ESTILOS CSS PARA BOTONES (Mismo formato que Gestión de Usuarios)
// ============================================
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .btn-action {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    
    /* Botón Ver - Gradiente Navy a Dorado */
    .btn-action.btn-view {
        background: linear-gradient(135deg, #000033, #FDB750);
        color: white;
    }
    
    .btn-action.btn-view:hover {
        background: linear-gradient(135deg, #FDB750, #000033);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 9, 60, 0.4);
    }
    
    /* Botón Editar - Gradiente Dorado a Navy */
    .btn-action.btn-edit {
        background: linear-gradient(135deg, #FDB750, #000033);
        color: white;
    }
    
    .btn-action.btn-edit:hover {
        background: linear-gradient(135deg, #000033, #FDB750);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(253, 183, 80, 0.4);
    }
    
    /* Botón Destacar - Normal (sin destacar) */
    .btn-action.btn-star {
        background: linear-gradient(135deg, #fff3e0, #ffe0b2);
        color: #f57c00;
    }
    
    .btn-action.btn-star:hover {
        background: linear-gradient(135deg, #FDB750, #ff9800);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(253, 183, 80, 0.4);
    }
    
    /* Botón Destacar - Activo (ya destacada) */
    .btn-action.btn-star-active {
        background: linear-gradient(135deg, #FDB750, #ff9800);
        color: white;
    }
    
    .btn-action.btn-star-active:hover {
        background: linear-gradient(135deg, #ff9800, #FDB750);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.5);
    }
    
    /* Botón Eliminar - Gradiente Rojo */
    .btn-action.btn-delete {
        background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
        color: white;
    }
    
    .btn-action.btn-delete:hover {
        background: linear-gradient(135deg, #ee5a6f, #ff6b6b);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(238, 90, 111, 0.4);
    }
    
    .btn-action:active {
        transform: translateY(0px);
    }
`;
document.head.appendChild(styleSheet);

// ============================================
// FUNCIONES DE PREVIEW DE IMAGEN DESDE URL
// ============================================

// Preview para modal de CREAR (desde file input)
window.previewNewsImageFromFile = function(input) {
    const file = input.files[0];
    const preview = document.getElementById('newsImagePreview');
    const previewImg = document.getElementById('newsImagePreviewImg');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
};

window.clearNewsImage = function() {
    const input = document.getElementById('newsImageFile');
    if (input) input.value = '';
    document.getElementById('newsImagePreview').style.display = 'none';
};

// Preview para modal de EDITAR (nueva imagen seleccionada)
window.previewEditNewsImageFromFile = function(input) {
    const file = input.files[0];
    const preview = document.getElementById('editNewsImagePreview');
    const previewImg = document.getElementById('editNewsNewPreviewImg');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
};

window.clearEditNewsImage = function() {
    const input = document.getElementById('editNewsImageFile');
    if (input) input.value = '';
    document.getElementById('editNewsImagePreview').style.display = 'none';
};

})(); // Fin del IIFE - Variables encapsuladas, sin colisiones