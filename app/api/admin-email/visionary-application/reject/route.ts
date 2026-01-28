import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { SendVisionaryEmailParams } from '@/utils/emailServices/adminDashbordEmailService/type';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { receiverEmail }: SendVisionaryEmailParams = body;

        const msg = {
            to: receiverEmail,
            from: {
                name: "Kaboom Collab",
                email: process.env.SENDGRID_FROM_EMAIL!
            },
            subject: `Your Application Status – Kaboom Collab`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #cc0000;">Thank You for Applying</h2>
                    <p>Hi there,</p>
                    <p>We truly appreciate your interest in joining <strong>Kaboom Collab</strong>.</p>
                    <p>After careful consideration, we regret to inform you that your application has not been accepted at this time.</p>
                    
                    <p>We encourage you to apply again in the future and stay connected with our community for updates and opportunities.</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px;">
                        This message was sent to ${receiverEmail}. If you didn’t apply, you can safely ignore this email.
                    </p>
                </div>
            `,
            text: `
                Your Application Status – Kaboom Collab

                Hi there,

                Thank you for your interest in Kaboom Collab. After careful review, we regret to inform you that your application has not been accepted at this time.

                We hope you'll consider applying again in the future.

                This message was sent to ${receiverEmail}. If you didn’t apply, you can ignore this email.
            `,
        };

        await sgMail.send(msg);
        return NextResponse.json({ message: 'Rejection email sent successfully' }, { status: 200 });
    } catch (error) {
        console.error('SendGrid error:', error);
        return NextResponse.json(
            {
                message: 'Failed to send rejection email',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}