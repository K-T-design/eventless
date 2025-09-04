
'use server';

import {
  Configuration,
  EmailsApi,
  EmailTransactionalMessageData,
} from '@elasticemail/elasticemail-client';

const config = new Configuration({
  apiKey: process.env.ELASTIC_EMAIL_API_KEY,
});

const emailsApi = new EmailsApi(config);

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export const sendEmail = async (options: EmailOptions) => {
  if (!process.env.ELASTIC_EMAIL_API_KEY || !process.env.ELASTIC_EMAIL_FROM_EMAIL) {
    console.error('Elastic Email API key or From Email is not configured.');
    // In a real app, you might want to throw an error or handle this differently
    return { success: false, message: 'Email service is not configured.' };
  }

  const emailTransactionalMessageData: EmailTransactionalMessageData = {
    Recipients: {
      To: [options.to],
    },
    Content: {
      Body: [
        {
          ContentType: 'HTML',
          Content: options.html,
          Charset: 'utf-8',
        },
      ],
      From: process.env.ELASTIC_EMAIL_FROM_EMAIL,
      Subject: options.subject,
    },
  };

  try {
    await emailsApi.emailsTransactionalPost(emailTransactionalMessageData);
    console.log('Transactional email sent successfully.');
    return { success: true };
  } catch (error) {
    console.error('Error sending transactional email:', error);
    return { success: false, message: 'Failed to send email.' };
  }
};
