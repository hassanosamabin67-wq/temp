import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { SendVisionaryEmailParams } from '@/utils/emailServices/adminDashbordEmailService/type';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { receiverEmail, actionUrl }: SendVisionaryEmailParams = body;

        const msg = {
            to: receiverEmail,
            from: {
                name: "Kaboom Collab",
                email: process.env.SENDGRID_FROM_EMAIL!
            },
            subject: `Your Application Has Been Accepted 🎉`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Congratulations! 🎉</h2>
                    <p>Hi there,</p>
                    <p>We're excited to inform you that your application to Kaboom Collab has been <strong>accepted</strong>!</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${actionUrl}" 
                           style="background-color: #28a745; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Get Started
                        </a>
                    </div>
                    
                    <p>Or copy and paste this link in your browser:</p>
                    <p style="word-break: break-all; color: #666;">${actionUrl}</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px;">
                        This message was sent to ${receiverEmail}. If you didn’t apply, you can safely ignore this email.
                    </p>
                </div>
            `,
            text: `
                Your Application Has Been Accepted!

                We're excited to let you know that your application to Kaboom Collab has been accepted.

                Get started by visiting the following link:
                ${actionUrl}

                This message was sent to ${receiverEmail}. If you didn’t apply, you can ignore this email.
            `,
        };

        await sgMail.send(msg);
        return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
    } catch (error) {
        console.error('SendGrid error:', error);
        return NextResponse.json(
            {
                message: 'Failed to send email',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}