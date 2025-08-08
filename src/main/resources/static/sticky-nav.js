/**
 * Sticky Navigation Handler
 * Makes the horizontal navigation stick to top when scrolled
 */

document.addEventListener('DOMContentLoaded', function() {
    const nav = document.querySelector('.horizontal-nav');
    const header = document.querySelector('.app-header');
    
    if (!nav || !header) {
        console.warn('Sticky navigation: Required elements not found');
        return;
    }

    let navOffset = 0;
    let ticking = false;

    // Calculate initial navigation offset
    function calculateOffset() {
        const headerRect = header.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        navOffset = headerRect.bottom;
    }

    // Handle scroll event
    function handleScroll() {
        if (!ticking) {
            requestAnimationFrame(updateNavigation);
            ticking = true;
        }
    }

    // Update navigation based on scroll position
    function updateNavigation() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > navOffset) {
            nav.classList.add('sticky');
            // Add padding to prevent content jump
            if (!document.querySelector('.nav-spacer')) {
                const spacer = document.createElement('div');
                spacer.className = 'nav-spacer';
                spacer.style.height = nav.offsetHeight + 'px';
                nav.parentNode.insertBefore(spacer, nav.nextSibling);
            }
        } else {
            nav.classList.remove('sticky');
            // Remove spacer
            const spacer = document.querySelector('.nav-spacer');
            if (spacer) {
                spacer.remove();
            }
        }
        
        ticking = false;
    }

    // Initialize
    function init() {
        calculateOffset();
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', calculateOffset);
        
        // Initial check in case page is already scrolled
        updateNavigation();
    }

    init();
});