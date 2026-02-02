const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

// @desc    Submit IT support request
// @route   POST /api/support/contact
// @access  Public
const submitContactRequest = async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            res.status(400);
            return next(new Error('Please provide all required fields'));
        }

        const ticketId = `TICKET-${Date.now()}`;
        const timestamp = new Date().toISOString();

        // Log the request
        console.log('IT Support Request:', {
            ticketId,
            name,
            email,
            subject,
            message,
            timestamp
        });

        // Send emails if email is configured
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                console.log('📧 Email configuration found, attempting to send emails...');
                console.log('   From:', process.env.EMAIL_USER);
                console.log('   To IT:', process.env.IT_DEPARTMENT_EMAIL || process.env.EMAIL_USER);
                console.log('   To User:', email);

                const transporter = createTransporter();

                // Verify transporter configuration
                await transporter.verify();
                console.log('✅ SMTP connection verified');

                // Email to IT Department
                const itEmailOptions = {
                    from: process.env.EMAIL_FROM,
                    to: process.env.IT_DEPARTMENT_EMAIL || process.env.EMAIL_USER,
                    subject: `New IT Support Request: ${subject}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                                <h1 style="color: white; margin: 0;">New Support Request</h1>
                            </div>
                            <div style="background: #f9fafb; padding: 30px;">
                                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <h2 style="color: #1f2937; margin-top: 0;">Ticket Details</h2>
                                    <p style="color: #6b7280;"><strong>Ticket ID:</strong> ${ticketId}</p>
                                    <p style="color: #6b7280;"><strong>Name:</strong> ${name}</p>
                                    <p style="color: #6b7280;"><strong>Email:</strong> ${email}</p>
                                    <p style="color: #6b7280;"><strong>Subject:</strong> ${subject}</p>
                                    <p style="color: #6b7280;"><strong>Submitted:</strong> ${new Date(timestamp).toLocaleString()}</p>
                                    
                                    <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
                                        <h3 style="color: #1f2937; margin-top: 0;">Message:</h3>
                                        <p style="color: #4b5563; white-space: pre-wrap;">${message}</p>
                                    </div>
                                </div>
                            </div>
                            <div style="background: #1f2937; padding: 20px; text-align: center;">
                                <p style="color: #9ca3af; margin: 0; font-size: 12px;">HRMS IT Support System</p>
                            </div>
                        </div>
                    `
                };

                // Confirmation email to user
                const userEmailOptions = {
                    from: process.env.EMAIL_FROM,
                    to: email,
                    subject: `Support Request Received - ${ticketId}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                                <h1 style="color: white; margin: 0;">Request Received!</h1>
                            </div>
                            <div style="background: #f9fafb; padding: 30px;">
                                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <p style="color: #1f2937; font-size: 16px;">Hi ${name},</p>
                                    <p style="color: #4b5563;">Thank you for contacting our IT Department. We've received your support request and will get back to you within 24 hours.</p>
                                    
                                    <div style="margin: 20px 0; padding: 15px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                                        <p style="color: #1e40af; margin: 0;"><strong>Your Ticket ID:</strong> ${ticketId}</p>
                                    </div>
                                    
                                    <h3 style="color: #1f2937;">Request Summary:</h3>
                                    <p style="color: #6b7280;"><strong>Subject:</strong> ${subject}</p>
                                    <div style="padding: 15px; background: #f3f4f6; border-radius: 8px;">
                                        <p style="color: #4b5563; margin: 0; white-space: pre-wrap;">${message}</p>
                                    </div>
                                    
                                    <p style="color: #6b7280; margin-top: 20px;">If you have any questions, please reply to this email with your ticket ID.</p>
                                </div>
                            </div>
                            <div style="background: #1f2937; padding: 20px; text-align: center;">
                                <p style="color: #9ca3af; margin: 0; font-size: 12px;">HRMS IT Support System</p>
                            </div>
                        </div>
                    `
                };

                console.log('📤 Sending emails...');

                // Send both emails
                const [itResult, userResult] = await Promise.all([
                    transporter.sendMail(itEmailOptions),
                    transporter.sendMail(userEmailOptions)
                ]);

                console.log('✅ Email to IT Department sent:', itResult.messageId);
                console.log('✅ Email to User sent:', userResult.messageId);
                console.log('✅ All emails sent successfully!');
            } catch (emailError) {
                console.error('❌ Email sending failed:');
                console.error('   Error:', emailError.message);
                console.error('   Code:', emailError.code);
                console.error('   Response:', emailError.response);
                console.error('   Full error:', emailError);
                // Don't fail the request if email fails
            }
        } else {
            console.log('⚠️  Email not configured - skipping email notification');
            console.log('   EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
            console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
        }

        res.status(200).json({
            success: true,
            message: 'Your request has been submitted successfully. Our IT team will contact you within 24 hours.',
            data: {
                ticketId,
                submittedAt: timestamp
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    submitContactRequest
};
