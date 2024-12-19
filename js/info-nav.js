function initInfoNav() {
    const select = document.querySelector('.info-nav-select');
    
    // Handle dropdown selection
    if (select) {
        select.addEventListener('change', function(e) {
            const targetElement = document.querySelector(this.value);
            
            if (targetElement) {
                const headerOffset = 180; // Increased to account for fixed header + dropdown
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }
}

// Export the function to global scope
window.initInfoNav = initInfoNav;