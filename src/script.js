document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                }
            }
        });
    });
    
    // Tab functionality for use cases
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding tab pane
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Form submission
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const formValues = Object.fromEntries(formData.entries());
            
            // Here you would typically send the data to your server
            console.log('Form submitted with values:', formValues);
            
            // Show success message
            alert('Thank you for your interest! We will contact you shortly.');
            
            // Reset form
            this.reset();
        });
    }
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements to animate
    document.querySelectorAll('.feature-card, .product-image, .use-case-image, .team-member').forEach(element => {
        observer.observe(element);
    });
    
    // Add animation classes to CSS
    const style = document.createElement('style');
    style.textContent = `
        .feature-card, .product-image, .use-case-image, .team-member {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .feature-card.animate, .product-image.animate, .use-case-image.animate, .team-member.animate {
            opacity: 1;
            transform: translateY(0);
        }
        
        .feature-card:nth-child(2) {
            transition-delay: 0.1s;
        }
        
        .feature-card:nth-child(3) {
            transition-delay: 0.2s;
        }
        
        .feature-card:nth-child(4) {
            transition-delay: 0.3s;
        }
        
        .feature-card:nth-child(5) {
            transition-delay: 0.4s;
        }
        
        .feature-card:nth-child(6) {
            transition-delay: 0.5s;
        }
        
        .team-member:nth-child(2) {
            transition-delay: 0.1s;
        }
        
        .team-member:nth-child(3) {
            transition-delay: 0.2s;
        }
    `;
    document.head.appendChild(style);
});