/**
 * Supabase Edge Function: send-email
 *
 * Sends emails via Resend API.
 * Set RESEND_API_KEY and EMAIL_FROM in your Supabase project secrets.
 *
 * If RESEND_API_KEY is not set, falls back to stub mode (logs only).
 *
 * Expected request body:
 * {
 *   to: string          - Recipient email address
 *   subject: string     - Email subject line
 *   body: string        - Email body text
 *   document_type: 'invoice' | 'quote'
 *   document_id: string - UUID of the document
 * }
 */

// @ts-ignore - Deno types
Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { to, subject, body: emailBody, document_type, document_id } = body

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // @ts-ignore - Deno env
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    // @ts-ignore - Deno env
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'Wired for Crochet <noreply@wiredforcrochet.com>'

    if (!resendApiKey) {
      // Stub mode — log and return success
      console.log('=== EMAIL STUB (no RESEND_API_KEY set) ===')
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log(`Body: ${emailBody}`)
      console.log(`Document: ${document_type} / ${document_id}`)
      console.log('==========================================')

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email logged (stub mode — set RESEND_API_KEY to send real emails)',
          recipient: to,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [to],
        subject: subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">${subject}</h2>
            <p style="color: #374151; line-height: 1.6;">${emailBody}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">
              Sent from Wired for Crochet
            </p>
          </div>
        `,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Resend API error:', errorData)
      return new Response(
        JSON.stringify({ error: `Email send failed: ${errorData.message || 'Unknown error'}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        recipient: to,
        id: data.id,
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
