document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('membershipForm');
    const messageDiv = document.getElementById('formMessage');

    // Your Contentful Management API access token
    const CONTENTFUL_MANAGEMENT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
    const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
    const ENVIRONMENT_ID = 'master';

    // Add your EmailJS configuration
    emailjs.init(process.env.EMAILJS_PUBLIC_KEY); // Replace with your EmailJS public key

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

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show processing message immediately
        showMembershipModal('Processing your application...');
        
        try {
            // 1. Collect form data
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
                        'en-US': form.dataDiNascita.value
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

            // 5. Send email with PDF attachment
            const emailParams = {
                to_email: form.email.value,
                to_name: form.nomeECognome.value,
                message: "Thank you for your membership application!",
                pdf_attachment: pdfBase64.split(',')[1],
                logo1_url: 'https://images.ctfassets.net/evaxoo3zkmhs/2mlMi9zSd8HvfXT87ZcDEr/809a6953b67c75b74c520d657b951253/logo_1.png',
                logo2_url: 'https://images.ctfassets.net/evaxoo3zkmhs/qLg1KL8BkxH2Hb3CH0PNo/c3a167c332b5ffb5292e412a288be4b4/logo_2.png'
            };

            const emailResponse = await emailjs.send(
                process.env.EMAILJS_SERVICE_ID,
                process.env.EMAILJS_TEMPLATE_ID,
                emailParams
            );

            if (emailResponse.status !== 200) {
                throw new Error('Failed to send email');
            }

            // 6. Send data to Contentful
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
                throw new Error('Failed to create entry in Contentful');
            }

            const entry = await createResponse.json();

            // Publish the Contentful entry
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
                throw new Error('Failed to publish entry in Contentful');
            }

            // Clear form and show success message
            form.reset();
            showMembershipModal('Thank you! Your membership application has been submitted and sent to your email.');

        } catch (error) {
            console.error('Error:', error);
            if (error.status === 426) {
                showMembershipModal('Application submitted but email delivery failed. Please contact support.', true);
            } else {
                showMembershipModal('An error occurred. Please try again.', true);
            }
        }
    });
    document.getElementById('closeModalButton').addEventListener('click', function() {
        document.getElementById('membershipResponseModal').style.display = 'none';
        window.location.href = '/';
    });
});