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
        const client = contentful.createClient({
            space: config.CONTENTFUL_SPACE_ID,
            accessToken: config.CONTENTFUL_ACCESS_TOKEN
        });

        await loadCorsoDetail(client);
    } catch (error) {
        console.error('Error initializing Contentful:', error);
        document.querySelector('.event-detail-container').innerHTML = 
            `<div class="error-message">Error loading corso: ${error.message}</div>`;
    }
}

async function loadCorsoDetail(client) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const corsoId = urlParams.get('id');

        if (!corsoId) {
            window.location.href = '/corsi';
            return;
        }

        console.log('Fetching corso details for:', corsoId);
        const entry = await client.getEntry(corsoId);
        console.log('Corso data received:', entry.fields.nomeCorso);
        
        displayCorso(entry);
    } catch (error) {
        console.error('Error loading corso:', error);
        document.querySelector('.event-detail-container').innerHTML = 
            `<div class="error-message">Error loading corso: ${error.message}</div>`;
    }
}

function displayCorso(corso) {
    console.log('Displaying corso:', corso.fields.nomeCorso);
    
    // Set page title
    document.title = `${corso.fields.nomeCorso} - Circolo dei Cerchi`;

    // Set hero image if exists
    if (corso.fields.immagine) {
        const imageUrl = corso.fields.immagine.fields.file.url;
        document.querySelector('.event-detail-image').innerHTML = `
            <img src="https:${imageUrl}" alt="${corso.fields.nomeCorso}">
        `;
    }

    // Set corso title
    document.querySelector('.event-detail-heading').textContent = corso.fields.nomeCorso;

    // Set metadata with clickable venue
    document.querySelector('.event-detail-venue').innerHTML = corso.fields.venueLocation ? 
        `<a href="${corso.fields.venueLocation}" target="_blank" rel="noopener noreferrer">${corso.fields.venue}</a>` : 
        corso.fields.venue;
    
    // Format date
    const date = new Date(corso.fields.dataInizio);
    document.querySelector('.event-detail-date').textContent = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Set description if exists
    if (corso.fields.descrizione) {
        const formattedDescription = corso.fields.descrizione
            // Convert markdown links to HTML
            .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            // Convert newlines to <br>
            .replace(/\n/g, '<br>');
            
        document.querySelector('.event-detail-description').innerHTML = formattedDescription;
    }

    console.log('Corso display complete');
}

document.addEventListener('DOMContentLoaded', initContentful);

document.addEventListener('DOMContentLoaded', () => {
    // Initialize EmailJS with your public key
    config.EMAILJS_PUBLIC_KEY; // Replace with your actual EmailJS public key

    const corsoInfoForm = document.getElementById('corsoInfoForm');
    const formMessage = document.getElementById('formMessage');

    if (corsoInfoForm) {
        corsoInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get form data
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const messaggio = document.getElementById('messaggio').value;
            const corso = document.getElementById('corsoTitle').value;

            try {
                // Send email using EmailJS
                await emailjs.send(
                    config.EMAILJS_SERVICE_ID,
                    config.EMAILJS_TEMPLATE_ID_FORM_CORSO,
                    {
                        from_name: nome,
                        reply_to: email,
                        message: messaggio,
                        corso_title: corso,
                        logo1_url: 'https://images.ctfassets.net/evaxoo3zkmhs/2mlMi9zSd8HvfXT87ZcDEr/809a953b67c75b74c520d657b951253/logo_1.png',
                        logo2_url: 'https://images.ctfassets.net/evaxoo3zkmhs/qLg1KL8BkxH2Hb3CH0PNo/c3a167c332b5ffb5292e412a288be4b4/logo_2.png'
                    },
                    config.EMAILJS_PUBLIC_KEY
                );

                // Show success message
                formMessage.textContent = 'Grazie per il tuo messaggio! Ti risponderemo presto.';
                formMessage.className = 'success';
                corsoInfoForm.reset();

            } catch (error) {
                console.error('Email error:', error);
                formMessage.textContent = 'Si è verificato un errore. Per favore riprova più tardi.';
                formMessage.className = 'error';
            }
        });
    }

    // Set the corso title in the hidden field when loading the page
    const setCorsoTitle = (title) => {
        const corsoTitleInput = document.getElementById('corsoTitle');
        if (corsoTitleInput) {
            corsoTitleInput.value = title;
        }
    };

    // Call this function when you load the corso details
    client.getEntry(corsoId)
        .then((entry) => {
            // ... your existing code ...
            setCorsoTitle(entry.fields.title);
        })
        .catch(console.error);
});