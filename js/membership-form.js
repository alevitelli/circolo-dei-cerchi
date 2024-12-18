document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Checking for configuration...');
        console.log('Current CONFIG:', window.CONFIG);
        
        // Wait for configuration with timeout
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds total
        
        while (!window.CONFIG && attempts < maxAttempts) {
            console.log('Waiting for configuration... Attempt:', attempts + 1);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.CONFIG) {
            throw new Error('Configuration failed to load after 5 seconds');
        }
        
        const config = window.getConfig();
        console.log('Configuration loaded:', {
            hasSpaceId: !!config.CONTENTFUL_SPACE_ID,
            hasManagementToken: !!config.CONTENTFUL_MANAGEMENT_TOKEN,
            hasEmailJS: !!config.EMAILJS_PUBLIC_KEY,
            hasServiceId: !!config.EMAILJS_SERVICE_ID,
            hasTemplateId: !!config.EMAILJS_TEMPLATE_ID
        });

        if (!config.CONTENTFUL_SPACE_ID || !config.CONTENTFUL_MANAGEMENT_TOKEN || !config.EMAILJS_PUBLIC_KEY) {
            throw new Error('Missing required configuration');
        }

        // Initialize EmailJS
        emailjs.init(config.EMAILJS_PUBLIC_KEY);

        const form = document.getElementById('membershipForm');
        const messageDiv = document.getElementById('formMessage');

        // Store configuration values
        const CONTENTFUL_MANAGEMENT_TOKEN = config.CONTENTFUL_MANAGEMENT_TOKEN;
        const SPACE_ID = config.CONTENTFUL_SPACE_ID;
        const ENVIRONMENT_ID = 'master';

        // Add these constants near the top after other configurations
        const SUMUP_API_URL = 'https://api.sumup.com';
        const SUMUP_CONFIG = {
            merchant_code: config.SUMUP_MERCHANT_CODE,
            access_token: config.SUMUP_ACCESS_TOKEN
        };

        async function generateQRCode(data) {
            const qr = qrcode(0, 'L');
            qr.addData(JSON.stringify(data));
            qr.make();
            return qr.createDataURL();
        }

        async function generatePDF(formData, qrCodeURL) {
            return new Promise((resolve) => {
                const cardTemplate = new Image();
                cardTemplate.crossOrigin = "anonymous";
                cardTemplate.src = 'https://images.ctfassets.net/evaxoo3zkmhs/4QJDCnCQlvN9IgY575dX0N/6f73d86cfd6cbb0928b5e34d1835b8ca/card_cc.png?fm=jpg&fl=progressive';

                cardTemplate.onload = function() {
                    const { jsPDF } = window.jspdf;
                    
                    // Create a canvas to render the PDF page
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Set canvas size to match template but scaled down
                    const scale = 0.7; // Reduce size to 70%
                    canvas.width = cardTemplate.width * scale;
                    canvas.height = cardTemplate.height * scale;
                    
                    // Use better image rendering
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // Draw template with scaling
                    ctx.drawImage(cardTemplate, 0, 0, canvas.width, canvas.height);
                    
                    // Draw black rectangle (adjust coordinates for scale)
                    ctx.fillStyle = 'black';
                    ctx.fillRect(
                        110 * scale, 
                        205 * scale, 
                        (480-110) * scale, 
                        (365-205) * scale
                    );
                    
                    // Add text (adjust font size and coordinates for scale)
                    const [nome, ...cognomeParts] = formData.fields.nomeECognome['en-US'].split(' ');
                    const cognome = cognomeParts.join(' ');
                    
                    ctx.font = `bold ${50 * scale}px helvetica`;
                    ctx.fillStyle = 'white';
                    ctx.fillText(nome.toUpperCase(), 130 * scale, 260 * scale);
                    ctx.fillText(cognome.toUpperCase(), 130 * scale, 320 * scale);
                    
                    // Draw QR code
                    const qrImage = new Image();
                    qrImage.crossOrigin = "anonymous";
                    qrImage.src = qrCodeURL;
                    qrImage.onload = function() {
                        ctx.drawImage(
                            qrImage, 
                            300 * scale, 
                            993 * scale, 
                            (782-300) * scale, 
                            (1476-993) * scale
                        );
                        
                        // Get JPG data with higher compression
                        const jpgBase64 = canvas.toDataURL('image/jpeg', 0.8);
                        
                        // Generate PDF with compressed settings
                        const width = canvas.width * 25.4 / 72;
                        const height = canvas.height * 25.4 / 72;
                        const doc = new jsPDF({
                            orientation: 'portrait',
                            unit: 'mm',
                            format: [width, height],
                            compress: true
                        });
                        
                        doc.addImage(canvas, 'JPEG', 0, 0, width, height, null, 'FAST');
                        const pdfBlob = doc.output('blob');
                        const pdfBase64 = doc.output('datauristring');
                        
                        resolve({ 
                            blob: pdfBlob, 
                            pdfBase64: pdfBase64,
                            jpgBase64: jpgBase64
                        });
                    };
                };
            });
        }

        async function downloadPDF(pdfBlob, fileName) {
            try {
                // Create download link with explicit PDF type
                const url = window.URL.createObjectURL(
                    new Blob([pdfBlob], { type: 'application/pdf' })
                );
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', fileName); // This should force download
                
                // Use click() method after appending to document
                document.body.appendChild(link);
                link.click();
                
                // Cleanup after a short delay
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
            } catch (error) {
                console.error('Download error:', error);
                throw error;
            }
        }

        function showMembershipModal(message, isError = false) {
            const modal = document.getElementById('membershipResponseModal');
            const modalMessage = document.getElementById('membershipModalMessage');
            modalMessage.textContent = message;
            modalMessage.style.color = isError ? 'red' : 'var(--color-accent2)';
            modal.style.display = 'flex';
            
            // Only show the close button for success or error messages
            const closeButton = modal.querySelector('.membership-modal-button');
            closeButton.style.display = message === 'Processing your application...' ? 'none' : 'inline-block';
        }

        // Make the function global by attaching it to window
        window.closeMembershipModal = function() {
            document.getElementById('membershipResponseModal').style.display = 'none';
        }

        document.getElementById('membershipResponseModal').addEventListener('click', function(e) {
            if (e.target === this) {
                document.getElementById('membershipResponseModal').style.display = 'none';
                window.location.href = '/';
            }
        });

        function parseAndFormatDate(dateString) {
            try {
                // First try parsing as ISO date (YYYY-MM-DD)
                let date = new Date(dateString);
                
                // If that didn't work, try parsing other formats
                if (isNaN(date.getTime())) {
                    // Try parsing "DD Mon YYYY" format (like "18 Dec 2024")
                    const parts = dateString.split(' ');
                    if (parts.length === 3) {
                        const months = {
                            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                        };
                        const day = parts[0].padStart(2, '0');
                        const month = months[parts[1]];
                        const year = parts[2];
                        if (month) {
                            date = new Date(`${year}-${month}-${day}`);
                        }
                    }
                }

                // If we still don't have a valid date, throw an error
                if (isNaN(date.getTime())) {
                    throw new Error('Invalid date format');
                }

                // Format the date as DD/MM/YYYY
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                
                return `${day}/${month}/${year}`;
            } catch (error) {
                console.error('Date parsing error:', error);
                throw new Error('Invalid date format. Please use DD/MM/YYYY format.');
            }
        }

        // At the top of your file, after the initial declarations
        let emailjsInitialized = false;

        // Create a function to initialize EmailJS
        async function initializeEmailJS(publicKey) {
            if (emailjsInitialized) {
                console.log('EmailJS already initialized');
                return;
            }
        
            try {
                if (!publicKey) {
                    throw new Error('EmailJS public key is missing');
                }
        
                console.log('Initializing EmailJS...');
                await emailjs.init(publicKey);
                
                // Verify initialization
                if (typeof emailjs.send !== 'function') {
                    throw new Error('EmailJS not properly initialized');
                }
                
                emailjsInitialized = true;
                console.log('EmailJS initialized successfully');
            } catch (error) {
                console.error('EmailJS initialization failed:', {
                    error: error,
                    message: error.message,
                    stack: error.stack
                });
                throw new Error(`Failed to initialize email service: ${error.message}`);
            }
        }

        // Add this function to handle SumUp checkout creation
        async function createSumUpCheckout(formData) {
            try {
                const returnUrl = new URL('/payment', window.location.origin).toString();
                
                const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SUMUP_CONFIG.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: 0.50,
                        currency: 'EUR',
                        checkout_reference: `membership-${Date.now()}`,
                        merchant_code: SUMUP_CONFIG.merchant_code,
                        description: 'Circolo dei Cerchi Membership Fee',
                        return_url: returnUrl,
                        pay_to_email: 'circolodeicerchi@gmail.com'
                    })
                });

                if (!response.ok) {
                    throw new Error(`SumUp API error: ${response.status}`);
                }

                const checkout = await response.json();
                return checkout;
            } catch (error) {
                console.error('SumUp checkout creation failed:', error);
                throw error;
            }
        }

        // Handle initial form submission
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                // 1. Collect and validate form data
                const formData = {
                    fields: {
                        email: { 'en-US': form.email.value },
                        nomeECognome: { 'en-US': form.nomeECognome.value },
                        cittaEProvinciaDiNascita: { 'en-US': form.cittaEProvinciaDiNascita.value },
                        dataDiNascita: { 'en-US': form.dataDiNascita.value },
                        indirizzoEComuneDiResidenza: { 'en-US': form.indirizzoEComuneDiResidenza.value },
                        codicefiscale: { 'en-US': form.codicefiscale.value }
                    }
                };

                // 2. Store form data in session storage
                sessionStorage.setItem('membershipFormData', JSON.stringify(formData));

                // 3. Show redirect message
                showMembershipModal('Redirecting to payment page...');

                // 4. Create SumUp checkout
                const checkout = await createSumUpCheckout(formData);

                // 5. Redirect to payment page
                window.location.href = `/payment?checkoutId=${checkout.id}`;

            } catch (error) {
                console.error('Form submission failed:', error);
                showMembershipModal(`An error occurred: ${error.message}. Please try again.`, true);
            }
        });

        // Handle return from payment
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('status');
        const checkoutId = urlParams.get('checkoutId');

        if (paymentStatus === 'PAID' && checkoutId) {
            handleSuccessfulPayment();
        }

        async function handleSuccessfulPayment() {
            try {
                showMembershipModal('Processing your application...');

                // 1. Retrieve stored form data
                const storedFormData = sessionStorage.getItem('membershipFormData');
                if (!storedFormData) {
                    throw new Error('No stored form data found');
                }
                const formData = JSON.parse(storedFormData);

                // 2. Generate QR Code
                const qrCodeURL = await generateQRCode(formData);

                // 3. Generate PDF
                const { blob: pdfBlob, pdfBase64 } = await generatePDF(formData, qrCodeURL);
                const fileName = `membership_${formData.fields.nomeECognome['en-US'].replace(/\s+/g, '_')}.pdf`;

                // 4. Download PDF locally
                await downloadPDF(pdfBlob, fileName);

                // 5. Send email with PDF attachment
                await sendConfirmationEmail(formData, pdfBase64);

                // 6. Create Contentful entry
                await createContentfulEntry(formData);

                // 7. Show success message and clean up
                showMembershipModal('Thank you! Your membership application has been submitted successfully and sent to your email.');
                sessionStorage.removeItem('membershipFormData');
                sessionStorage.removeItem('sumupCheckoutId');

            } catch (error) {
                console.error('Post-payment processing failed:', error);
                showMembershipModal(`An error occurred while processing your application: ${error.message}. Please contact support.`, true);
            }
        }

        async function sendConfirmationEmail(formData, pdfBase64) {
            try {
                console.log('Starting email process...');
                
                // Validate inputs
                if (!formData?.fields?.email?.['en-US']) {
                    throw new Error('Invalid email address in form data');
                }
                if (!formData?.fields?.nomeECognome?.['en-US']) {
                    throw new Error('Invalid name in form data');
                }
                if (!pdfBase64) {
                    throw new Error('Missing PDF attachment');
                }
        
                // Check if EmailJS needs initialization
                if (!emailjsInitialized) {
                    console.log('Initializing EmailJS...');
                    await initializeEmailJS(config.EMAILJS_PUBLIC_KEY);
                }
        
                // Clean and validate PDF data
                const pdfData = pdfBase64.split(',')[1] || pdfBase64;
                
                // Log parameters for debugging (excluding PDF content)
                console.log('Email parameters:', {
                    to_email: formData.fields.email['en-US'],
                    to_name: formData.fields.nomeECognome['en-US'],
                    service_id: config.EMAILJS_SERVICE_ID,
                    template_id: config.EMAILJS_TEMPLATE_ID,
                    hasPdfAttachment: !!pdfData,
                    pdfSize: pdfData.length
                });
        
                // Prepare email parameters
                const emailParams = {
                    to_email: formData.fields.email['en-US'].trim(),
                    to_name: formData.fields.nomeECognome['en-US'].trim(),
                    message: "Thank you for your membership application!",
                    pdf_attachment: pdfData,
                    logo1_url: 'https://images.ctfassets.net/evaxoo3zkmhs/2mlMi9zSd8HvfXT87ZcDEr/809a953b67c75b74c520d657b951253/logo_1.png',
                    logo2_url: 'https://images.ctfassets.net/evaxoo3zkmhs/qLg1KL8BkxH2Hb3CH0PNo/c3a167c332b5ffb5292e412a288be4b4/logo_2.png'
                };
        
                // Validate all required parameters are present
                const requiredParams = ['to_email', 'to_name', 'pdf_attachment'];
                for (const param of requiredParams) {
                    if (!emailParams[param]) {
                        throw new Error(`Missing required email parameter: ${param}`);
                    }
                }
        
                console.log('Sending email...');
                
                // Add error handling for the send operation
                try {
                    const response = await new Promise((resolve, reject) => {
                        emailjs.send(
                            config.EMAILJS_SERVICE_ID,
                            config.EMAILJS_TEMPLATE_ID,
                            emailParams,
                            config.EMAILJS_PUBLIC_KEY
                        ).then(
                            (response) => resolve(response),
                            (error) => reject(error)
                        );
                    });
        
                    console.log('Email sent successfully:', response);
                    return response;
                } catch (sendError) {
                    console.error('EmailJS send error details:', {
                        error: sendError,
                        message: sendError.message || 'Unknown error',
                        status: sendError.status,
                        text: sendError.text,
                        name: sendError.name
                    });
                    throw new Error(sendError.text || sendError.message || 'Failed to send email');
                }
            } catch (error) {
                console.error('Email process failed:', {
                    error: error,
                    message: error.message,
                    stack: error.stack
                });
                throw error;
            }
        }

        async function createContentfulEntry(formData) {
            const createResponse = await fetch(
                `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENVIRONMENT_ID}/entries`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${CONTENTFUL_MANAGEMENT_TOKEN}`,
                        'Content-Type': 'application/json',
                        'X-Contentful-Content-Type': 'membership'
                    },
                    body: JSON.stringify(formData)
                }
            );

            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                throw new Error(`Contentful entry creation failed: ${errorData.message}`);
            }

            const entry = await createResponse.json();

            // Publish the entry
            const publishResponse = await fetch(
                `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENVIRONMENT_ID}/entries/${entry.sys.id}/published`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${CONTENTFUL_MANAGEMENT_TOKEN}`,
                        'X-Contentful-Version': entry.sys.version
                    }
                }
            );

            if (!publishResponse.ok) {
                const publishErrorData = await publishResponse.json();
                throw new Error(`Contentful entry publishing failed: ${publishErrorData.message}`);
            }
        }

        document.getElementById('closeModalButton').addEventListener('click', function() {
            document.getElementById('membershipResponseModal').style.display = 'none';
            window.location.href = '/';
        });
    } catch (error) {
        console.error('Configuration error:', error);
        const messageDiv = document.getElementById('formMessage');
        if (messageDiv) {
            messageDiv.innerHTML = `<div class="error-message">Error initializing form: ${error.message}</div>`;
        }
    }
});