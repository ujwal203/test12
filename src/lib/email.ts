// src/lib/email.ts
import nodemailer from 'nodemailer';

// Create a Nodemailer transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'), // Default to 587 if not set
  secure: process.env.EMAIL_PORT === '465', // Use true for 465, false for other ports like 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify the transporter connection (optional, good for debugging)
transporter.verify(function (error) {
  if (error) {
    console.error('Nodemailer transporter verification failed:', error);
  } else {
    console.log('Nodemailer transporter ready to send emails');
  }
});

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Udyog Jagat" <${process.env.EMAIL_USER}>`, // Sender address
      to, // List of receivers
      subject, // Subject line
      text, // Plain text body
      html, // HTML body
    });

    console.log('Message sent: %s', info.messageId);
    // You can log the preview URL for ethereal.email if using it for testing
    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
