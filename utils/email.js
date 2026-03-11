const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Determine if we have SMTP credentials configured
    const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS;

    if (!hasSmtpConfig) {
        console.warn('⚠️ SMTP not configured! Showing email reset link in console instead of sending:');
        console.warn('=========================================');
        console.warn(`To: ${options.email}`);
        console.warn(`Subject: ${options.subject}`);
        console.warn(`Message:\n${options.message}`);
        console.warn('=========================================');
        return;
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT === '465' || process.env.SMTP_PORT == 465, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    // Define the email options
    const mailOptions = {
        from: `Sys RH SEPLAN <${process.env.SMTP_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html // Optional HTML content
    };

    // Send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
