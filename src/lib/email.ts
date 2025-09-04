
'use server';

import * as brevo from '@getbrevo/brevo';

const defaultClient = brevo.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];

// Add a check to ensure the API key is present before proceeding.
if (process.env.BREVO_API_KEY) {
    apiKey.apiKey = process.env.BREVO_API_KEY;
} else {
    console.warn("BREVO_API_KEY is not set. Email functionality will be disabled.");
}

const apiInstance = new brevo.TransactionalEmailsApi();

export async function sendTicketEmail(toEmail: string, userName:string, eventName: string, ticketId: string) {
    // Prevent sending emails if the service is not configured.
    if (!process.env.BREVO_API_KEY) {
        console.error("Cannot send email: BREVO_API_KEY is not configured.");
        // We throw an error here to ensure the calling function is aware of the configuration issue.
        // This prevents a ticket from appearing to be sent when it was not.
        throw new Error("Email service is not configured on the server.");
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = `Your Ticket for ${eventName}`;
    sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">🎟️ Your Ticket Awaits!</h1>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>You are confirmed for <strong>${eventName}</strong>!</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;">Your Ticket ID is: <strong>${ticketId}</strong></p>
        </div>
        <p>Present this ID at the event for check-in.</p>
        <br />
        <p>Thank you for using E-Ventless!</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">If you have any questions, please contact our support team.</p>
        </div>
    `;
    
    sendSmtpEmail.sender = { 
        name: process.env.BREVO_FROM_NAME!, 
        email: process.env.BREVO_FROM_EMAIL! 
    };
    
    sendSmtpEmail.to = [{ email: toEmail, name: userName }];

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`Email sent successfully to ${toEmail}`);
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('Failed to send email:', error);
        // Do not expose detailed error messages to the client for security.
        // Log the full error on the server for debugging.
        throw new Error('Failed to send the confirmation email.');
    }
}
