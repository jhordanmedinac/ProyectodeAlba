// ========== NAVBAR SEARCH TOGGLE ==========
function toggleNavbarSearch() {
    const searchBox = document.getElementById('navbarSearchBox');
    const searchInput = document.getElementById('navbarSearchInput');
    const searchResults = document.getElementById('navbarSearchResults');
    
    searchBox.classList.toggle('active');
    
    if (searchBox.classList.contains('active')) {
        // Enfocar el input cuando se abre
        setTimeout(() => {
            searchInput.focus();
        }, 100);
    } else {
        // Limpiar búsqueda cuando se cierra
        searchInput.value = '';
        searchResults.classList.remove('show');
        searchResults.innerHTML = '';
        searchBox.classList.remove('has-results');
    }
}

// Cerrar búsqueda del navbar al hacer clic fuera
document.addEventListener('click', function(e) {
    const searchBox = document.getElementById('navbarSearchBox');
    const searchBtn = document.querySelector('.navbar-search-btn');
    const searchContainer = document.querySelector('.navbar-search-container');
    
    if (searchBox && !searchContainer.contains(e.target)) {
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

// Búsqueda en tiempo real en el navbar
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
        
        // Buscar coincidencias
        const results = personalDatabase.filter(person => {
            const fullName = `${person.apellidos} ${person.nombres}`.toLowerCase();
            const legajo = person.legajo.toLowerCase();
            const dni = person.dni.toLowerCase();
            
            return fullName.includes(searchTerm) || 
                   legajo.includes(searchTerm) || 
                   dni.includes(searchTerm);
        });
        
        // Mostrar resultados
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
    });
    
    // Buscar con Enter
    navbarSearchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const searchResults = document.getElementById('navbarSearchResults');
            const firstResult = searchResults.querySelector('.navbar-search-result-item');
            if (firstResult) {
                firstResult.click();
            }
        }
    });
}

// Script para activar la línea debajo de la opción seleccionada
// CORREGIDO: Solo previene enlaces con # para permitir navegación normal
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        const targetHref = this.getAttribute('href');
        
        // Solo prevenir el comportamiento predeterminado si es un enlace ancla (#)
        if (!targetHref || targetHref === '#' || (targetHref.startsWith('#') && targetHref.length > 1)) {
            e.preventDefault();
            
            // Remueve la clase 'active' de todos los enlaces
            document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
            
            // Agrega la clase 'active' al enlace clickeado
            this.classList.add('active');
            
            // Scroll suave a la sección si es un ancla válida
            if (targetHref && targetHref.startsWith('#') && targetHref.length > 1) {
                const targetSection = document.querySelector(targetHref);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
        // Si el href es una URL real (index.html, Nosotros.html, etc.), 
        // dejamos que el navegador maneje la navegación normalmente
    });
});
// ========== FUNCIONES DE FILTRADO ==========
function filterNews(category) {
    const cards = document.querySelectorAll('.news-card:not(.featured-card)');
    const buttons = document.querySelectorAll('.filter-btn');

    // Actualizar botones activos
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Filtrar cards
    cards.forEach(card => {
        if (category === 'todas') {
            card.style.display = 'block';
        } else {
            const cardCategory = card.getAttribute('data-category');
            card.style.display = cardCategory === category ? 'block' : 'none';
        }

        // Re-animar cards visibles
        if (card.style.display === 'block') {
            card.style.animation = 'none';
            setTimeout(() => {
                card.style.animation = 'fadeIn 0.6s ease';
            }, 10);
        }
    });
}

// ========== FUNCIÓN DE BÚSQUEDA ==========
function searchNews() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.news-card');

    cards.forEach(card => {
        const title = card.querySelector('.card-title, .featured-title')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.card-description, .featured-description')?.textContent.toLowerCase() || '';

        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });

    if (searchTerm === '') {
        cards.forEach(card => card.style.display = 'block');
    }
}

// Búsqueda en tiempo real
document.getElementById('searchInput')?.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
        searchNews();
    }
});

// ========== FUNCIÓN DE PAGINACIÓN ==========
let currentPage = 1;
const totalPages = 5;

function changePage(direction) {
    currentPage += direction;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    // Actualizar botones activos
    const pageButtons = document.querySelectorAll('.page-btn');
    pageButtons.forEach((btn, index) => {
        if (index > 0 && index < pageButtons.length - 1) {
            btn.classList.remove('active');
            if (parseInt(btn.textContent) === currentPage) {
                btn.classList.add('active');
            }
        }
    });

    // Scroll suave al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Aquí podrías cargar nuevas noticias vía AJAX
    console.log('Página actual:', currentPage);
}

// ========== CLICK EN BOTONES DE PÁGINA ==========
document.querySelectorAll('.page-btn').forEach((btn, index) => {
    if (index > 0 && index < document.querySelectorAll('.page-btn').length - 1) {
        btn.addEventListener('click', function() {
            currentPage = parseInt(this.textContent);
            document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});

// ========== ANIMACIÓN DE ENTRADA ==========
window.addEventListener('load', () => {
    const cards = document.querySelectorAll('.news-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        setTimeout(() => {
            card.style.opacity = '1';
        }, index * 100);
    });
});

// ========== BACK TO TOP FUNCTIONALITY ==========
const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        backToTopBtn?.classList.add('show');
    } else {
        backToTopBtn?.classList.remove('show');
    }
});

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// ========== SMOOTH SCROLL PARA ENLACES DEL FOOTER ==========
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
// ========== DATOS DE PRUEBA - BASE DE DATOS DE PERSONAL ==========
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

// ========== BÚSQUEDA DE PERSONAL ==========
const searchInput = document.getElementById('searchPersonal');
const searchResults = document.getElementById('searchResults');

// Event listener para búsqueda en tiempo real
if (searchInput) {
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim().toLowerCase();
        
        if (searchTerm.length < 2) {
            searchResults.classList.remove('show');
            searchResults.innerHTML = '';
            return;
        }
        
        // Buscar coincidencias
        const results = personalDatabase.filter(person => {
            const fullName = `${person.apellidos} ${person.nombres}`.toLowerCase();
            const legajo = person.legajo.toLowerCase();
            const dni = person.dni.toLowerCase();
            
            return fullName.includes(searchTerm) || 
                   legajo.includes(searchTerm) || 
                   dni.includes(searchTerm);
        });
        
        // Mostrar resultados
        if (results.length > 0) {
            searchResults.innerHTML = results.map(person => `
                <div class="search-result-item" onclick="showPersonalInfo('${person.legajo}')">
                    <div class="search-result-name">${person.apellidos}, ${person.nombres}</div>
                    <div class="search-result-details">Legajo: ${person.legajo} | DNI: ${person.dni}</div>
                </div>
            `).join('');
            searchResults.classList.add('show');
        } else {
            searchResults.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
            searchResults.classList.add('show');
        }
    });
    
    // Cerrar resultados al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('show');
        }
    });
}

// ========== MOSTRAR INFORMACIÓN DE PERSONAL ==========
function showPersonalInfo(legajo) {
    const person = personalDatabase.find(p => p.legajo === legajo);
    
    if (!person) return;
    
    // Cerrar el navbar search box completamente
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
    
    // Actualizar datos en el modal
    document.getElementById('personalFullName').textContent = `${person.apellidos}, ${person.nombres}`;
    document.getElementById('personalLegajo').textContent = person.legajo;
    document.getElementById('personalDNI').textContent = person.dni;
    document.getElementById('personalRango').textContent = person.rango;
    document.getElementById('personalJefatura').textContent = person.jefatura;
    document.getElementById('personalPhoto').src = person.foto;
    
    // Actualizar estado
    const statusBadge = document.querySelector('.status-badge');
    statusBadge.className = `status-badge ${person.estado.toLowerCase()}`;
    statusBadge.innerHTML = `<strong>ESTADO:</strong> ${person.estado}`;
    if (person.estado === "BAJA") {
        statusBadge.innerHTML += ` (${person.fechaActualizacion})`;
    }
    
    // Actualizar QR
    document.querySelector('.qr-code').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=LEGAJO${person.legajo}`;
    
    // Actualizar certificaciones
    const certList = document.querySelector('.certification-list');
    certList.innerHTML = person.certificaciones.map(cert => `
        <div class="certification-item">
            <span class="cert-icon">${cert.icono}</span>
            <span class="cert-name">${cert.nombre}</span>
        </div>
    `).join('');
    
    // Mostrar modal
    document.getElementById('personalModal').classList.add('show');
    
    // Limpiar el buscador antiguo si existe
    const searchResults = document.getElementById('searchResults');
    const searchInput = document.getElementById('searchPersonal');
    if (searchResults) searchResults.classList.remove('show');
    if (searchInput) searchInput.value = '';
}

// ========== CERRAR MODAL ==========
function closePersonalModal() {
    document.getElementById('personalModal').classList.remove('show');
}

// Cerrar modal al hacer clic fuera de él
window.onclick = function(event) {
    const modal = document.getElementById('personalModal');
    if (event.target === modal) {
        closePersonalModal();
    }
}

// Cerrar modal con tecla ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePersonalModal();
    }
});

// ========== FUNCIÓN DE BÚSQUEDA (botón) ==========
function searchPersonal() {
    const searchTerm = searchInput.value.trim();
    if (searchTerm.length >= 2) {
        searchInput.dispatchEvent(new Event('input'));
    }
}
