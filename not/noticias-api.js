// ============================================
// CONFIGURACIÓN DEL API
// ============================================
const API_BASE_URL = 'https://paramedicosdelperu.org/api/noticias';
const FOTO_BASE_URL = 'https://paramedicosdelperu.org/api/noticias/foto';

// ============================================
// FUNCIONES PARA CONSUMIR EL BACKEND
// ============================================

/**
 * Obtener todas las publicaciones con filtros
 */
async function obtenerPublicaciones(filtros = {}) {
    try {
        const params = new URLSearchParams({
            pagina: filtros.pagina || 1,
            cantidad_por_pagina: filtros.cantidad || 9,
            solo_destacadas: filtros.destacadas || 0,
            solo_activas: filtros.activas !== undefined ? filtros.activas : 1,
            busqueda: filtros.busqueda || '',
            ordenar_por: filtros.ordenar || 'reciente'
        });

        const response = await fetch(`${API_BASE_URL}?${params}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener publicaciones:', error);
        return { total: 0, publicaciones: [] };
    }
}

/**
 * Obtener la publicación destacada
 */
async function obtenerPublicacionDestacada() {
    try {
        const response = await fetch(`${API_BASE_URL}/destacada`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener publicación destacada:', error);
        return null;
    }
}

/**
 * Obtener publicación por ID
 */
async function obtenerPublicacionPorId(idpublicacion) {
    try {
        const response = await fetch(`${API_BASE_URL}/${idpublicacion}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener publicación:', error);
        return null;
    }
}

/**
 * Obtener publicaciones recientes
 */
async function obtenerPublicacionesRecientes(cantidad = 3) {
    try {
        const response = await fetch(`${API_BASE_URL}/recientes?cantidad=${cantidad}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener publicaciones recientes:', error);
        return [];
    }
}

/**
 * Buscar publicaciones
 */
async function buscarPublicaciones(termino) {
    try {
        const response = await fetch(`${API_BASE_URL}/buscar?termino_busqueda=${encodeURIComponent(termino)}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();

        // Normalizar: el SP de búsqueda devuelve "resumen", mapearlo a "contenido"
        return data.map(pub => ({
            ...pub,
            contenido: pub.contenido || pub.resumen || pub.Resumen || pub.RESUMEN || pub.resumen_corto || ''
        }));

    } catch (error) {
        console.error('Error al buscar publicaciones:', error);
        return [];
    }
}

/**
 * Obtener próximos eventos (desde el endpoint de cursos)
 */
async function obtenerProximosEventos(limite = 3) {
    try {
        const response = await fetch(`https://paramedicosdelperu.org/api/cursos/eventos/proximos?limite=${limite}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener próximos eventos:', error);
        return { status: 'ERROR', total: 0, eventos: [] };
    }
}

// ============================================
// FUNCIONES PARA RENDERIZAR EN EL DOM
// ============================================

/**
 * Formatear fecha en español
 */
function formatearFecha(fechaString) {
    const fecha = new Date(fechaString);
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return fecha.toLocaleDateString('es-ES', opciones);
}

/**
 * Placeholder SVG para imágenes
 */
function getPlaceholderImage(width, height, text) {
    // Remover emojis y caracteres especiales para evitar error en btoa
    const cleanText = text.replace(/[^\x00-\x7F]/g, '');  // Solo ASCII
    
    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#00093C"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" fill="#c5a059" text-anchor="middle" dy=".3em">${cleanText || 'Imagen'}</text>
        </svg>
    `;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

/**
 * Renderizar la noticia destacada
 */
function renderizarNoticiaDestacada(publicacion) {
    const contenedor = document.querySelector('.news-featured');
    
    if (!contenedor || !publicacion) return;
    
    const imagenUrl = `${FOTO_BASE_URL}/${publicacion.idpublicacion}`;
    const placeholder = getPlaceholderImage(800, 450, 'Sin Imagen');
    
    contenedor.innerHTML = `
        <div class="featured-badge">NOTICIA DESTACADA</div>
        <div class="featured-image">
            <img src="${imagenUrl}" 
                 alt="${publicacion.titulo || 'Noticia destacada'}"
                 onerror="this.src='${placeholder}'">
        </div>
        <div class="featured-content">
            <span class="news-date">
                <i class="fas fa-calendar-alt"></i> ${formatearFecha(publicacion.fecha)}
            </span>
            <p class="featured-excerpt">${publicacion.contenido}</p>
        </div>
    `;
}

/**
 * Renderizar una tarjeta de noticia
 */
function crearTarjetaNoticia(publicacion) {
    const imagenUrl = `${FOTO_BASE_URL}/${publicacion.idpublicacion}`;
    const placeholder = getPlaceholderImage(400, 250, 'Sin Imagen');
    const titulo = publicacion.titulo || 'Noticia';
    // El SP de búsqueda devuelve "resumen", los demás devuelven "contenido"
    // Probamos todos los posibles nombres de campo
    const descripcion = publicacion.contenido 
        || publicacion.resumen 
        || publicacion.resumen_corto 
        || publicacion.descripcion 
        || '';
    
    return `
        <article class="news-card reveal" data-id="${publicacion.idpublicacion}">
            <div class="card-image">
                <img src="${imagenUrl}" 
                     alt="${titulo}"
                     onerror="this.src='${placeholder}'">
            </div>
            <div class="card-body">
                <span class="card-date">
                    <i class="fas fa-calendar-alt"></i> ${formatearFecha(publicacion.fecha)}
                </span>
                <p class="card-excerpt">${descripcion}</p>
                <a href="https://www.facebook.com/paramedicos.pe" target="_blank" class="btn-card-facebook">
                    <i class="fab fa-facebook-f"></i> Ver en Facebook
                </a>
            </div>
        </article>
    `;
}

/**
 * Renderizar grid de noticias
 */
function renderizarGridNoticias(publicaciones, ordenamiento = 'reciente') {
    const grid = document.querySelector('.news-grid');
    
    if (!grid) return;
    
    if (!publicaciones || publicaciones.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-newspaper" style="font-size: 48px; color: #c5a059; margin-bottom: 20px;"></i>
                <h3 style="color: #00093C; margin: 0 0 10px 0;">No se encontraron noticias</h3>
                <p style="color: #666;">Intenta con otros filtros de búsqueda</p>
            </div>
        `;
        return;
    }
    
    // 🔥 ORDENAR MANUALMENTE SI ES "ANTIGUAS"
    let publicacionesOrdenadas = [...publicaciones]; // Copiar array
    
    if (ordenamiento === 'antiguas') {
        publicacionesOrdenadas.sort((a, b) => {
            const fechaA = new Date(a.fecha);
            const fechaB = new Date(b.fecha);
            return fechaA - fechaB; // Ascendente (más viejas primero)
        });
        console.log('🔄 Publicaciones reordenadas manualmente (antiguas primero)');
    }
    
    grid.innerHTML = publicacionesOrdenadas.map(pub => crearTarjetaNoticia(pub)).join('');
    
    // Re-aplicar observador de animaciones
    aplicarAnimacionesReveal();
}

/**
 * Renderizar noticias recientes en el sidebar
 */
function renderizarNoticiasRecientes(publicaciones) {
    const lista = document.querySelector('.recent-news-list');
    
    if (!lista || !publicaciones) return;
    
    lista.innerHTML = publicaciones.map(pub => {
        const imagenUrl = `${FOTO_BASE_URL}/${pub.idpublicacion}`;
        const placeholder = getPlaceholderImage(80, 60, 'Noticia');
        const titulo = pub.titulo || pub.contenido.substring(0, 50) + '...';
        
        return `
            <div class="recent-news-item" data-id="${pub.idpublicacion}">
                <img src="${imagenUrl}" 
                     alt="${titulo}"
                     onerror="this.src='${placeholder}'">
                <div class="recent-news-content">
                    <h4>${titulo}</h4>
                    <span class="recent-date">
                        <i class="fas fa-calendar-alt"></i> ${formatearFecha(pub.fecha)}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Renderizar próximos eventos en el sidebar
 */
function renderizarProximosEventos(eventos) {
    // Buscar el contenedor de eventos
    const eventosContainer = document.querySelector('.events-list');
    
    if (!eventosContainer) {
        console.warn('⚠️ No se encontró el contenedor .events-list en el sidebar');
        return;
    }
    
    // Si no hay eventos
    if (!eventos || eventos.length === 0) {
        eventosContainer.innerHTML = `
            <div style="text-align: center; padding: 30px 20px; color: #666;">
                <i class="fas fa-calendar-times" style="font-size: 36px; margin-bottom: 15px; color: #c5a059; opacity: 0.6;"></i>
                <p style="font-size: 14px;">No hay eventos programados próximamente</p>
            </div>
        `;
        return;
    }
    
    // Crear las tarjetas de eventos
    eventosContainer.innerHTML = eventos.map(evento => crearTarjetaEventoSidebar(evento)).join('');
    
    console.log('✅ Eventos cargados en el sidebar:', eventos.length);
}

/**
 * Crear tarjeta de evento para el sidebar (estructura del HTML de noticias)
 */
function crearTarjetaEventoSidebar(evento) {
    const fecha = new Date(evento.fecha);
    const dia = fecha.getDate();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();
    const fechaFormateada = `${dia} de ${mes}, ${anio}`;
    
    // Determinar icono según modalidad
    let iconoModalidad = 'fas fa-building'; // Presencial por defecto
    let textoModalidad = evento.modalidad || 'Presencial';
    
    if (evento.modalidad === 'Virtual') {
        iconoModalidad = 'fas fa-laptop';
    } else if (evento.modalidad === 'Híbrido' || evento.modalidad === 'Semipresencial') {
        iconoModalidad = 'fas fa-users';
        textoModalidad = 'Híbrido';
    }
    
    return `
        <article class="event-item" data-event-id="${evento.id}">
            <div class="event-content">
                <h4 class="event-title">${evento.titulo}</h4>
                <div class="event-details">
                    <span class="event-date">
                        <i class="fas fa-calendar-alt"></i> ${fechaFormateada}
                    </span>
                    <span class="event-mode">
                        <i class="${iconoModalidad}"></i> ${textoModalidad}
                    </span>
                    ${evento.cupos_disponibles <= 5 && evento.cupos_disponibles > 0 ? 
                        `<span class="event-cupos" style="color: #d32f2f; font-weight: 600; font-size: 12px;">
                            <i class="fas fa-exclamation-circle"></i> Solo ${evento.cupos_disponibles} cupos
                        </span>` : 
                        ''
                    }
                </div>
            </div>
        </article>
    `;
}

/**
 * Re-aplicar animaciones reveal para elementos nuevos
 */
function aplicarAnimacionesReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
        el.classList.remove('visible'); // Reset
        revealObserver.observe(el);
    });
}

/**
 * Mostrar loader mientras carga
 */
function mostrarLoader(mostrar = true) {
    const grid = document.querySelector('.news-grid');
    if (!grid) return;
    
    if (mostrar) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="display: inline-block; width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #00093C; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 20px; color: #666;">Cargando noticias...</p>
            </div>
        `;
    }
}

// ============================================
// INICIALIZACIÓN Y EVENTOS
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔥 Iniciando carga de noticias desde el backend...');
    
    // Cargar noticia destacada
    const destacada = await obtenerPublicacionDestacada();
    if (destacada && destacada.length > 0) {
        renderizarNoticiaDestacada(destacada[0]);
    }
    
    // Cargar grid de noticias
    mostrarLoader(true);
    const { publicaciones } = await obtenerPublicaciones({
        cantidad: 9,
        ordenar: 'reciente'
    });
    renderizarGridNoticias(publicaciones);
    
    // Cargar noticias recientes para sidebar
    const recientes = await obtenerPublicacionesRecientes(3);
    renderizarNoticiasRecientes(recientes);
    
    // 🔥 CARGAR PRÓXIMOS EVENTOS PARA EL SIDEBAR
    const eventosData = await obtenerProximosEventos(3);
    if (eventosData.status === 'SUCCESS' && eventosData.eventos) {
        renderizarProximosEventos(eventosData.eventos);
    }
    
    // ============================================
    // BÚSQUEDA EN TIEMPO REAL
    // ============================================
    const searchInput = document.getElementById('searchNews');
    let searchTimeout;
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            
            // Debounce para evitar demasiadas peticiones
            clearTimeout(searchTimeout);
            
            searchTimeout = setTimeout(async () => {
                if (searchTerm.length >= 3) {
                    mostrarLoader(true);
                    const resultados = await buscarPublicaciones(searchTerm);
                    renderizarGridNoticias(resultados);
                } else if (searchTerm.length === 0) {
                    // Si borra todo, recargar todas las noticias
                    mostrarLoader(true);
                    const { publicaciones } = await obtenerPublicaciones({
                        cantidad: 9,
                        ordenar: 'reciente'
                    });
                    renderizarGridNoticias(publicaciones);
                }
            }, 500); // Espera 500ms después de que el usuario deje de escribir
        });
    }
    
    // ============================================
    // FILTRO POR ORDENAMIENTO
    // ============================================
    const dateFilter = document.getElementById('dateFilter');
    
    if (dateFilter) {
        dateFilter.addEventListener('change', async function(e) {
            const valor = e.target.value;
            
            console.log(`🔄 Filtro seleccionado: "${valor}"`);
            
            mostrarLoader(true);
            
            // Determinar el ordenamiento según el valor seleccionado
            let ordenarPor = 'reciente'; // Por defecto
            
            if (valor === 'antiguas') {
                ordenarPor = 'antiguas';
            } else if (valor === 'recientes') {
                ordenarPor = 'reciente';
            }
            
            console.log(`📊 Parámetro ordenar_por enviado: "${ordenarPor}"`);
            
            try {
                const { publicaciones, total } = await obtenerPublicaciones({
                    cantidad: 9,
                    ordenar: ordenarPor
                });
                
                console.log(`✅ Recibidas ${publicaciones.length} publicaciones`);
                
                // 🔥 PASAR EL ORDENAMIENTO A LA FUNCIÓN DE RENDERIZADO
                renderizarGridNoticias(publicaciones, ordenarPor);
                
                // Mostrar info de la primera y última noticia para verificar orden
                if (publicaciones.length > 0) {
                    const primera = publicaciones[0];
                    const ultima = publicaciones[publicaciones.length - 1];
                    console.log(`📅 Primera noticia mostrada: ${formatearFecha(primera.fecha)}`);
                    console.log(`📅 Última noticia mostrada: ${formatearFecha(ultima.fecha)}`);
                }
                
            } catch (error) {
                console.error('❌ Error al filtrar noticias:', error);
                mostrarLoader(false);
            }
        });
    }
    
    // ============================================
    // BOTÓN DE BÚSQUEDA
    // ============================================
    const searchBtn = document.querySelector('.btn-search-icon');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', async function() {
            const searchTerm = searchInput.value.trim();
            
            if (searchTerm.length >= 3) {
                mostrarLoader(true);
                const resultados = await buscarPublicaciones(searchTerm);
                renderizarGridNoticias(resultados);
            }
        });
    }
    
    console.log('✅ Noticias cargadas exitosamente desde el backend!');
});

// Animación CSS para el loader
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);