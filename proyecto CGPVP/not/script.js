// Script para activar la línea debajo de la opción seleccionada
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault(); // Evita el comportamiento predeterminado del enlace
        
        // Remueve la clase 'active' de todos los enlaces
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        
        // Agrega la clase 'active' al enlace clickeado
        this.classList.add('active');
        
        // Opcional: Scroll suave a la sección
        const targetId = this.getAttribute('href');
        if (targetId.startsWith('#')) {
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
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