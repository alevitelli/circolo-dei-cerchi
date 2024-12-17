let client;

async function initContentful() {
    try {
        console.log('Waiting for configuration...');
        while (!window.CONFIG) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const config = window.getConfig();
        console.log('Using configuration:', {
            spaceId: config.CONTENTFUL_SPACE_ID,
            tokenLength: config.CONTENTFUL_ACCESS_TOKEN ? config.CONTENTFUL_ACCESS_TOKEN.length : 0
        });

        if (!config.CONTENTFUL_SPACE_ID || !config.CONTENTFUL_ACCESS_TOKEN) {
            throw new Error('Invalid configuration');
        }

        console.log('Creating Contentful client...');
        client = contentful.createClient({
            space: config.CONTENTFUL_SPACE_ID,
            accessToken: config.CONTENTFUL_ACCESS_TOKEN
        });

        await loadGalleryImages();
        initializeGallery();
    } catch (error) {
        console.error('Error initializing Contentful:', error);
        document.querySelector('.gallery').innerHTML = 
            `<div class="error-message">Error loading gallery: ${error.message}</div>`;
    }
}

async function loadGalleryImages() {
    try {
        console.log('Fetching gallery images...');
        const response = await client.getEntries({
            content_type: 'galleryImage',
            order: 'fields.order'
        });

        console.log(`Received ${response.items.length} images`);
        
        const galleryContainer = document.querySelector('.gallery');
        galleryContainer.innerHTML = response.items.map(image => `
            <img src="${image.fields.image.fields.file.url}" 
                 alt="${image.fields.description || 'Circolo dei Cerchi venue'}" 
                 class="gallery-img">
        `).join('');

    } catch (error) {
        console.error('Error loading images:', error);
        throw error;
    }
}

function initializeGallery() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.modal-close');
    const prevBtn = document.querySelector('.modal-prev');
    const nextBtn = document.querySelector('.modal-next');
    const galleryImages = document.querySelectorAll('.gallery-img');
    let currentImageIndex = 0;

    // Open modal when clicking on gallery image
    galleryImages.forEach((img, index) => {
        img.addEventListener('click', function() {
            modal.style.display = 'block';
            modalImg.src = this.src;
            currentImageIndex = index;
        });
    });

    // Close modal
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside the image
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Previous image
    prevBtn.addEventListener('click', function() {
        currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
        modalImg.src = galleryImages[currentImageIndex].src;
    });

    // Next image
    nextBtn.addEventListener('click', function() {
        currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
        modalImg.src = galleryImages[currentImageIndex].src;
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (modal.style.display === 'block') {
            if (e.key === 'ArrowLeft') {
                prevBtn.click();
            } else if (e.key === 'ArrowRight') {
                nextBtn.click();
            } else if (e.key === 'Escape') {
                closeBtn.click();
            }
        }
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initContentful);