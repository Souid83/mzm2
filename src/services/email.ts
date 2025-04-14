import { supabase } from '../lib/supabase';

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  attachmentUrl: string;
}

export async function sendEmail({ to, subject, body, attachmentUrl }: SendEmailParams): Promise<void> {
  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      to,
      subject,
      body,
      attachmentUrl
    }
  });

  if (error) {
    throw new Error(`Error sending email: ${error.message}`);
  }
}