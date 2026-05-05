import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to, subject, text } = await request.json();

    // To implement real email sending, use a transactional email service like Resend or SendGrid:
    /*
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY!);
    
    await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to,
      subject,
      text,
    });
    */

    console.log(`[Mock Email] To: ${to}`);
    console.log(`[Mock Email] Subject: ${subject}`);
    console.log(`[Mock Email] Body: ${text}`);

    return NextResponse.json({ success: true, message: "Email simulation logged successfully. Check server console." });
  } catch (error) {
    console.error("Error formatting email request:", error);
    return NextResponse.json({ success: false, error: "Failed to process email" }, { status: 500 });
  }
}
