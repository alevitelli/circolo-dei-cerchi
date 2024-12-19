function initHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mainNav = document.querySelector('.main-nav');

    if (hamburger && mainNav) {
        console.log('Hamburger menu elements found');
        hamburger.addEventListener('click', (e) => {
            console.log('Hamburger clicked');
            e.preventDefault();
            e.stopPropagation();
            hamburger.classList.toggle('active');
            mainNav.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mainNav.classList.remove('active');
            });
        });
    } else {
        console.error('Hamburger menu elements not found');
    }
}

// Export the function to global scope
window.initHamburgerMenu = initHamburgerMenu;