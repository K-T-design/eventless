
'use server';

export async function sendTicketEmail(toEmail: string, userName: string, eventName: string, ticketId: string) {
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (!brevoApiKey) {
    console.error("Cannot send email: BREVO_API_KEY is not configured.");
    throw new Error("Email service is not configured on the server.");
  }
  
  const emailData = {
    sender: {
      name: process.env.BREVO_FROM_NAME || 'E-Ventless',
      email: process.env.BREVO_FROM_EMAIL || 'd.eventless@gmail.com',
    },
    to: [
      {
        email: toEmail,
        name: userName,
      },
    ],
    subject: `Your Ticket for ${eventName}`,
    htmlContent: `
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
      </div>
    `,
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (response.ok) {
      console.log(`Email sent successfully to ${toEmail}`);
      return { success: true, message: 'Email sent successfully' };
    } else {
      const errorData = await response.json();
      console.error('Failed to send email:', errorData);
       // Throw an error to ensure the calling function is aware of the failure.
      throw new Error(errorData.message || 'Failed to send the confirmation email via Brevo API.');
    }
  } catch (error: any) {
    console.error('Error during email dispatch:', error);
    // Rethrow to be handled by the calling server action.
    throw new Error(error.message || 'An unexpected error occurred while sending the email.');
  }
}
