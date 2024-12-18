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
            try {
                await emailjs.init(publicKey);
                emailjsInitialized = true;
                console.log('EmailJS initialized successfully');
            } catch (error) {
                console.error('EmailJS initialization failed:', error);
                throw new Error('Failed to initialize email service');
            }
        }

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            showMembershipModal('Processing your application...');
            
            try {
                // Format date once at the beginning
                const rawDate = new Date(form.dataDiNascita.value);
                const formattedDateDisplay = rawDate.toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                const contentfulDate = rawDate.toISOString().split('T')[0]; // YYYY-MM-DD for Contentful

                // 1. Collect form data with formatted date
                const formData = {
                    fields: {
                        email: {
                            'en-US': form.email.value
                        },
                        nomeECognome: {
                            'en-US': form.nomeECognome.value
                        },
                        cittaEProvinciaDiNascita: {
                            'en-US': form.cittaEProvinciaDiNascita.value
                        },
                        dataDiNascita: {
                            'en-US': contentfulDate  // Use ISO format for Contentful
                        },
                        indirizzoEComuneDiResidenza: {
                            'en-US': form.indirizzoEComuneDiResidenza.value
                        },
                        codicefiscale: {
                            'en-US': form.codicefiscale.value
                        }
                    }
                };

                // 2. Generate QR Code
                const qrCodeURL = await generateQRCode(formData);

                // 3. Generate PDF
                const { blob: pdfBlob, pdfBase64 } = await generatePDF(formData, qrCodeURL);
                const fileName = `membership_${formData.fields.nomeECognome['en-US'].replace(/\s+/g, '_')}.pdf`;

                // 4. Download PDF locally
                await downloadPDF(pdfBlob, fileName);

                // Ensure EmailJS is initialized before sending
                if (!emailjsInitialized) {
                    console.log('Initializing EmailJS...');
                    await initializeEmailJS(config.EMAILJS_PUBLIC_KEY);
                }
                
                // 5. Send email with PDF attachment
                console.log('Attempting to send email...', {
                    serviceId: config.EMAILJS_SERVICE_ID,
                    templateId: config.EMAILJS_TEMPLATE_ID,
                    hasPublicKey: !!config.EMAILJS_PUBLIC_KEY
                });

                const emailParams = {
                    to_email: form.email.value,
                    to_name: form.nomeECognome.value,
                    message: "Thank you for your membership application!",
                    pdf_attachment: pdfBase64.split(',')[1],
                    logo1_url: 'https://images.ctfassets.net/evaxoo3zkmhs/2mlMi9zSd8HvfXT87ZcDEr/809a6953b67c75b74c520d657b951253/logo_1.png',
                    logo2_url: 'https://images.ctfassets.net/evaxoo3zkmhs/qLg1KL8BkxH2Hb3CH0PNo/c3a167c332b5ffb5292e412a288be4b4/logo_2.png'
                };

                try {
                    // Add a small delay before sending (sometimes helps with mobile)
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    const emailResponse = await emailjs.send(
                        config.EMAILJS_SERVICE_ID,
                        config.EMAILJS_TEMPLATE_ID,
                        emailParams,
                        config.EMAILJS_PUBLIC_KEY // Add public key here explicitly
                    );
                    console.log('Email sent successfully:', emailResponse);
                } catch (emailError) {
                    console.error('Email sending failed:', {
                        error: emailError,
                        params: {
                            serviceId: config.EMAILJS_SERVICE_ID,
                            templateId: config.EMAILJS_TEMPLATE_ID,
                            hasPublicKey: !!config.EMAILJS_PUBLIC_KEY
                        }
                    });
                    throw new Error(`Email sending failed: ${emailError.message || JSON.stringify(emailError)}`);
                }

                // 6. Send data to Contentful
                console.log('Attempting to create Contentful entry...');
                
                console.log('Contentful payload:', formData); // Debug log

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
                    console.error('Contentful error details:', errorData);
                    throw new Error(`Contentful entry creation failed: ${errorData.message || JSON.stringify(errorData)}`);
                }

                const entry = await createResponse.json();
                console.log('Contentful entry created successfully:', entry);

                // Publish the entry
                try {
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
                        console.error('Contentful publish error details:', publishErrorData);
                        throw new Error(`Contentful entry publishing failed: ${publishErrorData.message || JSON.stringify(publishErrorData)}`);
                    }

                    console.log('Contentful entry published successfully');
                    
                    // Clear form and show success message
                    form.reset();
                    showMembershipModal('Thank you! Your membership application has been submitted successfully and sent to your email.');

                } catch (publishError) {
                    console.error('Publishing error:', publishError);
                    throw new Error(`Entry publishing failed: ${publishError.message}`);
                }

            } catch (error) {
                console.error('Operation failed:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
                });
                showMembershipModal(`An error occurred: ${error.message}. Please try again.`, true);
            }
        });
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