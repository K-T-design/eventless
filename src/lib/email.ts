
'use server';

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

  const emailData = {
    sender: { email: process.env.BREVO_FROM_EMAIL },
    to: [{ email: options.to }],
    subject: options.subject,
    htmlContent: options.html,
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo API Error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }
    
    await response.json();

    console.log('Transactional email sent successfully via Brevo.');
    return { success: true };
  } catch (error: any) {
    console.error('Error sending transactional email:', error);
    return { success: false, message: `Failed to send email: ${error.message}` };
  }
};
