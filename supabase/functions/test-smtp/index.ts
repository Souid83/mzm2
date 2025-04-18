import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure } = await req.json();

    // Create SMTP client
    const client = new SmtpClient();

    // Try to connect
    await client.connectTLS({
      hostname: smtp_host,
      port: smtp_port,
      username: smtp_user,
      password: smtp_pass,
      tls: smtp_secure === 'tls'
    });

    // Send test email
    await client.send({
      from: smtp_user,
      to: smtp_user,
      subject: "Test de connexion SMTP",
      content: "Si vous recevez cet email, la configuration SMTP est correcte.",
    });

    // Close connection
    await client.close();

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
    console.error('Error testing SMTP:', error);

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