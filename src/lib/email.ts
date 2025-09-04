
'use server';

import * as brevo from '@getbrevo/brevo';

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export const sendEmail = async (options: EmailOptions) => {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_FROM_EMAIL) {
    const errorMessage = 'Brevo API key or From Email is not configured.';
    console.error(errorMessage);
    return { success: false, message: errorMessage };
  }

  const apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = options.subject;
  sendSmtpEmail.htmlContent = options.html;
  sendSmtpEmail.sender = { email: process.env.BREVO_FROM_EMAIL, name: 'E-Ventless' };
  sendSmtpEmail.to = [{ email: options.to }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Transactional email sent successfully via Brevo.');
    return { success: true };
  } catch (error: any) {
    console.error('Error sending transactional email:', error.message);
    // Brevo's SDK might throw errors with a 'body' property containing more details
    const errorDetails = error.body ? JSON.stringify(error.body) : error.message;
    return { success: false, message: `Failed to send email: ${errorDetails}` };
  }
};
