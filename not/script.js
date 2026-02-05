// ========== CONFIGURACIÓN DE LA API FASTAPI ==========
const API_BASE_URL = 'http://localhost:8000'; // Cambiar según tu configuración
const API_PUBLICACIONES = `${API_BASE_URL}/publicaciones/`;

// ========== VARIABLES GLOBALES ==========
let paginaActual = 1;
const publicacionesPorPagina = 9; // Máximo 9 cards por página
let totalPublicaciones = 0;
let totalPaginas = 0;

// ========== CARGAR PUBLICACIONES AL INICIO ==========
document.addEventListener('DOMContentLoaded', function() {
    cargarPublicaciones(1);
});

// ========== FUNCIÓN PARA CARGAR PUBLICACIONES DESDE LA API FASTAPI ==========
async function cargarPublicaciones(pagina = 1) {
    try {
        mostrarCargando(true);
        
        // Llamar a la API con paginación
        const response = await fetch(
            `${API_PUBLICACIONES}?pagina=${pagina}&cantidad=${publicacionesPorPagina}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const resultado = await response.json();
        
        // Validar que tenga la estructura correcta
        if (resultado.datos) {
            // Actualizar variables globales
            paginaActual = resultado.pagina;
            totalPublicaciones = resultado.totalRegistros;
            totalPaginas = resultado.totalPaginas;
            
            // Mostrar publicaciones
            mostrarPublicaciones(resultado.datos);
            actualizarPaginacion();
            
            console.log(`✅ Cargadas ${resultado.datos.length} publicaciones de ${resultado.totalRegistros} totales`);
        } else if (resultado.error) {
            throw new Error(resultado.error);
        } else {
            throw new Error('Respuesta sin datos válidos');
        }
    } catch (error) {
        console.error('❌ Error al cargar publicaciones:', error);
        mostrarError(`No se pudieron cargar las publicaciones: ${error.message}`);
    } finally {
        mostrarCargando(false);
    }
}

// ========== MOSTRAR INDICADOR DE CARGA ==========
function mostrarCargando(mostrar) {
    const newsGrid = document.getElementById('newsGrid');
    if (mostrar) {
        newsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div class="loading-spinner"></div>
                <p style="color: #666; margin-top: 20px; font-size: 16px;">Cargando publicaciones...</p>
            </div>
        `;
    }
}

// ========== MOSTRAR ERROR ==========
function mostrarError(mensaje) {
    const newsGrid = document.getElementById('newsGrid');
    newsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
            <svg style="width: 64px; height: 64px; margin: 0 auto 20px; color: #ff6b6b;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke-width="2"/>
                <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2"/>
            </svg>
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">${mensaje}</p>
            <button onclick="cargarPublicaciones(1)" style="padding: 12px 30px; background: #00093C; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-family: 'Inter', sans-serif;">
                Intentar de nuevo
            </button>
        </div>
    `;
}

// ========== MOSTRAR PUBLICACIONES EN EL GRID ==========
function mostrarPublicaciones(publicaciones) {
    const newsGrid = document.getElementById('newsGrid');
    
    if (!publicaciones || publicaciones.length === 0) {
        newsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <svg style="width: 64px; height: 64px; margin: 0 auto 20px; color: #ccc;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8" stroke-width="2"/>
                    <path d="m21 21-4.35-4.35" stroke-width="2"/>
                </svg>
                <p style="color: #666; font-size: 16px;">No se encontraron publicaciones.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // Primera publicación como destacada (solo en la primera página)
    if (paginaActual === 1 && publicaciones.length > 0) {
        html += crearCardDestacada(publicaciones[0]);
    }
    
    // Resto de publicaciones como cards normales
    const inicioNormales = paginaActual === 1 ? 1 : 0;
    for (let i = inicioNormales; i < publicaciones.length; i++) {
        html += crearCardNormal(publicaciones[i]);
    }
    
    newsGrid.innerHTML = html;
}

// ========== CREAR CARD DESTACADA ==========
function crearCardDestacada(publicacion) {
    const fechaFormateada = formatearFecha(publicacion.fecha);
    const imagenUrl = publicacion.foto || 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800';
    
    // Solo descripción (mayor cantidad de caracteres)
    const descripcion = truncarTexto(publicacion.contenido, 200);
    
    return `
        <article class="news-card featured-card" data-id="${publicacion.idpublicacion}">
            <div class="featured-image" style="background-image: url('${imagenUrl}');"></div>
            <div class="featured-content">
                <span class="featured-badge">
                    <svg class="badge-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="4" fill="currentColor"/>
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    DESTACADO
                </span>
                <div class="featured-date">
                    <svg class="date-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    ${fechaFormateada}
                </div>
                <p class="featured-description">${descripcion}</p>
                <button class="featured-btn" onclick='verDetallePublicacion(${JSON.stringify(publicacion)})'>LEER MÁS →</button>
            </div>
        </article>
    `;
}

// ========== CREAR CARD NORMAL ==========
function crearCardNormal(publicacion) {
    const fechaFormateada = formatearFecha(publicacion.fecha);
    const imagenUrl = publicacion.foto || 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=600';
    
    // Solo descripción (mayor cantidad de caracteres)
    const descripcion = truncarTexto(publicacion.contenido, 150);
    
    return `
        <article class="news-card" data-id="${publicacion.idpublicacion}">
            <span class="card-badge">Publicación</span>
            <img src="${imagenUrl}" 
                 alt="Publicación" 
                 class="card-image" 
                 onerror="this.src='https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=600'"
                 loading="lazy">
            <div class="card-content">
                <div class="card-date">
                    <svg class="date-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    ${fechaFormateada}
                </div>
                <p class="card-description">${descripcion}</p>
                <div class="card-footer">
                    <button class="read-more-btn" onclick='verDetallePublicacion(${JSON.stringify(publicacion)})'>LEER MÁS →</button>
                </div>
            </div>
        </article>
    `;
}



// ========== FORMATEAR FECHA ==========
function formatearFecha(fechaStr) {
    try {
        const fecha = new Date(fechaStr);
        const dia = fecha.getDate();
        const mes = obtenerNombreMes(fecha.getMonth());
        const anio = fecha.getFullYear();
        return `${dia} de ${mes}, ${anio}`;
    } catch (error) {
        return fechaStr;
    }
}

// ========== OBTENER NOMBRE DEL MES ==========
function obtenerNombreMes(mes) {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes];
}

// ========== TRUNCAR TEXTO ==========
function truncarTexto(texto, maxLength) {
    if (!texto) return '';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength).trim() + '...';
}

// ========== VER DETALLE DE PUBLICACIÓN ==========
function verDetallePublicacion(publicacion) {
    window.open('https://www.facebook.com/paramedicos.pe/photos?locale=es_LA', '_blank');
}

// ========== PAGINACIÓN ==========
function actualizarPaginacion() {
    const paginationContainer = document.querySelector('.pagination');
    
    if (!paginationContainer || totalPaginas <= 1) {
        if (paginationContainer) paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    let html = `
        <button class="page-btn" 
                onclick="cambiarPagina(${paginaActual - 1})" 
                ${paginaActual === 1 ? 'disabled' : ''}>
            ← Anterior
        </button>
    `;
    
    // Mostrar máximo 5 botones de página
    const maxBotones = 5;
    let inicio = Math.max(1, paginaActual - Math.floor(maxBotones / 2));
    let fin = Math.min(totalPaginas, inicio + maxBotones - 1);
    
    // Ajustar inicio si estamos cerca del final
    if (fin - inicio < maxBotones - 1) {
        inicio = Math.max(1, fin - maxBotones + 1);
    }
    
    // Botón primera página si no está visible
    if (inicio > 1) {
        html += `<button class="page-btn" onclick="cambiarPagina(1)">1</button>`;
        if (inicio > 2) {
            html += `<button class="page-btn" disabled>...</button>`;
        }
    }
    
    // Botones de números de página
    for (let i = inicio; i <= fin; i++) {
        html += `
            <button class="page-btn ${i === paginaActual ? 'active' : ''}" 
                    onclick="cambiarPagina(${i})">
                ${i}
            </button>
        `;
    }
    
    // Botón última página si no está visible
    if (fin < totalPaginas) {
        if (fin < totalPaginas - 1) {
            html += `<button class="page-btn" disabled>...</button>`;
        }
        html += `<button class="page-btn" onclick="cambiarPagina(${totalPaginas})">${totalPaginas}</button>`;
    }
    
    html += `
        <button class="page-btn" 
                onclick="cambiarPagina(${paginaActual + 1})" 
                ${paginaActual === totalPaginas ? 'disabled' : ''}>
            Siguiente →
        </button>
    `;
    
    paginationContainer.innerHTML = html;
}

function cambiarPagina(nuevaPagina) {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    
    cargarPublicaciones(nuevaPagina);
    
    // Scroll suave al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== NAVBAR SEARCH TOGGLE ==========
function toggleNavbarSearch() {
    const searchBox = document.getElementById('navbarSearchBox');
    const searchInput = document.getElementById('navbarSearchInput');
    const searchResults = document.getElementById('navbarSearchResults');
    
    searchBox.classList.toggle('active');
    
    if (searchBox.classList.contains('active')) {
        setTimeout(() => {
            searchInput.focus();
        }, 100);
    } else {
        searchInput.value = '';
        searchResults.classList.remove('show');
        searchResults.innerHTML = '';
        searchBox.classList.remove('has-results');
    }
}

// Cerrar búsqueda del navbar al hacer clic fuera
document.addEventListener('click', function(e) {
    const searchBox = document.getElementById('navbarSearchBox');
    const searchContainer = document.querySelector('.navbar-search-container');
    
    if (searchBox && searchContainer && !searchContainer.contains(e.target)) {
        searchBox.classList.remove('active');
        searchBox.classList.remove('has-results');
        const searchInput = document.getElementById('navbarSearchInput');
        const searchResults = document.getElementById('navbarSearchResults');
        if (searchInput) searchInput.value = '';
        if (searchResults) {
            searchResults.classList.remove('show');
            searchResults.innerHTML = '';
        }
    }
});

// Búsqueda en tiempo real en el navbar (PERSONAL)
const navbarSearchInput = document.getElementById('navbarSearchInput');
if (navbarSearchInput) {
    navbarSearchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim().toLowerCase();
        const searchResults = document.getElementById('navbarSearchResults');
        const searchBox = document.getElementById('navbarSearchBox');
        
        if (searchTerm.length < 2) {
            searchResults.classList.remove('show');
            searchResults.innerHTML = '';
            searchBox.classList.remove('has-results');
            return;
        }
        
        // Buscar coincidencias en personalDatabase (si existe)
        if (typeof personalDatabase !== 'undefined') {
            const results = personalDatabase.filter(person => {
                const fullName = `${person.apellidos} ${person.nombres}`.toLowerCase();
                const legajo = person.legajo.toLowerCase();
                const dni = person.dni.toLowerCase();
                
                return fullName.includes(searchTerm) || 
                       legajo.includes(searchTerm) || 
                       dni.includes(searchTerm);
            });
            
            if (results.length > 0) {
                searchResults.innerHTML = results.map(person => `
                    <div class="navbar-search-result-item" onclick="showPersonalInfo('${person.legajo}');">
                        <div class="navbar-search-result-name">${person.apellidos}, ${person.nombres}</div>
                        <div class="navbar-search-result-details">Legajo: ${person.legajo} | DNI: ${person.dni}</div>
                    </div>
                `).join('');
                searchResults.classList.add('show');
                searchBox.classList.add('has-results');
            } else {
                searchResults.innerHTML = '<div class="navbar-no-results">No se encontraron resultados</div>';
                searchResults.classList.add('show');
                searchBox.classList.add('has-results');
            }
        }
    });
}

// Script para activar la línea debajo de la opción seleccionada
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        const targetHref = this.getAttribute('href');
        
        if (!targetHref || targetHref === '#' || (targetHref.startsWith('#') && targetHref.length > 1)) {
            e.preventDefault();
            document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
            this.classList.add('active');
            
            if (targetHref && targetHref.startsWith('#') && targetHref.length > 1) {
                const targetSection = document.querySelector(targetHref);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    });
});

// ========== SMOOTH SCROLL ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========== BASE DE DATOS DE PERSONAL (mantener para búsqueda de personal) ==========
const personalDatabase = [
    {
        legajo: "12345",
        nombres: "JUAN CARLOS",
        apellidos: "GARCÍA RODRÍGUEZ",
        dni: "72345678",
        rango: "TÉCNICO PARAMÉDICO",
        jefatura: "BRIGADA DE EMERGENCIAS - LIMA",
        estado: "ACTIVO",
        fechaActualizacion: "15/01/2026",
        foto: "https://via.placeholder.com/150x180/00093C/FFFFFF?text=FOTO",
        certificaciones: [
            { nombre: "SISTEMA COMANDO DE INCIDENTES", icono: "🎖️" },
            { nombre: "UNIDAD DE BÚSQUEDA Y RESCATE", icono: "🏅" },
            { nombre: "SOPORTE VITAL AVANZADO", icono: "🥇" }
        ]
    },
    {
        legajo: "12346",
        nombres: "MARÍA ELENA",
        apellidos: "LÓPEZ SÁNCHEZ",
        dni: "71234567",
        rango: "PARAMÉDICO SENIOR",
        jefatura: "UNIDAD MÉDICA - CALLAO",
        estado: "ACTIVO",
        fechaActualizacion: "20/01/2026",
        foto: "https://via.placeholder.com/150x180/00093C/FFFFFF?text=FOTO",
        certificaciones: [
            { nombre: "TRIAJE EN EMERGENCIAS", icono: "🎖️" },
            { nombre: "ATENCIÓN PREHOSPITALARIA", icono: "🏅" }
        ]
    },
    {
        legajo: "12347",
        nombres: "CARLOS ALBERTO",
        apellidos: "RAMÍREZ TORRES",
        dni: "70987654",
        rango: "INSTRUCTOR JEFE",
        jefatura: "DEPARTAMENTO DE CAPACITACIÓN",
        estado: "ACTIVO",
        fechaActualizacion: "10/01/2026",
        foto: "https://via.placeholder.com/150x180/00093C/FFFFFF?text=FOTO",
        certificaciones: [
            { nombre: "INSTRUCTOR CERTIFICADO", icono: "🎖️" },
            { nombre: "GESTIÓN DE CRISIS", icono: "🏅" },
            { nombre: "LIDERAZGO OPERATIVO", icono: "🥇" }
        ]
    }
];

// ========== MOSTRAR INFORMACIÓN DE PERSONAL ==========
function showPersonalInfo(legajo) {
    const person = personalDatabase.find(p => p.legajo === legajo);
    
    if (!person) return;
    
    const navbarSearchBox = document.getElementById('navbarSearchBox');
    const navbarSearchInput = document.getElementById('navbarSearchInput');
    const navbarSearchResults = document.getElementById('navbarSearchResults');
    
    if (navbarSearchBox) {
        navbarSearchBox.classList.remove('active');
        navbarSearchBox.classList.remove('has-results');
    }
    if (navbarSearchInput) {
        navbarSearchInput.value = '';
    }
    if (navbarSearchResults) {
        navbarSearchResults.classList.remove('show');
        navbarSearchResults.innerHTML = '';
    }
    
    document.getElementById('personalFullName').textContent = `${person.apellidos}, ${person.nombres}`;
    document.getElementById('personalLegajo').textContent = person.legajo;
    document.getElementById('personalDNI').textContent = person.dni;
    document.getElementById('personalRango').textContent = person.rango;
    document.getElementById('personalJefatura').textContent = person.jefatura;
    document.getElementById('personalPhoto').src = person.foto;
    
    const statusBadge = document.querySelector('.status-badge');
    statusBadge.className = `status-badge ${person.estado.toLowerCase()}`;
    statusBadge.innerHTML = `<strong>ESTADO:</strong> ${person.estado}`;
    if (person.estado === "BAJA") {
        statusBadge.innerHTML += ` (${person.fechaActualizacion})`;
    }
    
    document.querySelector('.qr-code').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=LEGAJO${person.legajo}`;
    
    const certList = document.querySelector('.certification-list');
    certList.innerHTML = person.certificaciones.map(cert => `
        <div class="certification-item">
            <span class="cert-icon">${cert.icono}</span>
            <span class="cert-name">${cert.nombre}</span>
        </div>
    `).join('');
    
    document.getElementById('personalModal').classList.add('show');
}

// ========== CERRAR MODAL ==========
function closePersonalModal() {
    document.getElementById('personalModal').classList.remove('show');
}

window.onclick = function(event) {
    const modal = document.getElementById('personalModal');
    if (event.target === modal) {
        closePersonalModal();
    }
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePersonalModal();
    }
});
