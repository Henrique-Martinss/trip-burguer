/* ============================================================
   SMASH BURGER — JavaScript
   Design: Dark Forge Premium — Industrial Dark Gourmet
   Funcionalidades: Navbar scroll, menu mobile, animações
   ============================================================ */

// ========== NAVBAR SCROLL EFFECT ==========
const navbar = document.querySelector('.navbar');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ========== MOBILE MENU TOGGLE ==========
menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Fechar menu ao clicar em um link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// ========== FADE UP ANIMATION ON SCROLL ==========
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observar todos os elementos com classe animate-fade-up
document.querySelectorAll('.animate-fade-up').forEach(el => {
    observer.observe(el);
});

// ========== SMOOTH SCROLL PARA LINKS INTERNOS ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            const target = document.querySelector(href);
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ========== PARALLAX EFFECT NO HERO ==========
const heroBackground = document.querySelector('.hero-background');

window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    if (heroBackground) {
        heroBackground.style.backgroundPosition = `center ${30 + scrollPosition * 0.5}px`;
    }
});

// ========== HOVER EFFECTS NOS CARDS ==========
document.querySelectorAll('.diferencial-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.borderColor = '#8C2493';
        this.style.transform = 'translateY(-4px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.borderColor = 'rgba(151, 99, 172, 0.12)';
        this.style.transform = 'translateY(0)';
    });
});

// ========== HOVER EFFECTS NOS DEPOIMENTOS ==========
document.querySelectorAll('.depoimento-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.borderColor = '#8C2493';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.borderColor = 'rgba(201, 168, 76, 0.1)';
    });
});

// ========== HOVER EFFECTS NOS BOTÕES SOCIAIS ==========
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('mouseenter', function() {
        this.style.borderColor = '#8C2493';
        this.style.transform = 'translateY(-3px)';
    });
    
    btn.addEventListener('mouseleave', function() {
        this.style.borderColor = 'rgba(201, 168, 76, 0.2)';
        this.style.transform = 'translateY(0)';
    });
});

// ========== HOVER EFFECTS NOS LINKS DE NAVEGAÇÃO ==========
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('mouseenter', function() {
        this.style.color = '#8C2493';
    });
    
    link.addEventListener('mouseleave', function() {
        this.style.color = '#aaa';
    });
});

// ========== HOVER EFFECTS NOS FOOTER LINKS ==========
document.querySelectorAll('.footer-links a').forEach(link => {
    link.addEventListener('mouseenter', function() {
        this.style.color = '#8C2493';
    });
    
    link.addEventListener('mouseleave', function() {
        this.style.color = '#888';
    });
});

// ========== HOVER EFFECTS NO WHATSAPP FLOAT ==========
const whatsappFloat = document.querySelector('.whatsapp-float');

whatsappFloat.addEventListener('mouseenter', function() {
    this.style.transform = 'scale(1.12)';
    this.style.boxShadow = '0 6px 28px rgba(37, 211, 102, 0.6)';
});

whatsappFloat.addEventListener('mouseleave', function() {
    this.style.transform = 'scale(1)';
    this.style.boxShadow = '0 4px 20px rgba(37, 211, 102, 0.4)';
});

// ========== HOVER EFFECTS NOS BURGER IMAGES ==========
document.querySelectorAll('.burger-image img').forEach(img => {
    img.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.07)';
    });
    
    img.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});

// ========== HOVER EFFECTS NOS INFO CARDS ==========
document.querySelectorAll('.info-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.borderColor = '#a018ee4d';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.borderColor = '#753b964d';
    });
});

// ========== LOG DE INICIALIZAÇÃO ==========
console.log('✓ Smash Burger - Landing Page carregada com sucesso!');
console.log('✓ Todas as animações e interações estão ativas.');