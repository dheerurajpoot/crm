import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, orgName, inviteUrl } = await request.json()

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Resend API key is not configured in environment variables' },
        { status: 500 }
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'LeadFlow CRM <onboarding@resend.dev>',
        to: email,
        subject: `Join ${orgName} on LeadFlow CRM`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0f172a; margin-bottom: 16px; font-weight: 700;">You have been invited!</h2>
            <p style="color: #334155; font-size: 15px; line-height: 24px;">
              You have been invited to join the <strong>${orgName}</strong> organization on LeadFlow CRM.
            </p>
            <div style="margin: 24px 0;">
              <a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 18px;">
              If the button above does not work, copy and paste the link below into your browser:
              <br />
              <a href="${inviteUrl}" style="color: #2563eb;">${inviteUrl}</a>
            </p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const errorData = await res.json()
      return NextResponse.json(
        { error: errorData.message || 'Failed to send invitation email' },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
