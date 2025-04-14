import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SMTP_CONFIG = {
  hostname: Deno.env.get('SMTP_HOST') || '',
  port: Number(Deno.env.get('SMTP_PORT')) || 587,
  username: Deno.env.get('SMTP_USER') || '',
  password: Deno.env.get('SMTP_PASS') || '',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, body, attachmentUrl } = await req.json();

    // Validate required fields
    if (!to || !subject || !body) {
      throw new Error('Missing required fields');
    }

    // Create SMTP client
    const client = new SmtpClient();

    // Connect to SMTP server
    await client.connectTLS({
      hostname: SMTP_CONFIG.hostname,
      port: SMTP_CONFIG.port,
      username: SMTP_CONFIG.username,
      password: SMTP_CONFIG.password,
    });

    // Download PDF attachment
    const pdfResponse = await fetch(attachmentUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Send email with attachment
    await client.send({
      from: SMTP_CONFIG.username,
      to: to,
      subject: subject,
      content: body,
      html: body.replace(/\n/g, '<br>'),
      attachments: [{
        filename: 'bordereau.pdf',
        content: new Uint8Array(pdfBuffer),
        contentType: 'application/pdf',
      }],
    });

    // Close connection
    await client.close();

    // Log success
    console.log('Email sent successfully to:', to);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error sending email:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});