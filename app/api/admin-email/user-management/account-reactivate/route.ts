import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface WelcomeEmailData {
    receiverEmail: string;
    firstName: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { receiverEmail, firstName }: WelcomeEmailData = body;

        const msg = {
            to: receiverEmail,
            from: {
                name: "Kaboom Collab",
                email: process.env.SENDGRID_FROM_EMAIL!
            },
            subject: `Reactivate Your Kaboom Collab Account`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #007bff; margin-bottom: 10px;">Reactivate Your Account</h1>
                <p style="color: #666; font-size: 18px;">Hi ${firstName}, we noticed your account was deactivated.</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0;">
                <h3 style="color: #333; margin-top: 0;">Quick Reactivation</h3>
                <p style="color: #555; line-height: 1.6;">
                    To reactivate your Kaboom Collab account, simply log in again using the button below.
                </p>
                <p style="color: #555; line-height: 1.6;">
                    Once reactivated, you can resume collaborating, creating rooms, and connecting with others instantly.
                </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
                   style="background-color: #28a745; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Reactivate My Account
                </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <h4 style="color: #333;">Need Help?</h4>
                <p style="color: #666; line-height: 1.6;">
                    If you have any questions or need assistance, feel free to reach out to our support team.
                </p>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
                This email was sent to ${receiverEmail}. If you didn’t request to reactivate your account, you can safely ignore this email.
            </p>
        </div>
    `,
            text: `
        Reactivate Your Kaboom Collab Account

        Hi ${firstName},

        We noticed your account was deactivated.

        To reactivate it, simply log in again:

        ${process.env.NEXT_PUBLIC_APP_URL}/login

        Once reactivated, you can resume using all Kaboom Collab features.

        This email was sent to ${receiverEmail}. If you didn't request this, just ignore it.
    `
        };

        await sgMail.send(msg);
        return NextResponse.json({ message: 'Reactivation email sent successfully' }, { status: 200 });
    } catch (error) {
        console.error('SendGrid reactivation email error:', error);
        return NextResponse.json(
            {
                message: 'Failed to send reactivation email',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}