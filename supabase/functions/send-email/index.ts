/**
 * Supabase Edge Function: send-email
 *
 * Stub implementation that logs the email request and returns success.
 * Replace with Resend API integration when ready for production email sending.
 *
 * Expected request body:
 * {
 *   to: string          - Recipient email address
 *   subject: string     - Email subject line
 *   body: string        - Email body text
 *   document_type: 'invoice' | 'quote'
 *   document_id: string - UUID of the document
 *   attachments?: Array<{ filename: string; content: string }> - Base64-encoded PDF attachments
 * }
 *
 * Future Resend integration:
 * 1. Install Resend SDK: import { Resend } from 'resend'
 * 2. Initialize: const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
 * 3. Call: await resend.emails.send({ from, to, subject, html, attachments })
 */

// @ts-ignore - Deno types
Deno.serve(async (req: Request) => {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { to, subject, body: emailBody, document_type, document_id } = body

    // Validate required fields
    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Log the email request (stub behavior)
    console.log('=== EMAIL SEND REQUEST ===')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body: ${emailBody}`)
    console.log(`Document: ${document_type} / ${document_id}`)
    console.log('=========================')

    // TODO: Replace with actual Resend integration
    // const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    // const { data, error } = await resend.emails.send({
    //   from: 'invoicing@yourdomain.com',
    //   to: [to],
    //   subject: subject,
    //   html: `<p>${emailBody}</p>`,
    //   attachments: body.attachments?.map((a: { filename: string; content: string }) => ({
    //     filename: a.filename,
    //     content: Buffer.from(a.content, 'base64'),
    //   })),
    // })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email queued successfully (stub - no actual email sent)',
        recipient: to,
        subject: subject,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('send-email function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
