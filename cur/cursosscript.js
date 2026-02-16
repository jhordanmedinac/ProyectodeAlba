// ============================================
// CONFIGURACIÓN DE LA API
// ============================================
const API_BASE_URL = 'http://localhost:8000/api'; // Cambia localhost por tu dominio en producción

// ============================================
// CARGAR CURSOS DESDE LA API
// ============================================
async function cargarCursos() {
    try {
        console.log('🔄 Cargando cursos desde:', `${API_BASE_URL}/cursos/activos`);
        const response = await fetch(`${API_BASE_URL}/cursos/activos`);
        const data = await response.json();
        
        console.log('📡 Respuesta de la API:', data);
        
        if (data.status === 'SUCCESS' && data.cursos) {
            console.log('✅ Total de cursos recibidos:', data.cursos.length);
            mostrarCursos(data.cursos);
        } else {
            console.warn('⚠️ Respuesta inesperada:', data);
            mostrarError('No se encontraron cursos');
        }
    } catch (error) {
        console.error('❌ Error al cargar cursos:', error);
        mostrarError('No se pudieron cargar los cursos');
    }
}

// ============================================
// CARGAR CURSO MÁS PRÓXIMO
// ============================================
async function cargarCursoProximo() {
    try {
        const response = await fetch(`${API_BASE_URL}/cursos/proximo`);
        const data = await response.json();
        
        if (data.status === 'SUCCESS' && data.curso_proximo) {
            mostrarCursoDestacado(data.curso_proximo);
        }
    } catch (error) {
        console.error('Error al cargar curso próximo:', error);
    }
}

// ============================================
// CARGAR DETALLE DEL CURSO
// ============================================
async function cargarDetalleCurso(idCurso) {
    try {
        const response = await fetch(`${API_BASE_URL}/cursos/${idCurso}`);
        const data = await response.json();
        
        if (data.status === 'SUCCESS' && data.curso) {
            return data.curso;
        }
    } catch (error) {
        console.error('Error al cargar detalle del curso:', error);
        return null;
    }
}

// ============================================
// MOSTRAR CURSO DESTACADO (MÁS PRÓXIMO)
// ============================================
function mostrarCursoDestacado(curso) {
    console.log('🔵 Mostrando curso destacado:', curso);
    
    const featured = document.querySelector('.course-featured');
    if (!featured) return;
    
    const idCurso = curso.id_curso || curso.id;
    
    // Actualizar icono según categoría
    const icon = obtenerIconoPorCategoria(curso.categoria);
    featured.querySelector('.featured-image i').className = icon;
    
    // Actualizar título
    featured.querySelector('.featured-title').textContent = curso.titulo;
    
    // Actualizar info grid
    const infoItems = featured.querySelectorAll('.info-item');
    if (infoItems[0]) {
        infoItems[0].querySelector('.info-value').textContent = curso.categoria;
    }
    if (infoItems[1]) {
        infoItems[1].querySelector('.info-value').textContent = curso.duracion || 'N/A';
    }
    if (infoItems[2]) {
        const iconoModalidad = obtenerIconoModalidad(curso.modalidad);
        infoItems[2].querySelector('i').className = iconoModalidad;
        infoItems[2].querySelector('.info-value').textContent = curso.modalidad;
    }
    if (infoItems[3]) {
        const fechaInicio = formatearFecha(curso.fecha_inicio);
        const fechaFin = formatearFecha(curso.fecha_fin);
        infoItems[3].querySelector('.info-value').textContent = `${fechaInicio} - ${fechaFin}`;
    }
    
    // Actualizar botón con el ID del curso
    const btnDetalle = document.getElementById('btn-curso-destacado');
    if (btnDetalle) {
        btnDetalle.onclick = () => abrirModalCurso(idCurso);
    }
    
    console.log('✅ Curso destacado configurado con ID:', idCurso);
}

// ============================================
// MOSTRAR CURSOS EN EL GRID
// ============================================
function mostrarCursos(cursos) {
    const grid = document.querySelector('.courses-grid');
    if (!grid) {
        console.error('❌ No se encontró el elemento .courses-grid');
        return;
    }
    
    console.log('📦 Cursos recibidos:', cursos.length);
    console.log('📋 Detalle de cursos:', cursos);
    
    // Limpiar grid
    grid.innerHTML = '';
    
    // Obtener el ID del curso destacado desde el objeto directamente
    let idDestacado = null;
    const btnDestacado = document.getElementById('btn-curso-destacado');
    if (btnDestacado && btnDestacado.onclick) {
        // Extraer ID del onclick si existe
        const onclickStr = btnDestacado.onclick.toString();
        const match = onclickStr.match(/abrirModalCurso\((\d+)\)/);
        if (match) {
            idDestacado = parseInt(match[1]);
        }
    }
    
    console.log('🔵 ID del curso destacado:', idDestacado);
    
    // Filtrar y mostrar cursos (máximo 6)
    const cursosFiltrados = idDestacado ? 
        cursos.filter(curso => {
            const idCurso = parseInt(curso.id_curso || curso.id);
            return idCurso !== idDestacado;
        }) : cursos;
    
    console.log('✅ Cursos después de filtrar:', cursosFiltrados.length);
    
    if (cursosFiltrados.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-info-circle" style="font-size: 48px; color: #c5a059; margin-bottom: 20px;"></i>
                <p style="color: #666; font-size: 18px;">No hay más cursos disponibles</p>
            </div>
        `;
        return;
    }
    
    cursosFiltrados
        .slice(0, 6)
        .forEach(curso => {
            const html = crearCardCurso(curso);
            console.log('🎨 Creando card para:', curso.titulo);
            grid.innerHTML += html;
        });
    
    console.log('🎨 Cards creadas en el DOM');
    
    // Forzar re-observación de elementos reveal
    setTimeout(() => {
        const newCards = document.querySelectorAll('.course-card.reveal');
        newCards.forEach(card => {
            revealObserver.observe(card);
            card.classList.add('visible'); // Forzar visibilidad inmediata
        });
    }, 100);
}

// ============================================
// CREAR CARD DE CURSO
// ============================================
function crearCardCurso(curso) {
    const id = curso.id_curso || curso.id;
    const categoria = curso.categoria || 'Sin categoría';
    const categoriaClass = categoria.toLowerCase().replace(/\s+/g, '-');
    const modalidad = curso.modalidad || 'Presencial';
    const modalidadClass = modalidad.toLowerCase();
    const icon = obtenerIconoPorCategoria(categoria);
    const iconoModalidad = obtenerIconoModalidad(modalidad);
    const fechaInicio = formatearFecha(curso.fecha_inicio);
    const fechaFin = formatearFecha(curso.fecha_fin);
    
    return `
        <article class="course-card reveal" data-category="${categoriaClass}" data-modality="${modalidadClass}">
            <div class="course-image">
                <i class="${icon}"></i>
            </div>
            <div class="course-body">
                <h3 class="course-name">${curso.titulo}</h3>
                
                <div class="course-info-compact">
                    <div class="info-row">
                        <span class="info-icon"><i class="fas fa-tag"></i></span>
                        <span class="info-text">${categoria}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-icon"><i class="fas fa-clock"></i></span>
                        <span class="info-text">${curso.duracion || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-icon"><i class="${iconoModalidad}"></i></span>
                        <span class="info-text">${modalidad}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-icon"><i class="fas fa-calendar-alt"></i></span>
                        <span class="info-text">${fechaInicio} - ${fechaFin}</span>
                    </div>
                </div>
                
                <button class="btn-course" onclick="abrirModalCurso(${id})">
                    <i class="fas fa-eye"></i> Ver
                </button>
            </div>
        </article>
    `;
}

// ============================================
// ABRIR MODAL CON DATOS DE LA API
// ============================================
async function abrirModalCurso(idCurso) {
    const curso = await cargarDetalleCurso(idCurso);
    
    if (!curso) {
        alert('No se pudo cargar la información del curso');
        return;
    }
    
    // Crear modal dinámicamente si no existe
    let modal = document.getElementById(`modal-curso-${idCurso}`);
    if (!modal) {
        modal = crearModalCurso(idCurso, curso);
        document.body.appendChild(modal);
    }
    
    // Mostrar modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// ============================================
// CREAR MODAL DINÁMICO
// ============================================
function crearModalCurso(idCurso, curso) {
    const modal = document.createElement('div');
    modal.id = `modal-curso-${idCurso}`;
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal('modal-curso-${idCurso}')">&times;</span>
            <h2>${curso.titulo}</h2>
            <p class="modal-description">
                ${curso.descripcion || 'Descripción no disponible'}
            </p>
            <div class="modal-details">
                <p><strong>Instructor:</strong> ${curso.instructor || 'Por definir'}</p>
                <p><strong>Requisitos:</strong> ${curso.requisitos || 'Ninguno'}</p>
                <p><strong>Dirección:</strong> ${curso.direccion || 'No especificada'}</p>
            </div>
        </div>
    `;
    
    return modal;
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function obtenerIconoPorCategoria(categoria) {
    const iconos = {
        'basico': 'fas fa-hand-holding-medical',
        'intermedio': 'fas fa-ambulance',
        'avanzado': 'fas fa-user-md',
        'especializado': 'fas fa-fire-extinguisher',
        'nivel basico': 'fas fa-hand-holding-medical',
        'nivel intermedio': 'fas fa-ambulance',
        'nivel avanzado': 'fas fa-user-md'
    };
    
    return iconos[categoria.toLowerCase()] || 'fas fa-graduation-cap';
}

function obtenerIconoModalidad(modalidad) {
    const iconos = {
        'virtual': 'fas fa-laptop',
        'presencial': 'fas fa-chalkboard-teacher',
        'semipresencial': 'fas fa-graduation-cap'
    };
    
    return iconos[modalidad.toLowerCase()] || 'fas fa-chalkboard-teacher';
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    
    try {
        const date = new Date(fecha);
        const dia = date.getDate().toString().padStart(2, '0');
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const mes = meses[date.getMonth()];
        const año = date.getFullYear();
        return `${dia} ${mes} ${año}`;
    } catch (error) {
        return fecha;
    }
}

function mostrarError(mensaje) {
    const grid = document.querySelector('.courses-grid');
    if (grid) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #c5a059; margin-bottom: 20px;"></i>
                <p style="color: #666; font-size: 18px;">${mensaje}</p>
            </div>
        `;
    }
}

// ============================================
// FILTROS CON API
// ============================================
async function aplicarFiltros() {
    const searchTerm = document.getElementById('searchCourses')?.value || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const modality = document.getElementById('modalityFilter')?.value || '';
    
    try {
        // Construir URL con parámetros
        let url = `${API_BASE_URL}/cursos/activos?`;
        if (searchTerm) url += `busqueda=${encodeURIComponent(searchTerm)}&`;
        if (category) url += `categoria=${encodeURIComponent(category)}&`;
        if (modality) url += `modalidad=${encodeURIComponent(modality)}&`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'SUCCESS' && data.cursos) {
            mostrarCursos(data.cursos);
        }
    } catch (error) {
        console.error('Error al aplicar filtros:', error);
    }
}

// ============================================
// CARGAR CATEGORÍAS Y MODALIDADES DINÁMICAS
// ============================================
async function cargarFiltrosDinamicos() {
    try {
        // Cargar categorías
        const respCat = await fetch(`${API_BASE_URL}/cursos/categorias`);
        const dataCat = await respCat.json();
        
        if (dataCat.status === 'SUCCESS' && dataCat.categorias) {
            const selectCat = document.getElementById('categoryFilter');
            if (selectCat) {
                dataCat.categorias.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.nombre;
                    option.textContent = `${cat.nombre} (${cat.total})`;
                    selectCat.appendChild(option);
                });
            }
            
            // 🔥 NUEVO: Cargar categorías en el sidebar
            cargarCategoriasSidebar(dataCat.categorias);
        }
        
        // Cargar modalidades
        const respMod = await fetch(`${API_BASE_URL}/cursos/modalidades`);
        const dataMod = await respMod.json();
        
        if (dataMod.status === 'SUCCESS' && dataMod.modalidades) {
            const selectMod = document.getElementById('modalityFilter');
            if (selectMod) {
                dataMod.modalidades.forEach(mod => {
                    const option = document.createElement('option');
                    option.value = mod.nombre;
                    option.textContent = `${mod.nombre} (${mod.total})`;
                    selectMod.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar filtros dinámicos:', error);
    }
}

// ============================================
// CARGAR CATEGORÍAS EN EL SIDEBAR
// ============================================
function cargarCategoriasSidebar(categorias) {
    const categoryList = document.querySelector('.category-list');
    if (!categoryList) {
        console.warn('⚠️ No se encontró el elemento .category-list en el sidebar');
        return;
    }
    
    // Limpiar contenido estático
    categoryList.innerHTML = '';
    
    // Crear elementos dinámicos
    categorias.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="#" class="list-link" data-category="${cat.nombre}">
                <i class="fas fa-chevron-right"></i>
                <span>${cat.nombre}</span>
                <span class="count">${cat.total}</span>
            </a>
        `;
        categoryList.appendChild(li);
    });
    
    // 🔥 Agregar event listeners a los nuevos links
    const newLinks = categoryList.querySelectorAll('.list-link');
    newLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover clase active de todos
            newLinks.forEach(l => l.classList.remove('active'));
            
            // Agregar clase active al seleccionado
            this.classList.add('active');
            
            // Aplicar filtro por categoría
            const categoria = this.getAttribute('data-category');
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.value = categoria;
                aplicarFiltros();
            }
            
            console.log('📌 Categoría seleccionada desde sidebar:', categoria);
        });
    });
    
    console.log('✅ Categorías cargadas en el sidebar:', categorias.length);
}

// ============================================
// SCROLL REVEAL - IntersectionObserver
// ============================================
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

revealElements.forEach(el => revealObserver.observe(el));

// ============================================
// MODALES
// ============================================

// Cerrar modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Cerrar modal al hacer clic fuera del contenido
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// Cerrar modal con tecla ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
});

// ============================================
// BÚSQUEDA EN TIEMPO REAL
// ============================================
const searchInput = document.getElementById('searchCourses');
if (searchInput) {
    let timeoutId;
    searchInput.addEventListener('input', function() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            aplicarFiltros();
        }, 500); // Esperar 500ms después de que el usuario deje de escribir
    });
}

// ============================================
// FILTROS
// ============================================
const categoryFilter = document.getElementById('categoryFilter');
if (categoryFilter) {
    categoryFilter.addEventListener('change', aplicarFiltros);
}

const modalityFilter = document.getElementById('modalityFilter');
if (modalityFilter) {
    modalityFilter.addEventListener('change', aplicarFiltros);
}

// ============================================
// CARGAR PRÓXIMOS EVENTOS PARA EL SIDEBAR
// ============================================
async function cargarProximosEventos() {
    try {
        console.log('🔄 Cargando próximos eventos...');
        const response = await fetch(`${API_BASE_URL}/cursos/eventos/proximos?limite=3`);
        const data = await response.json();
        
        console.log('📡 Respuesta de eventos:', data);
        
        if (data.status === 'SUCCESS' && data.eventos && data.eventos.length > 0) {
            mostrarEventosSidebar(data.eventos);
        } else {
            mostrarSidebarVacio();
        }
    } catch (error) {
        console.error('❌ Error al cargar eventos:', error);
        mostrarSidebarVacio();
    }
}

// ============================================
// MOSTRAR EVENTOS EN EL SIDEBAR
// ============================================
function mostrarEventosSidebar(eventos) {
    // Buscar el contenedor de "Próximos Eventos"
    const sidebarBoxes = document.querySelectorAll('.sidebar-box');
    let eventosSidebarBox = null;
    
    // Buscar el sidebar que contiene "Próximos Eventos"
    sidebarBoxes.forEach(box => {
        const title = box.querySelector('.sidebar-title');
        if (title && title.textContent.includes('Próximos Eventos')) {
            eventosSidebarBox = box;
        }
    });
    
    if (!eventosSidebarBox) {
        console.warn('⚠️ No se encontró el contenedor de "Próximos Eventos" en el sidebar');
        return;
    }
    
    // Limpiar contenido actual (mantener solo el título)
    const titulo = eventosSidebarBox.querySelector('.sidebar-title');
    eventosSidebarBox.innerHTML = '';
    eventosSidebarBox.appendChild(titulo);
    
    // Crear las tarjetas de eventos
    eventos.forEach(evento => {
        const eventCard = crearTarjetaEvento(evento);
        eventosSidebarBox.innerHTML += eventCard;
    });
    
    console.log('✅ Eventos cargados en el sidebar:', eventos.length);
}

// ============================================
// CREAR TARJETA DE EVENTO
// ============================================
function crearTarjetaEvento(evento) {
    const fecha = new Date(evento.fecha);
    const dia = fecha.getDate();
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const mes = meses[fecha.getMonth()];
    
    // Determinar icono según modalidad
    const iconoUbicacion = evento.modalidad === 'Virtual' ? 
        'fas fa-video' : 'fas fa-map-marker-alt';
    
    // Texto de ubicación (acortar si es muy largo)
    const ubicacionTexto = evento.ubicacion && evento.ubicacion.length > 30 ? 
        evento.ubicacion.substring(0, 30) + '...' : 
        (evento.ubicacion || 'Por confirmar');
    
    return `
        <div class="event-box-mini" data-event-id="${evento.id}">
            <div class="event-date">
                <span class="day">${dia}</span>
                <span class="month">${mes}</span>
            </div>
            <div class="event-details">
                <h4>${evento.titulo}</h4>
                <p>
                    <i class="${iconoUbicacion}"></i> ${ubicacionTexto}
                </p>
                ${evento.cupos_disponibles <= 5 && evento.cupos_disponibles > 0 ? 
                    `<p class="event-cupos-limitados">
                        <i class="fas fa-exclamation-circle"></i> 
                        Solo ${evento.cupos_disponibles} cupos
                    </p>` : 
                    ''
                }
            </div>
        </div>
    `;
}

// ============================================
// MOSTRAR MENSAJE CUANDO NO HAY EVENTOS
// ============================================
function mostrarSidebarVacio() {
    // Buscar el contenedor de "Próximos Eventos"
    const sidebarBoxes = document.querySelectorAll('.sidebar-box');
    let eventosSidebarBox = null;
    
    sidebarBoxes.forEach(box => {
        const title = box.querySelector('.sidebar-title');
        if (title && title.textContent.includes('Próximos Eventos')) {
            eventosSidebarBox = box;
        }
    });
    
    if (!eventosSidebarBox) return;
    
    eventosSidebarBox.innerHTML = `
        <h3 class="sidebar-title">Próximos Eventos</h3>
        <div style="text-align: center; padding: 30px 20px; color: #666;">
            <i class="fas fa-calendar-times" style="font-size: 36px; margin-bottom: 15px; color: #c5a059; opacity: 0.6;"></i>
            <p style="font-size: 14px;">No hay eventos programados próximamente</p>
        </div>
    `;
}

// ============================================
// ANIMACIÓN DE HOVER EN CARDS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Observar nuevas cards que se agreguen dinámicamente
    const observer = new MutationObserver(function() {
        const courseCards = document.querySelectorAll('.course-card');
        courseCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.borderColor = '#00093C';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.borderColor = '#c5a059';
            });
        });
    });
    
    const grid = document.querySelector('.courses-grid');
    if (grid) {
        observer.observe(grid, { childList: true });
    }
});

// ============================================
// SMOOTH SCROLL PARA NAVEGACIÓN
// ============================================
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

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de cursos cargado - Conectando con API...');
    
    // Cargar datos desde la API
    cargarCursoProximo();
    cargarCursos();
    cargarFiltrosDinamicos();
    cargarProximosEventos(); // 🔥 CARGAR EVENTOS DEL SIDEBAR
    
    // Añadir efecto de carga a las imágenes
    const courseImages = document.querySelectorAll('.course-image img, .featured-image img');
    courseImages.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
    });
});