// Chat Toggle
function toggleChat() {
    const chat = document.getElementById('bullChat');
    const isVisible = (chat.style.display === 'flex');
    chat.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
        const badge = document.querySelector('.notification-badge');
        if(badge) badge.style.display = 'none';
    }
}

// Testimonials Carousel
let currentSlide = 0;

function showTestimonial(n) {
    const slides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    
    if (n >= slides.length) { currentSlide = 0; }
    if (n < 0) { currentSlide = slides.length - 1; }
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function moveTestimonial(direction) {
    currentSlide += direction;
    showTestimonial(currentSlide);
}

function currentTestimonial(n) {
    currentSlide = n;
    showTestimonial(currentSlide);
}

// Auto-advance carousel every 5 seconds
setInterval(() => {
    moveTestimonial(1);
}, 5000);

// Stats Counter Animation
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 16); // 60fps
    let current = 0;
    
    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };
    
    updateCounter();
}

// Intersection Observer for Stats Animation
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counters = entry.target.querySelectorAll('.stat-number');
            counters.forEach(counter => {
                animateCounter(counter);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

// Observe stats section when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }
    
    // Smooth scroll for anchor links
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
    
    // Add animation class on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all service cards, training cards, etc.
    const cards = document.querySelectorAll('.service-card, .training-card, .equipment-item');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        fadeInObserver.observe(card);
    });
});

// Chat Input - Enter key to send
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('userInput');
    const sendBtn = document.querySelector('.btn-send');
    
    if (chatInput && sendBtn) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        sendBtn.addEventListener('click', sendMessage);
    }
});

function sendMessage() {
    const input = document.getElementById('userInput');
    const messagesContainer = document.getElementById('chatMessages');
    
    if (input.value.trim() !== '') {
        // Add user message
        const userMsg = document.createElement('div');
        userMsg.className = 'msg-user';
        userMsg.textContent = input.value;
        userMsg.style.background = 'var(--navy)';
        userMsg.style.color = 'white';
        userMsg.style.alignSelf = 'flex-end';
        userMsg.style.padding = '12px 15px';
        userMsg.style.borderRadius = '12px 12px 2px 12px';
        userMsg.style.maxWidth = '85%';
        userMsg.style.marginBottom = '12px';
        messagesContainer.appendChild(userMsg);
        
        // Clear input
        input.value = '';
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Simulate bot response after delay
        setTimeout(() => {
            const botMsg = document.createElement('div');
            botMsg.className = 'msg-bot';
            botMsg.textContent = 'Gracias por tu mensaje. Un asesor se pondrá en contacto contigo pronto.';
            messagesContainer.appendChild(botMsg);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 1000);
    }
}