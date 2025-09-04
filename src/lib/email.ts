
'use server';

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export const sendEmail = async (options: EmailOptions) => {
  if (!process.env.ELASTIC_EMAIL_API_KEY || !process.env.ELASTIC_EMAIL_FROM_EMAIL) {
    const errorMessage = 'Elastic Email API key or From Email is not configured.';
    console.error(errorMessage);
    return { success: false, message: errorMessage };
  }

  const formData = new URLSearchParams();
  formData.append('apikey', process.env.ELASTIC_EMAIL_API_KEY);
  formData.append('subject', options.subject);
  formData.append('from', process.env.ELASTIC_EMAIL_FROM_EMAIL);
  formData.append('to', options.to);
  formData.append('bodyHtml', options.html);
  formData.append('isTransactional', 'true');


  try {
    const response = await fetch('https://api.elasticemail.com/v2/email/send', {
        method: 'POST',
        body: formData,
    });
    
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Unknown error from Elastic Email API');
    }

    console.log('Transactional email sent successfully.');
    return { success: true };
  } catch (error: any) {
    console.error('Error sending transactional email:', error);
    return { success: false, message: `Failed to send email: ${error.message}` };
  }
};
