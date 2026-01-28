import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { userManagementEmail } from '@/utils/emailServices/adminDashbordEmailService/type';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { receiverEmail, firstName }: userManagementEmail = body;

        const msg = {
            to: receiverEmail,
            from: {
                name: "Kaboom Collab",
                email: process.env.SENDGRID_INVITATION_EMAIL!
            },
            subject: `Your Kaboom Collab Account is Now Active, ${firstName}!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #28a745; margin-bottom: 10px;">Account Activated</h1>
                        <p style="color: #666; font-size: 18px;">
                            Hi ${firstName}, your Kaboom Collab account is now active. 🎉
                        </p>
                    </div>

                    <div style="background-color: #e9f7ef; padding: 25px; border-radius: 10px; margin: 25px 0;">
                        <h3 style="color: #155724;">You're all set!</h3>
                        <p style="color: #555;">You can now log in and start collaborating.</p>
                        <div style="text-align: center; margin-top: 20px;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
                               style="background-color: #28a745; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                Log In to Your Account
                            </a>
                        </div>
                    </div>

                    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                        This email was sent to ${receiverEmail}. If you have questions, contact support.
                    </p>
                </div>
            `,
            text: `
                Hi ${firstName},

                Your Kaboom Collab account has been activated! You can now log in and start collaborating.

                Log in: ${process.env.NEXT_PUBLIC_APP_URL}/login
            `,
        };

        await sgMail.send(msg);
        return NextResponse.json({ message: 'Account activation email sent successfully' }, { status: 200 });

    } catch (error) {
        console.error('SendGrid activation email error:', error);
        return NextResponse.json(
            {
                message: 'Failed to send account activation email',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}